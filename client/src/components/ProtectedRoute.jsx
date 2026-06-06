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
            .then((data) => {
                const user = data.user;
                if (!user) return;
                localStorage.setItem('jewel_user', user.email);
                localStorage.setItem('jewel_is_admin', user.role === 'admin' ? 'true' : 'false');
                setAuth((state) => ({
                    auth: { ...state.auth, user: user.email, isAdmin: user.role === 'admin' },
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