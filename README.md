# Viny 2030 — Backend

## Estructura

```
viny2030/
├── server.js
├── routes/
│   ├── orders.js          # POST/GET/PATCH órdenes + email cliente + notif admin
│   └── upload.js          # POST comprobante con adjunto al admin
├── utils/
│   ├── mailer.js          # Nodemailer Gmail
│   ├── emailTemplates.js  # 5 idiomas + 3 opciones de pago (ARS/USD/SWIFT)
│   └── orderCode.js       # Genera VNY-2026-XXXX
└── public/
    ├── index.html
    ├── comprobante.html
    └── admin.html
```

## Correr local

```bash
npm install
npm run dev   # con nodemon
# o
npm start
```

## Deploy en Railway

### 1. Variables de entorno en Railway

En el panel de Railway → tu proyecto → Variables, agregar TODAS:

```
PORT=3000
GMAIL_USER=tu-email@gmail.com
GMAIL_PASS=tu-app-password
ADMIN_EMAIL=tu-email@gmail.com
TITULAR=Tu Nombre Completo
BANCO=Nombre del Banco
CBU_PESOS=tu-cbu-pesos
ALIAS_PESOS=tu-alias-pesos
CBU_DOLARES=tu-cbu-dolares
ALIAS_DOLARES=tu-alias-dolares
SWIFT=tu-codigo-swift
BANCO_INTERNACIONAL=Nombre Banco Internacional
CUENTA_INTERNACIONAL=tu-cuenta
DIRECCION_BENEFICIARIO=Tu Dirección
BASE_URL=https://TU-APP.railway.app
```

> ⚠️ Nunca subas valores reales al README ni al código. Usá siempre variables de entorno.

> ⚠️ `BASE_URL` = la URL que te da Railway (sin slash final)

### 2. Subir a GitHub y conectar Railway

```bash
git init
git add .
git commit -m "feat: viny2030 backend completo"
git remote add origin https://github.com/TU-USER/viny2030.git
git push -u origin main
```

Luego en Railway → New Project → Deploy from GitHub → seleccionar repo.

### 3. Verificar

```
https://TU-APP.railway.app/          → index
https://TU-APP.railway.app/comprobante → formulario
https://TU-APP.railway.app/admin       → panel
POST https://TU-APP.railway.app/api/orders → crea orden + envía email
```

## ⚠️ Nota sobre almacenamiento en Railway

Las órdenes se guardan en memoria (array). Al reiniciar el servidor se pierden.  
Para persistencia se recomienda agregar una base de datos (Railway PostgreSQL o MongoDB Atlas).
