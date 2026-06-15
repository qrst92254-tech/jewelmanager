import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Search } from 'lucide-react';
import { authFetch } from '../utils/authFetch';
import BarcodeScanner from './BarcodeScanner';

const API_URL = '';

const SaleForm = ({ isOpen, onClose, onSave, products }) => {
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [items, setItems] = useState([]);
    const [discount, setDiscount] = useState(0);
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [notes, setNotes] = useState('');
    const [gstRate, setGstRate] = useState(3);
    const [customers, setCustomers] = useState([]);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [saleScannerOpen, setSaleScannerOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCustomerName('');
            setCustomerPhone('');
            setItems([]);
            setDiscount(0);
            setPaymentMode('Cash');
            setNotes('');
            setGstRate(3);
            setCustomerSearch('');
            setShowCustomerDropdown(false);
            fetchCustomers();
        }
    }, [isOpen]);

    const fetchCustomers = async () => {
        try {
            const data = await authFetch(`${API_URL}/api/customers`);
            setCustomers(data);
        } catch (e) {
            console.error('Failed to fetch customers:', e);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.phone && c.phone.includes(customerSearch))
    );

    const selectCustomer = (c) => {
        setCustomerName(c.name);
        setCustomerPhone(c.phone || '');
        setCustomerSearch('');
        setShowCustomerDropdown(false);
    };

    const handleAddItem = () => {
        setItems([...items, { product_id: '', quantity: 1, price_at_sale: 0 }]);
    };

    const handleSaleScanResult = (decodedText) => {
        const sku = decodedText.trim();
        const product = products.find(p => p.sku === sku);
        setSaleScannerOpen(false);

        if (!product) {
            alert(`Product with SKU "${sku}" not found in stock.`);
            return;
        }

        const newItem = {
            product_id: String(product.id),
            quantity: 1,
            price_at_sale: product.net_weight * 2000
        };
        setItems(prev => [...prev, newItem]);
    };

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...items];
        updatedItems[index][field] = value;
        if (field === 'product_id') {
            const product = products.find(p => p.id === parseInt(value));
            if (product) {
                updatedItems[index].price_at_sale = product.net_weight * 2000;
            }
        }
        setItems(updatedItems);
    };

    const handleRemoveItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const cgst_rate = gstRate / 2;
        const sgst_rate = gstRate / 2;
        const taxable = subtotal - discount;
        const cgst_amount = taxable * (cgst_rate / 100);
        const sgst_amount = taxable * (sgst_rate / 100);
        const saleData = {
            customer_name: customerName,
            customer_phone: customerPhone,
            items: items.filter(item => item.product_id),
            discount,
            cgst_rate,
            sgst_rate,
            cgst_amount,
            sgst_amount,
            payment_mode: paymentMode,
            notes,
        };
        onSave(saleData);
    };

    if (!isOpen) return null;

    const subtotal = items.reduce((acc, item) => acc + (item.price_at_sale * item.quantity), 0);
    const taxable = subtotal - discount;
    const cgstRateHalf = gstRate / 2;
    const cgst_amount = taxable * (cgstRateHalf / 100);
    const sgst_amount = taxable * (cgstRateHalf / 100);
    const grandTotal = taxable + cgst_amount + sgst_amount;

    return (
        <>
            <div
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50 }}
                onClick={onClose}
            />
            <div
                style={{
                    position: 'fixed', top: 0, right: 0, bottom: 0,
                    width: '100%', maxWidth: '700px',
                    background: 'white', zIndex: 51,
                    boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
                    animation: 'slideInRight 0.3s forwards',
                    display: 'flex', flexDirection: 'column'
                }}
            >
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <h2 style={{ fontSize: '24px', margin: 0 }}>Create New Sale</h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flexGrow: 1, padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', color: 'var(--gold-dark)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Customer Details</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                            <div>
                                <label>Customer Name *</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        value={customerSearch || customerName}
                                        onChange={(e) => {
                                            setCustomerSearch(e.target.value);
                                            setCustomerName(e.target.value);
                                            setShowCustomerDropdown(true);
                                        }}
                                        onFocus={() => setShowCustomerDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                                        placeholder="Search or enter customer name"
                                        required
                                        style={{ paddingLeft: '2rem' }}
                                    />
                                    <Search size={16} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    {showCustomerDropdown && filteredCustomers.length > 0 && (
                                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', maxHeight: '180px', overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                            {filteredCustomers.map(c => (
                                                <div
                                                    key={c.id}
                                                    onMouseDown={() => selectCustomer(c)}
                                                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}
                                                >
                                                    <div style={{ fontWeight: 500 }}>{c.name}</div>
                                                    {c.phone && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.phone}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label>Phone Number</label>
                                <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Enter phone number" />
                            </div>
                        </div>

                        <h3 style={{ fontSize: '1rem', color: 'var(--gold-dark)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Sale Items</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                            {items.map((item, index) => {
                                const itemTotal = item.price_at_sale * item.quantity;
                                return (
                                    <div key={index} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', padding: '1rem', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                                        <div style={{ flex: 2.5 }}>
                                            <label>Product</label>
                                            <select
                                                value={item.product_id}
                                                onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                                            >
                                                <option value="">Select Product</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id} disabled={p.quantity < 1}>
                                                        {p.name} ({p.sku}) — Stock: {p.quantity}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div style={{ flex: 0.8 }}>
                                            <label>Qty</label>
                                            <input
                                                type="number" min="1"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                            />
                                        </div>
                                        <div style={{ flex: 1.2 }}>
                                            <label>Price (₹)</label>
                                            <input
                                                type="number"
                                                value={item.price_at_sale}
                                                onChange={(e) => handleItemChange(index, 'price_at_sale', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div style={{ flex: 1, textAlign: 'right' }}>
                                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total</label>
                                            <div style={{ fontWeight: 600, color: 'var(--gold)', paddingTop: '0.5rem' }}>
                                                ₹{itemTotal.toLocaleString('en-IN')}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(index)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF5252', padding: '0.75rem 0.5rem' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <button
                            type="button"
                            onClick={handleAddItem}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px dashed var(--gold)', color: 'var(--gold)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 500, width: '100%', justifyContent: 'center', marginBottom: '2rem' }}
                        >
                            <Plus size={18} /> Add Item
                        </button>
                        <button
                            type="button"
                            onClick={() => setSaleScannerOpen(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                background: '#B8960C',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '0.85rem'
                            }}
                        >
                            📷 Scan Item
                        </button>

                        <h3 style={{ fontSize: '1rem', color: 'var(--gold-dark)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Payment</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label>Payment Mode</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {['Cash', 'UPI', 'Card'].map(mode => (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => setPaymentMode(mode)}
                                            style={{
                                                flex: 1,
                                                padding: '0.6rem',
                                                border: `1.5px solid ${paymentMode === mode ? 'var(--gold)' : 'var(--border)'}`,
                                                background: paymentMode === mode ? 'var(--gold-light)' : 'white',
                                                color: paymentMode === mode ? 'var(--gold-dark)' : 'var(--text-secondary)',
                                                borderRadius: 'var(--radius-sm)',
                                                cursor: 'pointer',
                                                fontWeight: paymentMode === mode ? 600 : 400,
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label>Discount (₹)</label>
                                    <input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} placeholder="0" />
                                </div>
                                <div>
                                    <label>GST Rate (%)</label>
                                    <select value={gstRate} onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}>
                                        <option value={0}>0% (No GST)</option>
                                        <option value={1.5}>1.5% (0.75% CGST + 0.75% SGST)</option>
                                        <option value={3}>3% (1.5% CGST + 1.5% SGST)</option>
                                        <option value={5}>5% (2.5% CGST + 2.5% SGST)</option>
                                        <option value={12}>12% (6% CGST + 6% SGST)</option>
                                        <option value={18}>18% (9% CGST + 9% SGST)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Notes</label>
                            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="2" placeholder="Optional notes..." />
                        </div>
                    </div>

                    <div style={{ padding: '1.5rem', borderTop: '2px dashed var(--gold)', background: 'var(--bg-card)', flexShrink: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Subtotal: ₹{subtotal.toLocaleString('en-IN')}</div>
                                {discount > 0 && <div style={{ color: '#4CAF50', fontSize: '0.85rem' }}>Discount: -₹{discount.toLocaleString('en-IN')}</div>}
                                {taxable > 0 && gstRate > 0 && (
                                    <>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>CGST ({cgstRateHalf}%): +₹{cgst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>SGST ({cgstRateHalf}%): +₹{sgst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    </>
                                )}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Grand Total</div>
                                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', color: 'var(--gold)', lineHeight: 1 }}>
                                    ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                            <button type="submit" className="btn-primary" style={{ flex: 2 }}>Generate Bill</button>
                        </div>
                    </div>
                </form>
            </div>

            {saleScannerOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.85)',
                    zIndex: 99999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '20px',
                        width: '320px',
                        maxWidth: '90vw'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '12px'
                        }}>
                            <span style={{ fontWeight: 600, fontSize: '1rem' }}>Scan Product Barcode</span>
                            <button
                                type="button"
                                onClick={() => setSaleScannerOpen(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.4rem',
                                    cursor: 'pointer',
                                    color: '#666'
                                }}
                            >✕</button>
                        </div>
                        <BarcodeScanner
                            onResult={handleSaleScanResult}
                            onClose={() => setSaleScannerOpen(false)}
                        />
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `}</style>
        </>
    );
};

export default SaleForm;
