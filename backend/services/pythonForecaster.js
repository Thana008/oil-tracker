const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = {};

async function predictPriceWithPython(history, fuelType, horizonDays = 7) {
  const key = `${fuelType}:${horizonDays}`;
  const now = Date.now();
  const cached = cache[key];
  if (cached && now < cached.expiresAt) return cached.value;

  const sliced = Array.isArray(history) ? history.slice(-180) : [];
  
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/predict`, {
      history: sliced,
      fuelType,
      horizonDays
    });
    
    const result = response.data;
    cache[key] = { value: result, expiresAt: now + CACHE_TTL_MS };
    return result;
  } catch (error) {
    console.error('❌ AI Service error:', error.message);
    if (error.response) {
      console.error('Data:', error.response.data);
    }
    throw new Error(`AI service failed: ${error.message}`);
  }
}

module.exports = { predictPriceWithPython };
