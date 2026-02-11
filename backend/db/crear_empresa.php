<?php
// crear_empresa.php - Crear nueva empresa y configurar todo
require_once 'config.php';

function crearEmpresa() {
    // Obtener datos del POST
    $data = json_decode(file_get_contents('php://input'), true);
    
    $nombre = $data['nombre'] ?? '';
    $email = $data['email'] ?? '';
    $telefono = $data['telefono'] ?? '';
    
    // Validaciones
    if (empty($nombre) || empty($email)) {
        http_response_code(400);
        echo json_encode(['error' => 'Nombre y email son requeridos']);
        return;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Email inválido']);
        return;
    }
    
    $db = getDB();
    
    // Verificar si el email ya existe
    $stmt = $db->prepare("SELECT id FROM empresas WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'El email ya está registrado']);
        return;
    }
    
    try {
        // Generar API Key
        $api_key = generarApiKey($email);
        
        // Nombres de recursos
        $slug = strtolower(str_replace(' ', '-', $nombre));
        $github_repo = "viny-" . $slug;
        $b2_bucket = "viny-" . $slug . "-" . substr(md5($email), 0, 8);
        
        // Insertar empresa
        $stmt = $db->prepare("
            INSERT INTO empresas (nombre, email, telefono, estado_suscripcion, fecha_vencimiento, github_repo, b2_bucket, api_key) 
            VALUES (?, ?, ?, 'pendiente', DATE_ADD(NOW(), INTERVAL 7 DAY), ?, ?, ?)
        ");
        $stmt->execute([$nombre, $email, $telefono, $github_repo, $b2_bucket, $api_key]);
        $empresa_id = $db->lastInsertId();
        
        // Registrar log
        registrarLog($empresa_id, 'EMPRESA_CREADA', "Nueva empresa registrada: $nombre");
        
        // Ejecutar script Python para crear repo GitHub
        $output_github = [];
        $return_github = 0;
        exec(PYTHON_PATH . " " . SCRIPTS_PATH . "crear_repo_github.py \"$github_repo\" \"$email\" 2>&1", $output_github, $return_github);
        
        if ($return_github !== 0) {
            registrarLog($empresa_id, 'ERROR_GITHUB', "Error al crear repo: " . implode("\n", $output_github));
        } else {
            registrarLog($empresa_id, 'GITHUB_CREADO', "Repositorio GitHub creado: $github_repo");
        }
        
        // Ejecutar script Python para crear bucket B2
        $output_b2 = [];
        $return_b2 = 0;
        exec(PYTHON_PATH . " " . SCRIPTS_PATH . "crear_estructura_b2.py \"$b2_bucket\" \"$empresa_id\" 2>&1", $output_b2, $return_b2);
        
        if ($return_b2 !== 0) {
            registrarLog($empresa_id, 'ERROR_B2', "Error al crear bucket: " . implode("\n", $output_b2));
        } else {
            registrarLog($empresa_id, 'B2_CREADO', "Bucket B2 creado: $b2_bucket");
        }
        
        // Enviar email de bienvenida (simulado)
        $email_enviado = enviarEmailBienvenida($email, $nombre, $api_key);
        
        echo json_encode([
            'success' => true,
            'mensaje' => 'Empresa creada exitosamente',
            'empresa' => [
                'id' => $empresa_id,
                'nombre' => $nombre,
                'email' => $email,
                'api_key' => $api_key,
                'github_repo' => $github_repo,
                'b2_bucket' => $b2_bucket,
                'estado' => 'pendiente',
                'dias_prueba' => 7
            ],
            'pasos_completados' => [
                'base_datos' => true,
                'github' => ($return_github === 0),
                'backblaze' => ($return_b2 === 0),
                'email' => $email_enviado
            ]
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al crear empresa: ' . $e->getMessage()]);
    }
}

function enviarEmailBienvenida($email, $nombre, $api_key) {
    // En producción, aquí iría la integración con un servicio de email
    // Por ahora, solo simulamos
    $asunto = "¡Bienvenido a Viny2030!";
    $mensaje = "
    <html>
    <body>
        <h2>¡Hola $nombre!</h2>
        <p>Tu cuenta en Viny2030 ha sido creada exitosamente.</p>
        <p><strong>Tu API Key:</strong> $api_key</p>
        <p>Tienes 7 días de prueba gratuita.</p>
        <p>Accede a tu dashboard en: https://viny2030.com/dashboard.html</p>
    </body>
    </html>
    ";
    
    // mail($email, $asunto, $mensaje, ['Content-Type: text/html; charset=UTF-8']);
    
    registrarLog(null, 'EMAIL_ENVIADO', "Email de bienvenida enviado a $email");
    return true;
}
?>
