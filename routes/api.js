// routes/api.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { generateOrderCode } = require('../utils/orderCode');
const { getEmailTemplate } = require('../utils/emailTemplates');
const { sendEmail } = require('../utils/mailer');

// ─── Multer config ────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.body.orderCode || 'comprobante'}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Solo se permiten imágenes (JPG, PNG, WEBP) o PDF'));
  }
});

// ─── POST /api/orden ──────────────────────────────────
// Crea una orden y envía email al cliente con datos de pago
router.post('/orden', async (req, res) => {
  try {
    const { nombre, email, monto, idioma = 'es', descripcion } = req.body;

    if (!nombre || !email || !monto) {
      return res.status(400).json({ error: 'Faltan campos: nombre, email, monto' });
    }

    const orderCode = generateOrderCode();
    const uploadUrl = `${process.env.BASE_URL}/comprobante?codigo=${orderCode}`;

    const templateData = {
      nombre,
      monto,
      orderCode,
      cbu: process.env.BANK_CBU,
      alias: process.env.BANK_ALIAS,
      titular: process.env.BANK_TITULAR,
      banco: process.env.BANK_BANCO,
      uploadUrl,
      descripcion
    };

    const { subject, html } = getEmailTemplate(idioma, templateData);

    // Email al cliente
    await sendEmail({ to: email, subject, html });

    // Notificación al admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `🆕 Nueva orden ${orderCode} - ${nombre}`,
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2 style="color: #1a1a2e;">Nueva orden recibida</h2>
          <p><strong>Código:</strong> ${orderCode}</p>
          <p><strong>Cliente:</strong> ${nombre}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Monto:</strong> $${monto}</p>
          <p><strong>Idioma:</strong> ${idioma}</p>
          ${descripcion ? `<p><strong>Descripción:</strong> ${descripcion}</p>` : ''}
          <hr>
          <p style="color:#999; font-size:12px;">Email automático de viny2030.com.ar</p>
        </div>`
    });

    res.json({
      success: true,
      orderCode,
      message: `Email enviado a ${email}`
    });

  } catch (err) {
    console.error('Error en /api/orden:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/comprobante ────────────────────────────
// Recibe el comprobante de pago subido por el cliente
router.post('/comprobante', upload.single('comprobante'), async (req, res) => {
  try {
    const { orderCode, nombre, email } = req.body;

    if (!orderCode || !req.file) {
      return res.status(400).json({ error: 'Faltan orderCode o archivo' });
    }

    const fileUrl = `${process.env.BASE_URL}/uploads/${req.file.filename}`;

    // Notificación al admin con el comprobante
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `💰 Comprobante recibido - ${orderCode}`,
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2 style="color: #e94560;">Comprobante de pago recibido</h2>
          <p><strong>Código de orden:</strong> ${orderCode}</p>
          <p><strong>Cliente:</strong> ${nombre || 'No informado'}</p>
          <p><strong>Email:</strong> ${email || 'No informado'}</p>
          <p><strong>Archivo:</strong> <a href="${fileUrl}">${req.file.filename}</a></p>
          <hr>
          <p style="color:#999; font-size:12px;">Email automático de viny2030.com.ar</p>
        </div>`,
      attachments: [{
        filename: req.file.filename,
        path: req.file.path
      }]
    });

    res.json({
      success: true,
      message: 'Comprobante recibido. Te avisamos cuando confirmemos el pago.'
    });

  } catch (err) {
    console.error('Error en /api/comprobante:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/health ──────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
