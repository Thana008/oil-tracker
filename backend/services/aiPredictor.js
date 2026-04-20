/**
 * AI Predictor Service
 * Algorithms: Linear Regression, SMA, EMA, RSI, MACD
 */

function linearRegression(values) {
  const n = values.length;
  if (n < 2) return null;
  const sumX = (n * (n - 1)) / 2;
  const sumX2 = values.reduce((acc, _, i) => acc + i * i, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((acc, v, i) => acc + i * v, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const yMean = sumY / n;
  const ssTot = values.reduce((acc, v) => acc + (v - yMean) ** 2, 0);
  const ssRes = values.reduce((acc, v, i) => acc + (v - (slope * i + intercept)) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { slope, intercept, r2 };
}

function median(values) {
  const arr = values.filter(v => typeof v === 'number' && !isNaN(v)).slice().sort((a, b) => a - b);
  if (!arr.length) return null;
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}

function typicalDailyChange(values, window = 30) {
  const slice = values.slice(-window);
  const diffs = [];
  for (let i = 1; i < slice.length; i++) {
    const a = slice[i - 1];
    const b = slice[i];
    if (typeof a === 'number' && typeof b === 'number') diffs.push(Math.abs(b - a));
  }
  return median(diffs) ?? 0.5;
}

function theilSenRegression(values) {
  const n = values.length;
  if (n < 2) return null;

  const slopes = [];
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const dy = values[j] - values[i];
      const dx = j - i;
      if (dx !== 0 && isFinite(dy)) slopes.push(dy / dx);
    }
  }
  const slope = median(slopes);
  if (slope == null) return null;

  const intercepts = values.map((y, i) => y - slope * i);
  const intercept = median(intercepts);
  return { slope, intercept };
}

function sma(values, period) {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function smaArray(values, period) {
  const result = [];
  for (let i = period - 1; i < values.length; i++) {
    const w = values.slice(i - period + 1, i + 1);
    result.push(w.reduce((a, b) => a + b, 0) / period);
  }
  return result;
}

function ema(values, period) {
  if (values.length < period) return null;
  const k = 2 / (period + 1);
  let val = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < values.length; i++) {
    val = values[i] * k + val * (1 - k);
  }
  return val;
}

function rsi(values, period = 14) {
  if (values.length < period + 1) return null;
  const gains = [], losses = [];
  for (let i = 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    gains.push(d > 0 ? d : 0);
    losses.push(d < 0 ? -d : 0);
  }
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function macd(values) {
  const e12 = ema(values, 12);
  const e26 = ema(values, 26);
  if (!e12 || !e26) return null;
  return { macdLine: e12 - e26, ema12: e12, ema26: e26 };
}

const FUEL_NAMES = {
  diesel_b7: 'ดีเซล B7', diesel_b10: 'ดีเซล B10', diesel_b20: 'ดีเซล B20',
  gasohol_91: 'แก๊สโซฮอล์ 91', gasohol_95: 'แก๊สโซฮอล์ 95',
  e20: 'E20', e85: 'E85', premium_diesel: 'ดีเซลพรีเมียม',
};

function analyzeFuel(priceHistory, fuelType, horizonDays = 7) {
  const prices = priceHistory
    .map(h => h.prices?.[fuelType])
    .filter(p => p != null && !isNaN(p));

  const currentPrice = prices[prices.length - 1] || 0;

  if (prices.length < 5) {
    return {
      direction: 'STABLE', confidence: 40, currentPrice,
      predictedPrice: currentPrice, change: 0, changePercent: 0,
      signals: ['ข้อมูลไม่เพียงพอสำหรับการวิเคราะห์'], sma7: null, sma30: null,
      rsiValue: null, fuelName: FUEL_NAMES[fuelType] || fuelType,
    };
  }

  const recent30 = prices.slice(-30);
  const sma7v = sma(prices, Math.min(7, prices.length));
  const sma30v = sma(prices, Math.min(30, prices.length));
  const ema7v = ema(prices, Math.min(7, prices.length));
  const rsiV = rsi(prices, Math.min(14, prices.length - 1));
  const macdV = macd(prices);
  const lr = linearRegression(recent30);
  const ts = theilSenRegression(recent30);

  const trendModel = ts || lr;

  const rawPredicted = trendModel
    ? (trendModel.slope * (recent30.length + horizonDays - 1) + trendModel.intercept)
    : currentPrice;

  const typical = typicalDailyChange(prices, 30);
  const cap = Math.max(0.8, typical * horizonDays);
  let predictedPrice = rawPredicted;
  if (predictedPrice > currentPrice + cap) predictedPrice = currentPrice + cap;
  if (predictedPrice < currentPrice - cap) predictedPrice = currentPrice - cap;
  predictedPrice = Math.round(predictedPrice * 100) / 100;

  const signals = [];
  let bull = 0, bear = 0;

  // Signal 1: SMA crossover
  if (sma7v && sma30v) {
    if (sma7v > sma30v) {
      signals.push(`📈 SMA7 (${sma7v.toFixed(2)}) > SMA30 (${sma30v.toFixed(2)}) — แนวโน้มขาขึ้น`);
      bull++;
    } else {
      signals.push(`📉 SMA7 (${sma7v.toFixed(2)}) < SMA30 (${sma30v.toFixed(2)}) — แนวโน้มขาลง`);
      bear++;
    }
  }

  // Signal 2: RSI
  if (rsiV != null) {
    if (rsiV > 70) { signals.push(`⚠️ RSI: ${rsiV.toFixed(1)} — Overbought (เสี่ยงปรับลง)`); bear++; }
    else if (rsiV < 30) { signals.push(`⚡ RSI: ${rsiV.toFixed(1)} — Oversold (โอกาสฟื้นตัว)`); bull++; }
    else if (rsiV > 50) { signals.push(`📊 RSI: ${rsiV.toFixed(1)} — Bullish territory`); bull++; }
    else { signals.push(`📊 RSI: ${rsiV.toFixed(1)} — Bearish territory`); bear++; }
  }

  // Signal 3: Linear trend
  if (lr) {
    const weekly = lr.slope * 7;
    if (lr.slope > 0.005) {
      signals.push(`📈 Trend: +${weekly.toFixed(2)} บาท/สัปดาห์ (R²=${lr.r2.toFixed(2)})`);
      bull++;
    } else if (lr.slope < -0.005) {
      signals.push(`📉 Trend: ${weekly.toFixed(2)} บาท/สัปดาห์ (R²=${lr.r2.toFixed(2)})`);
      bear++;
    } else {
      signals.push(`➡️ Trend: ทรงตัว (slope=${lr.slope.toFixed(4)})`);
    }
  }

  // Signal 4: Price vs EMA
  if (ema7v) {
    if (currentPrice > ema7v) { signals.push(`💹 ราคา > EMA7 — Momentum ขาขึ้น`); bull++; }
    else { signals.push(`💹 ราคา < EMA7 — Momentum ขาลง`); bear++; }
  }

  // Signal 5: MACD
  if (macdV) {
    if (macdV.macdLine > 0) { signals.push(`📊 MACD: ${macdV.macdLine.toFixed(4)} — Bullish`); bull++; }
    else { signals.push(`📊 MACD: ${macdV.macdLine.toFixed(4)} — Bearish`); bear++; }
  }

  // Signal 6: Historical change matching horizon
  if (prices.length >= horizonDays) {
    const prevP = prices[prices.length - horizonDays];
    const chg = ((currentPrice - prevP) / prevP * 100);
    signals.push(`📆 เปลี่ยนแปลง ${horizonDays} วัน: ${chg >= 0 ? '+' : ''}${chg.toFixed(2)}% (${chg >= 0 ? '+' : ''}${(currentPrice - prevP).toFixed(2)} ฿)`);
  }

  // Determine direction & confidence
  const total = bull + bear;
  let direction = 'STABLE';
  let confidence = 50;
  if (total > 0) {
    const bPct = bull / total;
    if (bPct >= 0.6) { direction = 'UP'; confidence = Math.round(bPct * 100); }
    else if (bPct <= 0.4) { direction = 'DOWN'; confidence = Math.round((1 - bPct) * 100); }
  }
  if (lr?.r2) confidence = Math.max(30, Math.min(95, Math.round(confidence * (0.6 + lr.r2 * 0.4))));
  const change = Math.round((predictedPrice - currentPrice) * 100) / 100;

  return {
    direction, confidence, currentPrice, predictedPrice, change,
    changePercent: currentPrice ? Math.round((change / currentPrice) * 10000) / 100 : 0,
    signals, sma7: sma7v, sma30: sma30v, ema7: ema7v, rsiValue: rsiV,
    macd: macdV, r2: lr?.r2 ?? null, fuelName: FUEL_NAMES[fuelType] || fuelType,
    statModel: ts ? 'theil-sen' : (lr ? 'linear-regression' : null),
    horizonDays,
  };
}

function analyzeAll(priceHistory, horizonDays = 7) {
  const fuels = ['diesel_b7', 'diesel_b10', 'diesel_b20', 'gasohol_91', 'gasohol_95', 'e20', 'e85', 'premium_diesel'];
  const results = {};
  for (const f of fuels) results[f] = analyzeFuel(priceHistory, f, horizonDays);
  return results;
}

function generateSummary(analysis) {
  const { direction, confidence, currentPrice, predictedPrice, change, fuelName } = analysis;
  const dirTH = direction === 'UP' ? 'ขึ้น' : direction === 'DOWN' ? 'ลง' : 'ทรงตัว';
  const emoji = direction === 'UP' ? '📈' : direction === 'DOWN' ? '📉' : '➡️';
  const days = analysis.horizonDays || 7;
  if (direction === 'STABLE') {
    return `${emoji} ราคา${fuelName}คาดว่าจะ${dirTH} อยู่ที่ ${currentPrice.toFixed(2)} ฿/ลิตร (ความมั่นใจ ${confidence}%)`;
  }
  return `${emoji} ราคา${fuelName}คาดว่าจะ${dirTH} จาก ${currentPrice.toFixed(2)} → ${predictedPrice.toFixed(2)} ฿/ลิตร (${change >= 0 ? '+' : ''}${change.toFixed(2)} ฿) ภายใน ${days} วัน ความมั่นใจ ${confidence}%`;
}

module.exports = { linearRegression, theilSenRegression, sma, smaArray, ema, rsi, macd, analyzeFuel, analyzeAll, generateSummary };
