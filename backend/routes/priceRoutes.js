const { Router } = require('express');
const { getCurrentPrices, getHistory, getAllHistory } = require('../services/dataStore');
const { smaArray } = require('../services/aiPredictor');

const router = Router();

// GET /api/prices — current prices
router.get('/', async (req, res) => {
  try {
    const current = await getCurrentPrices();
    res.json({ success: true, ...current, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/prices/history?fuel=diesel_b7&days=30
router.get('/history', async (req, res) => {
  try {
    const { fuel = 'diesel_b7', days = '30' } = req.query;
    const requestedDays = parseInt(days, 10);
    const history = await getHistory(fuel, requestedDays + 30);
    const prices = history.map(h => h.price);
    const sma7 = smaArray(prices, 7);
    const sma30 = smaArray(prices, 30);

    const enriched = history.map((h, i) => ({
      ...h,
      sma7: i >= 6 ? sma7[i - 6] : null,
      sma30: i >= 29 ? sma30[i - 29] : null,
    })).slice(-requestedDays);

    res.json({ success: true, fuel, days: requestedDays, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/prices/all-history?days=90 — all fuels
router.get('/all-history', async (req, res) => {
  try {
    const { days = '90' } = req.query;
    const history = await getAllHistory(parseInt(days, 10));
    res.json({ success: true, days: parseInt(days, 10), data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
