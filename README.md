# 🍷 Viny 2030 — Sistema de Pagos y Consultoría

Sistema completo de gestión de órdenes, pagos y análisis de datos para el Dr. Vicente Humberto Monteverde.

---

## 🌐 URLs

| URL | Descripción |
|-----|-------------|
| https://www.viny2030.com.ar | Formulario principal |
| https://www.viny2030.com.ar/comprobante | Subir comprobante de pago |
| https://www.viny2030.com.ar/relato | Formulario de consulta |
| https://www.viny2030.com.ar/admin | Panel de administración |
| https://www.viny2030.com.ar/aceptar | Aceptar propuesta |
| https://www.viny2030.com.ar/dr_monteverde.html | Página del Dr. Monteverde |

> `viny2030.com.ar` redirige automáticamente a `www.viny2030.com.ar` vía Cloudflare Redirect Rule (301).

---

## 🏗️ Stack

- **Backend**: Node.js + Express
- **Base de datos**: PostgreSQL (Railway)
- **Hosting**: Railway (plan Hobby)
- **DNS / CDN**: Cloudflare
- **Email**: Gmail (App Password)
- **Storage de expedientes**: GitHub Org privada (`Viny2030-Clientes`)
- **IA**: Anthropic Claude API (análisis y traducción)
- **Tests**: Python + pytest + GitHub Actions

---

## 📁 Estructura del proyecto

```
viny2030.com.ar/
├── server.js               # Servidor Express principal
├── package.json
├── railway.json            # Configuración Railway
├── test_viny2030.py        # Tests pytest
├── .github/
│   └── workflows/
│       └── tests.yml       # GitHub Actions CI
├── public/                 # Archivos estáticos
│   ├── index.html
│   ├── comprobante.html
│   ├── relato.html
│   ├── admin.html
│   ├── aceptar.html
│   └── dr_monteverde.html
├── routes/
│   ├── orders.js           # API de órdenes
│   └── upload.js           # Upload de comprobantes y relatos
└── utils/
    ├── db.js               # Conexión PostgreSQL
    ├── mailer.js           # Envío de emails
    ├── orderCode.js        # Generación de códigos VNY-XXXX
    ├── emailTemplates.js   # Templates multiidioma
    ├── github.js           # Integración GitHub org clientes
    └── migrate.js          # Migración de base de datos
```

---

## 🚀 Deploy en Railway

### 1. Clonar el repo

```bash
git clone https://github.com/Viny2030-BA/viny2030.com.ar.git
cd viny2030.com.ar
npm install
```

### 2. Configurar variables de entorno en Railway

En Railway → tu proyecto → Variables:

```env
# Base de datos (Railway la provee automáticamente con PostgreSQL)
DATABASE_URL=postgresql://...

# Email
GMAIL_USER=tuemail@gmail.com
GMAIL_PASS=xxxx xxxx xxxx xxxx   ← App Password de Google (16 caracteres)
ADMIN_EMAIL=admin@viny2030.com.ar

# Datos bancarios
CBU_PESOS=0140005203400552652310
ALIAS_PESOS=ALGORIT.MONTE.PESOS
CBU_DOLARES=0140005204400550329709
ALIAS_DOLARES=ALGO.MONTE.DOLARES
TITULAR=Vicente Humberto Monteverde
BANCO=Banco Santander Argentina
SWIFT=BSCHUYMM
BANCO_INTERNACIONAL=Banco Santander Montevideo
CUENTA_INTERNACIONAL=005200183500
DIRECCION_BENEFICIARIO=Av. Directorio 3024-PB-Dto 04

# App
BASE_URL=https://www.viny2030.com.ar
PORT=8080

# GitHub (expedientes de clientes)
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
GITHUB_ORG=Viny2030-Clientes

# IA
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
```

### 3. Activar App Password en Gmail

