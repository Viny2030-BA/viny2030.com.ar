// routes/orders.js — v5: + generación automática de app.py con IA
require('dotenv').config();
const express = require('express');
const router  = express.Router();
const { generateOrderCode }  = require('../utils/orderCode');
const { getEmailTemplate }   = require('../utils/emailTemplates');
const { sendEmail }          = require('../utils/mailer');
const pool                   = require('../utils/db');
const { generateAppPy }      = require('../utils/appGenerator'); // ← NUEVO
const {
  createClientRepo,
  initRepoStructure,
  uploadDocumentToRepo,
  pushAppPy,
} = require('../utils/github');

// ─────────────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────────────
function repoNameFromCode(code) {
  return code.toLowerCase().replace(/\s+/g, '-');
}

async function getOrder(code) {
  const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [code]);
  return rows[0] || null;
}

// ─────────────────────────────────────────────────────────────────
// POST /api/orders — Crear nueva orden
// ─────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, email, amount = 10, lang = 'es', product = 'Diagnostico Algoritmico' } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Faltan datos: name, email' });

    const orderCode = generateOrderCode();
    const baseUrl   = process.env.BASE_URL || 'http://localhost:3000';
    const uploadUrl = `${baseUrl}/comprobante?codigo=${orderCode}`;

    await pool.query(
      `INSERT INTO orders (id, name, email, amount, lang, product, status, upload_url, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, NOW())`,
      [orderCode, name, email, amount, lang, product, uploadUrl]
    );

    const { subject, html } = getEmailTemplate(lang, {
      nombre: name, monto: amount, orderCode,
      cbu:                  process.env.CBU_PESOS              || '0140005203400552652310',
      alias:                process.env.ALIAS_PESOS            || 'ALGORIT.MONTE.PESOS',
      titular:              process.env.TITULAR                || 'Vicente Humberto Monteverde',
      banco:                process.env.BANCO                  || 'Banco Santander Argentina',
      cbuDolares:           process.env.CBU_DOLARES            || '0140005204400550329709',
      aliasDolares:         process.env.ALIAS_DOLARES          || 'ALGO.MONTE.DOLARES',
      swift:                process.env.SWIFT                  || 'BSCHUYMM',
      bancoInternacional:   process.env.BANCO_INTERNACIONAL    || 'Banco Santander Montevideo',
      cuentaInternacional:  process.env.CUENTA_INTERNACIONAL   || '005200183500',
      direccionBeneficiario:process.env.DIRECCION_BENEFICIARIO || 'Av. Directorio 3024-PB-Dto 04',
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

// ─────────────────────────────────────────────────────────────────
// GET /api/orders — Listar todas las órdenes
// ─────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/orders/analisis-ia — Proxy IA (debe ir ANTES de /:code)
// ─────────────────────────────────────────────────────────────────
router.post('/analisis-ia', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Falta el prompt' });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada en .env' });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Error Anthropic API: ${response.status}`, detail: errText });
    }

    res.json(await response.json());
  } catch (err) {
    console.error('Error proxy IA:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/orders/:code — Obtener una orden
// ─────────────────────────────────────────────────────────────────
router.get('/:code', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.code]);
    if (!rows.length) return res.status(404).json({ error: 'Orden no encontrada' });
    const o = rows[0];
    res.json({
      id: o.id, name: o.name, email: o.email, amount: o.amount,
      lang: o.lang, product: o.product, status: o.status,
      uploadUrl: o.upload_url, createdAt: o.created_at, aceptadoAt: o.aceptado_at,
      repo_url: o.repo_url || null, repo_name: o.repo_name || null,
      analisis:  o.analisis_es  ? { es: o.analisis_es,  traducido: o.analisis_trad  || o.analisis_es  } : null,
      propuesta: o.propuesta_es ? { es: o.propuesta_es, traducido: o.propuesta_trad || o.propuesta_es } : null,
      informe2_es:         o.informe2_es         || null,
      comprobante2_url:    o.comprobante2_url     || null,
      comprobante2_at:     o.comprobante2_at      || null,
      app_py_published:    o.app_py_published     || false,
      app_py_published_at: o.app_py_published_at  || null,
      streamlit_url:       o.streamlit_url        || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// PATCH /api/orders/:code/status — Cambiar estado
// ─────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────
// POST /api/orders/:code/analisis — Enviar análisis al cliente
// ─────────────────────────────────────────────────────────────────
router.post('/:code/analisis', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.code]);
    if (!rows.length) return res.status(404).json({ error: 'Orden no encontrada' });
    const order = rows[0];
    const { analisis, propuesta } = req.body;
    if (!analisis || !propuesta) return res.status(400).json({ error: 'Faltan campos: analisis, propuesta' });

    let analisisTraducido  = analisis;
    let propuestaTraducida = propuesta;

    if (order.lang && order.lang !== 'es') {
      const LANG_NAMES = { en: 'English', fr: 'French', de: 'German', it: 'Italian' };
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514', max_tokens: 3000,
            messages: [{ role: 'user', content: `Translate to ${LANG_NAMES[order.lang] || order.lang}. Return ONLY JSON with keys "analisis" and "propuesta". Keep technical terms.\nANALISIS: ${analisis}\nPROPUESTA: ${propuesta}` }]
          })
        });
        const data   = await response.json();
        const parsed = JSON.parse((data.content?.[0]?.text || '').replace(/```json|```/g, '').trim());
        analisisTraducido  = parsed.analisis  || analisis;
        propuestaTraducida = parsed.propuesta || propuesta;
      } catch (e) { console.error('Error traducción:', e.message); }
    }

    await pool.query(
      `UPDATE orders SET analisis_es=$1, analisis_trad=$2, propuesta_es=$3, propuesta_trad=$4,
       analisis_at=NOW(), status='analizado' WHERE id=$5`,
      [analisis, analisisTraducido, propuesta, propuestaTraducida, order.id]
    );

    const baseUrl    = process.env.BASE_URL || 'http://localhost:3000';
    const aceptarUrl = `${baseUrl}/aceptar?codigo=${order.id}&email=${encodeURIComponent(order.email)}`;

    const GREET = {
      es: { hola:'Hola',    btn:'Acepto el planteo',    at:'Análisis de tu caso',    pt:'Propuesta de solución', txt:'Si estás de acuerdo, hacé clic en el botón.' },
      en: { hola:'Hello',   btn:'I accept the proposal', at:'Analysis of your case', pt:'Proposed solution',      txt:'If you agree, click the button.' },
      fr: { hola:'Bonjour', btn:"J'accepte",             at:'Analyse',               pt:'Solution',               txt:"Si vous êtes d'accord, cliquez." },
      de: { hola:'Hallo',   btn:'Ich akzeptiere',        at:'Analyse',               pt:'Lösung',                 txt:'Wenn Sie einverstanden sind, klicken Sie.' },
      it: { hola:'Ciao',    btn:'Accetto',               at:'Analisi',               pt:'Soluzione',              txt:"Se sei d'accordo, clicca." }
    };
    const g = GREET[order.lang] || GREET.es;

    const html = `<div style="font-family:Arial;max-width:600px;margin:0 auto;background:#0a0a0a;color:#f0f0f0;padding:30px;border-radius:10px;">
      <div style="text-align:center;margin-bottom:24px;"><h1 style="color:#c9a84c;letter-spacing:6px;">VINY 2030</h1></div>
      <p>${g.hola} <strong>${order.name}</strong>,</p>
      <div style="background:#111;border-left:4px solid #c9a84c;padding:16px;margin:20px 0;">
        <h3 style="color:#c9a84c;">${g.at}</h3><p style="color:#ddd;white-space:pre-wrap;">${analisisTraducido}</p>
      </div>
      <div style="background:#111;border-left:4px solid #e94560;padding:16px;margin:20px 0;">
        <h3 style="color:#e94560;">${g.pt}</h3><p style="color:#ddd;white-space:pre-wrap;">${propuestaTraducida}</p>
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

// ─────────────────────────────────────────────────────────────────
// GET /api/orders/:code/analisis — Ver análisis
// ─────────────────────────────────────────────────────────────────
router.get('/:code/analisis', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.code]);
    if (!rows.length) return res.status(404).json({ error: 'Orden no encontrada' });
    const o = rows[0];
    res.json({
      orderCode: o.id,
      analisis:  o.analisis_es  ? { es: o.analisis_es,  traducido: o.analisis_trad  } : null,
      propuesta: o.propuesta_es ? { es: o.propuesta_es, traducido: o.propuesta_trad } : null,
      status: o.status
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/orders/:code/aceptar — Cliente acepta → email USD 40
// ─────────────────────────────────────────────────────────────────
router.post('/:code/aceptar', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE orders SET status='aceptado', aceptado_at=NOW() WHERE id=$1 RETURNING *`,
      [req.params.code]
    );
    if (!rows.length) return res.status(404).json({ error: 'Orden no encontrada' });
    const order = rows[0];
    const lang  = order.lang || 'es';

    const cbuPesos    = process.env.CBU_PESOS              || '0140005203400552652310';
    const aliasPesos  = process.env.ALIAS_PESOS            || 'ALGORIT.MONTE.PESOS';
    const cbuDolares  = process.env.CBU_DOLARES            || '0140005204400550329709';
    const aliasDolares= process.env.ALIAS_DOLARES          || 'ALGO.MONTE.DOLARES';
    const titular     = process.env.TITULAR                || 'Vicente Humberto Monteverde';
    const cuit        = '20-12034411-1';
    const bancoIntl   = process.env.BANCO_INTERNACIONAL    || 'Banco Santander Montevideo';
    const cuentaIntl  = process.env.CUENTA_INTERNACIONAL   || '005200183500';
    const dir         = process.env.DIRECCION_BENEFICIARIO || 'Av. Directorio 3024-PB-Dto 04';
    const swift       = process.env.SWIFT                  || 'BSCHUYMM';

    const SUBJ  = { es:`Viny 2030 - Aceptaste el planteo ${order.id} - USD 40`, en:`Viny 2030 - Proposal accepted ${order.id} - USD 40`, fr:`Viny 2030 - Proposition acceptée ${order.id} - USD 40`, de:`Viny 2030 - Vorschlag akzeptiert ${order.id} - USD 40`, it:`Viny 2030 - Proposta accettata ${order.id} - USD 40` };
    const HOLA  = { es:'Hola', en:'Hello', fr:'Bonjour', de:'Hallo', it:'Ciao' };
    const INTRO = { es:'Gracias por aceptar el planteo! A continuación los datos de pago (USD 40):', en:'Thank you! Here are the payment details (USD 40):', fr:'Merci! Voici les coordonnées de paiement (USD 40):', de:'Danke! Hier sind die Zahlungsdetails (USD 40):', it:'Grazie! Ecco i dati di pagamento (USD 40):' };
    const PLAZO = { es:'Plazo: 72 horas', en:'Deadline: 72 hours', fr:'Délai: 72 heures', de:'Frist: 72 Stunden', it:'Scadenza: 72 ore' };
    const CIERRE= { es:'Una vez recibido el pago coordinamos la implementación.', en:'Once payment is received we coordinate implementation.', fr:'Dès réception du paiement, nous coordonnons.', de:'Nach Zahlungseingang koordinieren wir.', it:'Una volta ricevuto il pagamento coordinamo.' };

    const row = (k, v) => `<tr><td style="padding:5px 10px;color:#888;font-size:12px;">${k}</td><td style="padding:5px 10px;color:#e8c96d;font-weight:bold;font-size:12px;">${v}</td></tr>`;

    const emailHtml = `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;background:#060810;color:#e8eaf0;padding:32px;border-radius:10px;">
      <div style="text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #1e2a38;">
        <h1 style="color:#c9a84c;font-family:Georgia,serif;font-size:24px;letter-spacing:6px;margin:0;">VINY 2030</h1>
        <p style="color:#0a9d6e;font-size:11px;margin:6px 0 0;">${order.id} — ACEPTADO</p>
      </div>
      <p>${HOLA[lang]||'Hola'} <strong>${order.name}</strong>,</p>
      <p style="color:#aaa;margin:10px 0 20px;">${INTRO[lang]||INTRO.es}</p>
      <div style="background:#111820;border:2px solid #c9a84c;border-radius:8px;padding:16px;text-align:center;margin-bottom:20px;">
        <p style="color:#c9a84c;font-size:32px;font-family:Georgia,serif;font-weight:bold;margin:0;">USD 40</p>
        <p style="color:#6b7a8d;font-size:11px;margin:4px 0 0;">Segunda Etapa</p>
      </div>
      <div style="background:#0d1117;border-left:3px solid #c9a84c;border-radius:4px;padding:12px;margin-bottom:10px;">
        <p style="color:#c9a84c;font-size:10px;letter-spacing:2px;margin:0 0 8px;">PESOS ARS</p>
        <table style="width:100%;border-collapse:collapse;">${row('CBU',cbuPesos)}${row('Alias',aliasPesos)}${row('Titular',titular)}${row('CUIT',cuit)}</table>
      </div>
      <div style="background:#0d1117;border-left:3px solid #6b7a8d;border-radius:4px;padding:12px;margin-bottom:10px;">
        <p style="color:#aaa;font-size:10px;letter-spacing:2px;margin:0 0 8px;">DÓLARES USD (ARG)</p>
        <table style="width:100%;border-collapse:collapse;">${row('CBU',cbuDolares)}${row('Alias',aliasDolares)}${row('Titular',titular)}${row('CUIT',cuit)}</table>
      </div>
      <div style="background:#0d1117;border-left:3px solid #e94560;border-radius:4px;padding:12px;margin-bottom:16px;">
        <p style="color:#e94560;font-size:10px;letter-spacing:2px;margin:0 0 8px;">WIRE TRANSFER</p>
        <table style="width:100%;border-collapse:collapse;">${row('Banco',bancoIntl)}${row('Beneficiario',titular)}${row('Cuenta',cuentaIntl)}${row('SWIFT',swift)}${row('Dirección',dir)}</table>
      </div>
      <p style="color:#6b7a8d;font-size:12px;text-align:center;">${PLAZO[lang]||PLAZO.es}</p>
      <p style="color:#aaa;font-size:13px;margin-top:16px;">${CIERRE[lang]||CIERRE.es}</p>
      <p style="color:#3a4a5a;font-size:11px;text-align:center;margin-top:20px;border-top:1px solid #1e2a38;padding-top:14px;">viny2030.com.ar — ${order.id}</p>
    </div>`;

    await sendEmail({ to: order.email, subject: SUBJ[lang]||SUBJ.es, html: emailHtml });
    await sendEmail({
      to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
      subject: `ACEPTACION: ${order.id} - ${order.name} - USD 40 pendiente`,
      html: `<div style="font-family:Arial;padding:20px;"><h2 style="color:#c9a84c;">Cliente aceptó el planteo</h2><p><b>Orden:</b> ${order.id}</p><p><b>Cliente:</b> ${order.name} (${order.email})</p><p><b>Estado:</b> Aceptado — esperando pago USD 40</p></div>`
    });

    res.json({ success: true, message: 'Email de pago enviado', orderCode: order.id, status: order.status });
  } catch (err) {
    console.error('Error POST aceptar:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/orders/:code/github-files — Proxy archivos repo privado
// ─────────────────────────────────────────────────────────────────
router.get('/:code/github-files', async (req, res) => {
  try {
    const code  = req.params.code.toLowerCase();
    const org   = process.env.GITHUB_ORG || 'Viny2030-Clientes';
    const token = process.env.GITHUB_TOKEN;
    if (!token) return res.status(500).json({ error: 'GITHUB_TOKEN no configurado' });

    const ghHeaders = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json', 'User-Agent': 'Viny2030-App' };

    let analisisMd = null;
    try {
      const r = await fetch(`https://api.github.com/repos/${org}/${code}/contents/analisis.md`, { headers: ghHeaders });
      if (r.ok) { const d = await r.json(); analisisMd = Buffer.from(d.content, 'base64').toString('utf-8'); }
    } catch(e) { console.error('Error leyendo analisis.md:', e.message); }

    let files = [];
    try {
      const r = await fetch(`https://api.github.com/repos/${org}/${code}/contents/relato`, { headers: ghHeaders });
      if (r.ok) {
        const items = await r.json();
        files = items.filter(f => f.name.match(/\.(csv|xlsx|xls|parquet|json|txt)$/i))
                     .map(f => ({ name: f.name, size: f.size, path: f.path, sha: f.sha }));
      }
    } catch(e) { console.error('Error leyendo /relato:', e.message); }

    res.json({ analisisMd, files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/orders/:code/github-file?path=... — Contenido de archivo
// ─────────────────────────────────────────────────────────────────
router.get('/:code/github-file', async (req, res) => {
  try {
    const code     = req.params.code.toLowerCase();
    const filePath = req.query.path;
    if (!filePath) return res.status(400).json({ error: 'Falta el parámetro path' });
    const org   = process.env.GITHUB_ORG || 'Viny2030-Clientes';
    const token = process.env.GITHUB_TOKEN;
    if (!token) return res.status(500).json({ error: 'GITHUB_TOKEN no configurado' });

    const r = await fetch(`https://api.github.com/repos/${org}/${code}/contents/${filePath}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json', 'User-Agent': 'Viny2030-App' }
    });
    if (!r.ok) return res.status(r.status).json({ error: 'Archivo no encontrado' });
    const d = await r.json();
    res.json({ name: d.name, content: Buffer.from(d.content, 'base64').toString('utf-8'), size: d.size });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/orders/:code/pago2 — Confirmar pago 2 → crear repo
// ─────────────────────────────────────────────────────────────────
router.post('/:code/pago2', async (req, res) => {
  const { code } = req.params;
  try {
    const order = await getOrder(code);
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    if (order.status !== 'aceptado')
      return res.status(400).json({ error: `Estado inválido. Esperado: aceptado. Actual: ${order.status}` });

    const repoName         = repoNameFromCode(code);
    const { url: repoUrl } = await createClientRepo(repoName, order.name || '');
    await initRepoStructure(repoName, { code, name: order.name || '', email: order.email || '' });

    const docsIndex = `# Documentos - ${code}\n\n`
      + (order.comprobante_url  ? `- **Comprobante 1:** ${order.comprobante_url}\n`  : '')
      + (order.comprobante2_url ? `- **Comprobante 2:** ${order.comprobante2_url}\n` : '');
    await uploadDocumentToRepo(repoName, 'facturas', 'index.md', docsIndex);

    await pool.query(
      `UPDATE orders SET status='pago2_recibido', repo_name=$1, repo_url=$2, repo_created_at=NOW() WHERE id=$3`,
      [repoName, repoUrl, code]
    );
    res.json({ ok: true, message: 'Pago 2 confirmado. Repo GitHub creado.', repo_url: repoUrl, repo_name: repoName });
  } catch (err) {
    console.error('[pago2]', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/orders/:code/informe2 — Guardar y subir informe
// ─────────────────────────────────────────────────────────────────
router.post('/:code/informe2', async (req, res) => {
  const { code } = req.params;
  const { informe_es, informe_trad } = req.body;
  if (!informe_es) return res.status(400).json({ error: 'informe_es es requerido' });
  try {
    const order = await getOrder(code);
    if (!order)           return res.status(404).json({ error: 'Orden no encontrada' });
    if (!order.repo_name) return res.status(400).json({ error: 'Repo GitHub no creado aún.' });

    const filename  = `informe_${new Date().toISOString().split('T')[0]}.md`;
    const contenido = `# Informe - ${code}\n\n## Español\n\n${informe_es}\n\n---\n\n## Traducción\n\n${informe_trad || '_No disponible_'}`;
    await uploadDocumentToRepo(order.repo_name, 'datos', filename, contenido);

    await pool.query(
      `UPDATE orders SET informe2_es=$1, informe2_trad=$2, informe2_sent_at=NOW(), status='informe2_enviado' WHERE id=$3`,
      [informe_es, informe_trad || null, code]
    );
    res.json({ ok: true, message: 'Informe guardado y subido al repo.' });
  } catch (err) {
    console.error('[informe2]', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/orders/:code/upload-algo — Push manual de app.py
// ─────────────────────────────────────────────────────────────────
router.post('/:code/upload-algo', async (req, res) => {
  const { code } = req.params;
  try {
    const order = await getOrder(code);
    if (!order)           return res.status(404).json({ error: 'Orden no encontrada' });
    if (!order.repo_name) return res.status(400).json({ error: 'Repo GitHub no creado.' });

    const appPyContent = req.file ? req.file.buffer.toString('utf-8') : req.body?.content;
    if (!appPyContent) return res.status(400).json({ error: 'Enviá el archivo app.py o { content: "..." }' });

    const result = await pushAppPy(order.repo_name, appPyContent);
    await pool.query(`UPDATE orders SET algo_pushed_at=NOW() WHERE id=$1`, [code]);
    res.json({ ok: true, message: 'app.py pusheado.', commit: result.commit, repo_url: order.repo_url });
  } catch (err) {
    console.error('[upload-algo]', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/orders/:code/repo-status
// ─────────────────────────────────────────────────────────────────
router.get('/:code/repo-status', async (req, res) => {
  try {
    const order = await getOrder(req.params.code);
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    res.json({
      repo_name:       order.repo_name       || null,
      repo_url:        order.repo_url        || null,
      repo_created_at: order.repo_created_at || null,
      streamlit_url:   order.streamlit_url   || null,
      status:          order.status
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/orders/:code/generar-app  ← NUEVO
// Admin genera el app.py con IA a partir de los archivos del cliente
// Body (opcional): { adminComment: "instrucción extra para la IA" }
// ─────────────────────────────────────────────────────────────────
router.post('/:code/generar-app', async (req, res) => {
  const { code }              = req.params;
  const { adminComment = '' } = req.body;

  try {
    const order = await getOrder(code);
    if (!order)           return res.status(404).json({ error: 'Orden no encontrada' });
    if (!order.repo_name) return res.status(400).json({ error: 'Repo GitHub no creado. Confirmar pago2 primero.' });

    const org   = process.env.GITHUB_ORG || 'Viny2030-Clientes';
    const token = process.env.GITHUB_TOKEN;
    const ghHeaders = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json', 'User-Agent': 'Viny2030-App' };

    // 1. Buscar archivos CSV/Excel en carpeta relato/ del repo
    let csvContent   = '';
    let archivoUsado = '';

    try {
      const listRes = await fetch(
        `https://api.github.com/repos/${org}/${order.repo_name}/contents/relato`,
        { headers: ghHeaders }
      );
      if (listRes.ok) {
        const items     = await listRes.json();
        const dataFiles = items.filter(f => f.name.match(/\.(csv|xlsx|xls|json|txt)$/i));
        if (dataFiles.length > 0) {
          const archivo = dataFiles[0];
          archivoUsado  = archivo.name;
          const fileRes = await fetch(
            `https://api.github.com/repos/${org}/${order.repo_name}/contents/${archivo.path}`,
            { headers: ghHeaders }
          );
          if (fileRes.ok) {
            const fileData = await fileRes.json();
            csvContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
          }
        }
      }
    } catch (e) {
      console.error('[generar-app] Error leyendo archivos del repo:', e.message);
    }

    // 2. Si no hay archivo en repo, usar relato de la DB
    if (!csvContent) {
      csvContent = order.relato_descripcion
        ? `(Sin dataset adjunto)\nRelato: ${order.relato_descripcion}`
        : '(Sin datos disponibles)';
    }

    // 3. Llamar a la IA para generar el app.py
    const result = await generateAppPy({
      orderCode:   code,
      clientName:  order.name || '',
      relato:      order.relato_descripcion || '',
      csvContent,
      adminComment
    });

    if (!result.ok) return res.status(500).json({ error: result.error });

    // 4. Guardar borrador en DB (no publicado aún)
    await pool.query(
      `UPDATE orders SET app_py_draft=$1, app_py_generated_at=NOW() WHERE id=$2`,
      [result.appPy, code]
    );

    res.json({
      ok:           true,
      appPy:        result.appPy,
      archivoUsado: archivoUsado || 'ninguno',
      message:      'app.py generado. Revisá y aprobá para publicar.'
    });

  } catch (err) {
    console.error('[generar-app]', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/orders/:code/publicar-app  ← NUEVO
// Admin aprueba el app.py y lo publica en GitHub
// Body: { appPy: "...código...", streamlitUrl: "https://..." }
// ─────────────────────────────────────────────────────────────────
router.post('/:code/publicar-app', async (req, res) => {
  const { code }                    = req.params;
  const { appPy, streamlitUrl = '' } = req.body;

  if (!appPy) return res.status(400).json({ error: 'appPy es requerido' });

  try {
    const order = await getOrder(code);
    if (!order)           return res.status(404).json({ error: 'Orden no encontrada' });
    if (!order.repo_name) return res.status(400).json({ error: 'Repo GitHub no creado.' });

    // 1. Subir app.py al repo GitHub
    const result = await pushAppPy(order.repo_name, appPy);
    if (!result.ok) return res.status(500).json({ error: 'Error subiendo app.py a GitHub' });

    // 2. Guardar en DB
    await pool.query(
      `UPDATE orders
       SET app_py_draft        = $1,
           app_py_published    = TRUE,
           app_py_published_at = NOW(),
           streamlit_url       = $2,
           status              = 'app_publicado'
       WHERE id = $3`,
      [appPy, streamlitUrl || null, code]
    );

    // 3. Si hay URL de Streamlit, enviar email al cliente
    if (streamlitUrl && order.email) {
      const lang  = order.lang || 'es';
      const SUBJ  = { es:`Viny 2030 — Tu dashboard está listo 🎉`, en:`Viny 2030 — Your dashboard is ready 🎉`, fr:`Viny 2030 — Votre tableau de bord est prêt 🎉`, de:`Viny 2030 — Ihr Dashboard ist bereit 🎉`, it:`Viny 2030 — Il tuo dashboard è pronto 🎉` };
      const HOLA  = { es:'Hola', en:'Hello', fr:'Bonjour', de:'Hallo', it:'Ciao' };
      const TEXTO = { es:'Tu dashboard personalizado con el análisis de tus datos ya está disponible.', en:'Your personalized dashboard with your data analysis is now available.', fr:'Votre tableau de bord personnalisé est maintenant disponible.', de:'Ihr personalisiertes Dashboard ist jetzt verfügbar.', it:'Il tuo dashboard personalizzato è ora disponibile.' };

      const html = `<div style="font-family:Arial;max-width:600px;margin:0 auto;background:#0a0a0a;color:#f0f0f0;padding:30px;border-radius:10px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#c9a84c;letter-spacing:6px;">VINY 2030</h1>
        </div>
        <p>${HOLA[lang]||'Hola'} <strong>${order.name}</strong>,</p>
        <p style="color:#aaa;">${TEXTO[lang]||TEXTO.es}</p>
        <div style="text-align:center;padding:24px;background:#1a1a1a;border-radius:8px;margin:20px 0;">
          <a href="${streamlitUrl}" style="background:#c9a84c;color:#000;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px;">
            🚀 Abrir Dashboard
          </a>
          <p style="color:#555;font-size:11px;margin-top:12px;">${streamlitUrl}</p>
        </div>
        <p style="color:#3a4a5a;font-size:11px;text-align:center;border-top:1px solid #1a1a1a;padding-top:14px;">
          🍷 Viny 2030 — viny2030.com.ar — ${code}
        </p>
      </div>`;

      await sendEmail({ to: order.email, subject: SUBJ[lang]||SUBJ.es, html });
      await sendEmail({
        to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
        subject: `App publicado: ${code} — URL enviada al cliente`,
        html: `<p><b>Orden:</b> ${code}</p><p><b>Cliente:</b> ${order.name}</p><p><b>URL:</b> <a href="${streamlitUrl}">${streamlitUrl}</a></p>`
      });
    }

    res.json({
      ok:            true,
      message:       streamlitUrl
        ? 'app.py publicado y URL enviada al cliente por email ✅'
        : 'app.py publicado en GitHub ✅. Conectá el repo a Streamlit y luego cargá la URL.',
      commit:        result.commit,
      repo_url:      order.repo_url,
      streamlit_url: streamlitUrl || null
    });

  } catch (err) {
    console.error('[publicar-app]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
