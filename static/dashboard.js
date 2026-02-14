// Variables globales
let currentApiKey = null;

// Al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si hay API key en URL o localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const apiKeyFromUrl = urlParams.get('api_key');
    const apiKeyFromStorage = localStorage.getItem('viny_api_key');
    
    if (apiKeyFromUrl) {
        currentApiKey = apiKeyFromUrl;
        localStorage.setItem('viny_api_key', apiKeyFromUrl);
        cargarDashboard();
    } else if (apiKeyFromStorage) {
        currentApiKey = apiKeyFromStorage;
        cargarDashboard();
    } else {
        mostrarLogin();
    }
    
    // Event listeners
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('btn-logout').addEventListener('click', handleLogout);
    document.getElementById('btn-copy-apikey').addEventListener('click', copyApiKey);
    
    // Event listeners para upload de archivos por categoría
    setupCategoryUploads();
});

function mostrarLogin() {
    document.getElementById('login-section').style.display = 'flex';
    document.getElementById('dashboard-section').style.display = 'none';
}

function mostrarDashboard() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';
}

async function handleLogin(e) {
    e.preventDefault();
    
    const apiKeyInput = document.getElementById('api-key-input').value.trim();
    
    if (!apiKeyInput) {
        alert('Por favor ingresa tu API Key');
        return;
    }
    
    currentApiKey = apiKeyInput;
    localStorage.setItem('viny_api_key', apiKeyInput);
    
    // Cargar datos del dashboard
    await cargarDashboard();
}

function handleLogout() {
    localStorage.removeItem('viny_api_key');
    currentApiKey = null;
    mostrarLogin();
}

async function cargarDashboard() {
    try {
        // Obtener información de la empresa
        const response = await fetch(`/api/empresa/${currentApiKey}`);
        
        if (!response.ok) {
            throw new Error('API Key inválida');
        }
        
        const data = await response.json();
        
        // Mostrar información en el dashboard
        document.getElementById('empresa-nombre').textContent = data.nombre;
        document.getElementById('info-nombre').textContent = data.nombre;
        document.getElementById('info-email').textContent = data.email;
        document.getElementById('info-estado').textContent = data.estado_suscripcion;
        document.getElementById('info-expiracion').textContent = data.fecha_expiracion || 'Sin vencimiento';
        document.getElementById('info-apikey').textContent = currentApiKey;
        document.getElementById('info-github').textContent = data.github_repo || 'No configurado';
        document.getElementById('info-github').href = data.github_repo || '#';
        document.getElementById('info-bucket').textContent = data.b2_bucket || 'No configurado';
        
        mostrarDashboard();
        
        // Cargar lista de archivos subidos
        await cargarArchivosSubidos();
        
    } catch (error) {
        console.error('Error al cargar dashboard:', error);
        alert('Error: ' + error.message);
        handleLogout();
    }
}

function copyApiKey() {
    const apiKey = document.getElementById('info-apikey').textContent;
    navigator.clipboard.writeText(apiKey).then(() => {
        alert('API Key copiada al portapapeles');
    }).catch(err => {
        console.error('Error al copiar:', err);
    });
}


// Configurar upload por categorías
function setupCategoryUploads() {
    const categories = ['activos_corrientes', 'activos_no_corrientes', 'pasivos_corrientes', 'pasivos_no_corrientes', 'patrimonio_neto'];
    
    categories.forEach(category => {
        const selectBtn = document.querySelector(`.category-select-btn[data-category="${category}"]`);
        const fileInput = document.querySelector(`.category-file-input[data-category="${category}"]`);
        const uploadArea = document.querySelector(`.category-upload-area[data-category="${category}"]`);
        const uploadBtn = document.querySelector(`.category-upload-btn[data-category="${category}"]`);
        
        // Click en botón de selección
        selectBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        // Click en área de drag & drop
        uploadArea.addEventListener('click', (e) => {
            if (e.target === uploadArea || e.target.tagName === 'P') {
                fileInput.click();
            }
        });
        
        // Cambio en input de archivo
        fileInput.addEventListener('change', () => {
            updateFileList(category, fileInput.files);
        });
        
        // Drag & Drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            const dt = new DataTransfer();
            Array.from(e.dataTransfer.files).forEach(file => dt.items.add(file));
            fileInput.files = dt.files;
            updateFileList(category, fileInput.files);
        });
        
        // Click en botón de subir
        uploadBtn.addEventListener('click', () => {
            uploadCategoryFiles(category, fileInput.files);
        });
    });
}

