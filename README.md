# 🏢 Viny2030 - Sistema de Contabilidad Automatizada

Sistema completo de gestión contable que automatiza la organización de documentos financieros en GitHub y Backblaze B2.

[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0.0-green.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🚀 Características

- ✅ **Gestión automática de repositorios GitHub** con estructura de 5 carpetas contables
- ✅ **Almacenamiento en Backblaze B2** (opcional)
- ✅ **API RESTful** para integración con aplicaciones
- ✅ **Base de datos SQLite** para gestión de empresas
- ✅ **Subida de archivos por categoría** contable
- ✅ **Sistema de API Keys** para autenticación

## 📁 Estructura del Proyecto

```
viny2030.com.ar/
├── app.py                          # Aplicación Flask principal
├── requirements.txt                # Dependencias Python
├── python/                         # Módulos del sistema
│   ├── crear_repo_github.py       # Creación de repositorios
│   └── crear_estructura_b2.py     # Gestión de buckets B2
├── .gitignore                      # Archivos ignorados
├── README.md                       # Este archivo
└── test_crear_empresa.sh          # Script de prueba
```

## 🔧 Configuración Inicial

### 1. Clonar el repositorio

```bash
git clone https://github.com/Viny2030-BA/viny2030.com.ar.git
cd viny2030.com.ar
```

### 2. Crear entorno virtual

```bash
python3 -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

Crea un archivo `.env` (no se sube a Git):

```bash
# GitHub (OBLIGATORIO)
GITHUB_TOKEN=ghp_tu_token_github_aqui

# Backblaze B2 (OPCIONAL)
B2_APPLICATION_KEY_ID=tu_key_id_aqui
B2_APPLICATION_KEY=tu_application_key_aqui

# Puerto (opcional)
PORT=5000
```

### 5. Obtener GitHub Token

1. Ve a https://github.com/settings/tokens/new
2. Nombre: `viny2030-production-token`
3. Expiration: `No expiration` o `1 year`
4. Permisos necesarios:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `delete_repo` (Delete repositories) - opcional
   - ✅ `workflow` (Update GitHub Action workflows) - opcional
5. Click en "Generate token"
6. Copia el token (empieza con `ghp_`)
7. Guárdalo en `.env` como `GITHUB_TOKEN`

### 6. Crear Organización en GitHub (Recomendado)

1. Ve a https://github.com/organizations/plan
2. Crea organización: `Viny2030-BA`
3. Invita tu usuario como Owner
4. Los repositorios se crearán automáticamente en esta org

## 🏃 Ejecutar la aplicación

### Desarrollo local

```bash
python app.py
```

La aplicación estará en: `http://localhost:5000`

### Producción (con Gunicorn)

```bash
gunicorn app:app
```

## 📡 API Endpoints

### 1. Health Check

```bash
GET /health
```

**Respuesta:**
```json
{
  "status": "healthy",
  "version": "2.3.0",
  "database": "connected"
}
```

### 2. Información del sistema

```bash
GET /
```

**Respuesta:**
```json
{
  "mensaje": "Viny2030 API activa",
  "version": "2.3.0",
  "endpoints": {
    "dashboard_demo": "/demo",
    "dashboard_empresarial": "/dashboard",
    "api_crear_empresa": "/api/crear-empresa",
    "api_subir_archivo": "/api/subir-archivo"
  }
}
```

### 3. Crear Empresa

```bash
POST /api/crear-empresa
Content-Type: application/json

{
  "nombre": "Mi Empresa S.A.",
  "email": "contacto@miempresa.com",
  "telefono": "+54 11 1234-5678"
}
```

**Respuesta:**
```json
{
  "mensaje": "Empresa creada exitosamente",
  "api_key": "viny_xxxxxxxxxxx",
  "nombre": "Mi Empresa S.A.",
  "email": "contacto@miempresa.com",
  "github_repo": "https://github.com/Viny2030-BA/viny-mi-empresa-sa-02151930",
  "b2_bucket": "viny-storage-mi-empresa-sa-02151930",
  "fecha_expiracion": "2026-03-15 19:30:00"
}
```

### 4. Obtener datos de empresa

```bash
GET /api/empresa/:apiKey
X-API-Key: viny_xxxxxxxxxxx
```

**Respuesta:**
```json
{
  "id": 1,
  "nombre": "Mi Empresa S.A.",
  "email": "contacto@miempresa.com",
  "telefono": "+54 11 1234-5678",
  "github_repo": "https://github.com/Viny2030-BA/viny-mi-empresa-sa-02151930",
  "b2_bucket": "viny-storage-mi-empresa-sa-02151930",
  "estado_suscripcion": "trial",
  "fecha_expiracion": "2026-03-15 19:30:00"
}
```

### 5. Subir archivo

```bash
POST /api/subir-archivo
X-API-Key: viny_xxxxxxxxxxx
Content-Type: multipart/form-data

archivo: [archivo binario]
categoria: activos_corrientes
```

**Categorías válidas:**
- `activos_corrientes`
- `activos_no_corrientes`
- `pasivos_corrientes`
- `pasivos_no_corrientes`
- `patrimonio_neto`

**Respuesta:**
```json
{
  "mensaje": "Archivo subido exitosamente",
  "categoria": "activos_corrientes",
  "archivo": "factura_001.pdf",
  "empresa": "Mi Empresa S.A.",
  "repositorio": "Viny2030-BA/viny-mi-empresa-sa-02151930",
  "ruta": "activos_corrientes/factura_001.pdf"
}
```

### 6. Listar empresas

```bash
GET /api/listar-empresas
```

**Respuesta:**
```json
{
  "total": 5,
  "empresas": [
    {
      "id": 1,
      "nombre": "Mi Empresa S.A.",
      "email": "contacto@miempresa.com",
      "estado": "trial",
      "fecha_creacion": "2026-02-15 19:30:00",
      "fecha_expiracion": "2026-03-15 19:30:00",
      "bucket_activo": true
    }
  ]
}
```

## 🧪 Testing

### Probar creación de empresa

```bash
chmod +x test_crear_empresa.sh
./test_crear_empresa.sh
```

### Probar subida de archivo

```bash
# Obtén tu API key primero
API_KEY="viny_xxxxxxxxxxx"

# Sube un archivo
curl -X POST https://viny2030-com-ar.onrender.com/api/subir-archivo \
  -H "X-API-Key: $API_KEY" \
  -F "archivo=@factura.pdf" \
  -F "categoria=activos_corrientes"
```

## 🌐 Deploy en Render.com

### 1. Variables de entorno

En Render Dashboard → Environment:

```
GITHUB_TOKEN=ghp_tu_token_aqui
B2_APPLICATION_KEY_ID=tu_key_id (opcional)
B2_APPLICATION_KEY=tu_key (opcional)
```

### 2. Build Command

```bash
pip install -r requirements.txt
```

### 3. Start Command

```bash
gunicorn app:app
```

## 📂 Estructura de Repositorios Generados

Cada empresa obtiene un repositorio con esta estructura:

```
viny-nombre-empresa-timestamp/
├── README.md
├── activos_corrientes/
│   ├── README.md
│   └── [archivos subidos]
├── activos_no_corrientes/
│   ├── README.md
│   └── [archivos subidos]
├── pasivos_corrientes/
│   ├── README.md
│   └── [archivos subidos]
├── pasivos_no_corrientes/
│   ├── README.md
│   └── [archivos subidos]
└── patrimonio_neto/
    ├── README.md
    └── [archivos subidos]
```

## 🔐 Seguridad

- ✅ API Keys únicas y seguras (32 bytes)
- ✅ No se almacenan contraseñas
- ✅ Tokens de GitHub no se exponen
- ✅ Base de datos SQLite local
- ✅ CORS configurado
- ✅ Validación de tipos de archivo

## 📝 Notas

- **Base de datos:** Se crea automáticamente en `viny2030.db`
- **Período de prueba:** 30 días por defecto
- **Backblaze B2:** Opcional, se crea en la primera subida
- **GitHub:** Los repos pueden ser públicos o privados (configurable)

## 🐛 Problemas Comunes

### Error: "GITHUB_TOKEN no configurado"

Solución: Configura la variable de entorno `GITHUB_TOKEN` con un token válido.

### Error: "No se pudo crear repositorio"

Solución: Verifica que:
1. El token tenga permisos `repo`
2. La organización `Viny2030-BA` exista
3. Tu usuario sea Owner de la organización

### Error: "Bucket B2 no se pudo crear"

Esto es opcional. El sistema funciona sin B2. Para habilitarlo, configura:
- `B2_APPLICATION_KEY_ID`
- `B2_APPLICATION_KEY`

## 📄 Licencia

MIT License - Ver archivo [LICENSE](LICENSE)

## 👥 Autor

**Viny2030 Team**
- GitHub: [@Viny2030-BA](https://github.com/Viny2030-BA)
- Website: https://www.viny2030.com.ar

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Add: nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

**⚡ Hecho con ❤️ en Argentina 🇦🇷**
