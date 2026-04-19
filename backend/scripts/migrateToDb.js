const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const DATA_FILE = path.join(__dirname, '../data/priceHistory.json');

async function migrate() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      console.log('No priceHistory.json found. Skipping migration.');
      return;
    }

    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    if (!data.history || data.history.length === 0) {
      console.log('JSON file is empty.');
      return;
    }

    console.log(`Found ${data.history.length} records in JSON. Migrating to PostgreSQL...`);

    let count = 0;
    for (const record of data.history) {
      const { date, prices, brent } = record;
      
      await prisma.priceHistory.upsert({
        where: { date },
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
          date: date,
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
      count++;
    }

    console.log(`✅ Successfully migrated ${count} records to PostgreSQL!`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
