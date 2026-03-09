// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders/:code/informe2 — Enviar segundo informe al cliente
// Igual que /analisis pero guarda en informe2_es / informe2_trad y
// marca status = 'informe2_enviado'. Sin botón de aceptar — es entrega final.
// AGREGAR al final de routes/orders.js, antes de: module.exports = router;
// ─────────────────────────────────────────────────────────────────────────────

router.post('/:code/informe2', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.code]);
    if (!rows.length) return res.status(404).json({ error: 'Orden no encontrada' });
    const order = rows[0];

    const { analisis, propuesta } = req.body;
    if (!analisis || !propuesta)
      return res.status(400).json({ error: 'Faltan campos: analisis, propuesta' });

    // Traducción automática (igual que en /analisis)
    let analisisTraducido = analisis;
    let propuestaTraducida = propuesta;

    if (order.lang && order.lang !== 'es') {
      const LANG_NAMES = { en: 'English', fr: 'French', de: 'German', it: 'Italian', pt: 'Portuguese' };
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 3000,
            messages: [{ role: 'user', content:
              `Translate to ${LANG_NAMES[order.lang] || order.lang}. Return ONLY JSON with keys "analisis" and "propuesta". Keep technical terms.\nANALISIS: ${analisis}\nPROPUESTA: ${propuesta}`
            }]
          })
        });
        const data = await response.json();
        const parsed = JSON.parse((data.content?.[0]?.text || '').replace(/```json|```/g, '').trim());
        analisisTraducido = parsed.analisis || analisis;
        propuestaTraducida = parsed.propuesta || propuesta;
      } catch (e) {
        console.error('Error traducción informe2:', e.message);
      }
    }

    // Guardar en DB
    await pool.query(
      `UPDATE orders SET informe2_es=$1, informe2_trad=$2, status='informe2_enviado' WHERE id=$3`,
      [analisis, analisisTraducido, order.id]
    );

    // Email al cliente — sin botón de aceptar, es entrega final
    const GREET = {
      es: { hola:'Hola', titulo:'Segundo Informe', at:'Análisis detallado', pt:'Implementación propuesta' },
      en: { hola:'Hello', titulo:'Second Report', at:'Detailed analysis', pt:'Proposed implementation' },
      fr: { hola:'Bonjour', titulo:'Deuxième Rapport', at:'Analyse détaillée', pt:'Mise en œuvre proposée' },
      de: { hola:'Hallo', titulo:'Zweiter Bericht', at:'Detaillierte Analyse', pt:'Vorgeschlagene Umsetzung' },
      it: { hola:'Ciao', titulo:'Secondo Rapporto', at:'Analisi dettagliata', pt:'Implementazione proposta' },
    };
    const g = GREET[order.lang] || GREET.es;

    const html = `<div style="font-family:Arial;max-width:600px;margin:0 auto;background:#0a0a0a;color:#f0f0f0;padding:30px;border-radius:10px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#c9a84c;letter-spacing:6px;">VINY 2030</h1>
        <p style="color:#6b7a8d;font-size:12px;letter-spacing:3px;">${g.titulo.toUpperCase()}</p>
      </div>
      <p>${g.hola} <strong>${order.name}</strong>,</p>
      <div style="background:#111;border-left:4px solid #c9a84c;padding:16px;margin:20px 0;">
        <h3 style="color:#c9a84c;">📊 ${g.at}</h3>
        <p style="color:#ddd;white-space:pre-wrap;">${analisisTraducido}</p>
      </div>
      <div style="background:#111;border-left:4px solid #e94560;padding:16px;margin:20px 0;">
        <h3 style="color:#e94560;">⚙️ ${g.pt}</h3>
        <p style="color:#ddd;white-space:pre-wrap;">${propuestaTraducida}</p>
      </div>
      <p style="color:#3a4a5a;font-size:11px;text-align:center;margin-top:20px;border-top:1px solid #1e2a38;padding-top:14px;">
        viny2030.com.ar — ${order.id}
      </p>
    </div>`;

    await sendEmail({
      to: order.email,
      subject: `Viny 2030 - ${g.titulo} ${order.id}`,
      html
    });
    await sendEmail({
      to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
      subject: `Informe 2 enviado: ${order.id} — ${order.name}`,
      html: `<p>Segundo informe enviado a ${order.name} (${order.email}). Orden: ${order.id}. Lang: ${order.lang}.</p>`
    });

    res.json({ success: true, orderCode: order.id, lang: order.lang });
  } catch (err) {
    console.error('Error POST informe2:', err.message);
    res.status(500).json({ error: err.message });
  }
});
