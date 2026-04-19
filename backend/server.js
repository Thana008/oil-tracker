const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const { getAllHistory, addPriceRecord } = require('./services/dataStore');
const { scrapePrices, estimatePricesFromBrent } = require('./services/oilPriceScraper');
const { fetchBrentOil } = require('./services/brentOilFetcher');
const priceRoutes = require('./routes/priceRoutes');
const predictionRoutes = require('./routes/predictionRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.use('/api/prices', priceRoutes);
app.use('/api/prediction', predictionRoutes);

app.get('/api/health', async (req, res) => {
  const history = await getAllHistory();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    records: history.length,
    lastUpdated: history.length > 0 ? history[0].updatedAt : null,
    ai: {
      provider: process.env.AI_PROVIDER || 'gemini',
      gemini: !!process.env.GEMINI_API_KEY,
      groq: !!process.env.GROQ_API_KEY,
      huggingface: !!process.env.HF_API_KEY,
    }
  });
});

async function updatePrices() {
  console.log('🔄 Updating oil prices...');
  try {
    const [scraped, brent] = await Promise.all([scrapePrices(), fetchBrentOil()]);

    if (scraped) {
      await addPriceRecord(scraped, brent);
      console.log(`✅ Prices updated from ${scraped.source}`);
      return;
    }

    // Scraping failed — use Brent correlation to estimate new prices
    const history = await getAllHistory();
    if (history.length === 0) return;

    const last = history[0]; // history is sorted desc
    const previousBrent = last.brent;

    const estimated = estimatePricesFromBrent(last.prices, brent, previousBrent);
    if (estimated) {
      await addPriceRecord(estimated, brent);
      console.log('📊 Prices estimated from Brent movement');
    } else {
      // Brent barely moved — keep prices, just update brent value
      await addPriceRecord({ ...last.prices, source: 'cached' }, brent);
      console.log('⏸️  Prices unchanged (Brent move < 1%), Brent updated');
    }
  } catch (err) {
    console.error('❌ Update error:', err.message);
  }
}

// Update every 4 hours
cron.schedule('0 */4 * * *', updatePrices);

app.listen(PORT, async () => {
  console.log(`🚀 Oil Tracker Backend running at http://localhost:${PORT}`);
  const history = await getAllHistory();
  if (history.length === 0) {
    console.log('📊 No history found. Run: node scripts/migrateToDb.js or seed script');
  } else {
    console.log(`📊 Loaded ${history.length} records from PostgreSQL`);
  }
  await updatePrices();
});
