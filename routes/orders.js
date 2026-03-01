const express = require('express');
const router = express.Router();
const { generateOrderCode } = require('../utils/orderCode');
const { getEmailTemplate } = require('../utils/emailTemplates');
const { sendEmail } = require('../utils/mailer');

const orders = [];

// POST /api/orders
router.post('/', async (req, res) => {
  try {
    const { name, email, amount = 10, lang = 'es', product = 'Diagnóstico Algorítmico' } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Faltan datos: name, email' });
    }

    const orderCode = generateOrderCode();
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const uploadUrl = `${baseUrl}/comprobante?codigo=${orderCode}`;

    const order = {
      id: orderCode, name, email, amount, lang, product,
      status: 'pending',
      createdAt: new Date().toISOString(),
      uploadUrl
    };
    orders.push(order);

    // Email al cliente en su idioma
    const { subject, html } = getEmailTemplate(lang, {
      nombre:  name,
      monto:   amount,
      orderCode,
      cbu:     process.env.CBU_PESOS   || '0140005203400552652310',
      alias:   process.env.ALIAS_PESOS || 'ALGORIT.MONTE.PESOS',
      titular: process.env.TITULAR     || 'Vicente Humberto Monteverde',
      banco:   process.env.BANCO       || 'Banco Santander Argentina',
      uploadUrl
    });

    await sendEmail({ to: email, subject, html });

    // Notificación al admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
      subject: `🆕 Nueva orden: ${orderCode} — ${name} — USD ${amount}`,
      html: `<div style="font-family:Arial;padding:20px;">
        <h2 style="color:#e94560;">Nueva orden recibida</h2>
        <p><b>Código:</b> ${orderCode}</p>
        <p><b>Cliente:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Monto:</b> USD ${amount}</p>
        <p><b>Idioma:</b> ${lang}</p>
        <p><b>Estado:</b> ⏳ Pendiente</p>
      </div>`
    });

    res.json({ success: true, orderCode, message: 'Email enviado correctamente' });

  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Error al procesar la orden', detail: err.message });
  }
});

router.get('/', (req, res) => res.json(orders));

router.get('/:code', (req, res) => {
  const order = orders.find(o => o.id === req.params.code);
  if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
  res.json(order);
});

router.patch('/:code/status', (req, res) => {
  const order = orders.find(o => o.id === req.params.code);
  if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
  order.status = req.body.status;
  res.json(order);
});

module.exports = router;
