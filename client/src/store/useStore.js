import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Zustand store for managing global application state.
 *
 * This store holds state related to live metal prices, API loading status,
 * and potential errors during data fetching.
 *
 * @property {object} prices - Stores the derived prices for different purities.
 * @property {boolean} isLoading - True when an API call is in progress.
 * @property {string|null} error - Stores error messages from API calls.
 * @property {string|null} lastUpdated - ISO timestamp of the last successful price update.
 * @property {function} fetchPrices - Action to fetch and update prices from the backend.
 * @property {function} setLoading - Action to set the loading state.
 * @property {function} setError - Action to set the error state.
 */
const useStore = create(devtools((set, get) => ({
    // Price State
    livePrices: {
        prices: {
            gold_24k_per_gram: 7200,
            gold_22k_per_gram: 6450,
            gold_18k_per_gram: 5300,
            gold_14k_per_gram: 4100,
            silver_999_per_gram: 85,
        },
        loading: false,
        error: null,
        lastUpdated: null,
    },

    // Auth State
    auth: {
        isAuthenticated: !!localStorage.getItem('jewel_token'),
        user: localStorage.getItem('jewel_user') || null,
        token: localStorage.getItem('jewel_token') || null,
        isAdmin: localStorage.getItem('jewel_is_admin') === 'true',
    },

    // Price Actions
    fetchPrices: async () => {
        set(state => ({ livePrices: { ...state.livePrices, loading: true } }));
        try {
            // Use relative paths: in dev, Vite proxy handles /api/* → localhost:3001
            const token = localStorage.getItem('jewel_token');
            const response = await fetch('/api/prices/live', {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (!response.ok) throw new Error('Failed to fetch prices');
            const result = await response.json();
            const payload = result.data || result;
            set({ 
                livePrices: { 
                    prices: payload, 
                    lastUpdated: result.timestamp || payload.last_updated || new Date().toISOString(), 
                    loading: false, 
                    error: null 
                } 
            });
        } catch (error) {
            set(state => ({ livePrices: { ...state.livePrices, loading: false, error: error.message } }));
        }
    },

    // Auth Actions
    login: async (email, password) => {
        // Use relative paths: in dev, Vite proxy handles /api/* → localhost:3001
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || err.error || 'Login failed');
        }
        const data = await response.json();
        if (data.success) {
            localStorage.setItem('jewel_token', data.token);
            localStorage.setItem('jewel_user', data.email);
            localStorage.setItem('jewel_is_admin', data.isAdmin ? 'true' : 'false');
            set({ auth: { isAuthenticated: true, user: data.email, token: data.token, isAdmin: !!data.isAdmin } });
        } else {
            throw new Error(data.message || 'Login failed');
        }
    },

    logout: async () => {
        const token = localStorage.getItem('jewel_token');
        try {
            if (token) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });
            }
        } catch {
            /* ignore */
        }
        localStorage.removeItem('jewel_token');
        localStorage.removeItem('jewel_user');
        localStorage.removeItem('jewel_is_admin');
        set({ auth: { isAuthenticated: false, user: null, token: null, isAdmin: false } });
    },
})));

export default useStore;