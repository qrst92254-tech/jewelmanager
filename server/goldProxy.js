const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
const CACHE_FILE = path.join(__dirname, 'ratesCache.json');

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

const parseNumber = (value) => {
  if (value == null) return null;
  const text = String(value).replace(/[₹,\s]/g, '').trim();
  const parsed = parseInt(text, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const matchCity = (value) => {
  const normalized = normalize(value);
  return CITIES.find((city) => normalized.includes(normalize(city)) || normalize(city).includes(normalized));
};

const readCache = () => {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;
    const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
};

const writeCache = (data) => {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

const getTodayDate = () => {
  const now = new Date();
  return now.toISOString().slice(0, 10);
};

const buildEmptyRates = () => {
  const gold = {};
  const silver = {};
  CITIES.forEach((city) => {
    gold[city] = { '22K': null, '24K': null };
    silver[city] = { perGram: null };
  });
  return { gold, silver };
};

const scrapeGoldRates = ($) => {
  const goldRates = {};
  CITIES.forEach((city) => {
    goldRates[city] = { '22K': null, '24K': null };
  });

  const tables = $('table').toArray();
  tables.forEach((table) => {
    $(table)
      .find('tr')
      .toArray()
      .forEach((row) => {
        const cells = $(row).find('td, th').toArray();
        if (cells.length < 3) return;

        const cityLabel = $(cells[0]).text();
        const cityName = matchCity(cityLabel);
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
};

const scrapeSilverRates = ($) => {
  const silverRates = {};
  CITIES.forEach((city) => {
    silverRates[city] = { perGram: null };
  });

  const tables = $('table').toArray();
  tables.forEach((table) => {
    $(table)
      .find('tr')
      .toArray()
      .forEach((row) => {
        const cells = $(row).find('td, th').toArray();
        if (cells.length < 2) return;

        const cityLabel = $(cells[0]).text();
        const cityName = matchCity(cityLabel);
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
};

const scrapeRates = async () => {
  const defaultData = {
    date: getTodayDate(),
    ...buildEmptyRates()
  };

  const goldResponse = await fetch('https://www.goodreturns.in/gold-rates/');
  if (!goldResponse.ok) {
    throw new Error(`Gold page fetch failed with status ${goldResponse.status}`);
  }
  const goldHtml = await goldResponse.text();
  const $gold = cheerio.load(goldHtml);
  const gold = scrapeGoldRates($gold);

  const silverResponse = await fetch('https://www.goodreturns.in/silver-rates/');
  if (!silverResponse.ok) {
    throw new Error(`Silver page fetch failed with status ${silverResponse.status}`);
  }
  const silverHtml = await silverResponse.text();
  const $silver = cheerio.load(silverHtml);
  const silver = scrapeSilverRates($silver);

  return {
    date: getTodayDate(),
    gold,
    silver
  };
};

app.get('/api/rates', async (req, res) => {
  try {
    const today = getTodayDate();
    const cache = readCache();

    if (cache && cache.date === today) {
      console.log('Serving from cache for date:', today);
      return res.json({ success: true, fromCache: true, data: cache });
    }

    console.log('Cache miss — fetching fresh data from goodreturns.in');
    const freshData = await scrapeRates();
    writeCache(freshData);
    return res.json({ success: true, fromCache: false, data: freshData });
  } catch (error) {
    console.error('Error fetching rates:', error.message);
    const cache = readCache();
    if (cache) {
      return res.json({ success: true, fromCache: true, stale: true, data: cache });
    }
    return res.status(500).json({ success: false, error: 'Failed to fetch rates' });
  }
});

app.listen(3001, () => {
  console.log('Gold proxy server running on http://localhost:3001');
});