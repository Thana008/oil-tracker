const { Router } = require('express');
const { getAllHistory } = require('../services/dataStore');
const { analyzeAll, analyzeFuel } = require('../services/aiPredictor');
const { analyzeWithAI } = require('../services/aiAnalyzer');
const { predictPriceWithPython } = require('../services/pythonForecaster');

const router = Router();

// GET /api/prediction — AI analysis for all fuel types
router.get('/', async (req, res) => {
  try {
    const history = getAllHistory(90);
    const analysis = analyzeAll(history);

    const fuels = Object.keys(analysis || {});
    await Promise.all(fuels.map(async (fuel) => {
      const a = analysis[fuel];
      if (!a || typeof a.currentPrice !== 'number') return;

      try {
        const py = await predictPriceWithPython(history, fuel, 7);
        if (py && py.success && typeof py.predictedPrice === 'number') {
          a.statPredictedPrice = a.predictedPrice;
          a.predictedPrice = py.predictedPrice;

          const change = a.predictedPrice - a.currentPrice;
          a.change = Math.round(change * 100) / 100;
          a.changePercent = a.currentPrice
            ? Math.round((a.change / a.currentPrice) * 10000) / 100
            : 0;

          if (Math.abs(a.change) < 0.05) a.direction = 'STABLE';
          else a.direction = a.change > 0 ? 'UP' : 'DOWN';

          a.aiModel = py.model || 'python';
          a.aiMeta = py.meta || null;
        }
      } catch (e) {
        a.aiModel = null;
        a.aiMeta = { error: e.message };
      }
    }));

    res.json({ success: true, timestamp: new Date().toISOString(), analysis });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/prediction/:fuel — detailed analysis for one fuel + AI summary
router.get('/:fuel', async (req, res) => {
  try {
    const { fuel } = req.params;
    const history = getAllHistory(90);
    const analysis = analyzeFuel(history, fuel);

    try {
      const py = await predictPriceWithPython(history, fuel, 7);
      if (py && py.success && typeof py.predictedPrice === 'number') {
        analysis.statPredictedPrice = analysis.predictedPrice;
        analysis.predictedPrice = py.predictedPrice;
        const change = analysis.predictedPrice - analysis.currentPrice;
        analysis.change = Math.round(change * 100) / 100;
        analysis.changePercent = analysis.currentPrice
          ? Math.round((analysis.change / analysis.currentPrice) * 10000) / 100
          : 0;

        if (Math.abs(analysis.change) < 0.05) analysis.direction = 'STABLE';
        else analysis.direction = analysis.change > 0 ? 'UP' : 'DOWN';

        analysis.aiModel = py.model || 'python';
        analysis.aiMeta = py.meta || null;
      }
    } catch (e) {
      analysis.aiModel = null;
      analysis.aiMeta = { error: e.message };
    }

    const summary = await analyzeWithAI(analysis, fuel);
    res.json({ success: true, fuel, analysis, summary, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
