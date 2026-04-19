const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_PRICES = {
  diesel_b7: 33.44, diesel_b10: 32.94, diesel_b20: 32.44,
  gasohol_91: 36.62, gasohol_95: 40.12, e20: 35.12, e85: 22.90, premium_diesel: 36.99,
};

async function addPriceRecord(prices, brent = null) {
  const today = new Date().toISOString().split('T')[0];
  try {
    await prisma.priceHistory.upsert({
      where: { date: today },
      update: {
        diesel_b7: prices.diesel_b7,
        diesel_b10: prices.diesel_b10,
        diesel_b20: prices.diesel_b20,
        gasohol_91: prices.gasohol_91,
        gasohol_95: prices.gasohol_95,
        e20: prices.e20,
        e85: prices.e85,
        premium_diesel: prices.premium_diesel,
        brent: brent,
        source: prices.source || 'cached'
      },
      create: {
        date: today,
        diesel_b7: prices.diesel_b7,
        diesel_b10: prices.diesel_b10,
        diesel_b20: prices.diesel_b20,
        gasohol_91: prices.gasohol_91,
        gasohol_95: prices.gasohol_95,
        e20: prices.e20,
        e85: prices.e85,
        premium_diesel: prices.premium_diesel,
        brent: brent,
        source: prices.source || 'cached'
      }
    });
  } catch (err) {
    console.error('addPriceRecord error:', err.message);
  }
}

async function getCurrentPrices() {
  try {
    const last = await prisma.priceHistory.findFirst({
      orderBy: { date: 'desc' }
    });
    if (!last) return { prices: DEFAULT_PRICES, source: 'default', date: new Date().toISOString().split('T')[0] };
    
    const prices = {
      diesel_b7: last.diesel_b7,
      diesel_b10: last.diesel_b10,
      diesel_b20: last.diesel_b20,
      gasohol_91: last.gasohol_91,
      gasohol_95: last.gasohol_95,
      e20: last.e20,
      e85: last.e85,
      premium_diesel: last.premium_diesel,
      source: last.source
    };
    return { prices, brent: last.brent, source: last.source || 'cached', date: last.date };
  } catch (err) {
    console.error('getCurrentPrices error:', err);
    return { prices: DEFAULT_PRICES, source: 'default', date: new Date().toISOString().split('T')[0] };
  }
}

async function getHistory(fuelType, days = 90) {
  try {
    const records = await prisma.priceHistory.findMany({
      orderBy: { date: 'desc' },
      take: days
    });
    
    return records.reverse().map(r => ({
      date: r.date,
      price: r[fuelType] ?? null,
      brent: r.brent ?? null,
    })).filter(r => r.price !== null);
  } catch (err) {
    console.error('getHistory error:', err);
    return [];
  }
}

async function getAllHistory(days = 90) {
  try {
    const records = await prisma.priceHistory.findMany({
      orderBy: { date: 'desc' },
      take: days
    });
    
    return records.reverse().map(r => ({
      date: r.date,
      prices: {
        diesel_b7: r.diesel_b7,
        diesel_b10: r.diesel_b10,
        diesel_b20: r.diesel_b20,
        gasohol_91: r.gasohol_91,
        gasohol_95: r.gasohol_95,
        e20: r.e20,
        e85: r.e85,
        premium_diesel: r.premium_diesel,
        source: r.source
      },
      brent: r.brent,
      updatedAt: r.updatedAt.toISOString()
    }));
  } catch (err) {
    console.error('getAllHistory error:', err);
    return [];
  }
}

module.exports = { addPriceRecord, getCurrentPrices, getHistory, getAllHistory, DEFAULT_PRICES };
