<?php
// config.php - Configuración del sistema Viny2030

// Configuración de base de datos
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'viny2030');

// Configuración de GitHub
define('GITHUB_TOKEN', 'ghp_YOUR_GITHUB_TOKEN_HERE');
define('GITHUB_ORG', 'viny2030');

// Configuración de Backblaze B2
define('B2_KEY_ID', 'YOUR_B2_KEY_ID');
define('B2_APP_KEY', 'YOUR_B2_APP_KEY');
define('B2_BUCKET_NAME', 'viny2030-clientes');

// Configuración de Python
define('PYTHON_PATH', 'python'); // o 'python3' según tu sistema
define('SCRIPTS_PATH', __DIR__ . '/../python/');

// Precio de suscripción
define('PRECIO_MENSUAL', 29.99);

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

// Conexión a base de datos
function getDB() {
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]
        );
        return $pdo;
    } catch (PDOException $e) {
        die(json_encode(['error' => 'Error de conexión: ' . $e->getMessage()]));
    }
}

// Generar API Key única
function generarApiKey($email) {
    return hash('sha256', $email . time() . rand());
}

// Logging
function registrarLog($empresa_id, $accion, $descripcion) {
    $db = getDB();
    $stmt = $db->prepare("INSERT INTO logs (empresa_id, accion, descripcion) VALUES (?, ?, ?)");
    $stmt->execute([$empresa_id, $accion, $descripcion]);
}
?>
