// routes/orders.js
// Rutas de segunda etapa:
//   POST /api/orders/:code/pago2          ← confirmar pago 2 → crea repo GitHub
//   POST /api/orders/:code/informe2       ← guardar informe traducido
//   POST /api/orders/:code/upload-algo    ← push app.py al repo

const express = require('express');
const router  = express.Router();
const { Pool } = require('pg');
const {
  createClientRepo,
  initRepoStructure,
  uploadDocumentToRepo,
  pushAppPy,
} = require('../utils/github');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function repoNameFromCode(code) {
  // 'VNY-2026-0009' → 'vny-2026-0009'
  return code.toLowerCase().replace(/\s+/g, '-');
}

async function getOrder(code) {
  const { rows } = await pool.query(
    'SELECT * FROM orders WHERE code = $1',
    [code]
  );
  return rows[0] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders/:code/pago2
// Body: { confirmed: true }
// 1. Cambia status → 'pago2_recibido'
// 2. Crea repo GitHub + estructura inicial
// 3. Sube documentos existentes (comprobante1, comprobante2 si existe)
// 4. Guarda repo_url en la DB
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:code/pago2', async (req, res) => {
  const { code } = req.params;

  try {
    const order = await getOrder(code);
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    if (order.status !== 'aceptado') {
      return res.status(400).json({
        error: `Estado inválido. Esperado: aceptado. Actual: ${order.status}`,
      });
    }

    // ── 1. Crear repo ──────────────────────────────────────────────────────
    const repoName = repoNameFromCode(code);
    const { url: repoUrl } = await createClientRepo(repoName, order.client_name || order.name || '');

    // ── 2. Inicializar estructura ──────────────────────────────────────────
    await initRepoStructure(repoName, {
      code,
      name:  order.client_name || order.name || '',
      email: order.email || '',
    });

    // ── 3. Subir comprobantes existentes ───────────────────────────────────
    // Comprobante de pago 1 (si tenés la URL, descargala y subila)
    // Por ahora guardamos las URLs como texto en el README de docs
    // (si los archivos están en tu storage local, adaptá este bloque)
    const docsIndex = `# Documentos - ${code}\n\n` +
      (order.comprobante_url  ? `- **Comprobante 1:** ${order.comprobante_url}\n`  : '') +
      (order.comprobante2_url ? `- **Comprobante 2:** ${order.comprobante2_url}\n` : '');

    await uploadDocumentToRepo(repoName, 'facturas', 'index.md', docsIndex);

    // ── 4. Actualizar DB ───────────────────────────────────────────────────
    await pool.query(
      `UPDATE orders
       SET status          = 'pago2_recibido',
           repo_name       = $1,
           repo_url        = $2,
           repo_created_at = NOW()
       WHERE code = $3`,
      [repoName, repoUrl, code]
    );

    return res.json({
      ok: true,
      message: 'Pago 2 confirmado. Repo GitHub creado.',
      repo_url: repoUrl,
      repo_name: repoName,
    });
  } catch (err) {
    console.error('[pago2]', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders/:code/informe2
// Body: { informe_es: '...', informe_trad: '...' }
// Guarda el informe en DB y lo sube al repo
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:code/informe2', async (req, res) => {
  const { code } = req.params;
  const { informe_es, informe_trad } = req.body;

  if (!informe_es) {
    return res.status(400).json({ error: 'informe_es es requerido' });
  }

  try {
    const order = await getOrder(code);
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    if (!order.repo_name) {
      return res.status(400).json({ error: 'Repo GitHub no creado aún. Confirmá pago2 primero.' });
    }

    // Subir informe al repo como markdown
    const filename = `informe_${new Date().toISOString().split('T')[0]}.md`;
    const contenido = `# Informe - ${code}\n\n## Español\n\n${informe_es}\n\n---\n\n## Traducción\n\n${informe_trad || '_No disponible_'}`;

    await uploadDocumentToRepo(order.repo_name, 'datos', filename, contenido);

    // Guardar en DB
    await pool.query(
      `UPDATE orders
       SET informe2_es      = $1,
           informe2_trad    = $2,
           informe2_sent_at = NOW(),
           status           = 'informe2_enviado'
       WHERE code = $3`,
      [informe_es, informe_trad || null, code]
    );

    return res.json({ ok: true, message: 'Informe guardado y subido al repo.' });
  } catch (err) {
    console.error('[informe2]', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders/:code/upload-algo
// Body: multipart/form-data → field: 'app_py' (archivo) o JSON { content: '...' }
// Push del app.py al repo → el VPS lo detecta y levanta Streamlit
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:code/upload-algo', async (req, res) => {
  const { code } = req.params;

  try {
    const order = await getOrder(code);
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    if (!order.repo_name) {
      return res.status(400).json({ error: 'Repo GitHub no creado. Confirmá pago2 primero.' });
    }

    let appPyContent;

    // Soporte para upload de archivo (multer) o JSON con content
    if (req.file) {
      appPyContent = req.file.buffer.toString('utf-8');
    } else if (req.body?.content) {
      appPyContent = req.body.content;
    } else {
      return res.status(400).json({ error: 'Enviá el archivo app.py o { content: "..." }' });
    }

    const result = await pushAppPy(order.repo_name, appPyContent);

    // Marcar en DB que el algoritmo fue pusheado
    await pool.query(
      `UPDATE orders SET algo_pushed_at = NOW() WHERE code = $1`,
      [code]
    );

    return res.json({
      ok: true,
      message: 'app.py pusheado al repo. El VPS lo levantará automáticamente.',
      commit: result.commit,
      repo_url: order.repo_url,
    });
  } catch (err) {
    console.error('[upload-algo]', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/:code/repo-status
// Devuelve estado del repo para mostrar en el admin
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:code/repo-status', async (req, res) => {
  const { code } = req.params;
  try {
    const order = await getOrder(code);
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    return res.json({
      repo_name:       order.repo_name       || null,
      repo_url:        order.repo_url        || null,
      repo_created_at: order.repo_created_at || null,
      status:          order.status,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
