# 📊 Viny2030 - Sistema de Contabilidad Automatizada

Sistema completo de contabilidad automatizada que integra **GitHub**, **Backblaze B2** y **Python** para proporcionar análisis financieros diarios a empresas.

## 🌟 Características

- ✅ **Registro automatizado** de nuevas empresas
- ✅ **Creación automática** de repositorio privado en GitHub
- ✅ **Bucket privado** en Backblaze B2 por cliente
- ✅ **Scripts Python** para análisis financiero
- ✅ **GitHub Actions** ejecutándose diariamente
- ✅ **Dashboard web** para clientes
- ✅ **Sistema de suscripciones** con verificación automática

## 📁 Estructura del Proyecto

```
viny2030/
├── backend/                    # PHP Backend (XAMPP)
│   ├── index.php              # API principal
│   ├── config.php             # Configuración
│   ├── crear_empresa.php      # Lógica creación empresa
│   ├── verificar_estado.php   # Check estado suscripción
│   └── db/
│       └── database.sql       # Base de datos MySQL
├── frontend/                   # Frontend web
│   ├── index.html             # Landing page
│   ├── formulario.html        # Formulario registro
│   ├── dashboard.html         # Panel cliente
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── app.js
├── python/                     # Scripts Python (GitHub/B2)
│   ├── crear_estructura_b2.py
│   ├── crear_repo_github.py
│   └── requirements.txt
└── templates/                  # Templates para repos
    ├── daily-sync.yml
    ├── b2_connector.py
    ├── balance_general.py
    ├── ratios_financieros.py
    └── verificar_estado.py
```

## 🚀 Instalación

### Requisitos

- XAMPP (PHP 8.0+, MySQL)
- Python 3.8+
- Cuenta GitHub con token de acceso
- Cuenta Backblaze B2

### Paso 1: Base de Datos

1. Abre XAMPP y inicia MySQL
2. Importa el archivo `backend/db/database.sql`

```bash
mysql -u root -p < backend/db/database.sql
```

### Paso 2: Configurar Backend

Edita `backend/config.php`:

```php
// GitHub
define('GITHUB_TOKEN', 'ghp_TU_TOKEN_AQUI');
define('GITHUB_ORG', 'tu-organizacion');

// Backblaze B2
define('B2_KEY_ID', 'TU_KEY_ID');
define('B2_APP_KEY', 'TU_APP_KEY');
```

### Paso 3: Instalar Dependencias Python

```bash
cd python
pip install -r requirements.txt
```

### Paso 4: Variables de Entorno

Configura las variables de entorno para Python:

```bash
export GITHUB_TOKEN="ghp_tu_token"
export B2_KEY_ID="tu_key_id"
export B2_APP_KEY="tu_app_key"
```

### Paso 5: Configurar XAMPP

1. Copia el proyecto a `C:\xampp\htdocs\viny2030\`
2. Accede a: `http://localhost/viny2030/frontend/index.html`

## 📖 Uso

### Para Administradores

1. **Landing Page**: `http://localhost/viny2030/frontend/index.html`
2. **Formulario Registro**: `http://localhost/viny2030/frontend/formulario.html`

### Crear Nueva Empresa

```bash
# Vía Web
# Ir a formulario.html y completar datos

# O vía API
curl -X POST http://localhost/viny2030/backend/crear-empresa \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Empresa S.A.",
    "email": "contacto@empresa.com",
    "telefono": "+123456789"
  }'
```

### Para Clientes

Acceder al dashboard con su API Key:
```
http://localhost/viny2030/frontend/dashboard.html?api_key=SU_API_KEY
```

## 🔄 Flujo de Trabajo

1. **Registro**: Cliente completa formulario
2. **Creación Automática**:
   - Registro en base de datos
   - Creación de repo GitHub privado
   - Creación de bucket B2 privado
   - Copia de templates Python
   - Configuración de GitHub Actions
3. **Uso Diario**:
   - Cliente sube datos contables a B2
   - GitHub Actions se ejecuta diariamente (6 AM UTC)
   - Scripts analizan datos y generan reportes
   - Resultados se suben a B2
   - Cliente accede vía dashboard

## 📊 Reportes Generados

- **Balance General**: Activos, Pasivos, Patrimonio
- **Ratios Financieros**: Liquidez, Rentabilidad, Endeudamiento
- **Estado de Resultados**: Ingresos, Gastos, Utilidad
- **Análisis de Tendencias**: Comparativas mensuales

## 🔐 Seguridad

- ✅ Repositorios privados por cliente
- ✅ Buckets privados en B2
- ✅ API Keys únicas por empresa
- ✅ Verificación de suscripción antes de cada análisis
- ✅ HTTPS en producción (recomendado)

## 💳 Sistema de Suscripciones

- **Precio**: $29.99/mes
- **Prueba gratis**: 7 días
- **Verificación automática**: Scripts validan estado antes de ejecutar
- **Alertas**: Notificaciones cuando quedan 3 días

## 🛠️ Desarrollo

### Ejecutar Localmente

```bash
# Backend (XAMPP debe estar corriendo)
http://localhost/viny2030/backend/

# Frontend
http://localhost/viny2030/frontend/
```

### Testing de Scripts Python

```bash
cd python

# Crear repo GitHub
python crear_repo_github.py "test-repo" "test@email.com"

# Crear bucket B2
python crear_estructura_b2.py "test-bucket" "1"
```

## 📞 Soporte

- Email: soporte@viny2030.com
- Documentación: https://docs.viny2030.com

## 📄 Licencia

Propietario - Viny2030 © 2025

---

**Desarrollado con ❤️ por el equipo Viny2030**

