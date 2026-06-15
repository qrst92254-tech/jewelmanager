import { useState, useEffect } from 'react';
import { authFetch } from '../utils/authFetch';

const API_URL = '';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const GSTReport = () => {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await authFetch(`${API_URL}/api/sales/by-month?month=${month}&year=${year}`);
            setRows(data.map(s => ({ ...s })));
        } catch (e) {
            setError('Failed to load sales data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [month, year]);

    const handleCellEdit = (index, field, value) => {
        setRows(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const totals = rows.reduce((acc, r) => ({
        total_amount: acc.total_amount + (parseFloat(r.total_amount) || 0),
        cgst_amount: acc.cgst_amount + (parseFloat(r.cgst_amount) || 0),
        sgst_amount: acc.sgst_amount + (parseFloat(r.sgst_amount) || 0),
        final_amount: acc.final_amount + (parseFloat(r.final_amount) || 0),
    }), { total_amount: 0, cgst_amount: 0, sgst_amount: 0, final_amount: 0 });

    const exportCSV = () => {
        const headers = ['Bill No', 'Date', 'Customer', 'Total Amount', 'CGST Rate%', 'CGST Amount', 'SGST Rate%', 'SGST Amount', 'Final Amount', 'Payment Mode'];
        const csvRows = rows.map(r => [
            r.bill_number || '',
            r.sale_date ? new Date(r.sale_date).toLocaleDateString('en-IN') : '',
            r.customer_name || '',
            r.total_amount || 0,
            r.cgst_rate || 0,
            r.cgst_amount || 0,
            r.sgst_rate || 0,
            r.sgst_amount || 0,
            r.final_amount || 0,
            r.payment_mode || ''
        ]);

        const csvContent = [headers, ...csvRows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GST_Report_${MONTHS[month - 1]}_${year}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => window.print();

    const cellStyle = {
        padding: '8px 10px',
        border: '1px solid #2a2a2a',
        fontSize: '0.82rem',
        color: 'var(--text)',
        background: 'transparent',
        minWidth: '80px'
    };

    const inputStyle = {
        background: 'transparent',
        border: 'none',
        color: 'var(--text)',
        width: '100%',
        fontSize: '0.82rem',
        outline: 'none',
        padding: 0
    };

    const years = [];
    for (let y = now.getFullYear(); y >= now.getFullYear() - 4; y--) years.push(y);

    return (
        <div id="gst-report-root" style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)' }}>
                    GST Report
                </h2>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Month selector */}
                    <select
                        value={month}
                        onChange={e => setMonth(parseInt(e.target.value))}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #333', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.9rem' }}
                    >
                        {MONTHS.map((m, i) => (
                            <option key={m} value={i + 1}>{m}</option>
                        ))}
                    </select>
                    {/* Year selector */}
                    <select
                        value={year}
                        onChange={e => setYear(parseInt(e.target.value))}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #333', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.9rem' }}
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button onClick={exportCSV} style={{ padding: '8px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                        Export CSV
                    </button>
                    <button onClick={handlePrint} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                        Print
                    </button>
                </div>
            </div>

            {/* Note */}
            <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: '16px' }}>
                You can click any cell to edit values before exporting. Changes are local only — they do not update your sales records.
            </p>

            {loading && <div style={{ color: 'var(--text)', padding: '20px 0' }}>Loading...</div>}
            {error && <div style={{ color: '#ef4444', padding: '20px 0' }}>{error}</div>}

            {!loading && !error && (
                <>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: '#B8960C', color: 'white' }}>
                                    <th style={{ ...cellStyle, color: 'white', border: '1px solid #9a7a0a' }}>#</th>
                                    <th style={{ ...cellStyle, color: 'white', border: '1px solid #9a7a0a' }}>Bill No</th>
                                    <th style={{ ...cellStyle, color: 'white', border: '1px solid #9a7a0a' }}>Date</th>
                                    <th style={{ ...cellStyle, color: 'white', border: '1px solid #9a7a0a' }}>Customer</th>
                                    <th style={{ ...cellStyle, color: 'white', border: '1px solid #9a7a0a' }}>Total Amt</th>
                                    <th style={{ ...cellStyle, color: 'white', border: '1px solid #9a7a0a' }}>CGST %</th>
                                    <th style={{ ...cellStyle, color: 'white', border: '1px solid #9a7a0a' }}>CGST Amt</th>
                                    <th style={{ ...cellStyle, color: 'white', border: '1px solid #9a7a0a' }}>SGST %</th>
                                    <th style={{ ...cellStyle, color: 'white', border: '1px solid #9a7a0a' }}>SGST Amt</th>
                                    <th style={{ ...cellStyle, color: 'white', border: '1px solid #9a7a0a' }}>Final Amt</th>
                                    <th style={{ ...cellStyle, color: 'white', border: '1px solid #9a7a0a' }}>Payment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 && (
                                    <tr>
                                        <td colSpan={11} style={{ ...cellStyle, textAlign: 'center', color: '#888', padding: '32px' }}>
                                            No sales found for {MONTHS[month - 1]} {year}
                                        </td>
                                    </tr>
                                )}
                                {rows.map((row, i) => (
                                    <tr key={row.id} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                                        <td style={cellStyle}>{i + 1}</td>
                                        <td style={cellStyle}>
                                            <input style={inputStyle} value={row.bill_number || ''} onChange={e => handleCellEdit(i, 'bill_number', e.target.value)} />
                                        </td>
                                        <td style={cellStyle}>
                                            <input style={inputStyle} value={row.sale_date ? new Date(row.sale_date).toLocaleDateString('en-IN') : ''} onChange={e => handleCellEdit(i, 'sale_date', e.target.value)} />
                                        </td>
                                        <td style={cellStyle}>
                                            <input style={inputStyle} value={row.customer_name || ''} onChange={e => handleCellEdit(i, 'customer_name', e.target.value)} />
                                        </td>
                                        <td style={cellStyle}>
                                            <input style={inputStyle} value={row.total_amount || ''} onChange={e => handleCellEdit(i, 'total_amount', e.target.value)} />
                                        </td>
                                        <td style={cellStyle}>
                                            <input style={inputStyle} value={row.cgst_rate || ''} onChange={e => handleCellEdit(i, 'cgst_rate', e.target.value)} />
                                        </td>
                                        <td style={cellStyle}>
                                            <input style={inputStyle} value={row.cgst_amount || ''} onChange={e => handleCellEdit(i, 'cgst_amount', e.target.value)} />
                                        </td>
                                        <td style={cellStyle}>
                                            <input style={inputStyle} value={row.sgst_rate || ''} onChange={e => handleCellEdit(i, 'sgst_rate', e.target.value)} />
                                        </td>
                                        <td style={cellStyle}>
                                            <input style={inputStyle} value={row.sgst_amount || ''} onChange={e => handleCellEdit(i, 'sgst_amount', e.target.value)} />
                                        </td>
                                        <td style={cellStyle}>
                                            <input style={inputStyle} value={row.final_amount || ''} onChange={e => handleCellEdit(i, 'final_amount', e.target.value)} />
                                        </td>
                                        <td style={cellStyle}>
                                            <input style={inputStyle} value={row.payment_mode || ''} onChange={e => handleCellEdit(i, 'payment_mode', e.target.value)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {rows.length > 0 && (
                                <tfoot>
                                    <tr style={{ background: 'rgba(184,150,12,0.15)', fontWeight: 700 }}>
                                        <td colSpan={4} style={{ ...cellStyle, fontWeight: 700, color: '#B8960C' }}>TOTALS</td>
                                        <td style={{ ...cellStyle, fontWeight: 700 }}>₹{totals.total_amount.toFixed(2)}</td>
                                        <td style={cellStyle}></td>
                                        <td style={{ ...cellStyle, fontWeight: 700 }}>₹{totals.cgst_amount.toFixed(2)}</td>
                                        <td style={cellStyle}></td>
                                        <td style={{ ...cellStyle, fontWeight: 700 }}>₹{totals.sgst_amount.toFixed(2)}</td>
                                        <td style={{ ...cellStyle, fontWeight: 700 }}>₹{totals.final_amount.toFixed(2)}</td>
                                        <td style={cellStyle}></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                    {rows.length > 0 && (
                        <div style={{ marginTop: '16px', padding: '16px', background: 'var(--surface)', borderRadius: '10px', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                            <div>
                                <div style={{ fontSize: '0.78rem', color: '#888' }}>Total Sales</div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>₹{totals.total_amount.toFixed(2)}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.78rem', color: '#888' }}>Total CGST</div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f59e0b' }}>₹{totals.cgst_amount.toFixed(2)}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.78rem', color: '#888' }}>Total SGST</div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f59e0b' }}>₹{totals.sgst_amount.toFixed(2)}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.78rem', color: '#888' }}>Grand Total</div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#B8960C' }}>₹{totals.final_amount.toFixed(2)}</div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Print-only styles */}
            <style>{`
                @media print {
                    .app-layout > nav,
                    .app-layout > aside,
                    nav.sidebar,
                    aside.sidebar {
                        display: none !important;
                    }
                    .content-container {
                        margin-left: 0 !important;
                    }
                    #gst-report-root {
                        max-width: 100% !important;
                    }
                    button { display: none !important; }
                    select { display: none !important; }
                    input { border: none !important; }
                }
            `}</style>
        </div>
    );
};

export default GSTReport;
