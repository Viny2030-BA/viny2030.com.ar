// Configuración de la API
const API_URL = window.location.origin;
let currentApiKey = null;

// Elementos del DOM
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const apiKeyInput = document.getElementById('api-key-input');
const btnLogout = document.getElementById('btn-logout');
const uploadStatus = document.getElementById('upload-status');
const btnCopyApikey = document.getElementById('btn-copy-apikey');
const formContable = document.getElementById('form-contable');
const contableStatus = document.getElementById('contable-status');

// Al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si hay API key guardada
    const savedApiKey = localStorage.getItem('viny_api_key');
    if (savedApiKey) {
        currentApiKey = savedApiKey;
        loadDashboard();
    }
    
    setupEventListeners();
    setupCategoryUploads();
});

// Configurar event listeners
function setupEventListeners() {
    // Login
    loginForm.addEventListener('submit', handleLogin);
    
    // Logout
    btnLogout.addEventListener('click', handleLogout);
    
    // Copy API key
    btnCopyApikey.addEventListener('click', copyApiKey);
    
    // Formulario contable
    if (formContable) {
        formContable.addEventListener('submit', handleContableSubmit);
        
        // Calcular totales en tiempo real
        const inputs = formContable.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            input.addEventListener('input', calcularResumen);
        });
    }
}

// ========== FUNCIONES DE CATEGORÍAS DE SUBIDA ==========

function setupCategoryUploads() {
    const categorias = [
        'activos_corrientes',
        'activos_no_corrientes',
        'pasivos_corrientes',
        'pasivos_no_corrientes',
        'patrimonio_neto'
    ];
    
    categorias.forEach(categoria => {
        const selectBtn = document.querySelector(`.category-select-btn[data-category="${categoria}"]`);
        const fileInput = document.querySelector(`.category-file-input[data-category="${categoria}"]`);
        const uploadArea = document.querySelector(`.category-upload-area[data-category="${categoria}"]`);
        const uploadBtn = document.querySelector(`.category-upload-btn[data-category="${categoria}"]`);
        
        // Botón seleccionar archivos
        if (selectBtn && fileInput) {
            selectBtn.addEventListener('click', () => fileInput.click());
        }
        
        // Cambio en input de archivo
        if (fileInput) {
            fileInput.addEventListener('change', (e) => handleCategoryFileSelect(e, categoria));
        }
        
        // Drag and drop
        if (uploadArea) {
            uploadArea.addEventListener('click', (e) => {
                if (e.target === uploadArea || e.target.tagName === 'P') {
                    fileInput.click();
                }
            });
            
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('drag-over');
            });
            
            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
                const files = Array.from(e.dataTransfer.files);
                fileInput.files = e.dataTransfer.files;
                displayCategoryFiles(files, categoria);
            });
        }
        
        // Botón de subida
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => handleCategoryUpload(categoria));
        }
    });
}

function handleCategoryFileSelect(e, categoria) {
    const files = Array.from(e.target.files);
    displayCategoryFiles(files, categoria);
}

function displayCategoryFiles(files, categoria) {
    const fileList = document.querySelector(`.category-file-list[data-category="${categoria}"]`);
    const uploadBtn = document.querySelector(`.category-upload-btn[data-category="${categoria}"]`);
    
    fileList.innerHTML = '';
    
    files.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'category-file-item';
        fileItem.innerHTML = `
            <span>📄 ${file.name} (${formatFileSize(file.size)})</span>
            <button type="button" onclick="removeCategoryFile('${categoria}', ${index})">Eliminar</button>
        `;
        fileList.appendChild(fileItem);
    });
    
    uploadBtn.style.display = files.length > 0 ? 'block' : 'none';
}

function removeCategoryFile(categoria, index) {
    const fileInput = document.querySelector(`.category-file-input[data-category="${categoria}"]`);
    const dt = new DataTransfer();
    const files = Array.from(fileInput.files);
    
    files.forEach((file, i) => {
        if (i !== index) dt.items.add(file);
    });
    
    fileInput.files = dt.files;
    displayCategoryFiles(Array.from(dt.files), categoria);
}

