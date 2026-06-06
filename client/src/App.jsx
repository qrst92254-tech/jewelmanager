import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import useStore from './store/useStore';

// Import global styles
import './index.css';

// Import components and pages
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import PriceTicker from './pages/PriceTicker';
import StockManager from './pages/StockManager';
import Calculator from './pages/Calculator';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Karigar from './pages/Karigar';
import Girvi from './pages/Girvi';
import Schemes from './pages/Schemes';
import Repairs from './pages/Repairs';
import Quotations from './pages/Quotations';
import Purchases from './pages/Purchases';
import Reports from './pages/Reports';
import Accounting from './pages/Accounting';
import Settings from './pages/Settings';
import AdminUsers from './pages/AdminUsers';
import Login from './pages/Login';

function App() {
    const isAuthenticated = useStore(state => state.auth.isAuthenticated);
    const authLoading = useStore(state => state.auth.loading);
    const checkAuth = useStore(state => state.checkAuth);

    useEffect(() => {
        checkAuth();
    }, []);

    if (authLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>⟳</div>
                    <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <Router>
            <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }} className="app-layout">
                <Navbar />
                <div 
                    style={{ 
                        flexGrow: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        marginLeft: isAuthenticated ? '260px' : '0px', 
                        transition: 'margin-left 0.3s ease',
                        overflowX: 'hidden'
                    }} 
                    className="content-container"
                >
                    <main style={{ flexGrow: 1 }}>
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
                            
                            {/* Redirect root based on auth */}
                            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />

                            {/* Protected Routes */}
                            <Route element={<ProtectedRoute />}>
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/prices" element={<PriceTicker />} />
                                <Route path="/stock" element={<StockManager />} />
                                <Route path="/calculator" element={<Calculator />} />
                                <Route path="/sales" element={<Sales />} />
                                <Route path="/customers" element={<Customers />} />
                                <Route path="/karigar" element={<Karigar />} />
                                <Route path="/girvi" element={<Girvi />} />
                                <Route path="/schemes" element={<Schemes />} />
                                <Route path="/repairs" element={<Repairs />} />
                                <Route path="/quotations" element={<Quotations />} />
                                <Route path="/purchases" element={<Purchases />} />
                                <Route path="/reports" element={<Reports />} />
                                <Route path="/accounting" element={<Accounting />} />
                                <Route path="/settings" element={<Settings />} />
                                <Route path="/admin/users" element={<AdminUsers />} />
                            </Route>

                            {/* Fallback route */}
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </main>
                    {isAuthenticated && (
                        <footer style={{ textAlign: 'center', padding: '1rem 2rem', background: 'white', borderTop: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            © {new Date().getFullYear()} JewelManager Pro — All Rights Reserved.
                        </footer>
                    )}
                </div>
            </div>

            {/* Responsiveness style overrides */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media (max-width: 768px) {
                    .app-layout {
                        flex-direction: column !important;
                    }
                    .content-container {
                        margin-left: 0px !important;
                    }
                }
            ` }} />
        </Router>
    );
}

const NotFound = () => (
    <div style={{ textAlign: 'center', marginTop: '5rem', padding: '2rem' }}>
        <h1 style={{ fontSize: '48px', color: 'var(--gold)', marginBottom: '1rem' }}>404</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2rem' }}>The page you are looking for does not exist.</p>
        <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>Go Home</Link>
    </div>
);

export default App;