// v2 - PostgreSQL
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const migrate = require('./utils/migrate');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rutas API
app.use('/api/orders', require('./routes/orders'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/comprobante', require('./routes/upload')); // alias

// Páginas
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/comprobante', (req, res) => res.sendFile(path.join(__dirname, 'public', 'comprobante.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/relato', (req, res) => res.sendFile(path.join(__dirname, 'public', 'relato.html')));
app.get('/aceptar', (req, res) => res.sendFile(path.join(__dirname, 'public', 'aceptar.html')));

// Iniciar servidor siempre — la migración corre en paralelo sin bloquear
app.listen(PORT, () => {
  console.log(`✅ Viny2030 corriendo en http://localhost:${PORT}`);
  // Intentar crear tabla, pero no bloquear si falla (ej: DATABASE_URL no configurada aún)
  migrate().catch(err => console.warn('⚠️ Migración pendiente:', err.message));
});