function updateFileList(category, files) {
    const fileList = document.querySelector(`.category-file-list[data-category="${category}"]`);
    const uploadBtn = document.querySelector(`.category-upload-btn[data-category="${category}"]`);
    
    fileList.innerHTML = '';
    
    if (files.length > 0) {
        Array.from(files).forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'category-file-item';
            fileItem.innerHTML = `
                <span>📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)</span>
                <button onclick="removeFile('${category}', ${index})">Eliminar</button>
            `;
            fileList.appendChild(fileItem);
        });
        uploadBtn.style.display = 'block';
    } else {
        uploadBtn.style.display = 'none';
    }
}

function removeFile(category, index) {
    const fileInput = document.querySelector(`.category-file-input[data-category="${category}"]`);
    const dt = new DataTransfer();
    
    Array.from(fileInput.files).forEach((file, i) => {
        if (i !== index) dt.items.add(file);
    });
    
    fileInput.files = dt.files;
    updateFileList(category, fileInput.files);
}

async function uploadCategoryFiles(category, files) {
    if (files.length === 0) return;
    
    const statusDiv = document.getElementById('upload-status');
    const categoryName = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    statusDiv.textContent = `Subiendo ${files.length} archivo(s) a ${categoryName}...`;
    statusDiv.className = 'upload-status';
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let file of files) {
        try {
            const formData = new FormData();
            formData.append('archivo', file);
            formData.append('categoria', category);
            
            const response = await fetch('/api/subir-archivo', {
                method: 'POST',
                headers: {
                    'X-API-Key': currentApiKey
                },
                body: formData
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                console.error(`Error al subir ${file.name}:`, result);
                errorCount++;
            } else {
                console.log('Archivo subido:', result);
                successCount++;
            }
            
        } catch (error) {
            console.error('Error:', error);
            errorCount++;
        }
    }
    
    // Mostrar resultado final
    if (errorCount === 0) {
        statusDiv.textContent = `✅ ${successCount} archivo(s) subido(s) exitosamente`;
        statusDiv.className = 'upload-status success';
    } else if (successCount > 0) {
        statusDiv.textContent = `⚠️ ${successCount} subidos, ${errorCount} con errores`;
        statusDiv.className = 'upload-status';
    } else {
        statusDiv.textContent = `❌ Error al subir archivos`;
        statusDiv.className = 'upload-status error';
    }
    
    // Limpiar inputs
    const fileInput = document.querySelector(`.category-file-input[data-category="${category}"]`);
    fileInput.value = '';
    updateFileList(category, fileInput.files);
    
    // Recargar lista de archivos
    await cargarArchivosSubidos();
    
    setTimeout(() => {
        statusDiv.textContent = '';
    }, 5000);
}

// NUEVA FUNCIÓN: Cargar y mostrar archivos subidos
async function cargarArchivosSubidos() {
    try {
        const response = await fetch('/api/listar-archivos', {
            method: 'GET',
            headers: {
                'X-API-Key': currentApiKey
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar archivos');
        }
        
        const data = await response.json();
        const filesListDiv = document.getElementById('files-list');
        
        if (!data.archivos || data.archivos.length === 0) {
            filesListDiv.innerHTML = '<p class="empty-state">Aún no has subido ningún archivo</p>';
            return;
        }
        
        // Crear HTML para cada archivo
        filesListDiv.innerHTML = data.archivos.map(archivo => {
            const categoryName = archivo.categoria.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const fecha = new Date(archivo.fecha).toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            return `
                <div class="file-item">
                    <div class="file-info">
                        <span class="file-category">${categoryName}</span>
                        <span class="file-name">📄 ${archivo.nombre}</span>
                    </div>
                    <div class="file-date">${fecha}</div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error al cargar archivos:', error);
        const filesListDiv = document.getElementById('files-list');
        filesListDiv.innerHTML = '<p class="empty-state">Error al cargar la lista de archivos</p>';
    }
}
