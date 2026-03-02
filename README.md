# Viny 2030 — Backend

## Estructura
```
viny2030/
├── server.js
├── routes/
│   ├── orders.js      # POST/GET/PATCH órdenes + email cliente + notif admin
│   └── upload.js      # POST comprobante con adjunto al admin
├── utils/
│   ├── mailer.js      # Nodemailer Gmail
│   ├── emailTemplates.js  # 5 idiomas + 3 opciones de pago (ARS/USD/SWIFT)
│   └── orderCode.js   # Genera VNY-2026-XXXX
└── public/
    ├── index.html
    ├── comprobante.html
    └── admin.html
```

## Correr local
```bash
npm install
npm run dev        # con nodemon
# o
npm start
```

## Deploy en Railway

### 1. Variables de entorno en Railway
En el panel de Railway → tu proyecto → Variables, agregar TODAS:

```
PORT=3000
GMAIL_USER=viny01958@gmail.com
GMAIL_PASS=cnxs ctzq sefg ydkh
ADMIN_EMAIL=viny01958@gmail.com
TITULAR=Vicente Humberto Monteverde
BANCO=Banco Santander Argentina
CBU_PESOS=0140005203400552652310
ALIAS_PESOS=ALGORIT.MONTE.PESOS
CBU_DOLARES=0140005204400550329709
ALIAS_DOLARES=ALGO.MONTE.DOLARES
SWIFT=BSCHUYMM
BANCO_INTERNACIONAL=Banco Santander Montevideo
CUENTA_INTERNACIONAL=005200183500
DIRECCION_BENEFICIARIO=Av. Directorio 3024-PB-Dto 04
BASE_URL=https://TU-APP.railway.app
```

⚠️ **BASE_URL** = la URL que te da Railway (sin slash final)

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
- `https://TU-APP.railway.app/` → index
- `https://TU-APP.railway.app/comprobante` → formulario
- `https://TU-APP.railway.app/admin` → panel
- `POST https://TU-APP.railway.app/api/orders` → crea orden + envía email

## ⚠️ Nota sobre almacenamiento en Railway
Las órdenes se guardan en memoria (array). Al reiniciar el servidor se pierden.
Para persistencia se recomienda agregar una base de datos (Railway PostgreSQL o MongoDB Atlas).