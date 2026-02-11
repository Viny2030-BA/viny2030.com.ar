# 🚀 Viny2030 - Deploy Completo en Render

Este es tu proyecto **Viny2030** completo y listo para subir a Render.

## 📦 Contenido del Paquete

```
viny2030/
├── app.py                  ✨ Backend Flask (reemplaza PHP)
├── requirements.txt        📋 Dependencias Python
├── render.yaml            ⚙️  Configuración de Render
├── .gitignore             🚫 Archivos a ignorar
├── DEPLOY_RENDER.md       📖 Guía de deployment
├── backend/               🗄️  Backend PHP original (referencia)
├── frontend/              🎨 Interfaz web (HTML/CSS/JS)
├── python/                🐍 Scripts de GitHub y B2
└── templates/             📄 Templates para análisis
```

## 🎯 Pasos Rápidos

### 1. Sube a GitHub

```bash
# Inicializa git (si no lo has hecho)
git init

# Agrega todos los archivos
git add .

# Commit inicial
git commit -m "Initial commit - Viny2030 for Render"

# Conecta con tu repositorio
git remote add origin https://github.com/TU_USUARIO/viny2030.git

# Push
git push -u origin main
```

### 2. Deploy en Render

1. Ve a **[dashboard.render.com](https://dashboard.render.com/)**
2. Click **"New +"** → **"Web Service"**
3. Conecta tu repositorio GitHub
4. Render detectará automáticamente `render.yaml`
5. Agrega las variables de entorno (ver abajo)
6. Click **"Create Web Service"**

### 3. Variables de Entorno (Opcional)

En Render → Environment:

```
GITHUB_TOKEN = ghp_tu_token_personal
GITHUB_ORG = tu_organizacion
B2_KEY_ID = tu_key_id_backblaze
B2_APP_KEY = tu_app_key_backblaze
```

> **Nota:** Sin estas variables, el sistema funcionará pero no creará repos ni buckets automáticamente.

## 🔗 URLs del Sistema

Después del deploy:

- **API Backend**: `https://viny2030.onrender.com`
- **Crear Empresa**: `https://viny2030.onrender.com/api/crear-empresa`
- **Verificar Estado**: `https://viny2030.onrender.com/api/verificar-estado?api_key=XXX`

## 🎨 Frontend

El frontend está en la carpeta `frontend/`. Para servirlo tienes 2 opciones:

### Opción A: Static Site en Render
1. New + → Static Site
2. Conecta el mismo repositorio
3. **Publish directory**: `frontend`
4. Deploy

### Opción B: Netlify/Vercel
1. Arrastra la carpeta `frontend/` a Netlify Drop
2. O conecta el repositorio en Vercel

## 🧪 Probar Localmente

```bash
# Instalar dependencias
pip install -r requirements.txt

# Ejecutar
python app.py

# La API estará en:
# http://localhost:5000
```

## 📝 Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Info de la API |
| POST | `/api/crear-empresa` | Crear nueva empresa |
| GET | `/api/verificar-estado` | Verificar suscripción |
| GET | `/api/obtener-datos` | Datos de empresa |
| GET | `/api/empresas` | Listar todas (admin) |

## 🔄 Actualizar el Proyecto

```bash
git add .
git commit -m "Actualización X"
git push
```

Render hará redeploy automáticamente en ~3-5 minutos.

## 💾 Base de Datos

El proyecto usa **SQLite** por defecto (perfecto para testing).

Para producción, te recomiendo **PostgreSQL**:

1. En Render: New + → PostgreSQL
2. Copia la URL de conexión
3. Actualiza `app.py` para usar PostgreSQL en vez de SQLite

## 📊 Características

✅ Backend Flask (reemplaza PHP)  
✅ API REST completa  
✅ Integración GitHub automática  
✅ Integración Backblaze B2  
✅ Sistema de suscripciones  
✅ API Keys únicas por cliente  
✅ Trial de 7 días  
✅ Frontend responsive  

## 🆘 Ayuda

- **Logs**: Render Dashboard → tu servicio → Logs
- **Guía detallada**: Lee `DEPLOY_RENDER.md`
- **Docs Render**: [render.com/docs](https://render.com/docs)

## 🎉 ¡Listo!

Tu sistema estará en: `https://viny2030.onrender.com`

---

**Desarrollado con ❤️ por Viny2030**
