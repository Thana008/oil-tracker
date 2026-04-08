const { scrapePrices } = require('./backend/services/oilPriceScraper');

async function test() {
  console.log('Testing scraper...');
  const prices = await scrapePrices();
  console.log('Result:', JSON.stringify(prices, null, 2));
}

test();
