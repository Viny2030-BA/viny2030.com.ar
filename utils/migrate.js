// utils/migrate.js
// Crea la tabla 'orders' en PostgreSQL si no existe.
// Se ejecuta automáticamente al iniciar el servidor.
const pool = require('./db');

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id                TEXT PRIMARY KEY,
        name              TEXT NOT NULL,
        email             TEXT NOT NULL,
        amount            NUMERIC DEFAULT 10,
        lang              TEXT DEFAULT 'es',
        product           TEXT DEFAULT 'Diagnostico Algoritmico',
        status            TEXT DEFAULT 'pending',
        upload_url        TEXT,
        analisis_es       TEXT,
        analisis_trad     TEXT,
        propuesta_es      TEXT,
        propuesta_trad    TEXT,
        analisis_at       TIMESTAMPTZ,
        aceptado_at       TIMESTAMPTZ,
        created_at        TIMESTAMPTZ DEFAULT NOW(),

        -- Segunda etapa (agregado v2)
        comprobante2_at   TIMESTAMPTZ,
        informe2_es       TEXT,
        informe2_trad     TEXT
      );
    `);

    // Agregar columnas si la tabla ya existe (migraciones seguras)
    const alterCols = [
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS comprobante2_at TIMESTAMPTZ`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS informe2_es TEXT`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS informe2_trad TEXT`,
    ];
    for (const sql of alterCols) {
      await pool.query(sql);
    }

    console.log('✅ PostgreSQL: tabla orders lista (v2 — segunda etapa)');
  } catch (err) {
    console.error('❌ Error en migración:', err.message);
    // No cortamos el servidor si falla
  }
}

module.exports = migrate;
