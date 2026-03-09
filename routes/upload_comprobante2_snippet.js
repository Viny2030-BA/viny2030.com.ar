// ─────────────────────────────────────────────────────────────────────────────
// POST /api/upload/comprobante2 — Subir comprobante del segundo pago (USD 40)
// Igual que /api/upload pero registra comprobante2_at y notifica correctamente.
// AGREGAR al final de routes/upload.js, antes de: module.exports = router;
// ─────────────────────────────────────────────────────────────────────────────

const uploadComprobante2 = multer({
  storage,
  fileFilter: fileFilterComprobante,
  limits: { fileSize: 20 * 1024 * 1024 }
});

router.post('/comprobante2', uploadComprobante2.single('comprobante'), async (req, res) => {
  try {
    const { orderCode, nombre, email, monto, producto } = req.body;

    if (!req.file)     return res.status(400).json({ success: false, error: 'No se recibió ningún archivo' });
    if (!orderCode)    return res.status(400).json({ success: false, error: 'Código de orden requerido' });

    // 1. Registrar timestamp en DB
    await pool.query(
      `UPDATE orders SET comprobante2_at = NOW(), status = 'pago2_recibido' WHERE id = $1`,
      [orderCode]
    );

    const repoName = orderCode.toLowerCase();

    // 2. Subir comprobante al repo GitHub del cliente (carpeta comprobantes/)
    try {
      await uploadBinaryFileToRepo(
        repoName,
        `comprobantes/comprobante2${path.extname(req.file.originalname)}`,
        req.file.path,
        '💰 Segundo comprobante de pago recibido'
      );
    } catch (ghErr) {
      console.error('Error GitHub comprobante2:', ghErr.message);
    }

    // 3. Notificar al admin — incluye aviso para emitir factura
    await sendEmail({
      to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
      subject: `💰 2do PAGO recibido: ${orderCode} — ${nombre || 'Cliente'} — USD ${monto || 40}`,
      html: `
        <div style="font-family:Arial;padding:20px;">
          <h2 style="color:#c9a84c;">Segundo pago recibido — Segunda Etapa</h2>
          <p><strong>Código:</strong> ${orderCode}</p>
          <p><strong>Nombre:</strong> ${nombre || 'No especificado'}</p>
          <p><strong>Email:</strong> ${email || 'No especificado'}</p>
          <p><strong>Monto:</strong> USD ${monto || 40}</p>
          <p><strong>Producto:</strong> ${producto || 'Segunda Etapa'}</p>
          <p><strong>Archivo:</strong> ${req.file.originalname}</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-AR')}</p>
          <p style="background:#fff3cd;border:1px solid #ffc107;padding:10px;border-radius:4px;color:#856404;">
            📋 <strong>Recordatorio:</strong> Emitir factura por USD ${monto || 40} al cliente ${nombre || ''} (${email || ''})
          </p>
          <p>📁 <a href="https://github.com/${GITHUB_ORG}/${repoName}">Ver expediente en GitHub</a></p>
        </div>`,
      attachments: [{ filename: req.file.originalname, content: fs.readFileSync(req.file.path) }]
    });

    // 4. Confirmar al cliente
    if (email) {
      await sendEmail({
        to: email,
        subject: `🍷 Viny 2030 — Recibimos tu segundo pago ${orderCode}`,
        html: `
          <div style="font-family:Arial;padding:20px;max-width:600px;margin:0 auto;background:#0a0a0a;color:#f0f0f0;">
            <div style="text-align:center;padding:20px 0;">
              <h1 style="color:#c9a84c;font-size:28px;">🍷 Viny 2030</h1>
              <p style="color:#aaa;">Orden <strong style="color:#c9a84c;">${orderCode}</strong></p>
            </div>
            <p>Hola <strong>${nombre || 'cliente'}</strong>,</p>
            <p>Recibimos tu comprobante de la segunda etapa. Estamos preparando tu informe y te lo enviaremos a la brevedad.</p>
            <p style="color:#aaa;font-size:13px;text-align:center;margin-top:30px;">
              <strong style="color:#c9a84c;">🍷 Viny 2030</strong>
            </p>
          </div>`
      });
    }

    res.json({ success: true, message: 'Segundo comprobante enviado correctamente', file: req.file.filename });
  } catch (err) {
    console.error('Error upload/comprobante2:', err);
    res.status(500).json({ success: false, error: 'Error al procesar el comprobante', detail: err.message });
  }
});
