const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendEmail } = require('../utils/mailer');

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/uploads');
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

// POST /api/upload - Subir comprobante
router.post('/', upload.single('comprobante'), async (req, res) => {
  try {
    const { orderCode, nombre, email } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se recibió ningún archivo' });
    }

    if (!orderCode) {
      return res.status(400).json({ success: false, error: 'Código de orden requerido' });
    }

    // 1. Notificar al admin con adjunto
    await sendEmail({
      to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
      subject: `💰 Comprobante recibido: ${orderCode} — ${nombre || 'Cliente'}`,
      html: `
        <div style="font-family:Arial;padding:20px;">
          <h2 style="color:#c9a84c;">Comprobante de pago recibido</h2>
          <p><strong>Código:</strong> ${orderCode}</p>
          <p><strong>Nombre:</strong> ${nombre || 'No especificado'}</p>
          <p><strong>Email:</strong> ${email || 'No especificado'}</p>
          <p><strong>Archivo:</strong> ${req.file.originalname}</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-AR')}</p>
          <p>El archivo está adjunto a este email.</p>
        </div>`,
      attachments: [{
        filename: req.file.originalname,
        path: req.file.path
      }]
    });

    // 2. Enviar opciones de pago al cliente
    if (email) {
      await sendEmail({
        to: email,
        subject: `🍷 Viny 2030 — Opciones de pago para tu orden ${orderCode}`,
        html: `
          <div style="font-family:Arial;padding:20px;max-width:600px;margin:0 auto;background:#0a0a0a;color:#f0f0f0;">
            <div style="text-align:center;padding:20px 0;">
              <h1 style="color:#c9a84c;font-size:28px;">🍷 Viny 2030</h1>
              <p style="color:#aaa;">Comprobante recibido — Orden <strong style="color:#c9a84c;">${orderCode}</strong></p>
            </div>

            <p style="font-size:16px;">Hola <strong>${nombre || 'cliente'}</strong>, recibimos tu comprobante correctamente.</p>
            <p>A continuación encontrás las opciones para realizar el pago:</p>

            <hr style="border-color:#333;margin:20px 0;">

            <!-- ARGENTINA PESOS -->
            <div style="background:#111;border-left:4px solid #c9a84c;padding:15px;margin-bottom:15px;border-radius:4px;">
              <h3 style="color:#c9a84c;margin:0 0 10px;">🇦🇷 Desde Argentina — Pesos (ARS)</h3>
              <table style="width:100%;font-size:14px;color:#ddd;">
                <tr><td style="padding:4px 0;color:#aaa;">Tipo:</td><td>Caja de Ahorro</td></tr>
                <tr><td style="padding:4px 0;color:#aaa;">CBU:</td><td><strong>0140005203400552652310</strong></td></tr>
                <tr><td style="padding:4px 0;color:#aaa;">Alias:</td><td><strong>ALGORIT.MONTE.PESOS</strong></td></tr>
                <tr><td style="padding:4px 0;color:#aaa;">Titular:</td><td>Vicente Humberto Monteverde</td></tr>
                <tr><td style="padding:4px 0;color:#aaa;">CUIL/CUIT:</td><td>20-12034411-1</td></tr>
              </table>
            </div>

            <!-- ARGENTINA DOLARES -->
            <div style="background:#111;border-left:4px solid #c9a84c;padding:15px;margin-bottom:15px;border-radius:4px;">
              <h3 style="color:#c9a84c;margin:0 0 10px;">🇦🇷 Desde Argentina — Dólares (USD)</h3>
              <table style="width:100%;font-size:14px;color:#ddd;">
                <tr><td style="padding:4px 0;color:#aaa;">Tipo:</td><td>Caja de Ahorro Dólares</td></tr>
                <tr><td style="padding:4px 0;color:#aaa;">CBU:</td><td><strong>0140005204400550329709</strong></td></tr>
                <tr><td style="padding:4px 0;color:#aaa;">Alias:</td><td><strong>ALGO.MONTE.DOLARES</strong></td></tr>
                <tr><td style="padding:4px 0;color:#aaa;">Titular:</td><td>Vicente Humberto Monteverde</td></tr>
                <tr><td style="padding:4px 0;color:#aaa;">CUIL/CUIT:</td><td>20-12034411-1</td></tr>
              </table>
            </div>

            <!-- EXTERIOR -->
            <div style="background:#111;border-left:4px solid #c9a84c;padding:15px;margin-bottom:15px;border-radius:4px;">
              <h3 style="color:#c9a84c;margin:0 0 10px;">🌍 Desde el Exterior — Wire Transfer</h3>
              <table style="width:100%;font-size:14px;color:#ddd;">
                <tr><td style="padding:4px 0;color:#aaa;">Banco:</td><td>Banco Santander Montevideo</td></tr>
                <tr><td style="padding:4px 0;color:#aaa;">Beneficiario:</td><td>Vicente Humberto Monteverde</td></tr>
                <tr><td style="padding:4px 0;color:#aaa;">Dirección:</td><td>Av. Directorio 3024-PB-DTO 04</td></tr>
                <tr><td style="padding:4px 0;color:#aaa;">CUIT:</td><td>20-12034411-1</td></tr>
                <tr><td style="padding:4px 0;color:#aaa;">Cuenta:</td><td>Caja de Ahorro en Dólares</td></tr>
                <tr><td style="padding:4px 0;color:#aaa;">Número:</td><td><strong>005200183500</strong></td></tr>
                <tr><td style="padding:4px 0;color:#aaa;">SWIFT:</td><td><strong>BSCHUYMM</strong></td></tr>
              </table>
            </div>

            <hr style="border-color:#333;margin:20px 0;">
            <p style="color:#aaa;font-size:13px;text-align:center;">
              Una vez realizado el pago, nos comunicaremos para confirmar tu pedido.<br>
              Ante cualquier consulta respondé este email.<br><br>
              <strong style="color:#c9a84c;">🍷 Viny 2030</strong>
            </p>
          </div>`
      });
    }

    res.json({ success: true, message: 'Comprobante enviado correctamente', file: req.file.filename });

  } catch (err) {
    console.error('Error uploading receipt:', err);
    res.status(500).json({ success: false, error: 'Error al procesar el comprobante', detail: err.message });
  }
});

module.exports = router;
