import React, { useState, useEffect, useCallback } from 'react';
import ProductForm from '../components/ProductForm';
import { Edit, Trash2, PackageSearch, Plus, Search, Filter, X, Printer } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const StockManager = () => {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
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
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleFormSubmit = async (productData) => {
        const url = selectedProduct ? `${API_URL}/api/products/${selectedProduct.id}` : `${API_URL}/api/products`;
        const method = selectedProduct ? 'PUT' : 'POST';
        const token = localStorage.getItem('jewel_token');

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(productData),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Form submission failed');
            }
            await fetchProducts();
            handleCloseForm();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleEdit = (product) => {
        setSelectedProduct(product);
        setIsFormOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                const token = localStorage.getItem('jewel_token');
                const response = await fetch(`${API_URL}/api/products/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token && { 'Authorization': `Bearer ${token}` })
                    }
                });
                if (!response.ok) throw new Error('Failed to delete product');
                await fetchProducts();
            } catch (err) {
                setError(err.message);
            }
        }
    };

    const handleCloseForm = () => {
        setSelectedProduct(null);
        setIsFormOpen(false);
    };

    const handlePrintTag = (product) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Tag - ${product.sku}</title>
                    <style>
                        body { font-family: 'DM Sans', sans-serif; padding: 20px; text-align: center; }
                        .tag-box { border: 2px solid #B8960C; border-radius: 8px; padding: 15px; width: 220px; margin: 0 auto; background: white; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
                        .sku { font-family: monospace; font-size: 1.1rem; font-weight: bold; letter-spacing: 1px; margin-top: 5px; }
                        .barcode { height: 40px; border-left: 2px solid black; border-right: 2px solid black; border-top: 1px solid black; border-bottom: 1px solid black; margin: 10px auto; width: 150px; background: repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 6px); }
                        .specs { font-size: 0.85rem; color: #555; margin-top: 8px; border-top: 1px dashed #ccc; padding-top: 8px; }
                    </style>
                </head>
                <body onload="window.print();window.close();">
                    <div class="tag-box">
                        <div style="font-size:0.75rem; color:#B8960C; font-weight:600; text-transform:uppercase;">JewelManager Pro</div>
                        <div style="font-weight:600; font-size:0.95rem; margin-top:4px;">${product.name}</div>
                        <div class="barcode"></div>
                        <div class="sku">${product.sku}</div>
                        <div class="specs">
                            <div>Metal: ${product.metal?.toUpperCase()} (${product.purity})</div>
                            <div>Weight: ${product.net_weight}g</div>
                        </div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const filteredProducts = products.filter(p => 
        (p.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.sku ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalItems = products.length;
    const lowStock = products.filter(p => p.quantity <= (p.stock_alert_threshold || 1)).length;
    const totalValue = products.reduce((acc, p) => acc + (p.net_weight * 6450), 0); // Simplified value calc for demo

    return (
        <div className="page-wrapper main-content fade-in container" style={{ position: 'relative' }}>
            
            {/* Header Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '36px', color: 'var(--text-primary)', margin: 0 }}>Inventory</h1>
                <button className="btn-primary" onClick={() => { setSelectedProduct(null); setIsFormOpen(true); }}>
                    <Plus size={18} style={{ marginRight: '8px' }} /> Add Product
                </button>
            </div>

            {/* Error Banner */}
            {error && (
                <div style={{ background: '#FFF4F4', borderLeft: '4px solid #FF5252', padding: '1rem', marginBottom: '1.5rem', color: '#D32F2F', borderRadius: '4px' }}>
                    {error}
                </div>
            )}

            {/* Stats Row */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '0.75rem 1.5rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total Items:</span>
                    <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{totalItems}</span>
                </div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '0.75rem 1.5rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Low Stock:</span>
                    <span style={{ fontWeight: 600, fontSize: '1.1rem', color: lowStock > 0 ? '#FF5252' : '#4CAF50' }}>{lowStock}</span>
                </div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '0.75rem 1.5rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Est. Value:</span>
                    <span style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--gold)' }}>₹ {(totalValue / 100000).toFixed(2)}L</span>
                </div>
            </div>

            {/* Filters Row */}
            <div className="card" style={{ marginBottom: '2rem', padding: '1rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flexGrow: 1, minWidth: '250px', position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                        type="text" 
                        placeholder="Search by SKU or Name..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '2.5rem', margin: 0 }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Filter size={18} color="var(--text-muted)" />
                    <select style={{ width: '130px', margin: 0 }}><option>All Categories</option></select>
                    <select style={{ width: '120px', margin: 0 }}><option>All Metals</option></select>
                    <select style={{ width: '110px', margin: 0 }}><option>All Purity</option></select>
                </div>
            </div>

            {/* Product Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading inventory...</div>
                ) : products.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <PackageSearch size={48} color="var(--border)" style={{ margin: '0 auto 1rem' }} />
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No Products Found</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Your inventory is empty. Add a new product to get started.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>SKU</th>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Metal & Purity</th>
                                    <th>Net Wt.</th>
                                    <th>Stock</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map(p => {
                                    const isLow = p.quantity <= (p.stock_alert_threshold || 1);
                                    return (
                                        <tr key={p.id}>
                                            <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{p.sku}</td>
                                            <td style={{ fontWeight: 500 }}>{p.name}</td>
                                            <td>{p.category}</td>
                                            <td>{p.purity} {p.metal}</td>
                                            <td>{p.net_weight}g</td>
                                            <td>
                                                <span style={{ 
                                                    background: isLow ? '#FFF4F4' : '#F4FBF5', 
                                                    color: isLow ? '#D32F2F' : '#2E7D32',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600
                                                }}>
                                                    {p.quantity} {isLow && '⚠️'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button 
                                                    onClick={() => handleEdit(p)} 
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-secondary)' }}
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handlePrintTag(p)} 
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--gold)', marginLeft: '8px' }}
                                                    title="Print Barcode Tag"
                                                >
                                                    <Printer size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(p.id)} 
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#FF5252', marginLeft: '8px' }}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Sliding Drawer Modal */}
            {isFormOpen && (
                <>
                    <div 
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50 }} 
                        onClick={handleCloseForm}
                    />
                    <div 
                        className="fade-in"
                        style={{ 
                            position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '600px', 
                            background: 'white', zIndex: 51, boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
                            animation: 'slideInRight 0.3s forwards'
                        }}
                    >
                        <button 
                            onClick={handleCloseForm}
                            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        >
                            <X size={24} />
                        </button>
                        <ProductForm product={selectedProduct} onSubmit={handleFormSubmit} onClear={handleCloseForm} />
                    </div>
                </>
            )}

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `}</style>
        </div>
    );
};

export default StockManager;