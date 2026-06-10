import React from 'react';
import { useMetalRates } from '../hooks/useMetalRates';

const PriceTicker = () => {
    const { data, loading, error } = useMetalRates();
    const lastUpdated = data?.last_updated ? new Date(data.last_updated).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

    const rows = [
        { label: 'Gold 24K', value: data?.gold_24k_per_gram },
        { label: 'Gold 22K', value: data?.gold_22k_per_gram },
        { label: 'Gold 18K', value: data?.gold_18k_per_gram },
        { label: 'Gold 14K', value: data?.gold_14k_per_gram },
        { label: 'Silver 999', value: data?.silver_999_per_gram },
        { label: 'Silver 925', value: data?.silver_925_per_gram },
        { label: 'Silver 800', value: data?.silver_800_per_gram }
    ];

    return (
        <div className="page-wrapper main-content fade-in container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '36px', color: 'var(--gold-dark)', margin: '0 0 0.5rem 0' }}>Live Market Prices</h1>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Rates sourced from goodreturns.in — updated once daily.</p>
                    <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
                        {lastUpdated ? `Last updated: ${lastUpdated}` : 'Loading latest rates...'}
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="card" style={{ padding: '2rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    Fetching rates from goodreturns.in...
                </div>
            ) : error ? (
                <div className="card" style={{ padding: '2rem', color: '#FF5252', textAlign: 'center' }}>
                    <strong>⚠ Could not connect to the rate server.</strong>
                    <div style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>
                        Make sure you start the backend with <code style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 4px', borderRadius: '4px' }}>npm run server</code> and refresh this page.
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
                                        {row.value != null ? `₹ ${Number(row.value).toLocaleString('en-IN')}` : 'Live rates temporarily unavailable'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PriceTicker;
