const axios = require('axios');
const { generateSummary } = require('./aiPredictor');

const CONFIG = {
  provider: 'groq', // บังคับใช้ Groq ตามคำขอของผู้ใช้
  groqKey: process.env.GROQ_API_KEY,
};

// Cache: { [fuelType]: { summary, expiresAt } }
const cache = {};
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 ชั่วโมง

function buildPrompt(analysis) {
  return `คุณเป็นผู้เชี่ยวชาญด้านราคาน้ำมันในประเทศไทย
วิเคราะห์ข้อมูลต่อไปนี้และสรุปเป็นภาษาไทย ไม่เกิน 2-3 ประโยค กระชับและเข้าใจง่าย:

- น้ำมัน: ${analysis.fuelName}
- ราคาปัจจุบัน: ${analysis.currentPrice.toFixed(2)} ฿/ลิตร
- คาดการณ์ 7 วัน: ${analysis.predictedPrice.toFixed(2)} ฿/ลิตร (${analysis.change >= 0 ? '+' : ''}${analysis.change.toFixed(2)} ฿)
- ทิศทาง: ${analysis.direction} (มั่นใจ ${analysis.confidence}%)
- สัญญาณ: ${analysis.signals.slice(0, 3).join(' | ')}

สรุปแนวโน้มและสิ่งที่ควรรู้ (สรุปเป็นภาษาไทยเท่านั้น)`;
}

async function callGroq(prompt) {
  if (!CONFIG.groqKey || CONFIG.groqKey.includes('ใส่_key')) {
    throw new Error('Missing or invalid GROQ_API_KEY');
  }

  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const { data } = await axios.post(url, {
    model: 'llama-3.3-70b-versatile', // โมเดลที่ฉลาดและฟรีของ Groq
    messages: [
      { 
        role: 'system', 
        content: 'คุณคือผู้ช่วยวิเคราะห์ราคาน้ำมันที่ตอบเป็นภาษาไทยที่กระชับและแม่นยำ' 
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.5,
    max_tokens: 200,
  }, {
    headers: { 'Authorization': `Bearer ${CONFIG.groqKey}` },
    timeout: 15000
  });

  return data.choices[0].message.content.trim();
}

async function analyzeWithAI(analysis, fuelType) {
  // ตรวจสอบ Cache
  if (cache[fuelType] && Date.now() < cache[fuelType].expiresAt) {
    return cache[fuelType].summary;
  }

  const prompt = buildPrompt(analysis);
  let summary = null;

  try {
    console.log(`🤖 AI Analyzing with Groq for ${fuelType}...`);
    summary = await callGroq(prompt);
  } catch (err) {
    console.warn(`❌ Groq AI error:`, err.message);
  }

  // หาก AI ล้มเหลว ให้ใช้ระบบสรุปจากสถิติ (Statistical Fallback)
  if (!summary) {
    summary = generateSummary(analysis);
  } else {
    // เก็บลง Cache เฉพาะกรณีที่ได้คำตอบจาก AI จริงๆ
    cache[fuelType] = { summary, expiresAt: Date.now() + CACHE_TTL };
  }

  return summary;
}

module.exports = { analyzeWithAI };
