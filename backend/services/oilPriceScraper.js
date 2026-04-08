const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = { 
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' 
};

function normalizePrices(prices) {
  if (!prices || typeof prices !== 'object') return prices;

  if (typeof prices.diesel_b7 === 'number' && typeof prices.diesel_b10 !== 'number') {
    prices.diesel_b10 = prices.diesel_b7;
  }
  if (typeof prices.diesel_b7 === 'number' && typeof prices.diesel_b20 !== 'number') {
    prices.diesel_b20 = prices.diesel_b7;
  }
  return prices;
}

// Try Kapook - Very stable source
async function scrapeKapook() {
  const url = 'https://gasprice.kapook.com/gasprice.php';
  try {
    const { data } = await axios.get(url, { timeout: 10000, headers: HEADERS });
    const $ = cheerio.load(data);
    const prices = {};
    
    // Iterate through all ULs to find price sections
    $('ul').each((_, ul) => {
      // Skip navigation ul (usually has many images)
      if ($(ul).find('img').length > 5) return;
      
      $(ul).find('li').each((_, li) => {
        const text = $(li).text().trim();
        const label = $(li).find('span').text().trim() || text.replace(/[\d.]+$/, '').trim();
        const rawPrice = $(li).find('em').text().trim() || text.match(/[\d.]+$/)?.[0] || '';
        const price = parseFloat(rawPrice);
        
        if (!isNaN(price) && price > 10) {
          const isPremium = /พรีเมียม|Premium|ซูเปอร์พาวเวอร์|Super Power|วี-เพาเวอร์|V-Power/i.test(label);
          if (/95/i.test(label) && /แก๊สโซฮอล์|Gasohol/.test(label) && !isPremium) prices.gasohol_95 = price;
          else if (/91/i.test(label) && /แก๊สโซฮอล์|Gasohol/.test(label) && !isPremium) prices.gasohol_91 = price;
          else if (/E20/i.test(label)) prices.e20 = price;
          else if (/E85/i.test(label)) prices.e85 = price;
          else if (/ดีเซล/i.test(label) && !/B20|B10/.test(label) && !isPremium) prices.diesel_b7 = price;
          else if (/ดีเซล.*B10/i.test(label)) prices.diesel_b10 = price;
          else if (/ดีเซล.*B20/i.test(label)) prices.diesel_b20 = price;
          else if (isPremium && /ดีเซล/i.test(label)) prices.premium_diesel = price;
        }
      });
      
      if (Object.keys(prices).length >= 4) return false; // Stop iterating ULs
    });

    if (Object.keys(prices).length >= 4) {
      console.log('✅ Kapook scraped successfully');
      normalizePrices(prices);
      return { ...prices, source: 'Kapook' };
    }
  } catch (err) {
    console.warn(`Kapook scrape failed:`, err.message);
  }
  return null;
}

// Try PTT - multiple URL patterns
async function scrapePTT() {
  const urls = [
    'https://www.pttplc.com/th/Product-Service/For-Consumer/For-Car/Pages/OilPrice.aspx',
    'https://www.pttplc.com/th/Home.aspx',
  ];
  for (const url of urls) {
    try {
      const { data } = await axios.get(url, { timeout: 10000, headers: HEADERS });
      const $ = cheerio.load(data);
      const prices = {};
      $('table tr, .oil-price, [class*="price"]').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length < 2) return;
        const label = $(cells[0]).text().trim();
        const raw = $(cells[cells.length - 1]).text().trim().replace(/[^\d.]/g, '');
        const price = parseFloat(raw);
        if (!isNaN(price) && price > 20 && price < 80) {
          if (/B7|ดีเซล.*B7/i.test(label) && !/B10|B20/.test(label)) prices.diesel_b7 = price;
          else if (/B10/i.test(label)) prices.diesel_b10 = price;
          else if (/B20/i.test(label)) prices.diesel_b20 = price;
          else if (/พรีเมียม|Premium/i.test(label) && /ดีเซล/i.test(label)) prices.premium_diesel = price;
          else if (/91|E10/i.test(label) && !/95/.test(label)) prices.gasohol_91 = price;
          else if (/95/i.test(label)) prices.gasohol_95 = price;
          else if (/E20/i.test(label)) prices.e20 = price;
          else if (/E85/i.test(label)) prices.e85 = price;
        }
      });
      if (Object.keys(prices).length >= 4) {
        console.log('✅ PTT scraped successfully');
        normalizePrices(prices);
        return { ...prices, source: 'PTT' };
      }
    } catch (err) {
      console.warn(`PTT scrape failed (${url.split('/').pop()}):`, err.message);
    }
  }
  return null;
}

