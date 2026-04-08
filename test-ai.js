require('dotenv').config({ path: './backend/.env' });
const { analyzeWithAI } = require('./backend/services/aiAnalyzer');

async function testAI() {
  const dummyAnalysis = {
    fuelName: 'ดีเซล B7',
    currentPrice: 50.54,
    predictedPrice: 51.20,
    change: 0.66,
    direction: 'UP',
    confidence: 85,
    signals: ['SMA crossover', 'RSI oversold']
  };

  console.log('Testing AI Analyzer with current config...');
  console.log('Provider:', process.env.AI_PROVIDER || 'gemini (default)');
  
  const summary = await analyzeWithAI(dummyAnalysis, 'diesel_b7');
  console.log('\nResult Summary:');
  console.log(summary);
}

testAI();
