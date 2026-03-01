// routes/pagos.js
// Rutas del sistema de pagos VNY 2030
// Integrar en server.js con: app.use('/pagos', require('./routes/pagos'))

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

// ─── Configuración de almacenamiento de comprobantes ────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/comprobantes');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const code = req.body.code || 'SIN-CODIGO';
    const ext = path.extname(file.originalname);
    cb(null, `${code}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase());
    ok ? cb(null, true) : cb(new Error('Solo JPG, PNG o PDF'));
  }
});

// ─── Generador de código VNY ─────────────────────────────────────────────────
function generarCodigo() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `VNY-2026-${num}`;
}

// ─── Configuración email ──────────────────────────────────────────────────────
function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });
}

// ─── Templates de email por idioma ───────────────────────────────────────────
const emailTemplates = {
  es: (data) => ({
    subject: `Datos de pago – ${data.service} | Código: ${data.code}`,
    body: `Estimado/a ${data.name},

Gracias por elegir VNY 2030. A continuación encontrará los datos para realizar su pago.

📋 Código de Operación: ${data.code}
🛒 Servicio: ${data.service}
💰 Monto: ${data.amount} ${data.currency}

━━━━━━━━━━━━━━━━━━━━━━━
PESOS ARGENTINOS (ARS)
━━━━━━━━━━━━━━━━━━━━━━━
Banco: Santander Argentina
Tipo: Caja de Ahorro Pesos
CBU: 0140005203400552652310
Alias: ALGORIT.MONTE.PESOS
Titular: Vicente Humberto Monteverde
CUIL: 20-12034411-1

━━━━━━━━━━━━━━━━━━━━━━━
DÓLARES – CUENTA ARGENTINA
━━━━━━━━━━━━━━━━━━━━━━━
Banco: Santander Argentina
Tipo: Caja de Ahorro Dólares
CBU: 0140005204400550329709
Alias: ALGO.MONTE.DOLARES
Titular: Vicente Humberto Monteverde
CUIL: 20-12034411-1

━━━━━━━━━━━━━━━━━━━━━━━
TRANSFERENCIA INTERNACIONAL (USD)
━━━━━━━━━━━━━━━━━━━━━━━
Banco: Banco Santander Montevideo
Beneficiario: Vicente Humberto Monteverde
Dirección: Av. Directorio 3024, PB, Dto 04
Cuenta N°: 005200183500
SWIFT/BIC: BSCHUYMM

━━━━━━━━━━━━━━━━━━━━━━━

Una vez realizado el pago, suba su comprobante en:
🔗 ${process.env.BASE_URL}/pagos/comprobante?code=${data.code}

Mencione su código ${data.code} en el comprobante.

Saludos cordiales,
Equipo VNY 2030
www.viny2030.com.ar`
  }),

  en: (data) => ({
    subject: `Payment details – ${data.service} | Code: ${data.code}`,
    body: `Dear ${data.name},

Thank you for choosing VNY 2030. Below are the payment details for your booking.

📋 Operation Code: ${data.code}
🛒 Service: ${data.service}
💰 Amount: ${data.amount} ${data.currency}

━━━━━━━━━━━━━━━━━━━━━━━
ARGENTINA – PESOS (ARS)
━━━━━━━━━━━━━━━━━━━━━━━
Bank: Santander Argentina
Account: Savings (Pesos)
CBU: 0140005203400552652310
Alias: ALGORIT.MONTE.PESOS
Holder: Vicente Humberto Monteverde
Tax ID: 20-12034411-1

━━━━━━━━━━━━━━━━━━━━━━━
ARGENTINA – US DOLLARS
━━━━━━━━━━━━━━━━━━━━━━━
Bank: Santander Argentina
Account: Savings (USD)
CBU: 0140005204400550329709
Alias: ALGO.MONTE.DOLARES
Holder: Vicente Humberto Monteverde
Tax ID: 20-12034411-1

━━━━━━━━━━━━━━━━━━━━━━━
INTERNATIONAL WIRE (USD)
━━━━━━━━━━━━━━━━━━━━━━━
Bank: Banco Santander Montevideo
Beneficiary: Vicente Humberto Monteverde
Address: Av. Directorio 3024, Ground Floor, Apt 04
Account No: 005200183500
SWIFT/BIC: BSCHUYMM

━━━━━━━━━━━━━━━━━━━━━━━

Once paid, please upload your receipt at:
🔗 ${process.env.BASE_URL}/pagos/comprobante?code=${data.code}

Include your code ${data.code} in the description.

Best regards,
VNY 2030 Team
www.viny2030.com.ar`
  }),

  fr: (data) => ({
    subject: `Données de paiement – ${data.service} | Code : ${data.code}`,
    body: `Cher(e) ${data.name},

Merci d'avoir choisi VNY 2030. Vous trouverez ci-dessous les informations de paiement.

📋 Code d'Opération : ${data.code}
🛒 Service : ${data.service}
💰 Montant : ${data.amount} ${data.currency}

━━━━━━━━━━━━━━━━━━━━━━━
ARGENTINE – PESOS (ARS)
━━━━━━━━━━━━━━━━━━━━━━━
Banque : Santander Argentine
Compte : Épargne Pesos
CBU : 0140005203400552652310
Alias : ALGORIT.MONTE.PESOS
Titulaire : Vicente Humberto Monteverde
ID Fiscal : 20-12034411-1

━━━━━━━━━━━━━━━━━━━━━━━
ARGENTINE – DOLLARS US
━━━━━━━━━━━━━━━━━━━━━━━
Banque : Santander Argentine
Compte : Épargne USD
CBU : 0140005204400550329709
Alias : ALGO.MONTE.DOLARES
Titulaire : Vicente Humberto Monteverde
ID Fiscal : 20-12034411-1

━━━━━━━━━━━━━━━━━━━━━━━
VIREMENT INTERNATIONAL (USD)
━━━━━━━━━━━━━━━━━━━━━━━
Banque : Banco Santander Montevideo
Bénéficiaire : Vicente Humberto Monteverde
Adresse : Av. Directorio 3024, RDC, Apt 04
N° de Compte : 005200183500
SWIFT/BIC : BSCHUYMM

━━━━━━━━━━━━━━━━━━━━━━━

Après paiement, téléchargez votre reçu sur :
🔗 ${process.env.BASE_URL}/pagos/comprobante?code=${data.code}

Mentionnez votre code ${data.code} dans la description.

Cordialement,
Équipe VNY 2030
www.viny2030.com.ar`
  }),

  de: (data) => ({
    subject: `Zahlungsdaten – ${data.service} | Code: ${data.code}`,
    body: `Sehr geehrte(r) ${data.name},

Vielen Dank, dass Sie VNY 2030 gewählt haben. Nachfolgend die Zahlungsdaten.

📋 Vorgangs-Code: ${data.code}
🛒 Dienst: ${data.service}
💰 Betrag: ${data.amount} ${data.currency}

━━━━━━━━━━━━━━━━━━━━━━━
ARGENTINIEN – PESO (ARS)
━━━━━━━━━━━━━━━━━━━━━━━
Bank: Santander Argentinien
Konto: Sparkonto Peso
CBU: 0140005203400552652310
Alias: ALGORIT.MONTE.PESOS
Inhaber: Vicente Humberto Monteverde
Steuer-ID: 20-12034411-1

━━━━━━━━━━━━━━━━━━━━━━━
ARGENTINIEN – US-DOLLAR
━━━━━━━━━━━━━━━━━━━━━━━
Bank: Santander Argentinien
Konto: Sparkonto USD
CBU: 0140005204400550329709
Alias: ALGO.MONTE.DOLARES
Inhaber: Vicente Humberto Monteverde
Steuer-ID: 20-12034411-1

━━━━━━━━━━━━━━━━━━━━━━━
INTERNATIONALE ÜBERWEISUNG (USD)
━━━━━━━━━━━━━━━━━━━━━━━
Bank: Banco Santander Montevideo
Begünstigter: Vicente Humberto Monteverde
Adresse: Av. Directorio 3024, EG, Whg 04
Kontonummer: 005200183500
SWIFT/BIC: BSCHUYMM

━━━━━━━━━━━━━━━━━━━━━━━

Nach der Zahlung laden Sie bitte Ihren Beleg hoch:
🔗 ${process.env.BASE_URL}/pagos/comprobante?code=${data.code}

Geben Sie bitte Ihren Code ${data.code} in der Beschreibung an.

Mit freundlichen Grüßen,
Team VNY 2030
www.viny2030.com.ar`
  }),

  it: (data) => ({
    subject: `Dati di pagamento – ${data.service} | Codice: ${data.code}`,
    body: `Gentile ${data.name},

Grazie per aver scelto VNY 2030. Di seguito i dati per effettuare il pagamento.

📋 Codice Operazione: ${data.code}
🛒 Servizio: ${data.service}
💰 Importo: ${data.amount} ${data.currency}

━━━━━━━━━━━━━━━━━━━━━━━
ARGENTINA – PESOS (ARS)
━━━━━━━━━━━━━━━━━━━━━━━
Banca: Santander Argentina
Conto: Risparmio Pesos
CBU: 0140005203400552652310
Alias: ALGORIT.MONTE.PESOS
Intestatario: Vicente Humberto Monteverde
Codice Fiscale: 20-12034411-1

━━━━━━━━━━━━━━━━━━━━━━━
ARGENTINA – DOLLARI USA
━━━━━━━━━━━━━━━━━━━━━━━
Banca: Santander Argentina
Conto: Risparmio USD
CBU: 0140005204400550329709
Alias: ALGO.MONTE.DOLARES
Intestatario: Vicente Humberto Monteverde
Codice Fiscale: 20-12034411-1

━━━━━━━━━━━━━━━━━━━━━━━
BONIFICO INTERNAZIONALE (USD)
━━━━━━━━━━━━━━━━━━━━━━━
Banca: Banco Santander Montevideo
Beneficiario: Vicente Humberto Monteverde
Indirizzo: Av. Directorio 3024, PT, App 04
N° Conto: 005200183500
SWIFT/BIC: BSCHUYMM

━━━━━━━━━━━━━━━━━━━━━━━

Dopo il pagamento, carichi la ricevuta su:
🔗 ${process.env.BASE_URL}/pagos/comprobante?code=${data.code}

Indichi il codice ${data.code} nella descrizione.

Cordiali saluti,
Team VNY 2030
www.viny2030.com.ar`
  })
};

// ─── In-memory store de órdenes (reemplazar por DB en producción) ─────────────
const orders = new Map();

// ─── RUTAS ────────────────────────────────────────────────────────────────────

// GET /pagos → formulario principal
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pagos.html'));
});

// GET /pagos/comprobante → página de subida
router.get('/comprobante', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/comprobante.html'));
});

// POST /pagos/api/nueva-orden → genera código y envía email
router.post('/api/nueva-orden', async (req, res) => {
  try {
    const { name, email, country, currency, amount, service, lang = 'es' } = req.body;

    if (!name || !email || !service) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const code = generarCodigo();
    const order = { code, name, email, country, currency, amount, service, lang, status: 'pendiente', createdAt: new Date() };
    orders.set(code, order);

    // Enviar email al cliente
    const template = emailTemplates[lang] || emailTemplates.es;
    const { subject, body } = template({ name, code, service, amount, currency });

    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"VNY 2030" <${process.env.GMAIL_USER}>`,
      to: email,
      subject,
      text: body
    });

    // Notificar al admin
    await transporter.sendMail({
      from: `"VNY 2030 Sistema" <${process.env.GMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `[Nueva Orden] ${code} – ${name}`,
      text: `Nueva orden creada:\n\nCódigo: ${code}\nCliente: ${name}\nEmail: ${email}\nServicio: ${service}\nMonto: ${amount} ${currency}\nIdioma: ${lang}\nFecha: ${new Date().toLocaleString('es-AR')}`
    });

    res.json({ success: true, code });

  } catch (err) {
    console.error('Error nueva orden:', err);
    res.status(500).json({ error: 'Error al procesar la orden' });
  }
});

// POST /pagos/api/subir-comprobante → recibe archivo
router.post('/api/subir-comprobante', upload.single('comprobante'), async (req, res) => {
  try {
    const { code, notes } = req.body;

    if (!code) return res.status(400).json({ error: 'Código requerido' });
    if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });

    const order = orders.get(code);
    if (order) {
      order.status = 'comprobante_recibido';
      order.comprobante = req.file.filename;
      order.notes = notes;
      order.uploadedAt = new Date();
    }

    // Notificar al admin con adjunto
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"VNY 2030 Sistema" <${process.env.GMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `[Comprobante] ${code}`,
      text: `Se recibió comprobante de pago:\n\nCódigo: ${code}\nArchivo: ${req.file.filename}\nNotas: ${notes || '—'}\nFecha: ${new Date().toLocaleString('es-AR')}`,
      attachments: [{
        filename: req.file.originalname,
        path: req.file.path
      }]
    });

    res.json({ success: true, code });

  } catch (err) {
    console.error('Error comprobante:', err);
    res.status(500).json({ error: 'Error al subir el comprobante' });
  }
});

// GET /pagos/api/orden/:code → consultar estado de orden
router.get('/api/orden/:code', (req, res) => {
  const order = orders.get(req.params.code);
  if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
  res.json({ code: order.code, status: order.status, service: order.service, createdAt: order.createdAt });
});

module.exports = router;
module.exports.orders = orders; // exportar para uso en admin
