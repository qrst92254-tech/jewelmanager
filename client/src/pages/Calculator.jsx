import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLivePrices } from '../hooks/useLivePrices';
import { authFetch } from '../utils/authFetch';

const Calculator = () => {
    const navigate = useNavigate();
    const { prices } = useLivePrices();
    
    const [metal, setMetal] = useState('Gold');
    const [purity, setPurity] = useState('22K');
    const [rateOverride, setRateOverride] = useState('');
    
    const [netWeight, setNetWeight] = useState('');
    const [stoneWeight, setStoneWeight] = useState('');
    
    const [makingType, setMakingType] = useState('per_gram');
    const [makingValue, setMakingValue] = useState('');
    const [wastagePercent, setWastagePercent] = useState('');
    const [stoneCharges, setStoneCharges] = useState('');
    const [otherCharges, setOtherCharges] = useState('');

    const [breakdown, setBreakdown] = useState(null);
    const [saving, setSaving] = useState(false);

    const buildQuotePayload = () => {
        const rate = getCurrentRate();
        const wt = parseFloat(netWeight) || 0;
        const metalValue = wt * rate;
        let making = 0;
        const mVal = parseFloat(makingValue) || 0;
        if (makingType === 'per_gram') making = wt * mVal;
        else if (makingType === 'percent') making = metalValue * (mVal / 100);
        else making = mVal;
        const wastage = metalValue * ((parseFloat(wastagePercent) || 0) / 100);
        const stone = parseFloat(stoneCharges) || 0;
        const other = parseFloat(otherCharges) || 0;
        const subtotal = metalValue + making + wastage + stone + other;
        const gst = subtotal * 0.03;
        return {
            customer_name: 'Walk-in Customer',
            customer_phone: '',
            gold_rate_used: metal === 'Gold' ? rate : prices.gold_22k_per_gram,
            silver_rate_used: metal === 'Silver' ? rate : prices.silver_999_per_gram,
            valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            subtotal: Math.round(subtotal),
            gst_amount: Math.round(gst),
            grand_total: Math.round(subtotal + gst),
            notes: `Calculator: ${metal} ${purity}, ${wt}g net`,
            items: [{
                product_name: `${metal} ${purity} Item`,
                category: 'calculator',
                purity,
                net_weight: wt,
                rate_per_gram: rate,
                metal_value: Math.round(metalValue),
                making_charges: Math.round(making),
                stone_charges: Math.round(stone),
                gst_amount: Math.round(gst),
                item_total: Math.round(subtotal + gst),
                quantity: 1,
            }],
        };
    };

    const handleSaveQuote = async () => {
        if (!breakdown) {
            alert('Enter weight and rate to calculate a price first.');
            return;
        }
        setSaving(true);
        try {
            await authFetch('/api/quotations', {
                method: 'POST',
                body: JSON.stringify(buildQuotePayload()),
            });
            alert('Quotation saved successfully.');
            navigate('/quotations');
        } catch (err) {
            alert(err.message || 'Failed to save quotation');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateBill = () => {
        if (!breakdown) {
            alert('Enter weight and rate to calculate a price first.');
            return;
        }
        navigate('/sales');
    };

    // Get current rate
    const getCurrentRate = () => {
        if (rateOverride) return Number(rateOverride);
        if (metal === 'Gold') {
            if (purity === '24K') return prices.gold_24k_per_gram || 7200;
            if (purity === '22K') return prices.gold_22k_per_gram || 6450;
            if (purity === '18K') return prices.gold_18k_per_gram || 5300;
            return 6450;
        } else {
            return prices.silver_999_per_gram || 85;
        }
    };

    useEffect(() => {
        const calculate = () => {
            const rate = getCurrentRate();
            const nw = Number(netWeight) || 0;

            // Guard against empty/invalid inputs
            if (!nw || !rate || nw <= 0 || rate <= 0) {
                setBreakdown(null);
                return;
            }

            const weight = parseFloat(netWeight) || 0;
            const ratePerGram = parseFloat(rate) || 0;

            const metalValue = weight * ratePerGram;

            let making = 0;
            const mVal = parseFloat(makingValue) || 0;
            if (makingType === 'per_gram') {
                making = weight * mVal;
            } else if (makingType === 'percent') {
                making = metalValue * (mVal / 100);
            } else {
                making = mVal;
            }

            const wastage = metalValue * ((parseFloat(wastagePercent) || 0) / 100);
            const stone = parseFloat(stoneCharges) || 0;
            const other = parseFloat(otherCharges) || 0;

            const subtotal = metalValue + making + wastage + stone + other;

            // Indian GST rules:
            // Metal + wastage: 3% GST (1.5% CGST + 1.5% SGST)
            // Making charges: 5% GST (2.5% CGST + 2.5% SGST)
            const gstOnMetal = (metalValue + wastage) * 0.03;
            const gstOnMaking = making * 0.05;

            const total = subtotal + gstOnMetal + gstOnMaking;

            setBreakdown({
                metalValue: Math.round(metalValue),
                making: Math.round(making),
                wastage: Math.round(wastage),
                stoneCharges: Math.round(stone),
                otherCharges: Math.round(other),
                subTotal: Math.round(subtotal),
                gstMetal: Math.round(gstOnMetal),
                gstMaking: Math.round(gstOnMaking),
                total: Math.round(total)
            });
        };

        calculate();
    }, [metal, purity, rateOverride, netWeight, stoneWeight, makingType, makingValue, wastagePercent, stoneCharges, otherCharges, prices]);

    return (
        <div className="page-wrapper main-content fade-in container">
            <h1 style={{ fontSize: '36px', color: 'var(--text-primary)', marginBottom: '2rem' }}>Price Calculator</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                
                {/* Left Panel - Inputs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    <div className="card">
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--gold-dark)', borderBottom: '1px dashed var(--border-gold)', paddingBottom: '0.5rem' }}>STEP 1 — Metal & Purity</h3>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label>Metal</label>
                                <select value={metal} onChange={(e) => setMetal(e.target.value)}>
                                    <option value="Gold">Gold</option>
                                    <option value="Silver">Silver</option>
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label>Purity</label>
                                <select value={purity} onChange={(e) => setPurity(e.target.value)}>
                                    {metal === 'Gold' ? (
                                        <>
                                            <option value="24K">24K</option>
                                            <option value="22K">22K</option>
                                            <option value="18K">18K</option>
                                            <option value="14K">14K</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="999">999 Silver</option>
                                            <option value="925">925 Silver</option>
                                        </>
                                    )}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label>Today's Rate (₹/g)</label>
                            <input 
                                type="number" 
                                value={rateOverride} 
                                onChange={(e) => setRateOverride(e.target.value)}
                                placeholder={`Current: ₹${getCurrentRate()}`} 
                            />
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--gold-dark)', borderBottom: '1px dashed var(--border-gold)', paddingBottom: '0.5rem' }}>STEP 2 — Weight</h3>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label>Net Weight (g)</label>
                                <input type="number" value={netWeight} onChange={(e) => setNetWeight(e.target.value)} placeholder="0.00" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label>Stone Weight (g)</label>
                                <input type="number" value={stoneWeight} onChange={(e) => setStoneWeight(e.target.value)} placeholder="0.00" />
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--gold-dark)', borderBottom: '1px dashed var(--border-gold)', paddingBottom: '0.5rem' }}>STEP 3 — Charges</h3>
                        
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label>Making Charge Type</label>
                                <select value={makingType} onChange={(e) => setMakingType(e.target.value)}>
                                    <option value="per_gram">Per Gram (₹)</option>
                                    <option value="percent">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount (₹)</option>
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label>Making Value</label>
                                <input type="number" value={makingValue} onChange={(e) => setMakingValue(e.target.value)} placeholder="0" />
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label>Wastage (%)</label>
                                <input type="number" value={wastagePercent} onChange={(e) => setWastagePercent(e.target.value)} placeholder="0" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label>Stone Charges (₹)</label>
                                <input type="number" value={stoneCharges} onChange={(e) => setStoneCharges(e.target.value)} placeholder="0" />
                            </div>
                        </div>
                        
                        <div>
                            <label>Other Charges (₹)</label>
                            <input type="number" value={otherCharges} onChange={(e) => setOtherCharges(e.target.value)} placeholder="0" />
                        </div>
                    </div>

                </div>

                {/* Right Panel - Live Result */}
                <div>
                    <div 
                        className="card" 
                        style={{ 
                            position: 'sticky', 
                            top: '100px', 
                            border: '1px solid var(--border)',
                            background: 'var(--bg-card)'
                        }}
                    >
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>💰</span> Price Breakdown
                        </h2>
                        
                        {breakdown && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '1.05rem' }}>
                                <BreakdownRow label="Metal Value" value={breakdown.metalValue} />
                                <BreakdownRow label="Making Charges" value={breakdown.making} />
                                {breakdown.wastage > 0 && <BreakdownRow label={`Wastage (${wastagePercent}%)`} value={breakdown.wastage} />}
                                {breakdown.stoneCharges > 0 && <BreakdownRow label="Stone Charges" value={breakdown.stoneCharges} />}
                                {breakdown.otherCharges > 0 && <BreakdownRow label="Other Charges" value={breakdown.otherCharges} />}
                                
                                <div style={{ borderTop: '1px solid var(--border)', margin: '0.5rem 0' }}></div>
                                
                                <BreakdownRow label="Sub Total" value={breakdown.subTotal} bold={true} />
                                <BreakdownRow label="GST on Metal (3%)" value={breakdown.gstMetal} color="var(--text-secondary)" />
                                {breakdown.making > 0 && <BreakdownRow label="GST on Making (5%)" value={breakdown.gstMaking} color="var(--text-secondary)" />}
                                
                                <div style={{ borderTop: '2px dashed var(--gold)', margin: '1rem 0' }}></div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>Total Price</span>
                                    <span 
                                        style={{ 
                                            fontFamily: "'Cormorant Garamond', serif", 
                                            fontSize: '42px', 
                                            color: 'var(--gold)',
                                            lineHeight: 1,
                                            animation: 'fadeIn 0.3s'
                                        }}
                                        key={breakdown.total} // Forces re-render animation on change
                                    >
                                        ₹ {breakdown.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                    <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={handleCreateBill}>Create Bill</button>
                                    <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={handleSaveQuote} disabled={saving}>
                                        {saving ? 'Saving...' : 'Save Quote'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

const BreakdownRow = ({ label, value, bold = false, color = 'var(--text-primary)' }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', color, fontWeight: bold ? 600 : 400 }}>
        <span>{label}</span>
        <span>₹ {value.toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</span>
    </div>
);

export default Calculator;