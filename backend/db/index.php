<?php
// index.php - API Principal Viny2030
require_once 'config.php';

// Obtener método y endpoint
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = trim($path, '/');
$segments = explode('/', $path);

// Router simple
if ($method === 'POST' && end($segments) === 'crear-empresa') {
    require_once 'crear_empresa.php';
    crearEmpresa();
} 
elseif ($method === 'GET' && end($segments) === 'verificar-estado') {
    require_once 'verificar_estado.php';
    verificarEstado();
}
elseif ($method === 'GET' && $segments[0] === 'empresa') {
    obtenerEmpresa();
}
elseif ($method === 'GET' && end($segments) === 'estadisticas') {
    obtenerEstadisticas();
}
else {
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint no encontrado']);
}

// Obtener datos de empresa
function obtenerEmpresa() {
    $api_key = $_GET['api_key'] ?? '';
    
    if (empty($api_key)) {
        http_response_code(400);
        echo json_encode(['error' => 'API Key requerida']);
        return;
    }
    
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM empresas WHERE api_key = ?");
    $stmt->execute([$api_key]);
    $empresa = $stmt->fetch();
    
    if (!$empresa) {
        http_response_code(404);
        echo json_encode(['error' => 'Empresa no encontrada']);
        return;
    }
    
    // Ocultar datos sensibles
    unset($empresa['api_key']);
    
    echo json_encode([
        'success' => true,
        'empresa' => $empresa
    ]);
}

// Obtener estadísticas generales
function obtenerEstadisticas() {
    $db = getDB();
    
    // Total empresas
    $total = $db->query("SELECT COUNT(*) as total FROM empresas")->fetch()['total'];
    
    // Empresas activas
    $activas = $db->query("SELECT COUNT(*) as total FROM empresas WHERE estado_suscripcion = 'activa'")->fetch()['total'];
    
    // Ingresos del mes
    $ingresos = $db->query("SELECT SUM(monto) as total FROM pagos WHERE MONTH(fecha_pago) = MONTH(NOW()) AND estado = 'completado'")->fetch()['total'] ?? 0;
    
    echo json_encode([
        'success' => true,
        'estadisticas' => [
            'total_empresas' => $total,
            'empresas_activas' => $activas,
            'ingresos_mes' => $ingresos
        ]
    ]);
}
?>
