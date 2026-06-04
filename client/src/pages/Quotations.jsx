import React, { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { Plus, Trash2, Printer, Search, FileText, X, CheckCircle, RefreshCcw } from 'lucide-react';
import { authFetch } from '../utils/authFetch';

const API_URL = '';

const Quotations = () => {
    const { livePrices } = useStore(state => state);
    const [quotations, setQuotations] = useState([]);
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modals
    const [isBuildModalOpen, setIsBuildModalOpen] = useState(false);

    // Form states
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [validUntil, setValidUntil] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState([
        { product_name: 'Gold Chain', category: 'chain', purity: '22K', net_weight: 10, rate_per_gram: livePrices.prices.gold_22k_per_gram || 6450, making_charges: 1500, stone_charges: 0, quantity: 1 }
    ]);

    const fetchQuotations = async () => {
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/quotations`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (res.ok) setQuotations(await res.json());
        } catch (e) { console.error(e); }
    };

    const loadQuotationDetails = async (quotation) => {
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/quotations/${quotation.id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (res.ok) setSelectedQuotation(await res.json());
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await fetchQuotations();
            setLoading(false);
        };
        init();
    }, []);

    const handleAddItem = () => {
        setItems([...items, {
            product_name: '', category: 'ring', purity: '22K', net_weight: 0,
            rate_per_gram: livePrices.prices.gold_22k_per_gram || 6450, making_charges: 0, stone_charges: 0, quantity: 1
        }]);
    };

    const handleRemoveItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index, field, val) => {
        const updated = [...items];
        updated[index][field] = val;
        
        // Auto default rate per gram based on metal & purity if they select standard options
        if (field === 'purity') {
            if (val === '24K') updated[index].rate_per_gram = livePrices.prices.gold_24k_per_gram;
            else if (val === '22K') updated[index].rate_per_gram = livePrices.prices.gold_22k_per_gram;
            else if (val === '18K') updated[index].rate_per_gram = livePrices.prices.gold_18k_per_gram;
            else if (val === '14K') updated[index].rate_per_gram = livePrices.prices.gold_14k_per_gram;
            else if (val === 'Silver') updated[index].rate_per_gram = livePrices.prices.silver_999_per_gram;
        }

        setItems(updated);
    };

    // Calculation formulas
    const calculateTotals = () => {
        let subtotal = 0;
        let gst = 0;
        const calculatedItems = items.map(item => {
            const wt = parseFloat(item.net_weight) || 0;
            const rate = parseFloat(item.rate_per_gram) || 0;
            const metalVal = wt * rate;
            const making = parseFloat(item.making_charges) || 0;
            const stones = parseFloat(item.stone_charges) || 0;
            const rawSub = (metalVal + making + stones) * (parseInt(item.quantity) || 1);
            const rawGst = rawSub * 0.03; // GST is 3% in Indian jewelry
            const total = rawSub + rawGst;
            subtotal += rawSub;
            gst += rawGst;
            return {
                ...item,
                metal_value: metalVal,
                gst_amount: rawGst,
                item_total: total
            };
        });

        return {
            items: calculatedItems,
            subtotal,
            gst_amount: gst,
            grand_total: subtotal + gst
        };
    };

    const totals = calculateTotals();

    const handleSaveQuotation = async (e) => {
        e.preventDefault();
        if (items.length === 0) {
            alert('Quotation must contain at least 1 item.');
            return;
        }

        const payload = {
            customer_name: customerName,
            customer_phone: customerPhone,
            gold_rate_used: livePrices.prices.gold_22k_per_gram,
            silver_rate_used: livePrices.prices.silver_999_per_gram,
            valid_until: validUntil,
            subtotal: totals.subtotal,
            gst_amount: totals.gst_amount,
            grand_total: totals.grand_total,
            notes,
            items: totals.items
        };

        try {
            await authFetch(`${API_URL}/api/quotations`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            setIsBuildModalOpen(false);
            setCustomerName('');
            setCustomerPhone('');
            setNotes('');
            setItems([{ product_name: 'Gold Chain', category: 'chain', purity: '22K', net_weight: 10, rate_per_gram: livePrices.prices.gold_22k_per_gram || 6450, making_charges: 1500, stone_charges: 0, quantity: 1 }]);
            await fetchQuotations();
        } catch (err) {
            alert(err.message || 'Failed to save quotation');
        }
    };

    const handleConvertQuotationToSale = async () => {
        if (!selectedQuotation) return;
        if (!window.confirm('Do you want to convert this quotation into a completed sale/invoice?')) return;
        
        try {
            const token = localStorage.getItem('jewel_token');
            // Register sale in backend
            const saleRes = await fetch(`${API_URL}/api/sales`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    customer_name: selectedQuotation.customer_name || 'Walkin Customer',
                    customer_phone: selectedQuotation.customer_phone || '',
                    sale_date: new Date().toISOString().split('T')[0],
                    payment_mode: 'cash',
                    subtotal: selectedQuotation.subtotal,
                    discount: 0,
                    gst_amount: selectedQuotation.gst_amount,
                    final_amount: selectedQuotation.grand_total,
                    items: selectedQuotation.items.map(item => ({
                        product_name: item.product_name,
                        purity: item.purity,
                        net_weight: item.net_weight,
                        gross_weight: item.net_weight,
                        making_charges: item.making_charges,
                        other_charges: item.stone_charges,
                        price: item.metal_value + item.making_charges + item.stone_charges,
                        gst: item.gst_amount,
                        total: item.item_total
                    }))
                })
            });

            if (!saleRes.ok) throw new Error('Failed to create sale from quotation');
            const saleData = await saleRes.json();

            // Update quotation status to converted
            const quoRes = await fetch(`${API_URL}/api/quotations/${selectedQuotation.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'converted',
                    converted_to_sale_id: saleData.id
                })
            });

            if (quoRes.ok) {
                alert('Quotation successfully converted to Sale Invoice!');
                await fetchQuotations();
                setSelectedQuotation(null);
            }
        } catch (e) {
            alert(`Error: ${e.message}`);
        }
    };

    const handlePrintQuotation = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Price Quotation Estimate - ${selectedQuotation.quotation_number}</title>
                    <style>
                        body { font-family: sans-serif; padding: 25px; line-height: 1.6; color: #333; }
                        .header { text-align: center; border-bottom: 2px dashed #B8960C; padding-bottom: 10px; margin-bottom: 20px; }
                        .watermark { text-align: center; color: #FF5252; font-size: 1.1rem; font-weight: bold; border: 1.5px solid #FF5252; padding: 8px; margin: 15px auto; width: fit-content; text-transform: uppercase; border-radius: 4px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                        th { background: #F3F4F6; text-align: left; padding: 8px; border-bottom: 2px solid #ddd; }
                        td { padding: 8px; border-bottom: 1px solid #eee; }
                        .totals { text-align: right; margin-top: 20px; font-size: 1.1rem; }
                        .footer { text-align: center; font-size: 0.8rem; color: #777; margin-top: 50px; border-top: 1px solid #ddd; padding-top: 10px; }
                    </style>
                </head>
                <body onload="window.print();window.close();">
                    <div class="header">
                        <h2>JEWELMANAGER PRO</h2>
                        <p>Valuation & Cost Estimate</p>
                    </div>
                    <div class="watermark">Estimate Only - Not a Tax Invoice</div>
                    <div style="display:flex; justify-content:space-between;">
                        <div>
                            <div><strong>Quotation:</strong> ${selectedQuotation.quotation_number}</div>
                            <div><strong>Date:</strong> ${new Date(selectedQuotation.created_at).toLocaleDateString()}</div>
                            <div><strong>Valid Until:</strong> ${new Date(selectedQuotation.valid_until).toLocaleDateString()}</div>
                        </div>
                        <div style="text-align:right;">
                            <div><strong>Customer Name:</strong> ${selectedQuotation.customer_name || 'Walkin Customer'}</div>
                            <div><strong>Phone:</strong> ${selectedQuotation.customer_phone || 'N/A'}</div>
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Item Name</th>
                                <th>Specification</th>
                                <th style="text-align:right;">Weight</th>
                                <th style="text-align:right;">Rate</th>
                                <th style="text-align:right;">Labor/Making</th>
                                <th style="text-align:right;">Tax (GST)</th>
                                <th style="text-align:right;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${selectedQuotation.items.map(i => `
                                <tr>
                                    <td>${i.product_name}</td>
                                    <td>${i.category.toUpperCase()} (${i.purity})</td>
                                    <td style="text-align:right;">${i.net_weight} g</td>
                                    <td style="text-align:right;">₹${i.rate_per_gram.toLocaleString()}</td>
                                    <td style="text-align:right;">₹${(i.making_charges + i.stone_charges).toLocaleString()}</td>
                                    <td style="text-align:right;">₹${i.gst_amount.toFixed(0)}</td>
                                    <td style="text-align:right; font-weight:bold;">₹${i.item_total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="totals">
                        <div>Subtotal: ₹${selectedQuotation.subtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                        <div>CGST (1.5%) + SGST (1.5%): ₹${selectedQuotation.gst_amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                        <div style="font-size: 1.3rem; color: #B8960C; font-weight: bold; margin-top: 5px;">Estimated Grand Total: ₹${selectedQuotation.grand_total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                    </div>
                    <div class="footer">
                        <p>Rates are indicative and fluctuate based on live market pricing. Items will not be delivered without conversion to a regular bill invoice.</p>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="page-wrapper main-content fade-in container" style={{ display: 'grid', gridTemplateColumns: selectedQuotation ? '1fr 380px' : '1fr', gap: '1.5rem' }}>
            <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '36px', color: 'var(--text-primary)', margin: 0 }}>Quotations & Estimates</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Draft cost breakdowns, estimate making and wastage fees, and convert items to sales invoices</p>
                    </div>
                    <button className="btn-primary" onClick={() => setIsBuildModalOpen(true)}>
                        <Plus size={18} style={{ marginRight: '8px' }} /> Create New Estimate
                    </button>
                </div>

                {/* Main List */}
                <div className="card" style={{ padding: 0 }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Quotations Journal</h2>
                    </div>
                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading estimations...</div>
                    ) : quotations.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No estimations generated yet. Create one now.</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Estimate Ref</th>
                                        <th>Customer</th>
                                        <th style={{ textAlign: 'right' }}>Items Count</th>
                                        <th style={{ textAlign: 'right' }}>Subtotal</th>
                                        <th style={{ textAlign: 'right' }}>Est Grand Total</th>
                                        <th style={{ textAlign: 'center' }}>Validity</th>
                                        <th style={{ textAlign: 'center' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quotations.map(q => (
                                        <tr key={q.id} onClick={() => loadQuotationDetails(q)} style={{ cursor: 'pointer', background: selectedQuotation?.id === q.id ? 'rgba(245, 230, 178, 0.2)' : 'transparent' }}>
                                            <td style={{ fontWeight: 600, color: 'var(--gold)' }}>{q.quotation_number}</td>
                                            <td>
                                                <div style={{ fontWeight: 500 }}>{q.customer_name || 'Walkin Customer'}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📞 {q.customer_phone || 'N/A'}</div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>Multiple Items</td>
                                            <td style={{ textAlign: 'right' }}>₹{q.subtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{q.grand_total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                                            <td style={{ textAlign: 'center' }}>{new Date(q.valid_until).toLocaleDateString('en-IN')}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span style={{
                                                    fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px',
                                                    backgroundColor: q.status === 'draft' ? '#ECEFF1' : q.status === 'converted' ? '#E8F5E9' : '#FFF3E0',
                                                    color: q.status === 'draft' ? '#37474F' : q.status === 'converted' ? '#2E7D32' : '#E65100'
                                                }}>{q.status.toUpperCase()}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar Details Drawer */}
            {selectedQuotation && (
                <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'fit-content', border: '1px solid var(--gold-light)', alignSelf: 'start', position: 'sticky', top: '80px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>Estimate Overview</h2>
                            <p style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 600 }}>{selectedQuotation.quotation_number}</p>
                        </div>
                        <button onClick={() => setSelectedQuotation(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                        <div style={{ padding: '10px', background: 'var(--bg)', borderRadius: '8px' }}>
                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Customer Detail</div>
                            <div>👦 {selectedQuotation.customer_name || 'Walkin Customer'}</div>
                            <div>📞 {selectedQuotation.customer_phone || 'No Phone'}</div>
                        </div>

                        <div style={{ padding: '10px', background: 'var(--bg)', borderRadius: '8px' }}>
                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Gold Rate Applied</div>
                            <div>💰 Standard Rate: ₹{selectedQuotation.gold_rate_used || 6450}/g</div>
                            <div>🗓️ Validity: Until {new Date(selectedQuotation.valid_until).toLocaleDateString()}</div>
                        </div>

                        {selectedQuotation.items && (
                            <div style={{ padding: '10px', background: 'var(--bg)', borderRadius: '8px' }}>
                                <div style={{ fontWeight: 600, marginBottom: '4px' }}>Cost Breakdown</div>
                                {selectedQuotation.items.map((i, idx) => (
                                    <div key={idx} style={{ borderBottom: '1px solid var(--border)', padding: '4px 0', fontSize: '0.8rem' }}>
                                        <div><strong>{i.product_name}</strong></div>
                                        <div style={{ color: 'var(--text-secondary)' }}>{i.net_weight}g @ ₹{i.rate_per_gram} (Labor: ₹{i.making_charges + i.stone_charges})</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                        <button className="btn-secondary" onClick={handlePrintQuotation} style={{ width: '100%', padding: '8px' }}><Printer size={14} style={{ marginRight: '6px' }} /> Print Estimate</button>
                        {selectedQuotation.status !== 'converted' && (
                            <button className="btn-primary" onClick={handleConvertQuotationToSale} style={{ width: '100%', padding: '8px' }}><RefreshCcw size={14} style={{ marginRight: '6px' }} /> Convert to Regular Bill</button>
                        )}
                    </div>
                </div>
            )}

            {/* Builder Modal */}
            {isBuildModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }}>
                    <div style={{ background: 'white', borderRadius: 'var(--radius)', width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Quotation Estimate Builder</h3>
                            <button onClick={() => setIsBuildModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSaveQuotation} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflowY: 'auto' }}>
                            <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', borderBottom: '1px solid var(--border)' }}>
                                <div><label>Customer Name</label><input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} /></div>
                                <div><label>Phone Number</label><input type="text" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} /></div>
                                <div><label>Validity Limit</label><input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} /></div>
                            </div>

                            <div style={{ padding: '1.25rem', flexGrow: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                                    <h4 style={{ margin: 0 }}>Quoted Items</h4>
                                    <button type="button" className="btn-secondary" onClick={handleAddItem} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>+ Add Item</button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                                    {items.map((item, idx) => (
                                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'end', background: '#F9FAFB', padding: '8px', borderRadius: '8px' }}>
                                            <div>
                                                <label style={{ fontSize: '0.75rem' }}>Name</label>
                                                <input type="text" required value={item.product_name} onChange={e => handleItemChange(idx, 'product_name', e.target.value)} style={{ padding: '6px' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem' }}>Purity</label>
                                                <select value={item.purity} onChange={e => handleItemChange(idx, 'purity', e.target.value)} style={{ padding: '6px' }}>
                                                    <option value="24K">24K Gold</option>
                                                    <option value="22K">22K Gold</option>
                                                    <option value="18K">18K Gold</option>
                                                    <option value="14K">14K Gold</option>
                                                    <option value="Silver">Silver</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem' }}>Wt (g)</label>
                                                <input type="number" step="0.01" required value={item.net_weight} onChange={e => handleItemChange(idx, 'net_weight', parseFloat(e.target.value) || 0)} style={{ padding: '6px' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem' }}>Rate</label>
                                                <input type="number" required value={item.rate_per_gram} onChange={e => handleItemChange(idx, 'rate_per_gram', parseFloat(e.target.value) || 0)} style={{ padding: '6px' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem' }}>Making</label>
                                                <input type="number" value={item.making_charges} onChange={e => handleItemChange(idx, 'making_charges', parseFloat(e.target.value) || 0)} style={{ padding: '6px' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem' }}>Stones</label>
                                                <input type="number" value={item.stone_charges} onChange={e => handleItemChange(idx, 'stone_charges', parseFloat(e.target.value) || 0)} style={{ padding: '6px' }} />
                                            </div>
                                            <button type="button" onClick={() => handleRemoveItem(idx)} style={{ background: 'none', border: 'none', color: '#FF5252', cursor: 'pointer', paddingBottom: '8px' }}><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ padding: '1.25rem', background: '#F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '0.9rem' }}>
                                    <div>Subtotal: ₹{totals.subtotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                    <div>GST (3%): ₹{totals.gst_amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--gold)' }}>Est Grand Total: ₹{totals.grand_total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                                </div>
                            </div>

                            <div style={{ padding: '1rem 1.25rem', background: 'var(--bg)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button type="button" onClick={() => setIsBuildModalOpen(false)} className="btn-secondary" style={{ padding: '6px 12px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ padding: '6px 16px' }}>Save Estimation</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Quotations;
