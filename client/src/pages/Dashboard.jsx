import React, { useEffect, useState } from 'react';
import { TrendingUp, AlertCircle, ShoppingBag, Package, Plus, Users, Hammer, Coins, Wrench, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useMetalRates } from '../hooks/useMetalRates';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { data: rateData, loading: ratesLoading, error: ratesError } = useMetalRates();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            const token = localStorage.getItem('jewel_token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const response = await fetch('/api/auth/dashboard-stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.status === 401 || response.status === 403) {
                    const body = await response.json().catch(() => ({}));
                    localStorage.removeItem('jewel_token');
                    localStorage.removeItem('jewel_user');
                    if (body.code === 'SESSION_INVALIDATED') {
                        alert('You have been logged out because your account was accessed on another device.');
                    }
                    navigate('/login');
                    return;
                }
                if (!response.ok) {
                    throw new Error("Failed to fetch dashboard data.");
                }

                const data = await response.json();
                setStats(data);
            } catch (err) {
                setError(err.message || 'Unable to load dashboard data.');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [navigate]);

    const recentSalesChartData = stats?.recentSales?.map((sale, index) => ({
        name: sale.bill_number || `Sale ${index + 1}`,
        value: Number(sale.final_amount) || 0,
        date: sale.sale_date ? new Date(sale.sale_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''
    })) || [];

    const lowStockItems = stats?.lowStockItems || [];

    if (loading) {
        return (
            <div className="page-wrapper main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: 'var(--gold)', fontFamily: "'Cormorant Garamond', serif", fontSize: '24px' }}>Loading Dashboard...</div>
            </div>
        );
    }

    return (
        <div className="page-wrapper main-content fade-in container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '36px', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Overview</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Welcome back to JewelManager Pro.</p>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>
            
            {/* Top Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <StatCard
                    title="Today's Revenue"
                    value={`₹ ${(Number(stats?.todayRevenue) || 0).toLocaleString('en-IN')}`}
                    trend={`Sales: ${stats?.salesToday || 0}`}
                    trendUp={stats?.salesToday > 0}
                    icon={<ShoppingBag color="var(--gold)" />}
                />
                <StatCard
                    title="Gold Rate (22K)"
                    value={ratesLoading ? 'Loading...' : rateData?.gold_22k_per_gram ? `₹ ${Number(rateData.gold_22k_per_gram).toLocaleString('en-IN')}` : 'Unavailable'}
                    trend={ratesError ? 'Rate service unavailable' : 'Live market source'}
                    trendUp={!ratesError}
                    icon={<TrendingUp color="var(--gold)" />}
                />
                <StatCard
                    title="Stock Items"
                    value={`${stats?.uniqueProducts || 0} items`}
                    trend={`Qty: ${Number(stats?.totalStock || 0).toLocaleString('en-IN')}`}
                    trendUp={true}
                    icon={<Package color="var(--gold)" />}
                />
                <StatCard
                    title="Low Stock Alerts"
                    value={`${stats?.lowStockCount || 0} items`}
                    trend={lowStockItems.length > 0 ? 'Review inventory' : 'No low items'}
                    trendUp={lowStockItems.length === 0}
                    icon={<AlertCircle color={lowStockItems.length > 0 ? '#FF5252' : 'var(--gold)'} />}
                />
            </div>

            <div className="card" style={{ marginBottom: '2.5rem', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '24px', marginBottom: '1rem' }}>Live Metal Rate Snapshot</h2>
                {ratesLoading ? (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Fetching live gold and silver rates...</div>
                ) : ratesError ? (
                    <div style={{ color: '#FF5252', fontSize: '0.95rem' }}>
                        ⚠ Could not load rates. Check backend connectivity or refresh the page.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                        <div style={{ padding: '1rem', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Gold 22K</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{rateData?.gold_22k_per_gram ? `₹ ${Number(rateData.gold_22k_per_gram).toLocaleString('en-IN')}` : 'N/A'}</div>
                        </div>
                        <div style={{ padding: '1rem', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Gold 24K</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{rateData?.gold_24k_per_gram ? `₹ ${Number(rateData.gold_24k_per_gram).toLocaleString('en-IN')}` : 'N/A'}</div>
                        </div>
                        <div style={{ padding: '1rem', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Silver per gram</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{rateData?.silver_999_per_gram ? `₹ ${Number(rateData.silver_999_per_gram).toLocaleString('en-IN')}` : 'N/A'}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {/* Chart Section */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ fontSize: '24px', marginBottom: '1.5rem' }}>Sales Overview</h2>
                    <div style={{ flexGrow: 1, minHeight: '300px' }}>
                        {recentSalesChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={recentSalesChartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={(value) => `₹${value}`} />
                                    <Tooltip 
                                        cursor={{ fill: 'rgba(245, 230, 178, 0.2)' }}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }} 
                                    />
                                    <Bar dataKey="value" fill="var(--gold)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', padding: '1.5rem' }}>
                                No recent sales data available yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Alerts Section */}
                <div className="card">
                    <h2 style={{ fontSize: '24px', marginBottom: '1.5rem' }}>Alerts</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {lowStockItems.length > 0 ? (
                            lowStockItems.map((item) => (
                                <div key={item.id} style={{ padding: '1rem', borderLeft: '3px solid #FF5252', background: '#FFF4F4', borderRadius: '4px' }}>
                                    <div style={{ fontWeight: 600, color: '#D32F2F', fontSize: '0.9rem' }}>{item.name || item.sku || 'Item'} is low</div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                                        Qty: {item.quantity} · Threshold: {item.stock_alert_threshold}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '1rem', borderLeft: '3px solid var(--gold)', background: 'var(--gold-light)', borderRadius: '4px' }}>
                                <div style={{ fontWeight: 600, color: 'var(--gold-dark)', fontSize: '0.9rem' }}>Inventory is healthy.</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>No low-stock items detected.</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Quick Store Actions</h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <Link to="/sales" className="btn-primary" style={{ textDecoration: 'none' }}>
                        <Plus size={16} style={{ marginRight: '6px' }} /> New Invoice
                    </Link>
                    <Link to="/customers" className="btn-secondary" style={{ textDecoration: 'none' }}>
                        <Users size={16} style={{ marginRight: '6px' }} /> CRM Profiles
                    </Link>
                    <Link to="/karigar" className="btn-secondary" style={{ textDecoration: 'none' }}>
                        <Hammer size={16} style={{ marginRight: '6px' }} /> Karigar Work
                    </Link>
                    <Link to="/girvi" className="btn-secondary" style={{ textDecoration: 'none' }}>
                        <Coins size={16} style={{ marginRight: '6px' }} /> Sanction Loan
                    </Link>
                    <Link to="/repairs" className="btn-secondary" style={{ textDecoration: 'none' }}>
                        <Wrench size={16} style={{ marginRight: '6px' }} /> Repair Orders
                    </Link>
                    <Link to="/schemes" className="btn-secondary" style={{ textDecoration: 'none' }}>
                        <Calendar size={16} style={{ marginRight: '6px' }} /> Gold Savings
                    </Link>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, trend, trendUp, icon }) => {
    return (
        <div 
            className="card" 
            style={{ 
                borderLeft: '4px solid var(--gold)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>{title}</span>
                <div style={{ padding: '8px', background: 'var(--bg)', borderRadius: '8px' }}>
                    {icon}
                </div>
            </div>
            <div className="price-number" style={{ marginBottom: '0.5rem', fontSize: '24px', color: 'var(--text-primary)' }}>{value}</div>
            <div style={{ fontSize: '0.85rem', color: trendUp ? '#4CAF50' : '#FF5252', fontWeight: 500 }}>
                {trend}
            </div>
        </div>
    );
};

export default Dashboard;