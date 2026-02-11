<?php
// verificar_estado.php - Verificar estado de suscripción de empresa
require_once 'config.php';

function verificarEstado() {
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
    
    $hoy = new DateTime();
    $vencimiento = new DateTime($empresa['fecha_vencimiento']);
    $dias_restantes = $hoy->diff($vencimiento)->days;
    
    // Verificar si la suscripción expiró
    $activa = ($empresa['estado_suscripcion'] === 'activa' && $vencimiento > $hoy);
    
    // Si expiró, actualizar estado
    if (!$activa && $empresa['estado_suscripcion'] === 'activa') {
        $stmt = $db->prepare("UPDATE empresas SET estado_suscripcion = 'cancelada' WHERE id = ?");
        $stmt->execute([$empresa['id']]);
        $empresa['estado_suscripcion'] = 'cancelada';
        registrarLog($empresa['id'], 'SUSCRIPCION_EXPIRADA', 'La suscripción ha expirado');
    }
    
    echo json_encode([
        'success' => true,
        'empresa' => [
            'id' => $empresa['id'],
            'nombre' => $empresa['nombre'],
            'email' => $empresa['email'],
            'estado' => $empresa['estado_suscripcion'],
            'fecha_vencimiento' => $empresa['fecha_vencimiento'],
            'dias_restantes' => ($activa ? $dias_restantes : 0),
            'activa' => $activa
        ]
    ]);
}
?>
