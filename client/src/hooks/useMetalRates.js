import { useState, useEffect, useCallback } from 'react';

export function useMetalRates() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchRates() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/prices/live');
        const json = await res.json();
        if (cancelled) return;
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.message || 'Failed to load rates');
        }
      } catch (err) {
        if (!cancelled) setError('Could not connect to server');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRates();
    return () => { cancelled = true; };
  }, []); // Empty array — fetch only once on mount, no infinite loop

  const updateRates = useCallback(async (newRates) => {
    try {
      setSaving(true);
      const res = await fetch('/api/prices/live', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRates),
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        return { success: true };
      } else {
        return { success: false, message: json.message };
      }
    } catch (err) {
      return { success: false, message: 'Could not connect to server' };
    } finally {
      setSaving(false);
    }
  }, []); // Empty array — updateRates never changes

  return { data, loading, error, saving, updateRates };
}
