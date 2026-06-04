import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useStore from '../store/useStore';
import { authFetch } from '../utils/authFetch';

const ProtectedRoute = () => {
    const isAuthenticated = useStore(state => state.auth.isAuthenticated);
    const setAuth = useStore.setState;

    useEffect(() => {
        if (!isAuthenticated) return;
        authFetch('/api/auth/me')
            .then((me) => {
                localStorage.setItem('jewel_is_admin', me.isAdmin ? 'true' : 'false');
                setAuth((state) => ({
                    auth: { ...state.auth, user: me.email, isAdmin: !!me.isAdmin },
                }));
            })
            .catch(() => { /* ignore — login redirect handled by authFetch */ });
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;