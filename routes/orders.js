const express = require('express');
const router = express.Router();
const { generateOrderCode } = require('../utils/orderCode');
const { generatePaymentEmail } = require('../templates/emails');
const { sendEmail } = require('../utils/mailer');

// In-memory store (se pierde al reiniciar — para producción usar DB)
const orders = [];

// POST /api/orders - Crear orden y enviar email de pago
router.post('/', async (req, res) => {
  try {
    const { name, email, amount, lang = 'es', product = '' } = req.body;

    if (!name || !email || !amount) {
      return res.status(400).json({ error: 'Faltan datos: name, email, amount' });
    }

    const orderCode = generateOrderCode();
    const uploadUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/comprobante?codigo=${orderCode}`;

    // Guardar orden
    const order = {
      id: orderCode,
      name,
      email,
      amount,
      lang,
      product,
      status: 'pending',
      createdAt: new Date().toISOString(),
      uploadUrl
    };
    orders.push(order);

    // Generar y enviar email al cliente
    const { subject, html } = generatePaymentEmail({ name, email, amount, orderCode, lang, uploadUrl });
    await sendEmail({ to: email, subject, html });

    // Notificar al admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
      subject: `🆕 Nueva orden: ${orderCode} — ${name} — $${amount}`,
      html: `<div style="font-family:Arial;padding:20px;">
        <h2 style="color:#c9a84c;">Nueva orden recibida</h2>
        <p><strong>Código:</strong> ${orderCode}</p>
        <p><strong>Cliente:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Monto:</strong> $${amount}</p>
        <p><strong>Producto:</strong> ${product}</p>
        <p><strong>Idioma:</strong> ${lang}</p>
        <p><strong>Estado:</strong> Pendiente de pago</p>
      </div>`
    });

    res.json({ success: true, orderCode, message: 'Email enviado correctamente' });

  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Error al procesar la orden', detail: err.message });
  }
});

// GET /api/orders - Listar órdenes (admin)
router.get('/', (req, res) => {
  res.json(orders);
});

// GET /api/orders/:code - Obtener una orden
router.get('/:code', (req, res) => {
  const order = orders.find(o => o.id === req.params.code);
  if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
  res.json(order);
});

// PATCH /api/orders/:code/status - Cambiar estado
router.patch('/:code/status', (req, res) => {
  const order = orders.find(o => o.id === req.params.code);
  if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
  order.status = req.body.status;
  res.json(order);
});

module.exports = router;
