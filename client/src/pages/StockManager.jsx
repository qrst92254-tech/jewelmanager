import React, { useState, useEffect, useCallback } from 'react';
import ProductForm from '../components/ProductForm';
import { Edit, Trash2, PackageSearch, Plus, Search, Filter, X, Printer, Upload } from 'lucide-react';
import ImportModal from '../components/ImportModal';
import { authFetch } from '../utils/authFetch';
import useStore from '../store/useStore';
import BarcodeScanner from '../components/BarcodeScanner';
import JsBarcode from 'jsbarcode';

const API_URL = '';

const StockManager = () => {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scannerOpen, setScannerOpen] = useState(false);
    const [highlightedSku, setHighlightedSku] = useState(null);

    const cachedProducts = useStore(state => state.cache.products);
    const cacheLoading = useStore(state => state.cache.productsLoading);
    const invalidateCache = useStore(state => state.invalidateCache);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const data = await authFetch(`${API_URL}/api/products`);
            setProducts(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (cachedProducts !== null) {
            // Use cached data — instant load
            setProducts(cachedProducts);
            setLoading(false);
        } else {
            // Cache miss — fetch normally
            fetchProducts();
        }
    }, [cachedProducts, fetchProducts]);

    const handleFormSubmit = async (productData) => {
        const url = selectedProduct ? `${API_URL}/api/products/${selectedProduct.id}` : `${API_URL}/api/products`;
        const method = selectedProduct ? 'PUT' : 'POST';

        try {
            await authFetch(url, {
                method,
                body: JSON.stringify(productData),
            });
            invalidateCache('products');
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
                await authFetch(`${API_URL}/api/products/${id}`, { method: 'DELETE' });
                invalidateCache('products');
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
        const sku = product.sku || '';

        // Generate barcode on a canvas in the main window using installed JsBarcode
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, sku, {
            format: 'CODE128',
            width: 3,
            height: 80,
            displayValue: false,
            margin: 10
        });
        const barcodeDataURL = canvas.toDataURL('image/png');

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Tag - ${sku}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; text-align: center; margin: 0; background: white; }
                        .tag-box { border: 2px solid #B8960C; border-radius: 8px; padding: 15px; width: 220px; margin: 0 auto; background: white; }
                        .shop-name { font-size: 0.75rem; color: #B8960C; font-weight: 600; text-transform: uppercase; }
                        .product-name { font-weight: 600; font-size: 0.95rem; margin-top: 4px; }
                        .barcode-wrap { margin: 10px auto 4px; }
                        .barcode-wrap img { width: 200px; }
                        .sku { font-family: monospace; font-size: 1rem; font-weight: bold; letter-spacing: 1px; margin-top: 2px; }
                        .specs { font-size: 0.85rem; color: #555; margin-top: 8px; border-top: 1px dashed #ccc; padding-top: 8px; }
                    </style>
                </head>
                <body onload="window.print(); window.close();">
                    <div class="tag-box">
                        <div class="shop-name">JewelManager Pro</div>
                        <div class="product-name">${product.name}</div>
                        <div class="barcode-wrap">
                            <img src="${barcodeDataURL}" alt="barcode" />
                        </div>
                        <div class="sku">${sku}</div>
                        <div class="specs">
                            <div>Metal: ${product.metal?.toUpperCase() || ''} (${product.purity || ''})</div>
                            <div>Weight: ${product.net_weight || 0}g</div>
                        </div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleScanResult = (decodedText) => {
        const sku = decodedText.trim();
        const found = products.find(p => p.sku === sku);
        setScannerOpen(false);

        if (found) {
            setHighlightedSku(sku);
            setSearchTerm(sku);
            setTimeout(() => setHighlightedSku(null), 3000);
        } else {
            setSelectedProduct(null);
            setIsFormOpen(true);
            alert(`SKU "${sku}" not found in stock. Please add it as a new product.`);
        }
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
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn-secondary" onClick={() => setShowImport(true)}>
                        <Upload size={18} style={{ marginRight: '8px' }} /> Import
                    </button>
                    <button className="btn-primary" onClick={() => { setSelectedProduct(null); setIsFormOpen(true); }}>
                        <Plus size={18} style={{ marginRight: '8px' }} /> Add Product
                    </button>
                    <button
                        onClick={() => setScannerOpen(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            background: '#B8960C',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.9rem'
                        }}
                    >
                        📷 Scan
                    </button>
                </div>
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
                {loading || cacheLoading ? (
                    <div style={{ padding: '1rem' }}>
                        {[...Array(5)].map((_, i) => (
                            <div key={i} style={{
                                display: 'grid',
                                gridTemplateColumns: '100px 1fr 120px 120px 80px 80px 100px',
                                gap: '1rem',
                                padding: '1rem 1.5rem',
                                borderBottom: '1px solid var(--border)',
                                alignItems: 'center'
                            }}>
                                {[100, 180, 100, 100, 60, 60, 80].map((w, j) => (
                                    <div key={j} style={{
                                        height: '14px',
                                        width: `${w}px`,
                                        borderRadius: '7px',
                                        background: 'linear-gradient(90deg, var(--border) 25%, var(--bg-card) 50%, var(--border) 75%)',
                                        backgroundSize: '200% 100%',
                                        animation: 'shimmer 1.5s infinite',
                                    }} />
                                ))}
                            </div>
                        ))}
                        <style>{`
                            @keyframes shimmer {
                                0% { background-position: 200% 0; }
                                100% { background-position: -200% 0; }
                            }
                        `}</style>
                    </div>
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
                                        <tr key={p.id} style={{
                                            outline: highlightedSku === p.sku ? '3px solid #B8960C' : 'none',
                                            transition: 'outline 0.3s ease'
                                        }}>
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

            <ImportModal
                isOpen={showImport}
                onClose={() => setShowImport(false)}
                importType="products"
                onSuccess={() => { setShowImport(false); fetchProducts(); }}
            />

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

            {scannerOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.8)',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px'
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
                                onClick={() => setScannerOpen(false)}
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
                            onResult={handleScanResult}
                            onClose={() => setScannerOpen(false)}
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
        </div>
    );
};

export default StockManager;