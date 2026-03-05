// ─────────────────────────────────────────────────────────────────
// PATCH para agregar a routes/orders.js
// Insertar ANTES de: module.exports = router;
// ─────────────────────────────────────────────────────────────────

// POST /api/orders/:code/analisis
// Recibe análisis en español, lo traduce al idioma del cliente,
// lo guarda en la orden y manda email al cliente
router.post('/:code/analisis', async (req, res) => {
  try {
    const order = orders.find(o => o.id === req.params.code);
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    const { analisis, propuesta } = req.body;
    if (!analisis || !propuesta) {
      return res.status(400).json({ error: 'Faltan campos: analisis, propuesta' });
    }

    // 1. Traducir con Claude si el idioma no es español
    let analisisTraducido = analisis;
    let propuestaTraducida = propuesta;

    if (order.lang && order.lang !== 'es') {
      const LANG_NAMES = { en: 'English', fr: 'Français', de: 'Deutsch', it: 'Italiano' };
      const targetLang = LANG_NAMES[order.lang] || order.lang;

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
            max_tokens: 2000,
            messages: [{
              role: 'user',
              content: `Translate the following two texts from Spanish to ${targetLang}.
Return ONLY a JSON object with keys "analisis" and "propuesta", no markdown, no explanation.

ANALISIS:
${analisis}

PROPUESTA:
${propuesta}`
            }]
          })
        });

        const data = await response.json();
        const text = data.content?.[0]?.text || '';
        const clean = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);
        analisisTraducido = parsed.analisis || analisis;
        propuestaTraducida = parsed.propuesta || propuesta;
      } catch (translateErr) {
        console.error('Error traduciendo:', translateErr.message);
        // Si falla la traducción, usamos el texto original
      }
    }

    // 2. Guardar en la orden
    order.analisis = { es: analisis, traducido: analisisTraducido };
    order.propuesta = { es: propuesta, traducido: propuestaTraducida };
    order.analisisAt = new Date().toISOString();
    order.status = 'analizado';

    // 3. Construir email al cliente
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const aceptarUrl = `${baseUrl}/aceptar?codigo=${order.id}&email=${encodeURIComponent(order.email)}`;

    const LANG_GREETINGS = {
      es: { hola: 'Hola', gracias: 'Gracias por confiar en Viny 2030.', siguiente: 'Si estás de acuerdo con el planteo, hacé clic en el botón para continuar con la segunda etapa.', boton: 'Acepto el planteo — continuar', analisisTitle: 'Análisis de tu caso', propuestaTitle: 'Propuesta de solución' },
      en: { hola: 'Hello', gracias: 'Thank you for trusting Viny 2030.', siguiente: 'If you agree with the proposal, click the button to continue to the second stage.', boton: 'I accept the proposal — continue', analisisTitle: 'Analysis of your case', propuestaTitle: 'Proposed solution' },
      fr: { hola: 'Bonjour', gracias: 'Merci de faire confiance à Viny 2030.', siguiente: 'Si vous êtes d\'accord avec la proposition, cliquez sur le bouton pour passer à la deuxième étape.', boton: 'J\'accepte la proposition — continuer', analisisTitle: 'Analyse de votre cas', propuestaTitle: 'Solution proposée' },
      de: { hola: 'Hallo', gracias: 'Danke, dass Sie Viny 2030 vertrauen.', siguiente: 'Wenn Sie mit dem Vorschlag einverstanden sind, klicken Sie auf die Schaltfläche, um mit der zweiten Stufe fortzufahren.', boton: 'Ich akzeptiere den Vorschlag — weiter', analisisTitle: 'Analyse Ihres Falls', propuestaTitle: 'Lösungsvorschlag' },
      it: { hola: 'Ciao', gracias: 'Grazie per aver scelto Viny 2030.', siguiente: 'Se sei d\'accordo con la proposta, clicca sul pulsante per procedere alla seconda fase.', boton: 'Accetto la proposta — continua', analisisTitle: 'Analisi del tuo caso', propuestaTitle: 'Soluzione proposta' }
    };

    const t = LANG_GREETINGS[order.lang] || LANG_GREETINGS['es'];

    const emailHtml = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#f0f0f0;padding:30px;border-radius:10px;">
  <div style="text-align:center;margin-bottom:30px;">
    <h1 style="color:#c9a84c;font-family:'Georgia',serif;font-size:28px;letter-spacing:6px;">VINY 2030</h1>
    <p style="color:#888;font-size:11px;letter-spacing:3px;text-transform:uppercase;">Diagnóstico Algorítmico</p>
  </div>

  <p style="font-size:16px;">${t.hola} <strong>${order.name}</strong>,</p>
  <p style="color:#ccc;line-height:1.6;">${t.gracias}</p>

  <div style="background:#111;border-left:4px solid #c9a84c;padding:20px;border-radius:6px;margin:25px 0;">
    <h3 style="color:#c9a84c;margin:0 0 12px;font-size:14px;letter-spacing:2px;text-transform:uppercase;">📊 ${t.analisisTitle}</h3>
    <p style="color:#ddd;line-height:1.7;white-space:pre-wrap;">${analisisTraducido}</p>
  </div>

  <div style="background:#111;border-left:4px solid #e94560;padding:20px;border-radius:6px;margin:25px 0;">
    <h3 style="color:#e94560;margin:0 0 12px;font-size:14px;letter-spacing:2px;text-transform:uppercase;">💡 ${t.propuestaTitle}</h3>
    <p style="color:#ddd;line-height:1.7;white-space:pre-wrap;">${propuestaTraducida}</p>
  </div>

  <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:20px;margin:25px 0;text-align:center;">
    <p style="color:#aaa;font-size:14px;margin-bottom:16px;">${t.siguiente}</p>
    <a href="${aceptarUrl}"
       style="background:#c9a84c;color:#000;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:15px;display:inline-block;letter-spacing:1px;">
      ✅ ${t.boton}
    </a>
    <p style="color:#555;font-size:11px;margin-top:12px;">Orden: <strong style="color:#c9a84c;">${order.id}</strong></p>
  </div>

  <p style="color:#555;font-size:12px;text-align:center;margin-top:30px;">
    viny2030.com.ar · ${order.id}
  </p>
