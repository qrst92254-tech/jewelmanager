import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useStore from '../store/useStore';

const ProtectedRoute = () => {
    const isAuthenticated = useStore(state => state.auth.isAuthenticated);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;