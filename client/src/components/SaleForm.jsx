import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const SaleForm = ({ isOpen, onClose, onSave, products }) => {
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [items, setItems] = useState([]);
    const [discount, setDiscount] = useState(0);
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isOpen) {
            setCustomerName('');
            setCustomerPhone('');
            setItems([]);
            setDiscount(0);
            setPaymentMode('Cash');
            setNotes('');
        }
    }, [isOpen]);

    const handleAddItem = () => {
        setItems([...items, { product_id: '', quantity: 1, price_at_sale: 0 }]);
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
        const saleData = {
            customer_name: customerName,
            customer_phone: customerPhone,
            items: items.filter(item => item.product_id),
            discount,
            payment_mode: paymentMode,
            notes,
        };
        onSave(saleData);
    };

    if (!isOpen) return null;

    const subtotal = items.reduce((acc, item) => acc + (item.price_at_sale * item.quantity), 0);
    const total = subtotal - discount;

    return (
        <>
            {/* Backdrop */}
            <div 
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50 }}
                onClick={onClose}
            />
            {/* Slide-in Panel */}
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
                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <h2 style={{ fontSize: '24px', margin: 0 }}>Create New Sale</h2>
                    <button 
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flexGrow: 1, padding: '1.5rem' }}>
                        {/* Customer Details */}
                        <h3 style={{ fontSize: '1rem', color: 'var(--gold-dark)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Customer Details</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                            <div>
                                <label>Customer Name *</label>
                                <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter customer name" required />
                            </div>
                            <div>
                                <label>Phone Number</label>
                                <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Enter phone number" />
                            </div>
                        </div>

                        {/* Sale Items */}
                        <h3 style={{ fontSize: '1rem', color: 'var(--gold-dark)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Sale Items</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                            {items.map((item, index) => (
                                <div key={index} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', padding: '1rem', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                                    <div style={{ flex: 3 }}>
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
                                    <div style={{ flex: 1 }}>
                                        <label>Qty</label>
                                        <input
                                            type="number" min="1"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                        />
                                    </div>
                                    <div style={{ flex: 1.5 }}>
                                        <label>Price (₹)</label>
                                        <input
                                            type="number"
                                            value={item.price_at_sale}
                                            onChange={(e) => handleItemChange(index, 'price_at_sale', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveItem(index)} 
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF5252', padding: '0.75rem 0.5rem' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button 
                            type="button" 
                            onClick={handleAddItem} 
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px dashed var(--gold)', color: 'var(--gold)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 500, width: '100%', justifyContent: 'center', marginBottom: '2rem' }}
                        >
                            <Plus size={18} /> Add Item
                        </button>

                        {/* Payment & Notes */}
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
                            <div>
                                <label>Discount (₹)</label>
                                <input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} placeholder="0" />
                            </div>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Notes</label>
                            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="2" placeholder="Optional notes..." />
                        </div>
                    </div>

                    {/* Footer with Total */}
                    <div style={{ padding: '1.5rem', borderTop: '2px dashed var(--gold)', background: 'var(--bg-card)', flexShrink: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Subtotal: ₹{subtotal.toLocaleString('en-IN')}</div>
                                {discount > 0 && <div style={{ color: '#4CAF50', fontSize: '0.85rem' }}>Discount: -₹{discount.toLocaleString('en-IN')}</div>}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total</div>
                                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', color: 'var(--gold)', lineHeight: 1 }}>
                                    ₹{total.toLocaleString('en-IN')}
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