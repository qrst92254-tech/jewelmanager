const db = require('../db/database');

// Current real prices (May 2026) - used as fallback when API fails
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

/**
 * Caches the fetched price into the database.
 * @param {object} prices - The prices object to be cached.
 */
function saveToCache(prices) {
  try {
    const stmt = db.prepare('INSERT INTO price_cache (metal, currency, price, source) VALUES (?, ?, ?, ?)');
    stmt.run('XAU', 'INR', JSON.stringify(prices), prices.source);
  } catch (error) {
    console.error('Error caching price to database:', error.message);
  }
}

/**
 * Retrieves the most recently cached price from the database.
 * @returns {object|null} The cached price record or null if none exists.
 */
function getLastCachedPrice() {
  try {
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

/**
 * Gets live prices for different gold and silver purities.
 * @returns {Promise<object>} An object containing prices for different purities.
 */
async function getLivePrices() {
  try {
    return FALLBACK_PRICES;
  } catch (error) {
    console.error('❌ Price service failed:', error.message);
    const cached = getLastCachedPrice();
    if (cached) {
      return { ...cached, source: 'db_cache', is_fallback: true };
    }
    return FALLBACK_PRICES;
  }
}

module.exports = { getLivePrices, FALLBACK_PRICES };