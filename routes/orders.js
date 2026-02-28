const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { generatePaymentEmail } = require('../templates/emails');

// Simple in-memory store (replace with DB in production)
const orders = [];
let orderCounter = parseInt(process.env.ORDER_START || '1');

function generateOrderCode() {
  const num = String(orderCounter++).padStart(4, '0');
  return `VNY-2026-${num}`;
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS  // App Password from Google
  }
});

// POST /api/orders - Create order and send payment email
router.post('/', async (req, res) => {
  try {
    const { name, email, amount, lang = 'es', product = '' } = req.body;

    if (!name || !email || !amount) {
      return res.status(400).json({ error: 'Faltan datos: name, email, amount' });
    }

    const orderCode = generateOrderCode();
    const uploadUrl = `${process.env.BASE_URL || 'https://tu-app.railway.app'}/comprobante?code=${orderCode}`;

    // Save order
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

    // Generate email
    const { subject, html } = generatePaymentEmail({ name, email, amount, orderCode, lang, uploadUrl });

    // Send to client
    await transporter.sendMail({
      from: `"Viny 2030" <${process.env.GMAIL_USER}>`,
      to: email,
      subject,
      html
    });

    // Notify admin
    await transporter.sendMail({
      from: `"Viny 2030 Sistema" <${process.env.GMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
      subject: `🆕 Nueva orden: ${orderCode} — ${name} — $${amount}`,
      html: `<p><strong>Código:</strong> ${orderCode}</p>
             <p><strong>Cliente:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Monto:</strong> $${amount}</p>
             <p><strong>Producto:</strong> ${product}</p>
             <p><strong>Idioma:</strong> ${lang}</p>
             <p><strong>Estado:</strong> Pendiente de pago</p>`
    });

    res.json({ success: true, orderCode, message: 'Email enviado correctamente' });

  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Error al procesar la orden', detail: err.message });
  }
});

// GET /api/orders - List all orders (admin)
router.get('/', (req, res) => {
  res.json(orders);
});

// GET /api/orders/:code - Get single order
router.get('/:code', (req, res) => {
  const order = orders.find(o => o.id === req.params.code);
  if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
  res.json(order);
});

// PATCH /api/orders/:code/status - Update status
router.patch('/:code/status', (req, res) => {
  const order = orders.find(o => o.id === req.params.code);
  if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
  order.status = req.body.status;
  res.json(order);
});

module.exports = router;
