function generateOrderCode() {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  const time = Date.now().toString(36).slice(-4).toUpperCase();
  return `VNY-${year}-${rand}${time}`;
}

module.exports = { generateOrderCode };