async function handleCategoryUpload(categoria) {
    const fileInput = document.querySelector(`.category-file-input[data-category="${categoria}"]`);
    const uploadBtn = document.querySelector(`.category-upload-btn[data-category="${categoria}"]`);
    const files = fileInput.files;
    
    if (files.length === 0) return;
    
    // Deshabilitar botón
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Subiendo...';
    
    try {
        // Subir cada archivo
        for (let file of files) {
            const formData = new FormData();
            formData.append('archivo', file);
            formData.append('categoria', categoria);
            
            const response = await fetch(`${API_URL}/api/subir-archivo`, {
                method: 'POST',
                headers: {
                    'X-API-Key': currentApiKey
                },
                body: formData
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detalle || 'Error al subir archivo');
            }
        }
        
        // Mostrar éxito
        showUploadStatus(`✅ Archivos subidos exitosamente a ${categoria.replace(/_/g, ' ')}`, 'success');
        
        // Limpiar formulario de esta categoría
        fileInput.value = '';
        const fileList = document.querySelector(`.category-file-list[data-category="${categoria}"]`);
        fileList.innerHTML = '';
        uploadBtn.style.display = 'none';
        
        // Recargar información
        setTimeout(() => loadDashboard(), 1000);
        
    } catch (error) {
        showUploadStatus(`❌ Error: ${error.message}`, 'error');
        console.error('Error:', error);
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = `Subir a ${categoria.replace(/_/g, ' ')}`;
    }
}

// ========== FUNCIONES ORIGINALES (NO MODIFICADAS) ==========

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
        showError('Por favor ingresa tu API Key');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/empresa/${apiKey}`);
        
        if (!response.ok) {
            throw new Error('API Key inválida');
        }
        
        const data = await response.json();
        
        // Guardar API key
        localStorage.setItem('viny_api_key', apiKey);
        currentApiKey = apiKey;
        
        // Cargar dashboard
        loadDashboard();
        
    } catch (error) {
        showError('API Key inválida o error de conexión');
        console.error('Error:', error);
    }
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('viny_api_key');
    currentApiKey = null;
    loginSection.style.display = 'flex';
    dashboardSection.style.display = 'none';
    apiKeyInput.value = '';
}

// Cargar dashboard
async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/api/empresa/${currentApiKey}`);
        
        if (!response.ok) {
            throw new Error('Error al cargar datos');
        }
        
        const data = await response.json();
        
        // Mostrar dashboard
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        
        // Actualizar información
        updateDashboardInfo(data);
        
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los datos');
        handleLogout();
    }
}

// Actualizar información del dashboard
function updateDashboardInfo(data) {
    document.getElementById('empresa-nombre').textContent = data.nombre;
    document.getElementById('info-nombre').textContent = data.nombre;
    document.getElementById('info-email').textContent = data.email;
    document.getElementById('info-apikey').textContent = currentApiKey;
    
    // Estado con color
    const estadoEl = document.getElementById('info-estado');
    estadoEl.textContent = data.estado_suscripcion.toUpperCase();
    estadoEl.style.color = data.estado_suscripcion === 'trial' ? 'var(--warning-color)' : 'var(--success-color)';
    
    // Fecha de expiración
    const expiracion = new Date(data.fecha_expiracion);
    document.getElementById('info-expiracion').textContent = expiracion.toLocaleDateString('es-AR');
    
    // GitHub repo
    const githubEl = document.getElementById('info-github');
    if (data.github_repo) {
        githubEl.href = data.github_repo;
        githubEl.textContent = data.github_repo;
    }
    
    // B2 Bucket
    const bucketEl = document.getElementById('info-bucket');
    bucketEl.textContent = data.b2_bucket || 'No creado aún';
    if (data.b2_bucket_created) {
        bucketEl.innerHTML += ' <span style="color: var(--success-color);">✓ Activo</span>';
    } else {
        bucketEl.innerHTML += ' <span style="color: var(--text-secondary);font-size:12px;">(Se creará al subir el primer archivo)</span>';
    }
    
    // Cargar datos contables
    if (data.activos_corrientes !== undefined) {
        document.getElementById('activos_corrientes').value = data.activos_corrientes || 0;
        document.getElementById('activos_no_corrientes').value = data.activos_no_corrientes || 0;
        document.getElementById('pasivos_corrientes').value = data.pasivos_corrientes || 0;
        document.getElementById('pasivos_no_corrientes').value = data.pasivos_no_corrientes || 0;
        document.getElementById('patrimonio_neto').value = data.patrimonio_neto || 0;
        
        calcularResumen();
    }
}

