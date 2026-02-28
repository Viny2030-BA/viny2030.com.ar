const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const fs = require('fs');

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const code = req.body.orderCode || 'UNKNOWN';
    cb(null, `${code}_${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Solo se aceptan JPG, PNG, WEBP o PDF'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

// POST /api/upload - Upload receipt
router.post('/', upload.single('comprobante'), async (req, res) => {
  try {
    const { orderCode, name, email } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    if (!orderCode) {
      return res.status(400).json({ error: 'Código de orden requerido' });
    }

    // Notify admin with attachment
    await transporter.sendMail({
      from: `"Viny 2030 Sistema" <${process.env.GMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
      subject: `💰 Comprobante recibido: ${orderCode} — ${name || 'Cliente'}`,
      html: `
        <h2 style="color:#c9a84c">Comprobante de pago recibido</h2>
        <p><strong>Código:</strong> ${orderCode}</p>
        <p><strong>Nombre:</strong> ${name || 'No especificado'}</p>
        <p><strong>Email:</strong> ${email || 'No especificado'}</p>
        <p><strong>Archivo:</strong> ${req.file.originalname}</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-AR')}</p>
        <p>El archivo está adjunto a este email.</p>
      `,
      attachments: [{
        filename: req.file.originalname,
        path: req.file.path
      }]
    });

    res.json({ success: true, message: 'Comprobante enviado correctamente', file: req.file.filename });

  } catch (err) {
    console.error('Error uploading receipt:', err);
    res.status(500).json({ error: 'Error al procesar el comprobante', detail: err.message });
  }
});

module.exports = router;