</div>`;

    await sendEmail({
      to: order.email,
      subject: `🍷 Viny 2030 — Análisis de tu caso ${order.id}`,
      html: emailHtml
    });

    // 4. Notificar al admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
      subject: `✅ Análisis enviado: ${order.id} — ${order.name}`,
      html: `
<div style="font-family:Arial;padding:20px;">
  <h2 style="color:#c9a84c;">Análisis enviado al cliente</h2>
  <p><strong>Orden:</strong> ${order.id}</p>
  <p><strong>Cliente:</strong> ${order.name} (${order.email})</p>
  <p><strong>Idioma:</strong> ${order.lang}</p>
  <p><strong>Estado:</strong> ✅ Análisis enviado — esperando aceptación</p>
  <hr style="border-color:#333;">
  <h4>Análisis (ES):</h4>
  <p style="color:#555;">${analisis}</p>
  <h4>Propuesta (ES):</h4>
  <p style="color:#555;">${propuesta}</p>
</div>`
    });

    res.json({
      success: true,
      message: 'Análisis enviado al cliente',
      orderCode: order.id,
      lang: order.lang,
      translated: order.lang !== 'es'
    });

  } catch (err) {
    console.error('Error enviando análisis:', err);
    res.status(500).json({ error: 'Error al enviar el análisis', detail: err.message });
  }
});

// GET /api/orders/:code/analisis — obtener análisis guardado
router.get('/:code/analisis', (req, res) => {
  const order = orders.find(o => o.id === req.params.code);
  if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
  res.json({
    orderCode: order.id,
    analisis: order.analisis || null,
    propuesta: order.propuesta || null,
    analisisAt: order.analisisAt || null,
    status: order.status
  });
});
