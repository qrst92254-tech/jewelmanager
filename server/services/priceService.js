const { getDatabase } = require('../db/database');
const cheerio = require('cheerio');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const FALLBACK_PRICES = {
  gold_24k_per_gram: 15605,
  gold_22k_per_gram: 14304,
  gold_18k_per_gram: 11703,
  gold_14k_per_gram: 9129,
  silver_999_per_gram: 275,
  silver_925_per_gram: 254,
  silver_800_per_gram: 220,
  last_updated: new Date().toISOString(),
  source: 'fallback',
  is_fallback: true
};

const TROY_OUNCE_TO_GRAM = 31.1034768;
const CITIES = [
  'Chennai',
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Kolkata',
  'Ahmedabad',
  'Pune'
];

function parseNumber(value) {
  if (value == null) return null;
  const text = String(value).replace(/[₹,\s]/g, '').trim();
  const parsed = Number(text);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalize(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function matchCity(value) {
  const normalized = normalize(value);
  return CITIES.find((city) => normalized.includes(normalize(city)) || normalize(city).includes(normalize(value)));
}

function buildEmptyRates() {
  const gold = {};
  const silver = {};
  CITIES.forEach((city) => {
    gold[city] = { '22K': null, '24K': null };
    silver[city] = { perGram: null };
  });
  return { gold, silver };
}

function gramsFromTroyOunce(pricePerOunce) {
  return pricePerOunce / TROY_OUNCE_TO_GRAM;
}

function saveToCache(prices) {
  try {
    const db = getDatabase();
    const stmt = db.prepare('INSERT INTO price_cache (metal, currency, price, source) VALUES (?, ?, ?, ?)');
    stmt.run('XAU', 'INR', JSON.stringify(prices), prices.source);
  } catch (error) {
    console.error('Error caching price to database:', error.message);
  }
}

function getLastCachedPrice() {
  try {
    const db = getDatabase();
    const stmt = db.prepare('SELECT price, fetched_at FROM price_cache WHERE metal = ? ORDER BY fetched_at DESC LIMIT 1');
    const record = stmt.get('XAU');
    if (record && record.price) {
      try {
        return JSON.parse(record.price);
      } catch (e) {
        console.error('Failed to parse cached price:', e.message);
        return null;
      }
    }
    return null;
  } catch (error) {
    console.error('Error retrieving latest cached price:', error.message);
    return null;
  }
}

function scrapeGoldRates($) {
  const goldRates = buildEmptyRates().gold;

  $('table').each((_, table) => {
    $(table)
      .find('tr')
      .each((_, row) => {
        const cells = $(row).find('td, th').toArray();
        if (cells.length < 3) return;

        const cityName = matchCity($(cells[0]).text());
        if (!cityName) return;

        const values = [];
        for (let idx = 1; idx < cells.length && values.length < 2; idx += 1) {
          const num = parseNumber($(cells[idx]).text());
          if (num != null) values.push(num);
        }

        if (values.length > 0) {
          goldRates[cityName]['22K'] = values[0];
        }
        if (values.length > 1) {
          goldRates[cityName]['24K'] = values[1];
        }
      });
  });

  return goldRates;
}

function scrapeSilverRates($) {
  const silverRates = buildEmptyRates().silver;

  $('table').each((_, table) => {
    $(table)
      .find('tr')
      .each((_, row) => {
        const cells = $(row).find('td, th').toArray();
        if (cells.length < 2) return;

        const cityName = matchCity($(cells[0]).text());
        if (!cityName) return;

        for (let idx = 1; idx < cells.length; idx += 1) {
          const num = parseNumber($(cells[idx]).text());
          if (num != null) {
            silverRates[cityName].perGram = num;
            break;
          }
        }
      });
  });

  return silverRates;
}

function pickBestGoldRate(goldRates) {
  const preferredCity = 'Chennai';
  if (goldRates[preferredCity]?.['22K'] && goldRates[preferredCity]?.['24K']) {
    return {
      gold_22k_per_gram: goldRates[preferredCity]['22K'],
      gold_24k_per_gram: goldRates[preferredCity]['24K']
    };
  }

  for (const city of CITIES) {
    if (goldRates[city]?.['22K'] && goldRates[city]?.['24K']) {
      return {
        gold_22k_per_gram: goldRates[city]['22K'],
        gold_24k_per_gram: goldRates[city]['24K']
      };
    }
  }

  return {
    gold_22k_per_gram: null,
    gold_24k_per_gram: null
  };
}

function pickBestSilverRate(silverRates) {
  const preferredCity = 'Chennai';
  if (silverRates[preferredCity]?.perGram) {
    return silverRates[preferredCity].perGram;
  }

  for (const city of CITIES) {
    if (silverRates[city]?.perGram) {
      return silverRates[city].perGram;
    }
  }

  return null;
}

function deriveAdditionalRates(prices) {
  const { gold_24k_per_gram, silver_999_per_gram } = prices;
  const gold_18k_per_gram = gold_24k_per_gram ? Number((gold_24k_per_gram * 18 / 24).toFixed(2)) : null;
  const gold_14k_per_gram = gold_24k_per_gram ? Number((gold_24k_per_gram * 14 / 24).toFixed(2)) : null;
  const silver_925_per_gram = silver_999_per_gram ? Number((silver_999_per_gram * 0.925).toFixed(2)) : null;
  const silver_800_per_gram = silver_999_per_gram ? Number((silver_999_per_gram * 0.8).toFixed(2)) : null;
  return { gold_18k_per_gram, gold_14k_per_gram, silver_925_per_gram, silver_800_per_gram };
}

function applyDerivedRates(prices) {
  return {
    ...prices,
    ...deriveAdditionalRates(prices)
  };
}

async function scrapeRates() {
  const goldResponse = await fetch('https://www.goodreturns.in/gold-rates/');
  if (!goldResponse.ok) {
    throw new Error(`Gold rates page failed with status ${goldResponse.status}`);
  }
  const goldHtml = await goldResponse.text();
  const $gold = cheerio.load(goldHtml);
  const goldRates = scrapeGoldRates($gold);

  const silverResponse = await fetch('https://www.goodreturns.in/silver-rates/');
  if (!silverResponse.ok) {
    throw new Error(`Silver rates page failed with status ${silverResponse.status}`);
  }
  const silverHtml = await silverResponse.text();
  const $silver = cheerio.load(silverHtml);
  const silverRates = scrapeSilverRates($silver);

  const { gold_22k_per_gram, gold_24k_per_gram } = pickBestGoldRate(goldRates);
  const silver_999_per_gram = pickBestSilverRate(silverRates);

  if (!gold_22k_per_gram || !gold_24k_per_gram || !silver_999_per_gram) {
    throw new Error('Failed to parse live gold or silver rates from trusted source');
  }

  return applyDerivedRates({
    gold_24k_per_gram: Number(gold_24k_per_gram),
    gold_22k_per_gram: Number(gold_22k_per_gram),
    silver_999_per_gram: Number(silver_999_per_gram),
    last_updated: new Date().toISOString(),
    source: 'goodreturns',
    is_fallback: false
  });
}

async function getLivePrices() {
  try {
    const prices = await scrapeRates();
    saveToCache(prices);
    return prices;
  } catch (error) {
    console.error('❌ Price service failed:', error.message);
    const cached = getLastCachedPrice();
    if (cached) {
      return applyDerivedRates({ ...cached, source: 'db_cache', is_fallback: true });
    }
    return applyDerivedRates(FALLBACK_PRICES);
  }
}

module.exports = { getLivePrices, FALLBACK_PRICES };