// server.js
require('dotenv').config();
const express = require('express');
const path    = require('path');
const app     = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ── Páginas ───────────────────────────────────────────────────────────────────
app.get('/',               (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/comprobante',    (req, res) => res.sendFile(path.join(__dirname, 'public', 'comprobante.html')));
app.get('/admin',          (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/relato',         (req, res) => res.sendFile(path.join(__dirname, 'public', 'relato.html')));
app.get('/aceptar',        (req, res) => res.sendFile(path.join(__dirname, 'public', 'aceptar.html')));

// Dr. Monteverde — guión bajo y guión medio apuntan al mismo archivo
app.get('/dr_monteverde',       (req, res) => res.sendFile(path.join(__dirname, 'public', 'dr_monteverde.html')));
app.get('/dr_monteverde.html',  (req, res) => res.sendFile(path.join(__dirname, 'public', 'dr_monteverde.html')));
app.get('/dr-monteverde',       (req, res) => res.redirect(301, '/dr_monteverde.html'));
app.get('/dr-monteverde.html',  (req, res) => res.redirect(301, '/dr_monteverde.html'));

// ── Rutas API (existentes + nuevas segunda etapa) ─────────────────────────────
const ordersRouter = require('./routes/orders');
const uploadRouter = require('./routes/upload');

app.use('/api/orders', ordersRouter);
app.use('/api/upload', uploadRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// ── Iniciar servidor ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Viny2030 corriendo en http://localhost:${PORT}`);
});
