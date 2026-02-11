-- Base de datos Viny2030
CREATE DATABASE IF NOT EXISTS viny2030;
USE viny2030;

-- Tabla de empresas/clientes
CREATE TABLE empresas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(50),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_suscripcion ENUM('activa', 'pendiente', 'cancelada') DEFAULT 'pendiente',
    fecha_vencimiento DATE,
    github_repo VARCHAR(255),
    b2_bucket VARCHAR(255),
    api_key VARCHAR(255) UNIQUE,
    INDEX idx_email (email),
    INDEX idx_api_key (api_key)
);

-- Tabla de pagos
CREATE TABLE pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metodo_pago VARCHAR(50),
    estado ENUM('completado', 'pendiente', 'fallido') DEFAULT 'pendiente',
    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

-- Tabla de logs
CREATE TABLE logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT,
    accion VARCHAR(255),
    descripcion TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

-- Insertar empresa de prueba
INSERT INTO empresas (nombre, email, telefono, estado_suscripcion, fecha_vencimiento, api_key) 
VALUES ('Empresa Demo', 'demo@viny2030.com', '+123456789', 'activa', DATE_ADD(NOW(), INTERVAL 30 DAY), MD5(CONCAT('demo', NOW())));
