import { useState, useEffect } from 'react';

const API_URL = '';

export function useMetalRates() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchRates = async () => {
      try {
        setLoading(true);
        setError(null);

        // DISABLED: goodreturns.in is blocked on Render free tier
        // const response = await fetch(`${API_URL}/api/prices/live`);
        // const json = await response.json();

        // if (!response.ok || json.success !== true) {
        //   throw new Error(json.error || 'Failed to load rates');
        // }

        if (active) {
          setData({ gold: null, silver: null });
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Server not reachable');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchRates();

    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error };
}