// Try Bangchak
async function scrapeBangchak() {
  const urls = [
    'https://www.bangchak.co.th/th/product-service/oil-price',
    'https://www.bangchak.co.th/oil-price',
  ];
  for (const url of urls) {
    try {
      const { data } = await axios.get(url, { timeout: 10000, headers: HEADERS });
      const $ = cheerio.load(data);
      const prices = {};
      $('table tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length < 2) return;
        const label = $(cells[0]).text().trim().toLowerCase();
        const raw = $(cells[cells.length - 1]).text().trim().replace(/[^\d.]/g, '');
        const price = parseFloat(raw);
        if (!isNaN(price) && price > 20 && price < 80) {
          if (/b7/.test(label) && !/b10|b20/.test(label)) prices.diesel_b7 = price;
          else if (/b10/.test(label)) prices.diesel_b10 = price;
          else if (/b20/.test(label)) prices.diesel_b20 = price;
          else if (/91|e10/.test(label) && !/95/.test(label)) prices.gasohol_91 = price;
          else if (/95/.test(label)) prices.gasohol_95 = price;
          else if (/e20/.test(label)) prices.e20 = price;
          else if (/e85/.test(label)) prices.e85 = price;
        }
      });
      if (Object.keys(prices).length >= 4) {
        console.log('✅ Bangchak scraped successfully');
        normalizePrices(prices);
        return { ...prices, source: 'Bangchak' };
      }
    } catch (err) {
      console.warn(`Bangchak scrape failed:`, err.message);
    }
  }
  return null;
}

/**
 * Estimate Thai retail prices from Brent crude movement.
 * Correlation: ~45% of Brent % change flows to retail over time.
 * PTT adjusts prices weekly in steps of ~0.10-0.50 THB.
 */
function estimatePricesFromBrent(lastPrices, currentBrent, previousBrent) {
  if (!previousBrent || !currentBrent || previousBrent === currentBrent) return null;

  const brentChangePct = (currentBrent - previousBrent) / previousBrent;
  const retailFactor = 0.45;
  const rawChange = brentChangePct * retailFactor;

  if (Math.abs(brentChangePct) < 0.01) return null;

  const FUEL_KEYS = ['diesel_b7', 'diesel_b10', 'diesel_b20', 'gasohol_91', 'gasohol_95', 'e20', 'e85', 'premium_diesel'];
  const newPrices = { ...lastPrices, source: 'Brent-estimate' };

  for (const fuel of FUEL_KEYS) {
    if (typeof lastPrices[fuel] === 'number') {
      const delta = lastPrices[fuel] * rawChange;
      const rounded = Math.round((lastPrices[fuel] + delta) * 10) / 10;
      newPrices[fuel] = rounded;
    }
  }

  const direction = rawChange > 0 ? '▲' : '▼';
  console.log(`📊 Brent-estimated prices: Brent ${direction}${(brentChangePct * 100).toFixed(2)}% → retail ${direction}${(rawChange * 100).toFixed(1)}%`);
  return newPrices;
}

async function scrapePrices() {
  const kapook = await scrapeKapook();
  if (kapook) return kapook;
  
  const ptt = await scrapePTT();
  if (ptt) return ptt;
  
  const bc = await scrapeBangchak();
  if (bc) return bc;
  
  return null;
}

module.exports = { scrapePrices, estimatePricesFromBrent };
