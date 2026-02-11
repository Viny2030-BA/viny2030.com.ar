# 🚀 Guía de Instalación Completa - Viny2030

## Prerequisitos

Antes de comenzar, asegúrate de tener:

- [ ] XAMPP instalado (PHP 8.0+, MySQL 5.7+)
- [ ] Python 3.8 o superior
- [ ] Cuenta en GitHub con permisos para crear repositorios
- [ ] Cuenta en Backblaze B2
- [ ] Editor de código (VS Code, Sublime, etc.)

## Paso 1: Instalar XAMPP

1. Descarga XAMPP desde: https://www.apachefriends.org/
2. Instala siguiendo el asistente
3. Inicia los servicios:
   - Apache
   - MySQL

## Paso 2: Configurar Base de Datos

### Opción A: PhpMyAdmin (Recomendado)

1. Abre: `http://localhost/phpmyadmin`
2. Crea una base de datos llamada `viny2030`
3. Ve a la pestaña "Import"
4. Selecciona el archivo `backend/db/database.sql`
5. Haz clic en "Go"

### Opción B: Línea de Comandos

```bash
# Windows
cd C:\xampp\mysql\bin
mysql.exe -u root -p

# Mac/Linux
mysql -u root -p

# Luego ejecuta:
CREATE DATABASE viny2030;
USE viny2030;
SOURCE /ruta/completa/a/database.sql;
```

## Paso 3: Copiar Proyecto a XAMPP

```bash
# Windows
# Copiar carpeta viny2030 a:
C:\xampp\htdocs\viny2030\

# Mac/Linux
# Copiar carpeta viny2030 a:
/Applications/XAMPP/htdocs/viny2030/
# o
/opt/lampp/htdocs/viny2030/
```

## Paso 4: Obtener Credenciales

### GitHub Token

1. Ve a: https://github.com/settings/tokens
2. Click en "Generate new token" > "Generate new token (classic)"
3. Nombre: "Viny2030 API"
4. Selecciona permisos:
   - [x] `repo` (Full control of private repositories)
   - [x] `admin:org` (si usas organización)
5. Click "Generate token"
6. **GUARDA EL TOKEN** (solo se muestra una vez)

### Backblaze B2 Credentials

1. Ve a: https://secure.backblaze.com/b2_buckets.htm
2. Click en "App Keys" en el menú lateral
3. Click en "Add a New Application Key"
4. Configura:
   - Name: Viny2030
   - Allow access to Bucket(s): All
5. Click "Create New Key"
6. **GUARDA keyID y applicationKey**

## Paso 5: Configurar Backend

Edita `backend/config.php`:

```php
<?php
// Configuración de base de datos
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');  // Tu password de MySQL si lo tienes
define('DB_NAME', 'viny2030');

// Configuración de GitHub
define('GITHUB_TOKEN', 'ghp_PEGA_TU_TOKEN_AQUI');
define('GITHUB_ORG', 'tu-usuario-o-organizacion');

// Configuración de Backblaze B2
define('B2_KEY_ID', 'PEGA_TU_KEY_ID');
define('B2_APP_KEY', 'PEGA_TU_APP_KEY');
define('B2_BUCKET_NAME', 'viny2030-clientes');

// Precio de suscripción
define('PRECIO_MENSUAL', 29.99);
?>
```

## Paso 6: Instalar Python y Dependencias

### Instalar Python

**Windows:**
1. Descarga desde: https://www.python.org/downloads/
2. Durante instalación, marca "Add Python to PATH"

**Mac:**
```bash
brew install python3
```

**Linux:**
```bash
sudo apt update
sudo apt install python3 python3-pip
```

### Instalar Dependencias

```bash
# Navega a la carpeta python
cd viny2030/python

# Instala las dependencias
pip install -r requirements.txt

# O si tienes Python 3 específicamente:
pip3 install -r requirements.txt
```

## Paso 7: Configurar Variables de Entorno

### Windows

Crea un archivo `.env` en la carpeta `python/`:

```env
GITHUB_TOKEN=ghp_tu_token_aqui
B2_KEY_ID=tu_key_id
B2_APP_KEY=tu_app_key
```

