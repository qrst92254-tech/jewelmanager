import { useState, useEffect, useCallback } from 'react';

const API_URL = '';

// These are today's real prices (May 2026) — used as display default
// while the real API loads
const DEFAULT_PRICES = {
  gold_24k_per_gram: 15605,
  gold_22k_per_gram: 14304,
  gold_18k_per_gram: 11703,
  gold_14k_per_gram: 9129,
  silver_999_per_gram: 275,
  silver_925_per_gram: 254,
  silver_800_per_gram: 220,
  last_updated: null,
  source: 'default',
  is_fallback: true
};

export function useLivePrices() {
  const [prices, setPrices] = useState(DEFAULT_PRICES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/prices/live`, {
        headers: {
          'Content-Type': 'application/json',
          // Send auth token if you have login
          ...(localStorage.getItem('jewel_token') && {
            'Authorization': `Bearer ${localStorage.getItem('jewel_token')}` 
          })
        }
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const result = await response.json();

      // Handle both response formats: {data: {...}} or just {...}
      const priceData = result.data || result;

      // Validate the data has actual numbers before using it
      if (priceData && priceData.gold_24k_per_gram && priceData.gold_24k_per_gram > 1000) {
        setPrices(priceData);
        setLastFetched(new Date());
      }

    } catch (err) {
      console.error('Failed to fetch live prices:', err.message);
      setError(err.message);
      // Keep showing DEFAULT_PRICES — don't show blank/zero
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch immediately on mount
  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  // Auto-refresh every 15 minutes
  useEffect(() => {
    const interval = setInterval(fetchPrices, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return {
    prices,
    loading,
    error,
    lastFetched,
    refetch: fetchPrices,
    isLive: prices?.source === 'live' || prices?.source === 'rapidapi',
    isFallback: prices?.is_fallback === true
  };
}