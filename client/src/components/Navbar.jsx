import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { 
    LayoutDashboard, 
    TrendingUp, 
    Package, 
    Calculator, 
    ShoppingBag, 
    Hammer, 
    Coins, 
    Calendar, 
    Users, 
    Wrench, 
    FileText, 
    Truck, 
    BarChart3, 
    BookOpen, 
    Settings, 
    LogOut,
    Menu,
    X
} from 'lucide-react';

const Navbar = () => {
    const { isAuthenticated, user, isAdmin, logout } = useStore(state => state.auth);
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!isAuthenticated) return null;

    return (
        <>
            {/* Mobile Toggle Bar */}
            <div 
                style={{ 
                    display: 'none', 
                    background: 'white', 
                    height: '56px', 
                    borderBottom: '1px solid var(--border)',
                    alignItems: 'center',
                    padding: '0 1rem',
                    justifyContent: 'space-between',
                    position: 'sticky',
                    top: 0,
                    zIndex: 40,
                    boxShadow: 'var(--shadow-sm)',
                    width: '100%'
                }}
                className="mobile-header"
            >
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                    <span style={{ fontSize: '18px' }}>💎</span>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', color: 'var(--gold)', fontWeight: 600 }}>
                        JewelManager
                    </span>
                </Link>
                <button 
                    onClick={() => setMobileOpen(!mobileOpen)} 
                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                    {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar Navigation */}
            <aside 
                style={{ 
                    width: '260px', 
                    background: 'white', 
                    borderRight: '1.5px solid var(--border)', 
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    zIndex: 45,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'transform 0.3s ease-in-out'
                }}
                className={`sidebar-nav ${mobileOpen ? 'open' : ''}`}
            >
                {/* Logo & Header */}
                <div>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '22px' }}>💎</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ 
                                fontFamily: "'Cormorant Garamond', serif", 
                                fontSize: '22px', 
                                color: 'var(--gold)', 
                                fontWeight: 700,
                                letterSpacing: '0.5px',
                                lineHeight: '1.1'
                            }}>
                                JewelManager
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>
                                Pro Enterprise
                            </span>
                        </div>
                    </div>

                    {/* Navigation Items (Scrollable) */}
                    <div style={{ padding: '1rem 0', maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }} className="nav-container">
                        <NavSectionTitle>Overview</NavSectionTitle>
                        <NavItem to="/dashboard" icon={<LayoutDashboard size={18} />}>Dashboard</NavItem>
                        <NavItem to="/prices" icon={<TrendingUp size={18} />}>Live Prices</NavItem>
                        <NavItem to="/calculator" icon={<Calculator size={18} />}>Price Calculator</NavItem>

                        <NavSectionTitle>Commerce</NavSectionTitle>
                        <NavItem to="/sales" icon={<ShoppingBag size={18} />}>Billing & Sales</NavItem>
                        <NavItem to="/customers" icon={<Users size={18} />}>Customer CRM</NavItem>
                        <NavItem to="/quotations" icon={<FileText size={18} />}>Quotations</NavItem>
                        <NavItem to="/purchases" icon={<Truck size={18} />}>Purchases & Suppliers</NavItem>

                        <NavSectionTitle>Operations</NavSectionTitle>
                        <NavItem to="/stock" icon={<Package size={18} />}>Stock Manager</NavItem>
                        <NavItem to="/karigar" icon={<Hammer size={18} />}>Karigar (Workers)</NavItem>
                        <NavItem to="/repairs" icon={<Wrench size={18} />}>Repair Orders</NavItem>
                        <NavItem to="/girvi" icon={<Coins size={18} />}>Girvi (Gold Loans)</NavItem>
                        <NavItem to="/schemes" icon={<Calendar size={18} />}>Gold Schemes</NavItem>

                        <NavSectionTitle>Finance</NavSectionTitle>
                        <NavItem to="/accounting" icon={<BookOpen size={18} />}>Cash Book & Ledger</NavItem>
                        <NavItem to="/reports" icon={<BarChart3 size={18} />}>GST & Reports</NavItem>

                        <NavSectionTitle>System</NavSectionTitle>
                        <NavItem to="/settings" icon={<Settings size={18} />}>Settings</NavItem>
                        {isAdmin && (
                            <NavItem to="/admin/users" icon={<Users size={18} />}>User Management</NavItem>
                        )}
                    </div>
                </div>

                {/* Footer User Profile & Logout */}
                <div style={{ borderTop: '1px solid var(--border)', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user || 'Admin'}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Store Manager</span>
                    </div>
                    <button 
                        onClick={handleLogout} 
                        style={{
                            background: 'none',
                            border: '1px solid var(--border)',
                            color: 'var(--text-secondary)',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        className="logout-btn"
                        title="Logout"
                    >
                        <LogOut size={15} />
                    </button>
                </div>
            </aside>

            {/* Mobile Backdrop overlay */}
            {mobileOpen && (
                <div 
                    onClick={() => setMobileOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.3)',
                        zIndex: 43
                    }}
                    className="mobile-backdrop"
                />
            )}

            {/* Injected styling */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media (max-width: 768px) {
                    .mobile-header { display: flex !important; }
                    .sidebar-nav {
                        transform: translateX(-100%);
                    }
                    .sidebar-nav.open {
                        transform: translateX(0);
                    }
                }
                .logout-btn:hover {
                    color: #FF5252 !important;
                    border-color: #FF5252 !important;
                    background: #FFF4F4;
                }
                .nav-container::-webkit-scrollbar {
                    width: 4px;
                }
                .nav-container::-webkit-scrollbar-thumb {
                    background: var(--border);
                    border-radius: 4px;
                }
            `}} />
        </>
    );
};

const NavSectionTitle = ({ children }) => (
    <div style={{ 
        fontSize: '0.72rem', 
        color: 'var(--text-muted)', 
        textTransform: 'uppercase', 
        letterSpacing: '1px', 
        fontWeight: 700, 
        padding: '0.75rem 1.5rem 0.25rem 1.5rem' 
    }}>
        {children}
    </div>
);

const NavItem = ({ to, icon, children }) => {
    return (
        <NavLink 
            to={to} 
            style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 24px',
                textDecoration: 'none',
                color: isActive ? 'var(--gold-dark)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                borderLeft: isActive ? '4px solid var(--gold)' : '4px solid transparent',
                backgroundColor: isActive ? 'rgba(184, 150, 12, 0.08)' : 'transparent',
                transition: 'all 0.2s ease',
                fontFamily: "'DM Sans', sans-serif"
            })}
            className="sidebar-link"
        >
            {icon}
            <span>{children}</span>
        </NavLink>
    );
};

export default Navbar;