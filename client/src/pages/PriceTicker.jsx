import React from 'react';
import { useMetalRates } from '../hooks/useMetalRates';

const cities = ['Chennai', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Kolkata', 'Ahmedabad', 'Pune'];

const PriceTicker = () => {
    const { data, loading, error } = useMetalRates();
    const lastUpdated = data?.date ? new Date(data.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

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
                                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>City</th>
                                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>Gold 22K</th>
                                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>Gold 24K</th>
                                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>Silver</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cities.map((city) => {
                                const gold22 = data?.gold?.[city]?.['22K'];
                                const gold24 = data?.gold?.[city]?.['24K'];
                                const silver = data?.silver?.[city]?.perGram;
                                return (
                                    <tr key={city}>
                                        <td style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>{city}</td>
                                        <td style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>{gold22 != null ? `₹ ${gold22.toLocaleString('en-IN')}` : 'N/A'}</td>
                                        <td style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>{gold24 != null ? `₹ ${gold24.toLocaleString('en-IN')}` : 'N/A'}</td>
                                        <td style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>{silver != null ? `₹ ${silver.toLocaleString('en-IN')}` : 'N/A'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PriceTicker;
