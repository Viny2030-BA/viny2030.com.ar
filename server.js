// server.js
require('dotenv').config();
const express = require('express');
const app     = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ── Rutas ─────────────────────────────────────────────────────────────────
const ordersRouter = require('./routes/orders');
const uploadRouter = require('./routes/upload');

app.use('/api/orders', ordersRouter);
app.use('/api/upload', uploadRouter);

// ── Health check ──────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// ── Start ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Backend corriendo en puerto ${PORT}`));
