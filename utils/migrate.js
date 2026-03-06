// utils/migrate.js
// Crea la tabla 'orders' en PostgreSQL si no existe.
// Se ejecuta automáticamente al iniciar el servidor.

const pool = require('./db');

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id            TEXT PRIMARY KEY,
        name          TEXT NOT NULL,
        email         TEXT NOT NULL,
        amount        NUMERIC DEFAULT 10,
        lang          TEXT DEFAULT 'es',
        product       TEXT DEFAULT 'Diagnostico Algoritmico',
        status        TEXT DEFAULT 'pending',
        upload_url    TEXT,
        analisis_es   TEXT,
        analisis_trad TEXT,
        propuesta_es  TEXT,
        propuesta_trad TEXT,
        analisis_at   TIMESTAMPTZ,
        aceptado_at   TIMESTAMPTZ,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ PostgreSQL: tabla orders lista');
  } catch (err) {
    console.error('❌ Error en migración:', err.message);
    // No cortamos el servidor si falla — se puede usar sin DB temporalmente
  }
}

module.exports = migrate;