// Copiar API key
function copyApiKey() {
    navigator.clipboard.writeText(currentApiKey);
    btnCopyApikey.textContent = '✓ Copiado!';
    setTimeout(() => {
        btnCopyApikey.textContent = '📋 Copiar';
    }, 2000);
}

// Show upload status
function showUploadStatus(message, type) {
    uploadStatus.textContent = message;
    uploadStatus.className = `upload-status ${type}`;
    
    setTimeout(() => {
        uploadStatus.className = 'upload-status';
    }, 5000);
}

// Show error
function showError(message) {
    alert(message);
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ========== FUNCIONES CONTABLES ==========

// Manejar envío de datos contables
async function handleContableSubmit(e) {
    e.preventDefault();
    
    const datos = {
        activos_corrientes: parseFloat(document.getElementById('activos_corrientes').value) || 0,
        activos_no_corrientes: parseFloat(document.getElementById('activos_no_corrientes').value) || 0,
        pasivos_corrientes: parseFloat(document.getElementById('pasivos_corrientes').value) || 0,
        pasivos_no_corrientes: parseFloat(document.getElementById('pasivos_no_corrientes').value) || 0,
        patrimonio_neto: parseFloat(document.getElementById('patrimonio_neto').value) || 0
    };
    
    try {
        const response = await fetch(`${API_URL}/api/actualizar-datos-contables`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': currentApiKey
            },
            body: JSON.stringify(datos)
        });
        
        if (!response.ok) {
            throw new Error('Error al guardar datos');
        }
        
        showContableStatus('✅ Datos contables guardados exitosamente', 'success');
        calcularResumen();
        
    } catch (error) {
        showContableStatus(`❌ Error: ${error.message}`, 'error');
        console.error('Error:', error);
    }
}

// Calcular resumen automático
function calcularResumen() {
    const activosCorrientes = parseFloat(document.getElementById('activos_corrientes').value) || 0;
    const activosNoCorrientes = parseFloat(document.getElementById('activos_no_corrientes').value) || 0;
    const pasivosCorrientes = parseFloat(document.getElementById('pasivos_corrientes').value) || 0;
    const pasivosNoCorrientes = parseFloat(document.getElementById('pasivos_no_corrientes').value) || 0;
    const patrimonioNeto = parseFloat(document.getElementById('patrimonio_neto').value) || 0;
    
    const totalActivos = activosCorrientes + activosNoCorrientes;
    const totalPasivos = pasivosCorrientes + pasivosNoCorrientes;
    const totalPasivosPatrimonio = totalPasivos + patrimonioNeto;
    
    document.getElementById('total-activos').textContent = `$${totalActivos.toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
    document.getElementById('total-pasivos').textContent = `$${totalPasivos.toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
    
    // Verificar ecuación contable
    const ecuacionEl = document.getElementById('ecuacion-contable');
    const diferencia = Math.abs(totalActivos - totalPasivosPatrimonio);
    
    if (diferencia < 0.01) {
        ecuacionEl.textContent = '✅ Balanceado';
        ecuacionEl.style.color = 'var(--success-color)';
    } else {
        ecuacionEl.textContent = `⚠️ Desbalanceado ($${diferencia.toLocaleString('es-AR', {minimumFractionDigits: 2})})`;
        ecuacionEl.style.color = 'var(--danger-color)';
    }
}

// Mostrar estado de guardado contable
function showContableStatus(message, type) {
    contableStatus.textContent = message;
    contableStatus.className = `upload-status ${type}`;
    
    setTimeout(() => {
        contableStatus.className = 'upload-status';
    }, 5000);
}