O configura variables de sistema:
1. Busca "Variables de entorno" en Windows
2. Click "Variables de entorno"
3. Agrega las variables en "Variables de usuario"

### Mac/Linux

Edita tu `~/.bashrc` o `~/.zshrc`:

```bash
export GITHUB_TOKEN="ghp_tu_token_aqui"
export B2_KEY_ID="tu_key_id"
export B2_APP_KEY="tu_app_key"
```

Luego ejecuta:
```bash
source ~/.bashrc  # o ~/.zshrc
```

## Paso 8: Verificar Instalación

### 1. Verificar Base de Datos

```bash
# Abre MySQL
mysql -u root -p

# Ejecuta:
USE viny2030;
SHOW TABLES;
```

Deberías ver:
- empresas
- pagos
- logs

### 2. Verificar Backend

Abre en tu navegador:
```
http://localhost/viny2030/backend/estadisticas
```

Deberías ver JSON con estadísticas.

### 3. Verificar Frontend

Abre:
```
http://localhost/viny2030/frontend/index.html
```

Deberías ver la landing page.

### 4. Test de Scripts Python

```bash
cd python

# Test GitHub
python crear_repo_github.py "test-viny" "test@test.com"

# Si funciona, deberías ver:
# ✅ Repositorio creado: https://github.com/...

# Test B2 (opcional, creará bucket real)
# python crear_estructura_b2.py "test-viny-bucket" "999"
```

## Paso 9: Crear Primera Empresa

1. Ve a: `http://localhost/viny2030/frontend/formulario.html`
2. Completa el formulario:
   - Nombre: "Empresa Demo"
   - Email: "demo@test.com"
   - Teléfono: "+123456789"
3. Click "Crear mi Cuenta Gratis"
4. **Guarda la API Key que recibes**

## Paso 10: Acceder al Dashboard

1. Copia la API Key recibida
2. Ve a: `http://localhost/viny2030/frontend/dashboard.html?api_key=TU_API_KEY`
3. Deberías ver tu dashboard con información de la empresa

## 🔧 Solución de Problemas

### Error: "Cannot connect to database"

```bash
# Verifica que MySQL esté corriendo
# En XAMPP Panel, MySQL debe estar "Running"

# Verifica las credenciales en config.php
# DB_USER y DB_PASS deben ser correctos
```

### Error: "GITHUB_TOKEN not found"

```bash
# Verifica que configuraste el token en config.php
# Y también en las variables de entorno para Python
```

### Error: Python "ModuleNotFoundError"

```bash
# Reinstala las dependencias
pip install -r python/requirements.txt --upgrade
```

### Error: "Permission denied" en scripts Python

```bash
# Mac/Linux: Da permisos de ejecución
chmod +x python/*.py
```

### Error al crear repositorio GitHub

```bash
# Verifica:
# 1. Token tiene permisos correctos
# 2. GITHUB_ORG existe (o usa tu username)
# 3. No existe ya un repo con ese nombre
```

## 🎯 Próximos Pasos

1. **Producción**: Configura un dominio y SSL
2. **Emails**: Integra servicio de email (SendGrid, AWS SES)
3. **Pagos**: Integra Stripe o PayPal
4. **Backups**: Configura backups automáticos de BD
5. **Monitoreo**: Configura logs y alertas

## 📚 Recursos Adicionales

- [Documentación XAMPP](https://www.apachefriends.org/docs/)
- [GitHub API Docs](https://docs.github.com/en/rest)
- [Backblaze B2 Docs](https://www.backblaze.com/b2/docs/)
- [Python Pandas](https://pandas.pydata.org/docs/)

## ✅ Checklist Final

- [ ] XAMPP instalado y corriendo
- [ ] Base de datos creada e importada
- [ ] Python y dependencias instaladas
- [ ] Tokens de GitHub y B2 configurados
- [ ] Backend configurado (config.php)
- [ ] Variables de entorno configuradas
- [ ] Landing page accesible
- [ ] Formulario funcional
- [ ] Primera empresa creada exitosamente
- [ ] Dashboard accesible con API Key

---

**¡Felicitaciones! 🎉 Tu sistema Viny2030 está listo para usar.**

Si tienes problemas, revisa la sección de Solución de Problemas o contacta a soporte.

