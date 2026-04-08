const { Router } = require('express');
const { getCurrentPrices, getHistory, getAllHistory } = require('../services/dataStore');
const { smaArray } = require('../services/aiPredictor');

const router = Router();

// GET /api/prices — current prices
router.get('/', (req, res) => {
  const current = getCurrentPrices();
  res.json({ success: true, ...current, timestamp: new Date().toISOString() });
});

// GET /api/prices/history?fuel=diesel_b7&days=30
router.get('/history', (req, res) => {
  const { fuel = 'diesel_b7', days = '30' } = req.query;
  const history = getHistory(fuel, parseInt(days, 10));
  const prices = history.map(h => h.price);
  const sma7 = smaArray(prices, 7);
  const sma30 = smaArray(prices, 30);

  const enriched = history.map((h, i) => ({
    ...h,
    sma7: i >= 6 ? sma7[i - 6] : null,
    sma30: i >= 29 ? sma30[i - 29] : null,
  }));

  res.json({ success: true, fuel, days: parseInt(days, 10), data: enriched });
});

// GET /api/prices/all-history?days=90 — all fuels
router.get('/all-history', (req, res) => {
  const { days = '90' } = req.query;
  const history = getAllHistory(parseInt(days, 10));
  res.json({ success: true, days: parseInt(days, 10), data: history });
});

module.exports = router;
