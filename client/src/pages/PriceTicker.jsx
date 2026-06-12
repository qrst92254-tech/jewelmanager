import React, { useState } from 'react';
import { useMetalRates } from '../hooks/useMetalRates';

const PriceTicker = () => {
    const { data, loading, error, saving, updateRates } = useMetalRates();
    const [isEditing, setIsEditing] = useState(false);
    const [editValues, setEditValues] = useState({ gold_24k: '', gold_22k: '', gold_18k: '', silver: '' });
    const [saveError, setSaveError] = useState(null);

    const lastUpdated = data?.updated_date ? new Date(data.updated_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

    const rows = [
        { label: 'Gold 24K', value: data?.gold_24k },
        { label: 'Gold 22K', value: data?.gold_22k },
        { label: 'Gold 18K', value: data?.gold_18k },
        { label: 'Silver', value: data?.silver }
    ];

    function handleEditClick() {
        setEditValues({
            gold_24k: data?.gold_24k || '',
            gold_22k: data?.gold_22k || '',
            gold_18k: data?.gold_18k || '',
            silver: data?.silver || '',
        });
        setIsEditing(true);
        setSaveError(null);
    }

    async function handleSave() {
        setSaveError(null);
        const result = await updateRates(editValues);
        if (result.success) {
            setIsEditing(false);
        } else {
            setSaveError(result.message || 'Failed to save');
        }
    }

    return (
        <div className="page-wrapper main-content fade-in container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '36px', color: 'var(--gold-dark)', margin: '0 0 0.5rem 0' }}>Live Market Prices</h1>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Enter your local gold and silver rates manually.</p>
                    <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
                        {lastUpdated ? `Last updated: ${lastUpdated}` : 'No rates entered yet'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {!isEditing && (
                        <>
                            <a
                                href="https://www.goodreturns.in/gold-rates-in-chennai.html"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    fontSize: '0.8rem', color: '#2563eb', background: '#eff6ff',
                                    padding: '6px 12px', borderRadius: '6px', border: '1px solid #bfdbfe',
                                    textDecoration: 'none'
                                }}
                            >
                                Check Today's Rate ↗
                            </a>
                            <button
                                onClick={handleEditClick}
                                style={{
                                    fontSize: '0.8rem', color: '#16a34a', background: '#f0fdf4',
                                    padding: '6px 12px', borderRadius: '6px', border: '1px solid #bbf7d0',
                                    cursor: 'pointer'
                                }}
                            >
                                Edit Rates
                            </button>
                        </>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="card" style={{ padding: '2rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    Fetching saved rates...
                </div>
            ) : error ? (
                <div className="card" style={{ padding: '2rem', color: '#FF5252', textAlign: 'center' }}>
                    <strong>⚠ {error}</strong>
                </div>
            ) : isEditing ? (
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                        {[
                            { label: 'Gold 24K', key: 'gold_24k', bg: '#fefce8', bd: '#fde68a' },
                            { label: 'Gold 22K', key: 'gold_22k', bg: '#fefce8', bd: '#fde68a' },
                            { label: 'Gold 18K', key: 'gold_18k', bg: '#fefce8', bd: '#fde68a' },
                            { label: 'Silver', key: 'silver', bg: '#f9fafb', bd: '#e5e7eb' },
                        ].map(({ label, key, bg, bd }) => (
                            <div key={key} style={{ padding: '1rem', background: bg, borderRadius: '8px', border: `1px solid ${bd}` }}>
                                <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>{label} (per gram)</p>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span style={{ color: '#6b7280', marginRight: '4px' }}>₹</span>
                                    <input
                                        type="number"
                                        value={editValues[key]}
                                        onChange={e => setEditValues(prev => ({ ...prev, [key]: e.target.value }))}
                                        style={{
                                            width: '100%', fontSize: '1.1rem', fontWeight: 700,
                                            background: 'transparent', border: 'none', borderBottom: '2px solid #d1d5db',
                                            outline: 'none'
                                        }}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    {saveError && <p style={{ color: '#dc2626', fontSize: '0.9rem', marginBottom: '0.75rem' }}>{saveError}</p>}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                padding: '8px 20px', background: '#16a34a', color: 'white',
                                border: 'none', borderRadius: '6px', cursor: 'pointer',
                                fontSize: '0.9rem', opacity: saving ? 0.5 : 1
                            }}
                        >
                            {saving ? 'Saving...' : 'Save Rates'}
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            style={{
                                padding: '8px 20px', background: '#f3f4f6', color: '#374151',
                                border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>Metal / Purity</th>
                                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>Rate (₹/g)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.label}>
                                    <td style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>{row.label}</td>
                                    <td style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                                        {row.value != null ? `₹ ${Number(row.value).toLocaleString('en-IN')}` : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!data?.gold_22k && !loading && (
                        <p style={{ padding: '1rem', color: '#6b7280', fontSize: '0.9rem' }}>
                            No rates entered yet. Click "Edit Rates" to add today's rates.
                        </p>
                    )}
                    {lastUpdated && (
                        <p style={{ padding: '0.5rem 1rem 1rem', color: '#9ca3af', fontSize: '0.8rem' }}>
                            As of {lastUpdated}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default PriceTicker;
