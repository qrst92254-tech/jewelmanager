import React, { useState, useEffect } from 'react';
import { Plus, Search, Truck, ArrowUpRight, Scale, X, CheckCircle, PlusCircle, Trash2 } from 'lucide-react';

const API_URL = '';

const Purchases = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeMainTab, setActiveMainTab] = useState('orders'); // 'orders' or 'suppliers'

    // Modals
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

    // Form states
    const [supplierForm, setSupplierForm] = useState({ name: '', contact_person: '', phone: '', email: '', address: '', gstin: '', supplier_type: 'wholesaler' });
    const [orderForm, setOrderForm] = useState({
        supplier_id: '', order_date: new Date().toISOString().split('T')[0], expected_date: '',
        amount_paid: 0, payment_method: 'cash', notes: ''
    });
    const [items, setItems] = useState([
        { product_name: 'Raw Gold Bar 999', category: 'bullion', metal: 'gold', purity: '24K', gross_weight: 100, net_weight: 100, quantity: 1, rate_per_gram: 7200, making_charges: 0 }
    ]);

    const fetchSuppliers = async () => {
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/purchases/suppliers`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (res.ok) {
                const data = await res.json();
                setSuppliers(data);
                if (data.length > 0 && !orderForm.supplier_id) {
                    setOrderForm(prev => ({ ...prev, supplier_id: data[0].id }));
                }
            }
        } catch (e) { console.error(e); }
    };

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/purchases/orders`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (res.ok) setOrders(await res.json());
        } catch (e) { console.error(e); }
    };

    const loadOrderDetails = async (order) => {
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/purchases/orders/${order.id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (res.ok) setSelectedOrder(await res.json());
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchSuppliers(), fetchOrders()]);
            setLoading(false);
        };
        init();
    }, []);

    const handleCreateSupplier = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/purchases/suppliers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(supplierForm)
            });
            if (res.ok) {
                setIsSupplierModalOpen(false);
                setSupplierForm({ name: '', contact_person: '', phone: '', email: '', address: '', gstin: '', supplier_type: 'wholesaler' });
                await fetchSuppliers();
            }
        } catch (e) { console.error(e); }
    };

    const handleAddItem = () => {
        setItems([...items, { product_name: '', category: 'bullion', metal: 'gold', purity: '24K', gross_weight: 0, net_weight: 0, quantity: 1, rate_per_gram: 0, making_charges: 0 }]);
    };

    const handleRemoveItem = (idx) => {
        setItems(items.filter((_, i) => i !== idx));
    };

    const handleItemChange = (idx, field, val) => {
        const updated = [...items];
        updated[idx][field] = val;
        setItems(updated);
    };

    const calculateTotals = () => {
        let subtotal = 0;
        const calculatedItems = items.map(item => {
            const wt = parseFloat(item.net_weight || item.gross_weight) || 0;
            const rate = parseFloat(item.rate_per_gram) || 0;
            const making = parseFloat(item.making_charges) || 0;
            const qty = parseInt(item.quantity) || 1;
            const total = (wt * rate + making) * qty;
            subtotal += total;
            return { ...item, item_total: total };
        });
        const gst = subtotal * 0.03; // GST is 3%
        return { items: calculatedItems, subtotal, gst_amount: gst, grand_total: subtotal + gst };
    };

    const totals = calculateTotals();

    const handleCreateOrder = async (e) => {
        e.preventDefault();
        if (items.length === 0) {
            alert('Quotation must contain at least 1 item.');
            return;
        }

        const payload = {
            ...orderForm,
            subtotal: totals.subtotal,
            gst_amount: totals.gst_amount,
            grand_total: totals.grand_total,
            items: totals.items
        };

        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/purchases/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setIsOrderModalOpen(false);
                setItems([{ product_name: 'Raw Gold Bar 999', category: 'bullion', metal: 'gold', purity: '24K', gross_weight: 100, net_weight: 100, quantity: 1, rate_per_gram: 7200, making_charges: 0 }]);
                setOrderForm({ supplier_id: suppliers[0]?.id || '', order_date: new Date().toISOString().split('T')[0], expected_date: '', amount_paid: 0, payment_method: 'cash', notes: '' });
                await Promise.all([fetchOrders(), fetchSuppliers()]);
            }
        } catch (e) { console.error(e); }
    };

    const totalOutstandingVal = suppliers.reduce((acc, s) => acc + (s.outstanding_amount || 0), 0);
    const totalPurchaseVal = orders.reduce((acc, o) => acc + (o.grand_total || 0), 0);

    return (
        <div className="page-wrapper main-content fade-in container" style={{ display: 'grid', gridTemplateColumns: selectedOrder ? '1fr 380px' : '1fr', gap: '1.5rem' }}>
            <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '36px', color: 'var(--text-primary)', margin: 0 }}>Purchase & Supplier Management</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Log raw gold/silver metal buys, custom orders from wholesalers, and credit balances</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="btn-secondary" onClick={() => setIsSupplierModalOpen(true)}>Add Supplier</button>
                        <button className="btn-primary" onClick={() => setIsOrderModalOpen(true)}>
                            <Plus size={18} style={{ marginRight: '8px' }} /> Record Purchase
                        </button>
                    </div>
                </div>

                {/* Main Tab Links */}
                <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
                    <button onClick={() => setActiveMainTab('orders')} style={{ background: 'none', border: 'none', padding: '12px 16px', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, color: activeMainTab === 'orders' ? 'var(--gold)' : 'var(--text-secondary)', borderBottom: activeMainTab === 'orders' ? '3px solid var(--gold)' : 'none' }}>Purchase Orders</button>
                    <button onClick={() => setActiveMainTab('suppliers')} style={{ background: 'none', border: 'none', padding: '12px 16px', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, color: activeMainTab === 'suppliers' ? 'var(--gold)' : 'var(--text-secondary)', borderBottom: activeMainTab === 'suppliers' ? '3px solid var(--gold)' : 'none' }}>Supplier Directory</button>
                </div>

                {/* Dashboard Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--gold)' }}>
                        <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '50%', color: 'var(--gold)' }}><Truck size={20} /></div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Purchase Spend</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>₹{totalPurchaseVal.toLocaleString('en-IN')}</div>
                        </div>
                    </div>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #FF5252' }}>
                        <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '50%', color: '#FF5252' }}><ArrowUpRight size={20} /></div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Supplier Outstanding</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>₹{totalOutstandingVal.toLocaleString('en-IN')}</div>
                        </div>
                    </div>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #4CAF50' }}>
                        <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '50%', color: '#4CAF50' }}><Scale size={20} /></div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Registered Vendors</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{suppliers.length} active</div>
                        </div>
                    </div>
                </div>

                {activeMainTab === 'orders' ? (
                    <div className="card" style={{ padding: 0 }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Purchase Log</h2>
                        </div>
                        {loading ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading purchases...</div>
                        ) : orders.length === 0 ? (
                            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No purchase orders logged yet.</div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>PO Number</th>
                                            <th>Supplier</th>
                                            <th>Order Date</th>
                                            <th style={{ textAlign: 'right' }}>Total Cost</th>
                                            <th style={{ textAlign: 'right' }}>Amount Paid</th>
                                            <th style={{ textAlign: 'center' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map(o => (
                                            <tr key={o.id} onClick={() => loadOrderDetails(o)} style={{ cursor: 'pointer', background: selectedOrder?.id === o.id ? 'rgba(245, 230, 178, 0.2)' : 'transparent' }}>
                                                <td style={{ fontWeight: 600, color: 'var(--gold)' }}>{o.po_number}</td>
                                                <td>{o.supplier_name}</td>
                                                <td>{new Date(o.order_date).toLocaleDateString('en-IN')}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{o.grand_total.toLocaleString('en-IN')}</td>
                                                <td style={{ textAlign: 'right' }}>₹{o.amount_paid.toLocaleString('en-IN')}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span style={{
                                                        fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px',
                                                        backgroundColor: o.status === 'completed' ? '#E8F5E9' : '#FFF3E0',
                                                        color: o.status === 'completed' ? '#2E7D32' : '#E65100'
                                                    }}>{o.status.toUpperCase()}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="card" style={{ padding: 0 }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Supplier Register</h2>
                        </div>
                        {loading ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading suppliers...</div>
                        ) : suppliers.length === 0 ? (
                            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No suppliers registered.</div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Company Name</th>
                                            <th>Contact Person</th>
                                            <th>Mobile</th>
                                            <th>GSTIN</th>
                                            <th style={{ textAlign: 'right' }}>Total Purchases</th>
                                            <th style={{ textAlign: 'right' }}>Outstanding Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {suppliers.map(s => (
                                            <tr key={s.id}>
                                                <td style={{ fontWeight: 600 }}>{s.name}</td>
                                                <td>{s.contact_person || 'N/A'}</td>
                                                <td>{s.phone || 'N/A'}</td>
                                                <td>{s.gstin || 'N/A'}</td>
                                                <td style={{ textAlign: 'right' }}>₹{(s.total_purchases || 0).toLocaleString('en-IN')}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 600, color: s.outstanding_amount > 0 ? '#FF5252' : 'inherit' }}>₹{(s.outstanding_amount || 0).toLocaleString('en-IN')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Sidebar Details Drawer */}
            {selectedOrder && (
                <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'fit-content', border: '1px solid var(--gold-light)', alignSelf: 'start', position: 'sticky', top: '80px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>Purchase Overview</h2>
                            <p style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 600 }}>{selectedOrder.po_number}</p>
                        </div>
                        <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                        <div style={{ padding: '10px', background: 'var(--bg)', borderRadius: '8px' }}>
                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Supplier Details</div>
                            <div>🏢 {selectedOrder.supplier_name}</div>
                            <div>📅 Purchase Date: {new Date(selectedOrder.order_date).toLocaleDateString()}</div>
                        </div>

                        <div style={{ padding: '10px', background: 'var(--bg)', borderRadius: '8px' }}>
                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Charges & Outlay</div>
                            <div>💵 Total Bill Amount: ₹{selectedOrder.grand_total.toLocaleString()}</div>
                            <div>💸 Amount Settled: ₹{selectedOrder.amount_paid.toLocaleString()}</div>
                            <div style={{ color: '#FF5252', fontWeight: 600 }}>💵 Credit Balance: ₹{(selectedOrder.grand_total - selectedOrder.amount_paid).toLocaleString()}</div>
                        </div>

                        {selectedOrder.items && (
                            <div style={{ padding: '10px', background: 'var(--bg)', borderRadius: '8px' }}>
                                <div style={{ fontWeight: 600, marginBottom: '4px' }}>Purchased Items</div>
                                {selectedOrder.items.map((i, idx) => (
                                    <div key={idx} style={{ borderBottom: '1px solid var(--border)', padding: '4px 0', fontSize: '0.8rem' }}>
                                        <div><strong>{i.product_name}</strong></div>
                                        <div style={{ color: 'var(--text-secondary)' }}>{i.gross_weight}g @ ₹{i.rate_per_gram}/g (Qty: {i.quantity})</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modals */}
            {isSupplierModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }}>
                    <div style={{ background: 'white', borderRadius: 'var(--radius)', width: '100%', maxWidth: '440px' }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Register Wholesaler / Vendor</h3>
                            <button onClick={() => setIsSupplierModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreateSupplier} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div><label>Supplier/Company Name *</label><input type="text" required value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} /></div>
                            <div><label>Contact Person</label><input type="text" value={supplierForm.contact_person} onChange={e => setSupplierForm({ ...supplierForm, contact_person: e.target.value })} /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div><label>Phone Number</label><input type="text" value={supplierForm.phone} onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })} /></div>
                                <div><label>Email Address</label><input type="email" value={supplierForm.email} onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })} /></div>
                            </div>
                            <div><label>GSTIN Identifier</label><input type="text" value={supplierForm.gstin} onChange={e => setSupplierForm({ ...supplierForm, gstin: e.target.value.toUpperCase() })} /></div>
                            <div><label>Company Address</label><input type="text" value={supplierForm.address} onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })} /></div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setIsSupplierModalOpen(false)} className="btn-secondary" style={{ padding: '6px 12px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ padding: '6px 16px' }}>Save Supplier</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isOrderModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }}>
                    <div style={{ background: 'white', borderRadius: 'var(--radius)', width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Record Raw Metal Acquisition</h3>
                            <button onClick={() => setIsOrderModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflowY: 'auto' }}>
                            <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', borderBottom: '1px solid var(--border)' }}>
                                <div>
                                    <label>Select Wholesaler / Vendor</label>
                                    <select value={orderForm.supplier_id} onChange={e => setOrderForm({ ...orderForm, supplier_id: e.target.value })}>
                                        {suppliers.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div><label>Purchase Date *</label><input type="date" required value={orderForm.order_date} onChange={e => setOrderForm({ ...orderForm, order_date: e.target.value })} /></div>
                                <div><label>Expected Delivery</label><input type="date" value={orderForm.expected_date} onChange={e => setOrderForm({ ...orderForm, expected_date: e.target.value })} /></div>
                            </div>

                            <div style={{ padding: '1.25rem', flexGrow: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                                    <h4 style={{ margin: 0 }}>Raw Items purchased</h4>
                                    <button type="button" className="btn-secondary" onClick={handleAddItem} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>+ Add Item</button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
                                    {items.map((item, idx) => (
                                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'end', background: '#F9FAFB', padding: '8px', borderRadius: '8px' }}>
                                            <div>
                                                <label style={{ fontSize: '0.75rem' }}>Item Name</label>
                                                <input type="text" required value={item.product_name} onChange={e => handleItemChange(idx, 'product_name', e.target.value)} style={{ padding: '6px' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem' }}>Metal</label>
                                                <select value={item.metal} onChange={e => handleItemChange(idx, 'metal', e.target.value)} style={{ padding: '6px' }}>
                                                    <option value="gold">Gold</option>
                                                    <option value="silver">Silver</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem' }}>Net Wt (g)</label>
                                                <input type="number" step="0.01" required value={item.net_weight} onChange={e => handleItemChange(idx, 'net_weight', parseFloat(e.target.value) || 0)} style={{ padding: '6px' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem' }}>Rate / g</label>
                                                <input type="number" required value={item.rate_per_gram} onChange={e => handleItemChange(idx, 'rate_per_gram', parseFloat(e.target.value) || 0)} style={{ padding: '6px' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem' }}>Making Chgs</label>
                                                <input type="number" value={item.making_charges} onChange={e => handleItemChange(idx, 'making_charges', parseFloat(e.target.value) || 0)} style={{ padding: '6px' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem' }}>Quantity</label>
                                                <input type="number" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)} style={{ padding: '6px' }} />
                                            </div>
                                            <button type="button" onClick={() => handleRemoveItem(idx)} style={{ background: 'none', border: 'none', color: '#FF5252', cursor: 'pointer', paddingBottom: '8px' }}><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ padding: '1.25rem', background: '#F3F4F6', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ fontSize: '0.9rem' }}>
                                    <div>Subtotal: ₹{totals.subtotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                    <div>GST (3%): ₹{totals.gst_amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--gold)', marginTop: '4px' }}>Grand Total: ₹{totals.grand_total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div><label>Immediate Payment (₹)</label><input type="number" value={orderForm.amount_paid} onChange={e => setOrderForm({ ...orderForm, amount_paid: parseFloat(e.target.value) || 0 })} /></div>
                                    <div>
                                        <label>Payment Method</label>
                                        <select value={orderForm.payment_method} onChange={e => setOrderForm({ ...orderForm, payment_method: e.target.value })}>
                                            <option value="cash">Cash</option>
                                            <option value="bank">Bank Transfer</option>
                                            <option value="gold_exchange">Metal Exchange</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '1rem 1.25rem', background: 'var(--bg)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button type="button" onClick={() => setIsOrderModalOpen(false)} className="btn-secondary" style={{ padding: '6px 12px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ padding: '6px 16px' }}><CheckCircle size={14} style={{ marginRight: '6px' }} /> Record Stock Purchase</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Purchases;
