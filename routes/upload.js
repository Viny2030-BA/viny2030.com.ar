// routes/upload.js
// POST /api/upload/comprobante2
// Recibe el comprobante de pago 2, lo guarda y sube al repo si ya existe

const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const { Pool } = require('pg');
const path     = require('path');
const { uploadDocumentToRepo } = require('../utils/github');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Guardar en memoria (Railway no tiene disco persistente)
const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/upload/comprobante2
// Form-data: code (string), file (archivo)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/comprobante2', upload.single('file'), async (req, res) => {
  const { code } = req.body;

  if (!code)      return res.status(400).json({ error: 'code es requerido' });
  if (!req.file)  return res.status(400).json({ error: 'Archivo requerido' });

  try {
    // Buscar la orden
    const { rows } = await pool.query(
      'SELECT * FROM orders WHERE code = $1',
      [code]
    );
    const order = rows[0];
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    // Nombre limpio para el archivo
    const ext      = path.extname(req.file.originalname).toLowerCase();
    const filename = `comprobante2_${Date.now()}${ext}`;

    // Si ya tiene repo → subir directamente
    let repoUpload = null;
    if (order.repo_name) {
      repoUpload = await uploadDocumentToRepo(
        order.repo_name,
        'recibos',
        filename,
        req.file.buffer
      );
    }

    // Guardar URL temporal (en Railway podrías subir a R2/S3 y guardar la URL real)
    // Por ahora guardamos el nombre del archivo como referencia
    const fileRef = repoUpload
      ? repoUpload.url
      : `pending:${filename}`;  // Se subirá cuando se cree el repo

    await pool.query(
      `UPDATE orders
       SET comprobante2_url = $1,
           comprobante2_at  = NOW()
       WHERE code = $2`,
      [fileRef, code]
    );

    return res.json({
      ok:       true,
      filename,
      repo_url: repoUpload?.url || null,
      message:  repoUpload
        ? 'Comprobante subido al repo GitHub.'
        : 'Comprobante guardado. Se subirá al repo cuando se confirme el pago.',
    });
  } catch (err) {
    console.error('[comprobante2]', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
