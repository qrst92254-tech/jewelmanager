import React, { useState, useEffect } from 'react';
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
import GSTReport from './pages/GSTReport';
import Accounting from './pages/Accounting';
import Settings from './pages/Settings';
import AdminUsers from './pages/AdminUsers';
import Login from './pages/Login';

function App() {
    const isAuthenticated = useStore(state => state.auth.isAuthenticated);
    const authLoading = useStore(state => state.auth.loading);
    const checkAuth = useStore(state => state.checkAuth);
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockReason, setBlockReason] = useState('');

    useEffect(() => {
        checkAuth().then(() => {
            const state = useStore.getState();
            if (state.auth.isAuthenticated) {
                state.preloadData();
            }
        });
    }, []);

    // PWA offline detection
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    useEffect(() => {
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }, []);

    useEffect(() => {
      const handleBlocked = (e) => {
        setIsBlocked(true);
        setBlockReason(e.detail?.message || '');
      };
      window.addEventListener('jewel:blocked', handleBlocked);
      return () => window.removeEventListener('jewel:blocked', handleBlocked);
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

    if (isBlocked) {
      return (
        <div style={{ 
          display: 'flex', justifyContent: 'center', alignItems: 'center', 
          height: '100vh', background: 'var(--bg)', flexDirection: 'column',
          gap: '1rem', padding: '2rem', textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem' }}>⏰</div>
          <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Trial Expired</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.6 }}>
            {blockReason || 'Your 14-day free trial has ended. Contact the administrator to continue using JewelManager Pro.'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
            <a 
              href="https://wa.me/919395359101"
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '0.75rem 1.5rem',
                background: '#25D366',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '1rem'
              }}
            >
              💬 WhatsApp
            </a>
            <a 
              href="https://instagram.com/direct/new/"
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '1rem'
              }}
            >
              📸 Instagram DM
            </a>
          </div>
        </div>
      );
    }

    return (
        <Router>
            {/* PWA Offline Banner */}
            {isOffline && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
                backgroundColor: '#f59e0b',
                color: '#ffffff',
                textAlign: 'center',
                padding: '8px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                You are offline. Some features may not work.
              </div>
            )}
            <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }} className="app-layout">
                <Navbar />
                    <div 
                    style={{ 
                        flexGrow: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        marginLeft: isAuthenticated ? '260px' : '0px', 
                        transition: 'margin-left 0.3s ease',
                        overflowX: 'hidden',
                        overflowY: 'auto',
                        minHeight: '100vh'
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
                                <Route path="/gst-report" element={<GSTReport />} />
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
                        overflow-y: visible !important;
                        min-height: auto !important;
                    }
                    .main-content {
                        padding: 1rem !important;
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