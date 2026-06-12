import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Calendar, FileText, Download, BarChart2, ShieldAlert, TrendingUp, IndianRupee, ArrowDownCircle, AlertCircle } from 'lucide-react';
import { authFetch } from '../utils/authFetch';

const API_URL = '';

const Reports = () => {
    const [activeTab, setActiveTab] = useState('financial');
    const [loading, setLoading] = useState(true);

    // Filters
    const [fromVal, setFromVal] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [toVal, setToVal] = useState(new Date().toISOString().split('T')[0]);
    const [monthVal, setMonthVal] = useState(new Date().getMonth() + 1);
    const [yearVal, setYearVal] = useState(new Date().getFullYear());

    // Report data
    const [financial, setFinancial] = useState(null);
    const [gst, setGst] = useState(null);
    const [stock, setStock] = useState(null);
    const [topProducts, setTopProducts] = useState([]);

    const fetchFinancial = async () => {
        try {
            const data = await authFetch(`${API_URL}/api/reports/financial?from=${fromVal}&to=${toVal}`);
            setFinancial(data);
        } catch (e) { console.error(e); }
    };

    const fetchGst = async () => {
        try {
            const data = await authFetch(`${API_URL}/api/reports/gst?month=${monthVal}&year=${yearVal}`);
            setGst(data);
        } catch (e) { console.error(e); }
    };

    const fetchStock = async () => {
        try {
            const data = await authFetch(`${API_URL}/api/reports/stock`);
            setStock(data);
        } catch (e) { console.error(e); }
    };

    const fetchTopProducts = async () => {
        try {
            const data = await authFetch(`${API_URL}/api/reports/top-products?limit=10`);
            setTopProducts(data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            if (activeTab === 'financial') await fetchFinancial();
            else if (activeTab === 'gst') await fetchGst();
            else if (activeTab === 'stock') await fetchStock();
            else if (activeTab === 'products') await fetchTopProducts();
            setLoading(false);
        };
        load();
    }, [activeTab, fromVal, toVal, monthVal, yearVal]);

    // Client-side CSV Download Helper
    const downloadCSV = (data, filename) => {
        if (!data || data.length === 0) return;
        const keys = Object.keys(data[0]);
        const csvContent = [
            keys.join(','),
            ...data.map(row => keys.map(k => {
                let cell = row[k] === null || row[k] === undefined ? '' : String(row[k]);
                // escape commas
                if ((cell ?? '').includes(',')) cell = `"${cell.replace(/"/g, '""')}"`;
                return cell;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const mockHistoryData = [
        { date: '10 May', sales: 45000, expenses: 12000 },
        { date: '15 May', sales: 52000, expenses: 8000 },
        { date: '20 May', sales: 38000, expenses: 14000 },
        { date: '25 May', sales: 61000, expenses: 9500 },
        { date: '30 May', sales: 78000, expenses: 11000 }
    ];

    return (
        <div className="page-wrapper main-content fade-in container">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '36px', color: 'var(--text-primary)', margin: 0 }}>GST Reports & Analytics</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Review tax filing data, item performance, stock velocity charts and store profitability summaries</p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <button onClick={() => setActiveTab('financial')} style={{ background: 'none', border: 'none', padding: '12px 16px', cursor: 'pointer', fontWeight: 600, color: activeTab === 'financial' ? 'var(--gold)' : 'var(--text-secondary)', borderBottom: activeTab === 'financial' ? '3px solid var(--gold)' : 'none' }}>Financial Summary</button>
                <button onClick={() => setActiveTab('gst')} style={{ background: 'none', border: 'none', padding: '12px 16px', cursor: 'pointer', fontWeight: 600, color: activeTab === 'gst' ? 'var(--gold)' : 'var(--text-secondary)', borderBottom: activeTab === 'gst' ? '3px solid var(--gold)' : 'none' }}>GST Tax Return</button>
                <button onClick={() => setActiveTab('stock')} style={{ background: 'none', border: 'none', padding: '12px 16px', cursor: 'pointer', fontWeight: 600, color: activeTab === 'stock' ? 'var(--gold)' : 'var(--text-secondary)', borderBottom: activeTab === 'stock' ? '3px solid var(--gold)' : 'none' }}>Stock Analytics</button>
                <button onClick={() => setActiveTab('products')} style={{ background: 'none', border: 'none', padding: '12px 16px', cursor: 'pointer', fontWeight: 600, color: activeTab === 'products' ? 'var(--gold)' : 'var(--text-secondary)', borderBottom: activeTab === 'products' ? '3px solid var(--gold)' : 'none' }}>Top Selling Products</button>
            </div>

            {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Compiling analytics dashboard...</div>
            ) : (
                <>
                    {activeTab === 'financial' && financial && (
                        <div>
                            {/* Filters */}
                            <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '12px 20px', marginBottom: '2rem', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 500 }}><Calendar size={16} /> Date Interval:</div>
                                <div style={{ width: '160px' }}><input type="date" value={fromVal} onChange={e => setFromVal(e.target.value)} style={{ padding: '4px 8px' }} /></div>
                                <div style={{ fontSize: '0.85rem' }}>to</div>
                                <div style={{ width: '160px' }}><input type="date" value={toVal} onChange={e => setToVal(e.target.value)} style={{ padding: '4px 8px' }} /></div>
                            </div>

                            {/* Summary row */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                                <div className="card" style={{ borderLeft: '4px solid #4CAF50' }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Revenue</div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>₹{financial.revenue?.toLocaleString() || 0}</div>
                                </div>
                                <div className="card" style={{ borderLeft: '4px solid #FF5252' }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Expenses</div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>₹{financial.expenses?.toLocaleString() || 0}</div>
                                </div>
                                <div className="card" style={{ borderLeft: '4px solid var(--gold)' }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Net Operating Profit</div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>₹{financial.profit?.toLocaleString() || 0}</div>
                                </div>
                                <div className="card" style={{ borderLeft: '4px solid #00ACC1' }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Pledged Loans Out</div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>₹{financial.activeGirviLoans?.toLocaleString() || 0}</div>
                                </div>
                            </div>

                            {/* Revenue Chart */}
                            <div className="card" style={{ marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Cashflow Analytics (Sales vs Expenses)</h3>
                                <div style={{ width: '100%', height: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={mockHistoryData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="sales" stroke="#4CAF50" strokeWidth={2} name="Sales Inflow" />
                                            <Line type="monotone" dataKey="expenses" stroke="#FF5252" strokeWidth={2} name="Expense Outflow" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'gst' && gst && (
                        <div>
                            {/* Monthly Selector */}
                            <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '12px 20px', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 500 }}><Calendar size={16} /> Select Tax Period:</div>
                                <select value={monthVal} onChange={e => setMonthVal(parseInt(e.target.value))} style={{ width: '130px', padding: '4px' }}>
                                    <option value="1">January</option><option value="2">February</option><option value="3">March</option><option value="4">April</option>
                                    <option value="5">May</option><option value="6">June</option><option value="7">July</option><option value="8">August</option>
                                    <option value="9">September</option><option value="10">October</option><option value="11">November</option><option value="12">December</option>
                                </select>
                                <select value={yearVal} onChange={e => setYearVal(parseInt(e.target.value))} style={{ width: '100px', padding: '4px' }}>
                                    <option value="2025">2025</option><option value="2026">2026</option><option value="2027">2027</option>
                                </select>
                                <button className="btn-secondary" onClick={() => downloadCSV(gst.sales, `GST_Sales_Report_${monthVal}_${yearVal}.csv`)} style={{ padding: '6px 12px', fontSize: '0.85rem', marginLeft: 'auto' }}>
                                    <Download size={14} style={{ marginRight: '6px' }} /> Download GST Excel CSV
                                </button>
                            </div>

                            {/* Aggregates Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                                <div className="card" style={{ borderLeft: '4px solid var(--gold)' }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Taxable Turnover (Subtotal)</div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-primary)' }}>₹{(gst.totals?.taxable || 0).toLocaleString()}</div>
                                </div>
                                <div className="card" style={{ borderLeft: '4px solid #0288D1' }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Output CGST (1.5%)</div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-primary)' }}>₹{(gst.totals?.cgst || 0).toLocaleString()}</div>
                                </div>
                                <div className="card" style={{ borderLeft: '4px solid #0288D1' }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Output SGST (1.5%)</div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-primary)' }}>₹{(gst.totals?.sgst || 0).toLocaleString()}</div>
                                </div>
                                <div className="card" style={{ borderLeft: '4px solid #33691E' }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Gross Sales (Inc Tax)</div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-primary)' }}>₹{(gst.totals?.total || 0).toLocaleString()}</div>
                                </div>
                            </div>

                            {/* Tables */}
                            <div className="card" style={{ padding: 0 }}>
                                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Inward Turnovers (Tax Invoices Filed)</h3>
                                </div>
                                {gst.sales?.length === 0 ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No invoices filed in this period.</div>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Bill No.</th>
                                                    <th>Customer Name</th>
                                                    <th>Invoice Date</th>
                                                    <th style={{ textAlign: 'right' }}>Taxable Amt</th>
                                                    <th style={{ textAlign: 'right' }}>CGST (1.5%)</th>
                                                    <th style={{ textAlign: 'right' }}>SGST (1.5%)</th>
                                                    <th style={{ textAlign: 'right' }}>Invoice Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {gst.sales.map(s => (
                                                    <tr key={s.id}>
                                                        <td style={{ fontWeight: 600, color: 'var(--gold)' }}>{s.bill_number}</td>
                                                        <td>{s.customer_name}</td>
                                                        <td>{new Date(s.sale_date).toLocaleDateString('en-IN')}</td>
                                                        <td style={{ textAlign: 'right' }}>₹{(s.total_amount || 0).toLocaleString()}</td>
                                                        <td style={{ textAlign: 'right' }}>₹{(s.cgst_amount || 0).toLocaleString()}</td>
                                                        <td style={{ textAlign: 'right' }}>₹{(s.sgst_amount || 0).toLocaleString()}</td>
                                                        <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{(s.final_amount || 0).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'stock' && stock && (
                        <div>
                            {/* Stock Summary Metrics */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--gold)' }}>
                                    <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '50%', color: 'var(--gold)' }}><BarChart2 size={20} /></div>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Unique SKUs</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{stock.total} products</div>
                                    </div>
                                </div>
                                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #FF5252' }}>
                                    <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '50%', color: '#FF5252' }}><ShieldAlert size={20} /></div>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Low Stock Warning</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{stock.lowStock?.length || 0} alerts</div>
                                    </div>
                                </div>
                            </div>

                            {/* Low Stock Checklist */}
                            {stock.lowStock?.length > 0 && (
                                <div className="card" style={{ borderLeft: '4px solid #FF5252', padding: '1.25rem', marginBottom: '2rem' }}>
                                    <h3 style={{ color: '#D32F2F', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', marginBottom: '1rem' }}><AlertCircle size={18} /> Reorder Checklist Warnings</h3>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>SKU</th>
                                                    <th>Item Name</th>
                                                    <th>Material</th>
                                                    <th style={{ textAlign: 'right' }}>Current Qty</th>
                                                    <th style={{ textAlign: 'right' }}>Threshold limit</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stock.lowStock.map(p => (
                                                    <tr key={p.id}>
                                                        <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{p.sku}</td>
                                                        <td>{p.name}</td>
                                                        <td>{p.metal?.toUpperCase()} ({p.purity})</td>
                                                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#D32F2F' }}>{p.quantity} pcs</td>
                                                        <td style={{ textAlign: 'right' }}>{p.stock_alert_threshold || 1} pcs</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'products' && (
                        <div>
                            {topProducts.length === 0 ? (
                                <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No items sold yet. Sales records will populate this chart.</div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
                                    {/* Visual Chart */}
                                    <div className="card">
                                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Product Velocity Rank</h3>
                                        <div style={{ width: '100%', height: '300px' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={topProducts}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                                    <XAxis dataKey="name" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Bar dataKey="total_sold" fill="var(--gold)" radius={[4, 4, 0, 0]} name="Pcs Sold" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Top Rankings table */}
                                    <div className="card" style={{ padding: 0 }}>
                                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                                            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Leaderboard</h3>
                                        </div>
                                        <div style={{ padding: '0.5rem' }}>
                                            {topProducts.map((p, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyItems: 'space-between', borderBottom: '1px solid var(--border)', padding: '10px 5px', fontSize: '0.85rem' }}>
                                                    <div style={{ flexGrow: 1 }}>
                                                        <strong>#{idx + 1} {p.name}</strong>
                                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{p.category.toUpperCase()} ({p.metal})</div>
                                                    </div>
                                                    <div style={{ textAlign: 'right', fontWeight: 600 }}>{p.total_sold} pcs</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Reports;
