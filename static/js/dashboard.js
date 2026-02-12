// Variables para datos contables
const formContable = document.getElementById('form-contable');
const contableStatus = document.getElementById('contable-status');

// Event listener para formulario contable
if (formContable) {
    formContable.addEventListener('submit', handleContableSubmit);
    
    // Calcular totales en tiempo real
    const inputs = formContable.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', calcularResumen);
    });
}

// Actualizar información contable al cargar dashboard
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
    
    // NUEVO: Cargar datos contables
    if (data.activos_corrientes !== undefined) {
        document.getElementById('activos_corrientes').value = data.activos_corrientes || 0;
        document.getElementById('activos_no_corrientes').value = data.activos_no_corrientes || 0;
        document.getElementById('pasivos_corrientes').value = data.pasivos_corrientes || 0;
        document.getElementById('pasivos_no_corrientes').value = data.pasivos_no_corrientes || 0;
        document.getElementById('patrimonio_neto').value = data.patrimonio_neto || 0;
        
        calcularResumen();
    }
}

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