1. Ir a [myaccount.google.com](https://myaccount.google.com) → Seguridad
2. Activar Verificación en 2 pasos
3. Contraseñas de aplicaciones → "Otra" → "Viny2030"
4. Copiar el código de 16 caracteres → pegarlo en `GMAIL_PASS`

---

## 🌐 Configuración DNS (Cloudflare)

### Registros DNS

| Tipo | Nombre | Contenido | Proxy |
|------|--------|-----------|-------|
| CNAME | `viny2030.com.ar` | `viny2030comar-production.up.railway.app` | ☁️ Proxied |
| CNAME | `www` | `viny2030comar-production.up.railway.app` | ☁️ DNS only |

> ⚠️ El registro `www` debe estar en **DNS only** (nube gris) para que Railway maneje el SSL correctamente.

### Redirect Rule (raíz → www)

En Cloudflare → Rules → Redirect Rules:

- **Source**: `viny2030.com.ar/*`
- **Target**: `https://www.viny2030.com.ar/${1}`
- **Status**: 301

### SSL/TLS

- Modo: **Full** (no Flexible)

---

## 📡 API Reference

### POST `/api/orders` — Crear orden

```json
{
  "name": "Juan Perez",
  "email": "juan@email.com",
  "amount": 10,
  "lang": "es",
  "product": "Diagnostico Algoritmico"
}
```

Respuesta:
```json
{
  "success": true,
  "orderCode": "VNY-2026-AB3C1X2D",
  "uploadUrl": "https://www.viny2030.com.ar/comprobante?codigo=VNY-2026-AB3C1X2D",
  "message": "Email enviado"
}
```

### GET `/api/orders` — Listar todas las órdenes

### GET `/api/orders/:code` — Obtener una orden

### PATCH `/api/orders/:code/status` — Cambiar estado

```json
{ "status": "en_proceso" }
```

### POST `/api/orders/:code/analisis` — Enviar análisis al cliente

```json
{
  "analisis": "Texto del análisis...",
  "propuesta": "Texto de la propuesta..."
}
```

### POST `/api/orders/:code/aceptar` — Cliente acepta propuesta

### POST `/api/upload` — Subir comprobante de pago

Form-data:
- `comprobante` (archivo: jpg, png, pdf, mp4)
- `orderCode`, `nombre`, `email`, `monto`, `producto`

### POST `/api/upload/relato` — Enviar relato del problema

Form-data:
- `archivos[]` (hasta 10 archivos: csv, xlsx, parquet, jpg, pdf, mp4...)
- `orderCode`, `nombre`, `email`, `descripcion`, `fechaProblema`, `urgencia`

---

## 🌍 Idiomas soportados

Los emails se envían automáticamente en el idioma del cliente:

| Código | Idioma |
|--------|--------|
| `es` | 🇦🇷 Español |
| `en` | 🇬🇧 Inglés |
| `fr` | 🇫🇷 Francés |
| `de` | 🇩🇪 Alemán |
| `it` | 🇮🇹 Italiano |
| `pt` | 🇧🇷 Portugués |

---

## 🧪 Tests

### Correr localmente

```bash
pip install pytest requests
pytest test_viny2030.py -v
```

### Correr contra producción

```bash
BASE_URL=https://www.viny2030.com.ar pytest test_viny2030.py -v
```

### CI automático (GitHub Actions)

Los tests corren automáticamente en cada `push` a `main`. Ver resultados en:
**Actions → Tests Viny2030**

Cobertura de tests (26 en total):

- ✅ Páginas HTML (index, comprobante, admin, relato, aceptar, dr_monteverde)
- ✅ Redirects (dr-monteverde → dr_monteverde)
- ✅ API Orders (crear, listar, obtener, cambiar status, análisis)
- ✅ Upload comprobante (validaciones de archivo y campos)
- ✅ Upload relato (con y sin archivos adjuntos)

---

## 🔄 Flujo de trabajo

```
1. Cliente llena formulario → POST /api/orders
2. Sistema genera código VNY-XXXX y envía email con datos de pago
3. Cliente transfiere y sube comprobante → POST /api/upload
4. Admin recibe notificación → revisa en panel /admin
5. Admin carga análisis y propuesta → POST /api/orders/:code/analisis
6. Cliente recibe email con análisis → acepta → POST /api/orders/:code/aceptar
7. Sistema envía datos de pago final (USD 40)
8. Admin coordina implementación
```

---

## 📂 Expedientes en GitHub

Cada cliente tiene un repositorio privado en la organización `Viny2030-Clientes`:

- `README.md` — datos del cliente
- `analisis.md` — relato + análisis técnico
- `estado.md` — historial de estados
- `relato/` — archivos adjuntos del cliente (CSV, Excel, Parquet, etc.)
- `comprobante.*` — imagen/PDF del comprobante de pago

---

## 🛠️ Desarrollo local

```bash
# Instalar dependencias
npm install

# Crear archivo .env con las variables (ver .env.example)
cp .env.example .env

# Correr en modo desarrollo
node server.js
```

El servidor queda disponible en `http://localhost:3000`.

---

## 📝 Notas importantes

- El `orderCode` se genera con aleatoriedad (`Math.random` + `Date.now`) para evitar colisiones en la DB
- El registro `www` en Cloudflare debe estar en **DNS only** — si se pone en Proxied, Railway detecta el proxy y falla el SSL
- Railway es efímero — no usar archivos locales para almacenar estado (como contadores). Usar siempre la DB o aleatoriedad
- El plan actual de Railway tiene un límite de **2 requests/segundo** en la DB

---

*🍷 Viny 2030 — viny2030.com.ar*
