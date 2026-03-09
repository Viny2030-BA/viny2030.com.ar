// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders/:code/upload-algo — Sube archivos de algoritmo al repo GitHub
// Body: { files: [ { path: "algoritmo/app.py", content: "texto..." }, ... ] }
// AGREGAR al final de routes/orders.js, antes de: module.exports = router;
// ─────────────────────────────────────────────────────────────────────────────

router.post('/:code/upload-algo', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.code]);
    if (!rows.length) return res.status(404).json({ error: 'Orden no encontrada' });

    const { files } = req.body;
    if (!files || !Array.isArray(files) || files.length === 0)
      return res.status(400).json({ error: 'Falta el array files: [{path, content}]' });

    const org   = process.env.GITHUB_ORG || 'Viny2030-Clientes';
    const token = process.env.GITHUB_TOKEN;
    if (!token) return res.status(500).json({ error: 'GITHUB_TOKEN no configurado' });

    const repoName = req.params.code.toLowerCase();
    const uploaded = [];
    const errors   = [];

    for (const file of files) {
      if (!file.path || !file.content) { errors.push(`Falta path o content en un archivo`); continue; }
      try {
        // Verificar si el archivo ya existe (para obtener su SHA)
        let sha = undefined;
        const checkRes = await fetch(
          `https://api.github.com/repos/${org}/${repoName}/contents/${file.path}`,
          { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json', 'User-Agent': 'Viny2030-App' } }
        );
        if (checkRes.ok) {
          const existing = await checkRes.json();
          sha = existing.sha;
        }

        const body = {
          message: `🤖 Algoritmo Viny 2030 — ${file.path}`,
          content: Buffer.from(file.content).toString('base64'),
          ...(sha ? { sha } : {})
        };

        const putRes = await fetch(
          `https://api.github.com/repos/${org}/${repoName}/contents/${file.path}`,
          {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json', 'User-Agent': 'Viny2030-App', 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          }
        );

        if (putRes.ok) {
          uploaded.push(file.path);
        } else {
          const err = await putRes.json();
          errors.push(`${file.path}: ${err.message}`);
        }
      } catch (e) {
        errors.push(`${file.path}: ${e.message}`);
      }
    }

    res.json({
      success: uploaded.length > 0,
      uploaded,
      errors,
      repoUrl: `https://github.com/${org}/${repoName}`
    });
  } catch (err) {
    console.error('Error upload-algo:', err.message);
    res.status(500).json({ error: err.message });
  }
});
