// utils/db.js
// Conexión a PostgreSQL (Railway)
// Requiere variable de entorno: DATABASE_URL

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL error inesperado:', err.message);
});

module.exports = pool;
