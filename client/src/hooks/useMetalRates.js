import { useState, useEffect, useCallback } from 'react';

export function useMetalRates() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchRates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/prices/live');
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        setError(json.message || 'Failed to load rates');
      }
    } catch (err) {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

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
  }, []);

  return { data, loading, error, saving, updateRates, refetch: fetchRates };
}
