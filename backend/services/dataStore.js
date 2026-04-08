const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/priceHistory.json');

const DEFAULT_PRICES = {
  diesel_b7: 33.44,
  diesel_b10: 32.94,
  diesel_b20: 32.44,
  gasohol_91: 36.62,
  gasohol_95: 40.12,
  e20: 35.12,
  e85: 22.90,
  premium_diesel: 36.99,
};

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const init = { history: [], lastUpdated: null };
      saveData(init);
      return init;
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (err) {
    console.error('loadData error:', err.message);
    return { history: [], lastUpdated: null };
  }
}

function saveData(data) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('saveData error:', err.message);
  }
}

function addPriceRecord(prices, brent = null) {
  const data = loadData();
  const today = new Date().toISOString().split('T')[0];
  const idx = data.history.findIndex(h => h.date === today);
  const record = { date: today, prices, brent, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    data.history[idx] = record;
  } else {
    data.history.push(record);
  }
  if (data.history.length > 365) data.history = data.history.slice(-365);
  data.lastUpdated = new Date().toISOString();
  saveData(data);
}

function getCurrentPrices() {
  const data = loadData();
  if (data.history.length === 0) return { prices: DEFAULT_PRICES, source: 'default', date: new Date().toISOString().split('T')[0] };
  const last = data.history[data.history.length - 1];
  return { prices: last.prices, brent: last.brent, source: last.prices.source || 'cached', date: last.date };
}

function getHistory(fuelType, days = 90) {
  const data = loadData();
  return data.history.slice(-days).map(r => ({
    date: r.date,
    price: r.prices[fuelType] ?? null,
    brent: r.brent ?? null,
  })).filter(r => r.price !== null);
}

function getAllHistory(days = 90) {
  const data = loadData();
  return data.history.slice(-days);
}

module.exports = { loadData, saveData, addPriceRecord, getCurrentPrices, getHistory, getAllHistory, DEFAULT_PRICES };
