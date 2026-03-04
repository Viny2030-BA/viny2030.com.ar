const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendEmail } = require('../utils/mailer');
const { setupClientRepo, uploadFileToRepo, uploadBinaryFileToRepo } = require('../utils/github');

const GITHUB_ORG = process.env.GITHUB_ORG || 'Viny2030-Clientes';

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
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4', 'video/quicktime'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Formato no permitido'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } });

// ─────────────────────────────────────────────
// POST /api/upload — Subir comprobante de pago
// ─────────────────────────────────────────────
router.post('/', upload.single('comprobante'), async (req, res) => {
  try {
    const { orderCode, nombre, email, monto, producto } = req.body;

    if (!req.file) return res.status(400).json({ success: false, error: 'No se recibió ningún archivo' });
    if (!orderCode) return res.status(400).json({ success: false, error: 'Código de orden requerido' });

    const BASE_URL = process.env.BASE_URL || 'https://viny2030.com.ar';
    const formularioUrl = `${BASE_URL}/relato?orden=${orderCode}&email=${encodeURIComponent(email || '')}`;

    // 1. Crear repo en GitHub org
    try {
      await setupClientRepo({
        orderCode,
        nombre,
        email,
        monto,
        producto,
        comprobantePath: req.file.path,
        comprobanteOriginalName: req.file.originalname
      });
    } catch (ghErr) {
      console.error('Error GitHub:', ghErr.message);
      // No interrumpir el flujo si falla GitHub
    }

    // 2. Notificar al admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
      subject: `💰 Comprobante recibido: ${orderCode} — ${nombre || 'Cliente'}`,
      html: `
        <div style="font-family:Arial;padding:20px;">
          <h2 style="color:#c9a84c;">Comprobante de pago recibido</h2>
          <p><strong>Código:</strong> ${orderCode}</p>
          <p><strong>Nombre:</strong> ${nombre || 'No especificado'}</p>
          <p><strong>Email:</strong> ${email || 'No especificado'}</p>
          <p><strong>Monto:</strong> ${monto || 'No especificado'}</p>
          <p><strong>Producto:</strong> ${producto || 'No especificado'}</p>
          <p><strong>Archivo:</strong> ${req.file.originalname}</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-AR')}</p>
          <p>📁 <a href="https://github.com/${GITHUB_ORG}/${orderCode.toLowerCase()}">Ver expediente en GitHub</a></p>
        </div>`,
      attachments: [{ filename: req.file.originalname, path: req.file.path }]
    });

    // 3. Email al cliente con opciones de pago + link al formulario
    if (email) {
      await sendEmail({
        to: email,
        subject: `🍷 Viny 2030 — Opciones de pago para tu orden ${orderCode}`,
        html: `
          <div style="font-family:Arial;padding:20px;max-width:600px;margin:0 auto;background:#0a0a0a;color:#f0f0f0;">
            <div style="text-align:center;padding:20px 0;">
              <h1 style="color:#c9a84c;font-size:28px;">🍷 Viny 2030</h1>
              <p style="color:#aaa;">Orden <strong style="color:#c9a84c;">${orderCode}</strong></p>
            </div>

            <p>Hola <strong>${nombre || 'cliente'}</strong>, recibimos tu comprobante. A continuación las opciones de pago:</p>

            <div style="background:#111;border-left:4px solid #c9a84c;padding:15px;margin-bottom:15px;border-radius:4px;">
              <h3 style="color:#c9a84c;margin:0 0 10px;">🇦🇷 Desde Argentina — Pesos (ARS)</h3>
              <table style="width:100%;font-size:14px;color:#ddd;">
                <tr><td style="color:#aaa;padding:4px 0;">Tipo:</td><td>Caja de Ahorro</td></tr>
                <tr><td style="color:#aaa;padding:4px 0;">CBU:</td><td><strong>0140005203400552652310</strong></td></tr>
                <tr><td style="color:#aaa;padding:4px 0;">Alias:</td><td><strong>ALGORIT.MONTE.PESOS</strong></td></tr>
                <tr><td style="color:#aaa;padding:4px 0;">Titular:</td><td>Vicente Humberto Monteverde</td></tr>
                <tr><td style="color:#aaa;padding:4px 0;">CUIL/CUIT:</td><td>20-12034411-1</td></tr>
              </table>
            </div>

            <div style="background:#111;border-left:4px solid #c9a84c;padding:15px;margin-bottom:15px;border-radius:4px;">
              <h3 style="color:#c9a84c;margin:0 0 10px;">🇦🇷 Desde Argentina — Dólares (USD)</h3>
              <table style="width:100%;font-size:14px;color:#ddd;">
                <tr><td style="color:#aaa;padding:4px 0;">Tipo:</td><td>Caja de Ahorro Dólares</td></tr>
                <tr><td style="color:#aaa;padding:4px 0;">CBU:</td><td><strong>0140005204400550329709</strong></td></tr>
                <tr><td style="color:#aaa;padding:4px 0;">Alias:</td><td><strong>ALGO.MONTE.DOLARES</strong></td></tr>
                <tr><td style="color:#aaa;padding:4px 0;">Titular:</td><td>Vicente Humberto Monteverde</td></tr>
                <tr><td style="color:#aaa;padding:4px 0;">CUIL/CUIT:</td><td>20-12034411-1</td></tr>
              </table>
            </div>

            <div style="background:#111;border-left:4px solid #c9a84c;padding:15px;margin-bottom:20px;border-radius:4px;">
              <h3 style="color:#c9a84c;margin:0 0 10px;">🌍 Desde el Exterior — Wire Transfer</h3>
              <table style="width:100%;font-size:14px;color:#ddd;">
                <tr><td style="color:#aaa;padding:4px 0;">Banco:</td><td>Banco Santander Montevideo</td></tr>
                <tr><td style="color:#aaa;padding:4px 0;">Beneficiario:</td><td>Vicente Humberto Monteverde</td></tr>
                <tr><td style="color:#aaa;padding:4px 0;">Dirección:</td><td>Av. Directorio 3024-PB-DTO 04</td></tr>
                <tr><td style="color:#aaa;padding:4px 0;">CUIT:</td><td>20-12034411-1</td></tr>
                <tr><td style="color:#aaa;padding:4px 0;">Cuenta:</td><td>Caja de Ahorro en Dólares</td></tr>
                <tr><td style="color:#aaa;padding:4px 0;">Número:</td><td><strong>005200183500</strong></td></tr>
                <tr><td style="color:#aaa;padding:4px 0;">SWIFT:</td><td><strong>BSCHUYMM</strong></td></tr>
              </table>
            </div>

            <div style="text-align:center;padding:20px;background:#111;border-radius:8px;margin-top:10px;">
              <p style="margin-bottom:15px;font-size:15px;">Una vez realizado el depósito, completá el formulario con el relato de tu consulta:</p>
              <a href="${formularioUrl}" style="background:#c9a84c;color:#000;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px;display:inline-block;">
                📝 Completar formulario de consulta
              </a>
            </div>

            <p style="color:#aaa;font-size:13px;text-align:center;margin-top:20px;">
              Ante cualquier consulta respondé este email.<br>
              <strong style="color:#c9a84c;">🍷 Viny 2030</strong>
            </p>
          </div>`
      });
    }

    res.json({ success: true, message: 'Comprobante enviado correctamente', file: req.file.filename });

  } catch (err) {
    console.error('Error upload:', err);
    res.status(500).json({ success: false, error: 'Error al procesar el comprobante', detail: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/upload/relato — Formulario de relato del problema
// ─────────────────────────────────────────────
const uploadRelato = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '../public/uploads/relatos');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${req.body.orderCode || 'UNKNOWN'}_${Date.now()}${ext}`);
    }
  }),
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }
});

router.post('/relato', uploadRelato.array('archivos', 10), async (req, res) => {
  try {
    const { orderCode, nombre, email, descripcion, fechaProblema, urgencia } = req.body;

    if (!orderCode) return res.status(400).json({ success: false, error: 'Código de orden requerido' });

    const repoName = orderCode.toLowerCase();
    const fecha = new Date().toLocaleString('es-AR');

    // 1. Actualizar analisis.md en el repo
    const analisisMd = `# Análisis — ${orderCode}

## Datos del relato

| Campo | Valor |
|-------|-------|
| **Cliente** | ${nombre || 'No especificado'} |
| **Email** | ${email || 'No especificado'} |
| **Fecha del problema** | ${fechaProblema || 'No especificado'} |
| **Urgencia** | ${urgencia || 'Normal'} |
| **Fecha de carga** | ${fecha} |

## Descripción del problema

${descripcion || 'Sin descripción'}

## Archivos adjuntos

${req.files && req.files.length > 0
  ? req.files.map(f => `- ${f.originalname}`).join('\n')
  : '_Sin archivos adjuntos_'}

## Análisis técnico

_Pendiente_

## Resolución propuesta

_Pendiente_
`;

    try {
      // Actualizar analisis.md
      await uploadFileToRepo(repoName, 'analisis.md', analisisMd, '📝 Relato del problema cargado');

      // Subir archivos adjuntos al repo
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          await uploadBinaryFileToRepo(
            repoName,
            `relato/${file.originalname}`,
            file.path,
            `📎 Archivo adjunto: ${file.originalname}`
          );
        }
      }

      // Actualizar estado.md
      const estadoUpdate = `# Estado del Expediente — ${orderCode}

## Historial de estados

| Fecha | Estado | Nota |
|-------|--------|------|
| ${fecha} | 🟠 En análisis | Relato del problema recibido |
`;
      await uploadFileToRepo(repoName, 'estado.md', estadoUpdate, '📊 Estado actualizado: en análisis');

    } catch (ghErr) {
      console.error('Error GitHub relato:', ghErr.message);
    }

    // 2. Notificar al admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
      subject: `📝 Nuevo relato de problema: ${orderCode} — ${nombre || 'Cliente'}`,
      html: `
        <div style="font-family:Arial;padding:20px;">
          <h2 style="color:#c9a84c;">Relato de problema recibido</h2>
          <p><strong>Código:</strong> ${orderCode}</p>
          <p><strong>Nombre:</strong> ${nombre || 'No especificado'}</p>
          <p><strong>Email:</strong> ${email || 'No especificado'}</p>
          <p><strong>Fecha del problema:</strong> ${fechaProblema || 'No especificado'}</p>
          <p><strong>Urgencia:</strong> ${urgencia || 'Normal'}</p>
          <p><strong>Descripción:</strong></p>
          <blockquote style="border-left:3px solid #c9a84c;padding-left:10px;color:#555;">${descripcion || 'Sin descripción'}</blockquote>
          <p><strong>Archivos adjuntos:</strong> ${req.files ? req.files.length : 0}</p>
          <p>📁 <a href="https://github.com/${GITHUB_ORG}/${repoName}">Ver expediente completo en GitHub</a></p>
        </div>`,
      attachments: req.files ? req.files.map(f => ({ filename: f.originalname, path: f.path })) : []
    });

    // 3. Confirmar al cliente
    if (email) {
      await sendEmail({
        to: email,
        subject: `🍷 Viny 2030 — Recibimos tu consulta ${orderCode}`,
        html: `
          <div style="font-family:Arial;padding:20px;max-width:600px;background:#0a0a0a;color:#f0f0f0;">
            <h1 style="color:#c9a84c;text-align:center;">🍷 Viny 2030</h1>
            <p>Hola <strong>${nombre || 'cliente'}</strong>,</p>
            <p>Recibimos tu relato para la orden <strong style="color:#c9a84c;">${orderCode}</strong>.</p>
            <p>Nuestro equipo analizará tu caso y te responderemos a la brevedad.</p>
            <p style="color:#aaa;font-size:13px;text-align:center;margin-top:30px;">
              <strong style="color:#c9a84c;">🍷 Viny 2030</strong>
            </p>
          </div>`
      });
    }

    res.json({ success: true, message: 'Relato enviado correctamente' });

  } catch (err) {
    console.error('Error relato:', err);
    res.status(500).json({ success: false, error: 'Error al procesar el relato', detail: err.message });
  }
});

module.exports = router;
