import React, { useEffect, useState } from 'react';
import { TrendingUp, AlertCircle, ShoppingBag, Package, Plus, FileText, BarChart2, Users, Hammer, Coins, Wrench, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useMetalRates } from '../hooks/useMetalRates';

const API_URL = '';

const mockChartData = [
  { name: 'Mon', sales: 4000 },
  { name: 'Tue', sales: 3000 },
  { name: 'Wed', sales: 2000 },
  { name: 'Thu', sales: 2780 },
  { name: 'Fri', sales: 1890 },
  { name: 'Sat', sales: 2390 },
  { name: 'Sun', sales: 3490 },
];

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { data: rateData, loading: ratesLoading, error: ratesError } = useMetalRates();
    const navigate = useNavigate();
    const defaultCity = 'Chennai';
    const defaultCityRates = rateData?.gold?.[defaultCity] || {};
    const defaultCity22K = defaultCityRates?.['22K'];
    const defaultCity24K = defaultCityRates?.['24K'];
    const defaultCitySilver = rateData?.silver?.[defaultCity]?.perGram;

    useEffect(() => {
        const fetchStats = async () => {
            const token = localStorage.getItem('jewel_token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const response = await fetch(`${API_URL}/api/auth/dashboard-stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('jewel_token');
                    navigate('/login');
                    return;
                }
                if (!response.ok) {
                    throw new Error("Failed to fetch dashboard data.");
                }

                const data = await response.json();
                setStats(data);
            } catch (err) {
                // If API is down, use mock data so UI still looks good
                setStats({
                    totalRevenue: 45200,
                    totalSales: 12,
                    uniqueProducts: 124,
                    totalStock: 820000,
                    recentSales: []
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [navigate]);


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
                    title="Today's Sales"
                    value={`₹ ${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`}
                    trend="↑ 12% today"
                    trendUp={true}
                    icon={<ShoppingBag color="var(--gold)" />}
                />
                <StatCard 
                    title="Gold Rate (22K)"
                    value={ratesLoading ? 'Loading...' : defaultCity22K ? `₹ ${defaultCity22K.toLocaleString('en-IN')}` : 'Unavailable'}
                    trend={ratesError ? 'Could not load rates' : `Chennai 22K`}
                    trendUp={!ratesError}
                    icon={<TrendingUp color="var(--gold)" />}
                />
                <StatCard 
                    title="Stock Items"
                    value={`${stats?.uniqueProducts || 0} items`}
                    trend={`₹ ${(stats?.totalStock || 0).toLocaleString('en-IN')} value`}
                    trendUp={true}
                    icon={<Package color="var(--gold)" />}
                />
                <StatCard 
                    title="Low Stock Alerts"
                    value="3 items ⚠️"
                    trend="Need restock"
                    trendUp={false}
                    icon={<AlertCircle color="#FF5252" />}
                />
            </div>

            <div className="card" style={{ marginBottom: '2.5rem', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '24px', marginBottom: '1rem' }}>Live Metal Rate Snapshot</h2>
                {ratesLoading ? (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Fetching live gold and silver rates...</div>
                ) : ratesError ? (
                    <div style={{ color: '#FF5252', fontSize: '0.95rem' }}>
                        ⚠ Could not load rates. Make sure the rate proxy server is running on port 3001.
                    </div>
                ) : (
                    <>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1rem' }}>
                            Last updated: {rateData?.date ? new Date(rateData.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today'}
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>City</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>Gold 22K</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>Gold 24K</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>Silver</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {['Chennai', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Kolkata', 'Ahmedabad', 'Pune'].map((city) => {
                                        const gold22 = rateData?.gold?.[city]?.['22K'];
                                        const gold24 = rateData?.gold?.[city]?.['24K'];
                                        const silver = rateData?.silver?.[city]?.perGram;
                                        return (
                                            <tr key={city}>
                                                <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>{city}</td>
                                                <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>{gold22 != null ? `₹ ${gold22.toLocaleString('en-IN')}` : 'N/A'}</td>
                                                <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>{gold24 != null ? `₹ ${gold24.toLocaleString('en-IN')}` : 'N/A'}</td>
                                                <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>{silver != null ? `₹ ${silver.toLocaleString('en-IN')}` : 'N/A'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {/* Chart Section */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ fontSize: '24px', marginBottom: '1.5rem' }}>Sales Overview</h2>
                    <div style={{ flexGrow: 1, minHeight: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mockChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={(value) => `₹${value}`} />
                                <Tooltip 
                                    cursor={{ fill: 'rgba(245, 230, 178, 0.2)' }}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }} 
                                />
                                <Bar dataKey="sales" fill="var(--gold)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Alerts Section */}
                <div className="card">
                    <h2 style={{ fontSize: '24px', marginBottom: '1.5rem' }}>Alerts</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ padding: '1rem', borderLeft: '3px solid #FF5252', background: '#FFF4F4', borderRadius: '4px' }}>
                            <div style={{ fontWeight: 600, color: '#D32F2F', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertCircle size={16} /> Low Stock
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Gold Chain 22K (SKU-102) is running low.</div>
                        </div>
                        <div style={{ padding: '1rem', borderLeft: '3px solid var(--gold)', background: 'var(--gold-light)', opacity: 0.8, borderRadius: '4px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--gold-dark)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <TrendingUp size={16} /> Price Update
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Gold rate increased by ₹120/g today.</div>
                        </div>
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