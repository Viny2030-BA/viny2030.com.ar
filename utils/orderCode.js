const fs = require('fs');
const path = require('path');

const COUNTER_FILE = path.join(__dirname, '../data/counter.json');

function ensureDataDir() {
  const dir = path.join(__dirname, '../data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(COUNTER_FILE)) fs.writeFileSync(COUNTER_FILE, JSON.stringify({ count: 0 }));
}

function generateOrderCode() {
  ensureDataDir();
  const data = JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf8'));
  data.count += 1;
  fs.writeFileSync(COUNTER_FILE, JSON.stringify(data));
  const year = new Date().getFullYear();
  const num = String(data.count).padStart(4, '0');
  return `VNY-${year}-${num}`;
}

module.exports = { generateOrderCode };
