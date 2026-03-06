// routes/orders.js
// Versión con PostgreSQL — reemplaza el array en memoria por queries SQL

const express = require('express');
const router = express.Router();
const { generateOrderCode } = require('../utils/orderCode');
const { getEmailTemplate } = require('../utils/emailTemplates');
const { sendEmail } = require('../utils/mailer');
const pool = require('../utils/db');

// ─────────────────────────────────────────────
// POST /api/orders — Crear nueva orden
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, email, amount = 10, lang = 'es', product = 'Diagnostico Algoritmico' } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Faltan datos: name, email' });

    const orderCode = generateOrderCode();
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const uploadUrl = `${baseUrl}/comprobante?codigo=${orderCode}`;

    // Guardar en PostgreSQL
    await pool.query(
      `INSERT INTO orders (id, name, email, amount, lang, product, status, upload_url, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, NOW())`,
      [orderCode, name, email, amount, lang, product, uploadUrl]
    );

    // Email al cliente
    const { subject, html } = getEmailTemplate(lang, {
      nombre: name,
      monto: amount,
      orderCode,
      cbu: process.env.CBU_PESOS || '0140005203400552652310',
      alias: process.env.ALIAS_PESOS || 'ALGORIT.MONTE.PESOS',
      titular: process.env.TITULAR || 'Vicente Humberto Monteverde',
      banco: process.env.BANCO || 'Banco Santander Argentina',
      cbuDolares: process.env.CBU_DOLARES || '0140005204400550329709',
      aliasDolares: process.env.ALIAS_DOLARES || 'ALGO.MONTE.DOLARES',
      swift: process.env.SWIFT || 'BSCHUYMM',
      bancoInternacional: process.env.BANCO_INTERNACIONAL || 'Banco Santander Montevideo',
      cuentaInternacional: process.env.CUENTA_INTERNACIONAL || '005200183500',
      direccionBeneficiario: process.env.DIRECCION_BENEFICIARIO || 'Av. Directorio 3024-PB-Dto 04',
      uploadUrl
    });

    await sendEmail({ to: email, subject, html });
    await sendEmail({
      to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
      subject: `Nueva orden: ${orderCode} - ${name} - USD ${amount}`,
      html: `<p><b>Codigo:</b> ${orderCode}</p><p><b>Cliente:</b> ${name} (${email})</p><p><b>Monto:</b> USD ${amount}</p><p><b>Link:</b> <a href="${uploadUrl}">${uploadUrl}</a></p>`
    });

    res.json({ success: true, orderCode, uploadUrl, message: 'Email enviado' });

  } catch (err) {
    console.error('Error POST /api/orders:', err.message);
    res.status(500).json({ error: 'Error al procesar', detail: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/orders — Listar todas las órdenes
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/orders/:code — Obtener una orden
// ─────────────────────────────────────────────
router.get('/:code', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.code]);
    if (!rows.length) return res.status(404).json({ error: 'Orden no encontrada' });
    const o = rows[0];
    // Normalizar para compatibilidad con el frontend (aceptar.html)
    res.json({
      id: o.id,
      name: o.name,
      email: o.email,
      amount: o.amount,
      lang: o.lang,
      product: o.product,
      status: o.status,
      uploadUrl: o.upload_url,
      createdAt: o.created_at,
      aceptadoAt: o.aceptado_at,
      analisis: o.analisis_es ? { es: o.analisis_es, traducido: o.analisis_trad || o.analisis_es } : null,
      propuesta: o.propuesta_es ? { es: o.propuesta_es, traducido: o.propuesta_trad || o.propuesta_es } : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/orders/:code/status — Cambiar estado
// ─────────────────────────────────────────────
router.patch('/:code/status', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [req.body.status, req.params.code]
    );
    if (!rows.length) return res.status(404).json({ error: 'Orden no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/orders/:code/analisis — Cargar análisis y enviar email
// ─────────────────────────────────────────────
router.post('/:code/analisis', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.code]);
    if (!rows.length) return res.status(404).json({ error: 'Orden no encontrada' });
    const order = rows[0];

    const { analisis, propuesta } = req.body;
    if (!analisis || !propuesta) return res.status(400).json({ error: 'Faltan campos' });

    let analisisTraducido = analisis;
    let propuestaTraducida = propuesta;

    // Traducción automática si el idioma no es español
    if (order.lang && order.lang !== 'es') {
      const LANG_NAMES = { en: 'English', fr: 'French', de: 'German', it: 'Italian' };
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
              content: `Translate to ${LANG_NAMES[order.lang] || order.lang}. Return ONLY JSON with keys analisis and propuesta.\nANALISIS: ${analisis}\nPROPUESTA: ${propuesta}`
            }]
          })
        });
        const data = await response.json();
        const parsed = JSON.parse(data.content[0].text.replace(/```json|```/g, '').trim());
        analisisTraducido = parsed.analisis || analisis;
        propuestaTraducida = parsed.propuesta || propuesta;
      } catch (e) {
        console.error('Error traducción:', e.message);
      }
    }

    // Guardar análisis en PostgreSQL
    await pool.query(
      `UPDATE orders
       SET analisis_es = $1, analisis_trad = $2,
           propuesta_es = $3, propuesta_trad = $4,
           analisis_at = NOW(), status = 'analizado'
       WHERE id = $5`,
      [analisis, analisisTraducido, propuesta, propuestaTraducida, order.id]
    );

    // Construir email con botón de aceptar
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const aceptarUrl = `${baseUrl}/aceptar?codigo=${order.id}&email=${encodeURIComponent(order.email)}`;

    const GREET = {
      es: { hola: 'Hola', btn: 'Acepto el planteo', at: 'Análisis de tu caso', pt: 'Propuesta de solución', txt: 'Si estás de acuerdo, hacé clic en el botón.' },
      en: { hola: 'Hello', btn: 'I accept the proposal', at: 'Analysis of your case', pt: 'Proposed solution', txt: 'If you agree, click the button.' },
      fr: { hola: 'Bonjour', btn: "J'accepte", at: 'Analyse', pt: 'Solution', txt: "Si vous êtes d'accord, cliquez." },
      de: { hola: 'Hallo', btn: 'Ich akzeptiere', at: 'Analyse', pt: 'Lösung', txt: 'Wenn Sie einverstanden sind, klicken Sie.' },
      it: { hola: 'Ciao', btn: 'Accetto', at: 'Analisi', pt: 'Soluzione', txt: "Se sei d'accordo, clicca." }
    };
    const g = GREET[order.lang] || GREET.es;

    const html = `
      <div style="font-family:Arial;max-width:600px;margin:0 auto;background:#0a0a0a;color:#f0f0f0;padding:30px;border-radius:10px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#c9a84c;letter-spacing:6px;">VINY 2030</h1>
        </div>
        <p>${g.hola} <strong>${order.name}</strong>,</p>
        <div style="background:#111;border-left:4px solid #c9a84c;padding:16px;margin:20px 0;">
          <h3 style="color:#c9a84c;">${g.at}</h3>
          <p style="color:#ddd;">${analisisTraducido}</p>
        </div>
        <div style="background:#111;border-left:4px solid #e94560;padding:16px;margin:20px 0;">
          <h3 style="color:#e94560;">${g.pt}</h3>
          <p style="color:#ddd;">${propuestaTraducida}</p>
        </div>
        <div style="text-align:center;padding:20px;background:#1a1a1a;border-radius:8px;">
          <p style="color:#aaa;margin-bottom:16px;">${g.txt}</p>
          <a href="${aceptarUrl}" style="background:#c9a84c;color:#000;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;">${g.btn}</a>
          <p style="color:#555;font-size:11px;margin-top:12px;">${order.id}</p>
        </div>
      </div>`;

    await sendEmail({ to: order.email, subject: `Viny 2030 - Analisis ${order.id}`, html });
    await sendEmail({
      to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
      subject: `Analisis enviado: ${order.id}`,
      html: `<p>Cliente: ${order.name} | Orden: ${order.id} | Lang: ${order.lang}</p>`
    });

    res.json({ success: true, orderCode: order.id, lang: order.lang });

  } catch (err) {
    console.error('Error POST analisis:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/orders/:code/analisis — Ver análisis
// ─────────────────────────────────────────────
router.get('/:code/analisis', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.code]);
    if (!rows.length) return res.status(404).json({ error: 'Orden no encontrada' });
    const o = rows[0];
    res.json({
      orderCode: o.id,
      analisis: o.analisis_es ? { es: o.analisis_es, traducido: o.analisis_trad } : null,
      propuesta: o.propuesta_es ? { es: o.propuesta_es, traducido: o.propuesta_trad } : null,
      status: o.status
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/orders/:code/aceptar — Cliente acepta → email USD 40
// ─────────────────────────────────────────────
router.post('/:code/aceptar', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE orders SET status = 'aceptado', aceptado_at = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.code]
    );
    if (!rows.length) return res.status(404).json({ error: 'Orden no encontrada' });
    const order = rows[0];

    const cbuPesos     = process.env.CBU_PESOS               || '0140005203400552652310';
    const aliasPesos   = process.env.ALIAS_PESOS              || 'ALGORIT.MONTE.PESOS';
    const cbuDolares   = process.env.CBU_DOLARES              || '0140005204400550329709';
    const aliasDolares = process.env.ALIAS_DOLARES            || 'ALGO.MONTE.DOLARES';
    const titular      = process.env.TITULAR                  || 'Vicente Humberto Monteverde';
    const cuit         = '20-12034411-1';
    const bancoIntl    = process.env.BANCO_INTERNACIONAL      || 'Banco Santander Montevideo';
    const cuentaIntl   = process.env.CUENTA_INTERNACIONAL     || '005200183500';
    const dir          = process.env.DIRECCION_BENEFICIARIO   || 'Av. Directorio 3024-PB-Dto 04';
    const swift        = process.env.SWIFT                    || 'BSCHUYMM';

    const SUBJ  = { es: `Viny 2030 - Aceptaste el planteo ${order.id} - USD 40`, en: `Viny 2030 - Proposal accepted ${order.id} - USD 40`, fr: `Viny 2030 - Proposition acceptée ${order.id} - USD 40`, de: `Viny 2030 - Vorschlag akzeptiert ${order.id} - USD 40`, it: `Viny 2030 - Proposta accettata ${order.id} - USD 40` };
    const HOLA  = { es: 'Hola', en: 'Hello', fr: 'Bonjour', de: 'Hallo', it: 'Ciao' };
    const INTRO = { es: 'Gracias por aceptar el planteo! A continuación los datos de pago (USD 40):', en: 'Thank you! Here are the payment details (USD 40):', fr: 'Merci! Voici les coordonnées de paiement (USD 40):', de: 'Danke! Hier sind die Zahlungsdetails (USD 40):', it: 'Grazie! Ecco i dati di pagamento (USD 40):' };
    const PLAZO = { es: 'Plazo: 72 horas', en: 'Deadline: 72 hours', fr: 'Délai: 72 heures', de: 'Frist: 72 Stunden', it: 'Scadenza: 72 ore' };
    const CIERRE= { es: 'Una vez recibido el pago coordinamos la implementación.', en: 'Once payment is received we coordinate implementation.', fr: 'Dès réception du paiement, nous coordonnons.', de: 'Nach Zahlungseingang koordinieren wir.', it: 'Una volta ricevuto il pagamento coordinamo.' };

    const row = (k, v) => `<tr><td style="padding:5px 10px;color:#888;font-size:12px;">${k}</td><td style="padding:5px 10px;color:#e8c96d;font-weight:bold;font-size:12px;">${v}</td></tr>`;
    const lang = order.lang || 'es';

    const emailHtml = `
<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;background:#060810;color:#e8eaf0;padding:32px;border-radius:10px;">
  <div style="text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #1e2a38;">
    <h1 style="color:#c9a84c;font-family:Georgia,serif;font-size:24px;letter-spacing:6px;margin:0;">VINY 2030</h1>
    <p style="color:#0a9d6e;font-size:11px;margin:6px 0 0;">${order.id} — ACEPTADO</p>
  </div>
  <p>${HOLA[lang] || 'Hola'} <strong>${order.name}</strong>,</p>
  <p style="color:#aaa;margin:10px 0 20px;">${INTRO[lang] || INTRO.es}</p>
  <div style="background:#111820;border:2px solid #c9a84c;border-radius:8px;padding:16px;text-align:center;margin-bottom:20px;">
    <p style="color:#c9a84c;font-size:32px;font-family:Georgia,serif;font-weight:bold;margin:0;">USD 40</p>
    <p style="color:#6b7a8d;font-size:11px;margin:4px 0 0;">Segunda Etapa</p>
  </div>
  <div style="background:#0d1117;border-left:3px solid #c9a84c;border-radius:4px;padding:12px;margin-bottom:10px;">
    <p style="color:#c9a84c;font-size:10px;letter-spacing:2px;margin:0 0 8px;">PESOS ARS</p>
    <table style="width:100%;border-collapse:collapse;">${row('CBU', cbuPesos)}${row('Alias', aliasPesos)}${row('Titular', titular)}${row('CUIT', cuit)}</table>
  </div>
  <div style="background:#0d1117;border-left:3px solid #6b7a8d;border-radius:4px;padding:12px;margin-bottom:10px;">
    <p style="color:#aaa;font-size:10px;letter-spacing:2px;margin:0 0 8px;">DÓLARES USD (ARG)</p>
    <table style="width:100%;border-collapse:collapse;">${row('CBU', cbuDolares)}${row('Alias', aliasDolares)}${row('Titular', titular)}${row('CUIT', cuit)}</table>
  </div>
  <div style="background:#0d1117;border-left:3px solid #e94560;border-radius:4px;padding:12px;margin-bottom:16px;">
    <p style="color:#e94560;font-size:10px;letter-spacing:2px;margin:0 0 8px;">WIRE TRANSFER</p>
    <table style="width:100%;border-collapse:collapse;">${row('Banco', bancoIntl)}${row('Beneficiario', titular)}${row('Cuenta', cuentaIntl)}${row('SWIFT', swift)}${row('Dirección', dir)}</table>
  </div>
  <p style="color:#6b7a8d;font-size:12px;text-align:center;">${PLAZO[lang] || PLAZO.es}</p>
  <p style="color:#aaa;font-size:13px;margin-top:16px;">${CIERRE[lang] || CIERRE.es}</p>
  <p style="color:#3a4a5a;font-size:11px;text-align:center;margin-top:20px;border-top:1px solid #1e2a38;padding-top:14px;">viny2030.com.ar — ${order.id}</p>
</div>`;

    await sendEmail({ to: order.email, subject: SUBJ[lang] || SUBJ.es, html: emailHtml });
    await sendEmail({
      to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
      subject: `ACEPTACION: ${order.id} - ${order.name} - USD 40 pendiente`,
      html: `<div style="font-family:Arial;padding:20px;"><h2 style="color:#c9a84c;">Cliente aceptó el planteo</h2><p><b>Orden:</b> ${order.id}</p><p><b>Cliente:</b> ${order.name} (${order.email})</p><p><b>Estado:</b> Aceptado — esperando pago USD 40</p><p><b>Fecha:</b> ${order.aceptado_at}</p></div>`
    });

    res.json({ success: true, message: 'Email de pago enviado', orderCode: order.id, status: order.status });

  } catch (err) {
    console.error('Error POST aceptar:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
