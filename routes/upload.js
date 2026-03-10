// routes/upload.js
const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const { Pool } = require('pg');
const path     = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Guardar en memoria (Railway no tiene disco persistente)
const storage = multer.memoryStorage();

const uploadSingle = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

const uploadMulti = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/upload
// Form-data: orderCode (string), comprobante (archivo)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', (req, res, next) => {
  uploadSingle.single('comprobante')(req, res, (err) => {
    if (err instanceof multer.MulterError || err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  });
}, async (req, res) => {
  const { orderCode } = req.body;

  if (!orderCode) {
    return res.status(400).json({ success: false, error: 'orderCode es requerido' });
  }
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Archivo requerido' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM orders WHERE code = $1',
      [orderCode]
    );
    if (!rows[0]) {
      return res.status(404).json({ success: false, error: 'Orden no encontrada' });
    }

    const ext      = path.extname(req.file.originalname).toLowerCase();
    const filename = `comprobante_${Date.now()}${ext}`;

    await pool.query(
      `UPDATE orders SET comprobante_url = $1, updated_at = NOW() WHERE code = $2`,
      [`pending:${filename}`, orderCode]
    );

    return res.json({ success: true, filename });
  } catch (err) {
    console.error('[upload]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/upload/relato
// Form-data: orderCode (string), archivos[] (múltiples archivos opcionales)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/relato', (req, res, next) => {
  uploadMulti.array('archivos', 10)(req, res, (err) => {
    if (err instanceof multer.MulterError || err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  });
}, async (req, res) => {
  const { orderCode, descripcion, fechaProblema, urgencia, nombre, email } = req.body;

  if (!orderCode) {
    return res.status(400).json({ success: false, error: 'orderCode es requerido' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM orders WHERE code = $1',
      [orderCode]
    );
    if (!rows[0]) {
      return res.status(404).json({ success: false, error: 'Orden no encontrada' });
    }

    const archivos = (req.files || []).map(f => f.originalname);

    await pool.query(
      `UPDATE orders
       SET relato_descripcion = $1,
           relato_fecha       = $2,
           relato_urgencia    = $3,
           updated_at         = NOW()
       WHERE code = $4`,
      [descripcion || null, fechaProblema || null, urgencia || null, orderCode]
    );

    return res.json({ success: true, archivos });
  } catch (err) {
    console.error('[relato]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/upload/comprobante2  (ruta original, se mantiene)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/comprobante2', (req, res, next) => {
  uploadSingle.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError || err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  });
}, async (req, res) => {
  const { code } = req.body;
  if (!code)     return res.status(400).json({ success: false, error: 'code es requerido' });
  if (!req.file) return res.status(400).json({ success: false, error: 'Archivo requerido' });

  try {
    const { rows } = await pool.query(
      'SELECT * FROM orders WHERE code = $1', [code]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Orden no encontrada' });

    const ext      = path.extname(req.file.originalname).toLowerCase();
    const filename = `comprobante2_${Date.now()}${ext}`;

    await pool.query(
      `UPDATE orders SET comprobante2_url = $1, comprobante2_at = NOW() WHERE code = $2`,
      [`pending:${filename}`, code]
    );

    return res.json({ success: true, filename });
  } catch (err) {
    console.error('[comprobante2]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
