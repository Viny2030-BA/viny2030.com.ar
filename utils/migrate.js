// utils/migrate.js
// Ejecutar con: node utils/migrate.js
// Agrega columnas nuevas a la tabla orders

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const migrations = [
  // ── Segunda etapa ───────────────────────────────────────────────────────
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS comprobante2_url TEXT`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS comprobante2_at TIMESTAMPTZ`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS informe2_es TEXT`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS informe2_trad TEXT`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS informe2_sent_at TIMESTAMPTZ`,

  // ── GitHub repo del cliente ─────────────────────────────────────────────
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS repo_name TEXT`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS repo_url TEXT`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS repo_created_at TIMESTAMPTZ`,

  // ── algo_pushed_at ──────────────────────────────────────────────────────
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS algo_pushed_at TIMESTAMPTZ`,

  // ── app.py generado por IA ─────────────────────────────────────────────
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS app_py_draft TEXT`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS app_py_generated_at TIMESTAMPTZ`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS app_py_published BOOLEAN DEFAULT FALSE`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS app_py_published_at TIMESTAMPTZ`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS streamlit_url TEXT`,

  // ── Índices para búsqueda rápida ────────────────────────────────────────
  `CREATE INDEX IF NOT EXISTS idx_orders_code ON orders(code)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`,
];

async function run() {
  const client = await pool.connect();
  try {
    console.log('🔄 Corriendo migraciones...\n');
    for (const sql of migrations) {
      try {
        await client.query(sql);
        console.log(`  ✅ ${sql.slice(0, 70)}...`);
      } catch (err) {
        console.error(`  ❌ Error: ${err.message}`);
        console.error(`     SQL: ${sql}`);
      }
    }
    console.log('\n✅ Migraciones completadas.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
