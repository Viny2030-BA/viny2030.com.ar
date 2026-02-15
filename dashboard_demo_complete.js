// Variables globales
let currentApiKey = null;
let uploadedFiles = [];

// Datos de empresa DEMO (simula respuesta de /api/empresa/:apiKey)
const DEMO_EMPRESA = {
    nombre: "Empresa Demo S.A.",
    email: "contacto@empresademo.com.ar",
    estado_suscripcion: "✅ Activo",
    fecha_expiracion: "31 de Diciembre 2026",
    github_repo: "https://github.com/viny2030/contabilidad-demo",
    b2_bucket: "viny2030-demo-bucket-2026"
};

// Archivos de ejemplo ya "subidos" (simula respuesta de /api/listar-archivos)
const DEMO_FILES = [
    {
        nombre: "balance_general_enero_2026.pdf",
        categoria: "activos_corrientes",
        fecha: "2026-02-10T10:30:00"
    },
    {
        nombre: "factura_compra_electricidad_001.pdf",
        categoria: "pasivos_corrientes",
        fecha: "2026-02-12T09:15:00"
    },
    {
        nombre: "escritura_inmueble_oficina.pdf",
        categoria: "activos_no_corrientes",
        fecha: "2026-01-20T14:20:00"
    },
    {
        nombre: "contrato_prestamo_bancario.xlsx",
        categoria: "pasivos_no_corrientes",
        fecha: "2026-01-15T11:00:00"
    },
    {
        nombre: "acta_constitucion_capital_social.pdf",
        categoria: "patrimonio_neto",
        fecha: "2026-01-05T08:00:00"
    },
    {
        nombre: "caja_efectivo_febrero.xlsx",
        categoria: "activos_corrientes",
        fecha: "2026-02-13T16:45:00"
    },
    {
        nombre: "cuentas_por_pagar_proveedores.pdf",
        categoria: "pasivos_corrientes",
        fecha: "2026-02-14T10:20:00"
    }
];

// Al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('%c🎯 Dashboard DEMO de Viny2030 Cargado', 'color: #667eea; font-size: 16px; font-weight: bold;');
    console.log('%c💡 Versión DEMO - Todas las llamadas a API están simuladas', 'color: #666;');
    
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
    
    // Inicializar archivos demo con estructura correcta
    uploadedFiles = DEMO_FILES.map(file => ({
        nombre: file.nombre,
        categoria: file.categoria,
        fecha: new Date(file.fecha)
    }));
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
    
    // Cargar datos del dashboard (simulado)
    await cargarDashboard();
}

function handleLogout() {
    localStorage.removeItem('viny_api_key');
    currentApiKey = null;
    mostrarLogin();
    
    console.log('👋 Sesión cerrada');
}

async function cargarDashboard() {
    try {
        console.log('📡 Simulando llamada a /api/empresa/' + currentApiKey);
        
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // SIMULA: const response = await fetch(`/api/empresa/${currentApiKey}`);
        // SIMULA: const data = await response.json();
        const data = DEMO_EMPRESA;
        
        console.log('✅ Datos de empresa recibidos (DEMO):', data);
        
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
        
        console.log('✅ Dashboard DEMO cargado exitosamente');
        
    } catch (error) {
        console.error('❌ Error al cargar dashboard:', error);
        alert('Error: ' + error.message);
    }
}

function copyApiKey() {
    const apiKey = document.getElementById('info-apikey').textContent;
    navigator.clipboard.writeText(apiKey).then(() => {
        alert('✅ API Key copiada al portapapeles');
    }).catch(err => {
        console.error('Error al copiar:', err);
        alert('Error al copiar API Key');
    });
}

// Configurar upload por categorías
function setupCategoryUploads() {
    const categories = [
        'activos_corrientes', 
        'activos_no_corrientes', 
        'pasivos_corrientes', 
        'pasivos_no_corrientes', 
        'patrimonio_neto'
    ];
    
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
    
    console.log(`📤 Simulando subida de ${files.length} archivo(s) a ${categoryName}`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let file of files) {
        try {
            // SIMULA: const formData = new FormData();
            // SIMULA: formData.append('archivo', file);
            // SIMULA: formData.append('categoria', category);
            
            // SIMULA: const response = await fetch('/api/subir-archivo', {
            //     method: 'POST',
            //     headers: { 'X-API-Key': currentApiKey },
            //     body: formData
            // });
            
            // Simular delay de subida
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // SIMULA: const result = await response.json();
            const result = {
                success: true,
                message: 'Archivo subido exitosamente (DEMO)',
                filename: file.name,
                categoria: category
            };
            
            console.log('✅ Archivo simulado:', result);
            
            // Agregar a la lista local
            uploadedFiles.push({
                nombre: file.name,
                categoria: category,
                fecha: new Date()
            });
            
            successCount++;
            
        } catch (error) {
            console.error('❌ Error:', error);
            errorCount++;
        }
    }
    
    // Mostrar resultado final
    if (errorCount === 0) {
        statusDiv.textContent = `✅ ${successCount} archivo(s) subido(s) exitosamente (DEMO)`;
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
        statusDiv.className = 'upload-status';
    }, 5000);
}

// Cargar y mostrar archivos subidos
async function cargarArchivosSubidos() {
    try {
        console.log('📡 Simulando llamada a /api/listar-archivos');
        
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // SIMULA: const response = await fetch('/api/listar-archivos', {
        //     method: 'GET',
        //     headers: { 'X-API-Key': currentApiKey }
        // });
        // SIMULA: const data = await response.json();
        
        const data = {
            archivos: uploadedFiles
        };
        
        console.log(`📂 ${data.archivos.length} archivos en el sistema (DEMO)`);
        
        const filesListDiv = document.getElementById('files-list');
        
        if (!data.archivos || data.archivos.length === 0) {
            filesListDiv.innerHTML = '<p class="empty-state">Aún no has subido ningún archivo</p>';
            return;
        }
        
        // Ordenar por fecha más reciente primero
        const sortedArchivos = [...data.archivos].sort((a, b) => {
            const dateA = new Date(a.fecha);
            const dateB = new Date(b.fecha);
            return dateB - dateA;
        });
        
        // Crear HTML para cada archivo
        filesListDiv.innerHTML = sortedArchivos.map(archivo => {
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
        console.error('❌ Error al cargar archivos:', error);
        const filesListDiv = document.getElementById('files-list');
        filesListDiv.innerHTML = '<p class="empty-state">Error al cargar la lista de archivos</p>';
    }
}

// Exponer función removeFile globalmente
window.removeFile = removeFile;

// Log de bienvenida
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #667eea;');
console.log('%c   🏢 Viny2030 - Dashboard DEMO   ', 'color: #667eea; font-size: 18px; font-weight: bold;');
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #667eea;');
console.log('%c💡 Este es un entorno de PRUEBAS', 'color: #fbbf24; font-weight: bold;');
console.log('%c📊 Todos los datos son FICTICIOS', 'color: #666;');
console.log('%c🔧 No hay backend conectado - Todo funciona localmente', 'color: #666;');
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #667eea;');
