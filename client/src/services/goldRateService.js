import { RAPIDAPI_KEY, RAPIDAPI_HOST, RAPIDAPI_BASE_URL } from "../config/apiConfig";

const CACHE_KEY_BASE = "jewelmanager_gold_rates";
const CACHE_DATE_KEY_BASE = "jewelmanager_gold_rates_date";

function parseRate(data, keys) {
  if (!data) return null;
  for (const key of keys) {
    const value = data[key];
    if (value != null && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

export async function fetchGoldRates(city = "chennai") {
  const normalizedCity = (city || "chennai").toLowerCase().replace(/\s+/g, '_');
  const cacheKey = `${CACHE_KEY_BASE}_${normalizedCity}`;
  const cacheDateKey = `${CACHE_DATE_KEY_BASE}_${normalizedCity}`;
  const today = new Date().toISOString().split("T")[0];
  const cachedDate = localStorage.getItem(cacheDateKey);
  const cachedData = localStorage.getItem(cacheKey);

  if (cachedDate === today && cachedData) {
    return JSON.parse(cachedData);
  }

  if (!RAPIDAPI_KEY || RAPIDAPI_KEY === "PASTE_YOUR_RAPIDAPI_KEY_HERE") {
    const message = "RapidAPI key is missing or invalid. Set VITE_RAPIDAPI_KEY in client/.env and restart the app.";
    console.error("Gold rate fetch error:", message);
    if (cachedData) return JSON.parse(cachedData);
    throw new Error(message);
  }

  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_HOST,
    },
  };

  try {
    const response = await fetch(`${RAPIDAPI_BASE_URL}/price?city=${encodeURIComponent(city)}`, options);
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (parseError) {
      console.error("Gold rate parse error:", parseError.message);
    }
    if (!response.ok) {
      const message = data?.message || `RapidAPI request failed with status ${response.status}`;
      throw new Error(message);
    }

    const parsed = {
      city: data?.city || city,
      gold_22k_per_10g: parseRate(data, [
        "gold_22k_per_10g",
        "gold_22k",
        "gold22k",
        "gold22",
        "gold_22k_price",
        "gold_22k_price_10g",
        "gold_22k_rate",
      ]),
      gold_24k_per_10g: parseRate(data, [
        "gold_24k_per_10g",
        "gold_24k",
        "gold24k",
        "gold24",
        "gold_24k_price",
        "gold_24k_price_10g",
        "gold_24k_rate",
      ]),
      silver_per_kg: parseRate(data, [
        "silver_per_kg",
        "silver_999_per_kg",
        "silver_999",
        "silver",
        "silver_price",
        "silver_price_kg",
      ]),
      last_updated: data?.last_updated || data?.updated_at || new Date().toISOString(),
      raw: data,
    };

    localStorage.setItem(cacheKey, JSON.stringify(parsed));
    localStorage.setItem(cacheDateKey, today);

    return parsed;
  } catch (error) {
    console.error("Gold rate fetch error:", error.message || error);
    if (cachedData) return JSON.parse(cachedData);
    throw error;
  }
}

export function getCachedRates(city = "chennai") {
  const normalizedCity = (city || "chennai").toLowerCase().replace(/\s+/g, '_');
  const cacheKey = `${CACHE_KEY_BASE}_${normalizedCity}`;
  const data = localStorage.getItem(cacheKey);
  return data ? JSON.parse(data) : null;
}

export function clearRateCache(city) {
  if (city) {
    const normalizedCity = city.toLowerCase().replace(/\s+/g, '_');
    localStorage.removeItem(`${CACHE_KEY_BASE}_${normalizedCity}`);
    localStorage.removeItem(`${CACHE_DATE_KEY_BASE}_${normalizedCity}`);
  } else {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(CACHE_KEY_BASE) || key.startsWith(CACHE_DATE_KEY_BASE)) {
        localStorage.removeItem(key);
      }
    });
  }
}
