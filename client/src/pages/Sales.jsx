import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Plus, Eye, Printer, Trash2, ShoppingCart, X, Share2 } from 'lucide-react';
import SaleForm from '../components/SaleForm';
import BillTemplate from '../components/BillTemplate';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Sales = () => {
    const [sales, setSales] = useState([]);
    const [products, setProducts] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const billRef = useRef();

    const fetchSales = async () => {
        try {
            const token = localStorage.getItem('jewel_token');
            const response = await fetch(`${API_URL}/api/sales`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (!response.ok) throw new Error('Failed to fetch sales');
            const data = await response.json();
            setSales(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem('jewel_token');
            const response = await fetch(`${API_URL}/api/products`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (!response.ok) throw new Error('Failed to fetch products');
            const data = await response.json();
            setProducts(data);
        } catch (err) {
            console.error("Error fetching products for sale form:", err);
        }
    };

    useEffect(() => {
        fetchSales();
        fetchProducts();
    }, []);

    const handleSaveSale = async (saleData) => {
        try {
            const token = localStorage.getItem('jewel_token');
            const response = await fetch(`${API_URL}/api/sales`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(saleData),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to create sale');
            }
            setIsFormOpen(false);
            fetchSales();
            fetchProducts();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const handleDeleteSale = async (id) => {
        if (window.confirm('Are you sure you want to delete this sale? This action cannot be undone.')) {
            try {
                const token = localStorage.getItem('jewel_token');
                const response = await fetch(`${API_URL}/api/sales/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token && { 'Authorization': `Bearer ${token}` })
                    }
                });
                if (!response.ok) throw new Error('Failed to delete sale');
                fetchSales();
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        }
    };

    const handleViewBill = async (id) => {
        try {
            const token = localStorage.getItem('jewel_token');
            const response = await fetch(`${API_URL}/api/sales/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (!response.ok) throw new Error('Failed to fetch sale details');
            const data = await response.json();
            setSelectedSale(data);
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const handlePrint = useReactToPrint({
        content: () => billRef.current,
        documentTitle: `Invoice-${selectedSale?.bill_number || 'bill'}`,
    });

    const handleWhatsAppShare = () => {
        if (!selectedSale) return;
        const msg = `Hello ${selectedSale.customer_name || 'Valued Customer'}, your bill summary from JewelManager Pro is: Bill No: ${selectedSale.bill_number}, Total Amount: ₹${(selectedSale.final_amount || 0).toLocaleString('en-IN')}. Thank you!`;
        const phone = selectedSale.customer_phone ? selectedSale.customer_phone.replace(/\D/g, '') : '';
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    return (
        <div className="page-wrapper main-content fade-in container">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '36px', color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>Sales</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Create invoices and manage sales history</p>
                </div>
                <button className="btn-primary" onClick={() => setIsFormOpen(true)}>
                    <Plus size={18} style={{ marginRight: '8px' }} /> New Sale
                </button>
            </div>

            {/* Error Banner */}
            {error && (
                <div style={{ background: '#FFF4F4', borderLeft: '4px solid #FF5252', padding: '1rem', marginBottom: '1.5rem', color: '#D32F2F', borderRadius: '4px' }}>
                    {error}
                </div>
            )}

            {/* Sales History Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Sales History</h2>
                    <span className="gold-badge">{sales.length} Records</span>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading sales...</div>
                ) : sales.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <ShoppingCart size={48} color="var(--border)" style={{ margin: '0 auto 1rem', display: 'block' }} />
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No Sales Yet</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Create your first sale to get started.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Bill No.</th>
                                    <th>Customer</th>
                                    <th>Date</th>
                                    <th>Payment</th>
                                    <th style={{ textAlign: 'right' }}>Amount</th>
                                    <th style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map(sale => (
                                    <tr key={sale.id}>
                                        <td style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--gold)' }}>{sale.bill_number}</td>
                                        <td>{sale.customer_name}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{new Date(sale.sale_date).toLocaleDateString('en-IN')}</td>
                                        <td>
                                            <span className="gold-badge">{sale.payment_mode || 'Cash'}</span>
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                            ₹{(sale.final_amount || 0).toLocaleString('en-IN')}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button 
                                                onClick={() => handleViewBill(sale.id)} 
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--gold)' }}
                                                title="View Bill"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteSale(sale.id)} 
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#FF5252', marginLeft: '8px' }}
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Sale Form Drawer */}
            <SaleForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSaveSale}
                products={products}
            />

            {/* Bill View Modal */}
            {selectedSale && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }}>
                    <div style={{ background: '#F5F5F5', borderRadius: 'var(--radius)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        {/* Modal Header */}
                        <div style={{ padding: '1rem 1.5rem', background: 'white', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Invoice: {selectedSale.bill_number}</h3>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button onClick={handlePrint} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
                                    <Printer size={16} style={{ marginRight: '6px' }} /> Print
                                </button>
                                <button onClick={handleWhatsAppShare} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                                    <Share2 size={16} style={{ marginRight: '6px' }} /> Share WhatsApp
                                </button>
                                <button 
                                    onClick={() => setSelectedSale(null)} 
                                    style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                        {/* Bill Content */}
                        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
                            <BillTemplate ref={billRef} sale={selectedSale} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sales;