/**
 * Seed Script: generates 90 days of realistic Thai oil price history
 * Run: npm run seed
 */
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/priceHistory.json');

// Current prices (April 2026 approximate, PTT retail)
const CURRENT = {
  diesel_b7: 33.44, diesel_b10: 32.94, diesel_b20: 32.44,
  gasohol_91: 36.62, gasohol_95: 40.12, e20: 35.12, e85: 22.90, premium_diesel: 36.99,
};

// Prices 90 days ago (lower, since crude was lower in Jan 2026)
const START = {
  diesel_b7: 31.94, diesel_b10: 31.44, diesel_b20: 30.94,
  gasohol_91: 34.92, gasohol_95: 38.32, e20: 33.52, e85: 21.40, premium_diesel: 35.29,
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function round2(v) {
  return Math.round(v * 100) / 100;
}

function generateHistory() {
  const history = [];
  const totalDays = 90;
  const fuels = Object.keys(CURRENT);

  let brent = 70.5; // Starting Brent price (USD/bbl)
  const brentTarget = 73.2;

  // PTT changes prices every ~7 days (simulate price-change events)
  let prices = { ...START };
  let daysSinceChange = 0;
  let nextChangeDays = 7;

  for (let d = 0; d < totalDays; d++) {
    const date = new Date();
    date.setDate(date.getDate() - (totalDays - d));
    const dateStr = date.toISOString().split('T')[0];
    const t = d / (totalDays - 1); // progress 0→1

    daysSinceChange++;

    if (daysSinceChange >= nextChangeDays) {
      // Apply weekly price adjustment
      for (const fuel of fuels) {
        const targetPrice = lerp(START[fuel], CURRENT[fuel], t);
        const noise = (Math.random() - 0.5) * 0.4;
        const drift = (targetPrice - prices[fuel]) * 0.6;
        prices[fuel] = round2(clamp(prices[fuel] + drift + noise, START[fuel] * 0.95, CURRENT[fuel] * 1.05));
      }
      daysSinceChange = 0;
      nextChangeDays = 5 + Math.floor(Math.random() * 5); // 5-9 days
    }

    // Brent oil: random walk toward target
    brent = round2(lerp(brent, brentTarget, 0.02) + (Math.random() - 0.5) * 1.5);
    brent = clamp(brent, 65, 85);

    history.push({ date: dateStr, prices: { ...prices }, brent });
  }

  // Make sure last entry matches current prices exactly
  const today = new Date().toISOString().split('T')[0];
  const lastIdx = history.findIndex(h => h.date === today);
  const finalRecord = { date: today, prices: { ...CURRENT }, brent: brentTarget };
  if (lastIdx >= 0) history[lastIdx] = finalRecord;
  else history.push(finalRecord);

  return history;
}

const history = generateHistory();
const output = { history, lastUpdated: new Date().toISOString() };

const dir = path.dirname(DATA_FILE);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(DATA_FILE, JSON.stringify(output, null, 2));

console.log(`✅ Seeded ${history.length} records from ${history[0].date} to ${history[history.length - 1].date}`);
console.log('📍 Current prices:', CURRENT);
