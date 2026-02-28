# 🍷 Viny 2030 — Sistema de Pagos

Sistema completo con:
- ✅ Email automático con datos de pago (5 idiomas)
- ✅ Página para subir comprobante
- ✅ Códigos VNY-2026-XXXX automáticos
- ✅ Panel de administración

---

## 🚀 Deploy en Railway

### 1. Subir a GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/viny2030-backend.git
git push -u origin main
```

### 2. En Railway
1. railway.app → New Project → Deploy from GitHub repo
2. Seleccionar el repo
3. Ir a **Variables** y cargar todas las del `.env.example`

### 3. Variables obligatorias en Railway
```
GMAIL_USER=tuemail@gmail.com
GMAIL_PASS=xxxx xxxx xxxx xxxx   ← App Password de Google
ADMIN_EMAIL=tu@email.com
CBU=tu_cbu
ALIAS=TU.ALIAS
TITULAR=Nombre del titular
BANCO=Nombre del banco
BASE_URL=https://TU-APP.up.railway.app
```

### 4. Activar App Password en Gmail
1. myaccount.google.com → Seguridad
2. Verificación en 2 pasos (debe estar activa)
3. Contraseñas de aplicaciones → "Otra" → "Viny2030"
4. Copiar el código de 16 caracteres → pegarlo en GMAIL_PASS

---

## 📁 Páginas disponibles

| URL | Descripción |
|-----|-------------|
| `/` | Formulario de nuevo pedido |
| `/comprobante` | Subir comprobante de pago |
| `/admin` | Panel de administración |
| `/api/orders` | API REST de órdenes |

---

## 🌐 Idiomas de email
- 🇦🇷 Español
- 🇬🇧 Inglés  
- 🇫🇷 Francés
- 🇩🇪 Alemán
- 🇮🇹 Italiano
