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
        isAuthenticated: false,
        user: null,
        token: null,
        isAdmin: false,
        loading: true,
    },

    // Price Actions
    fetchPrices: async () => {
        // DISABLED: goodreturns.in is blocked on Render free tier
        return null;
    },

    // Auth Actions
    checkAuth: async () => {
        try {
            const res = await fetch('/api/auth/me', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                const user = data.user;
                if (user) {
                    localStorage.setItem('jewel_user', user.email);
                    localStorage.setItem('jewel_is_admin', user.role === 'admin' ? 'true' : 'false');
                    set({ auth: { isAuthenticated: true, user: user.email, token: null, isAdmin: user.role === 'admin', loading: false } });
                    return;
                }
            }
        } catch { /* ignore */ }
        set({ auth: { isAuthenticated: false, user: null, token: null, isAdmin: false, loading: false } });
    },

    login: async (email, password) => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.error || data.message || 'Login failed');
        }
        const user = data.user;
        localStorage.setItem('jewel_user', user.email);
        localStorage.setItem('jewel_is_admin', user.role === 'admin' ? 'true' : 'false');
        set({ auth: { isAuthenticated: true, user: user.email, token: null, isAdmin: user.role === 'admin', loading: false } });
    },

    logout: async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include' });
        } catch {
            /* ignore */
        }
        localStorage.removeItem('jewel_user');
        localStorage.removeItem('jewel_is_admin');
        set({ auth: { isAuthenticated: false, user: null, token: null, isAdmin: false, loading: false } });
    },
})));

export default useStore;