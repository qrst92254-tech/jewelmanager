import React, { forwardRef } from 'react';

const BillTemplate = forwardRef(({ sale, shop = {} }, ref) => {
    if (!sale) return null;

    const shopName = shop.shop_name || 'JewelManager Pro';
    const shopAddress = shop.shop_address || shop.address || '';
    const shopPhone = shop.shop_phone || shop.phone || '';
    const shopGstin = shop.shop_gstin || shop.gstin || '';
    const billFooter = shop.bill_footer || shop.invoice_terms || 'Thank you for your business!';

    const renderPrice = (value) => '₹' + (value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div ref={ref} className="print-bill-root" style={{ padding: '2.5rem', background: 'white', color: '#1A1A1A', fontFamily: "'DM Sans', sans-serif", maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px double #B8960C', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', fontWeight: 600, color: '#B8960C', margin: '0 0 0.25rem 0' }}>
                        💎 {shopName}
                    </h1>
                    {shopAddress && (
                        <p style={{ fontSize: '0.85rem', color: '#666', margin: '0.15rem 0' }}>{shopAddress}</p>
                    )}
                    {shopPhone && (
                        <p style={{ fontSize: '0.85rem', color: '#666', margin: '0.15rem 0' }}>Phone: {shopPhone}</p>
                    )}
                    {shopGstin && (
                        <p style={{ fontSize: '0.85rem', color: '#666', margin: '0.15rem 0', fontWeight: 600 }}>GSTIN: {shopGstin}</p>
                    )}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', fontWeight: 600, color: '#B8960C', margin: '0', letterSpacing: '2px' }}>TAX INVOICE</h2>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                <div style={{ background: '#FAFAF8', padding: '1rem', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', marginBottom: '0.5rem' }}>Bill To</p>
                    <p style={{ fontWeight: 600, fontSize: '1.1rem', margin: '0 0 0.25rem 0' }}>{sale.customer_name}</p>
                    {sale.customer_phone && <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>Phone: {sale.customer_phone}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ color: '#999', fontSize: '0.85rem' }}>Bill Number: </span>
                        <span style={{ fontWeight: 600, color: '#B8960C' }}>{sale.bill_number}</span>
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ color: '#999', fontSize: '0.85rem' }}>Date: </span>
                        <span style={{ fontWeight: 500 }}>{new Date(sale.sale_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div>
                        <span style={{ color: '#999', fontSize: '0.85rem' }}>Payment: </span>
                        <span style={{ fontWeight: 500 }}>{sale.payment_mode || 'Cash'}</span>
                    </div>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                <thead>
                    <tr style={{ background: '#B8960C' }}>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'white', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>#</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'white', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Item Description</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'white', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>HSN</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'white', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qty</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'white', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items?.map((item, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #E5E1D8' }}>
                            <td style={{ padding: '0.85rem 1rem', fontSize: '0.9rem' }}>{index + 1}</td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.name} ({item.sku})</div>
                                <div style={{ fontSize: '0.8rem', color: '#999' }}>{item.metal} — {item.purity} | Net Wt: {item.net_weight || '-'}g</div>
                            </td>
                            <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#666' }}>{item.hsn_code || '7113'}</td>
                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontSize: '0.9rem' }}>{item.quantity}</td>
                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 600, fontSize: '0.95rem' }}>{renderPrice(item.price_at_sale * item.quantity)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
                <div style={{ width: '320px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.95rem' }}>
                        <span>Subtotal:</span>
                        <span>{renderPrice(sale.total_amount)}</span>
                    </div>
                    {sale.discount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.95rem', color: '#4CAF50' }}>
                            <span>Discount:</span>
                            <span>- {renderPrice(sale.discount)}</span>
                        </div>
                    )}
                    <div style={{ borderTop: '1px solid #E5E1D8', margin: '0.5rem 0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.85rem', color: '#666' }}>
                        <span>Taxable Amount:</span>
                        <span>{renderPrice((sale.total_amount || 0) - (sale.discount || 0))}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.85rem', color: '#666' }}>
                        <span>CGST ({sale.cgst_rate || 1.5}%):</span>
                        <span>+ {renderPrice(sale.cgst_amount)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.85rem', color: '#666' }}>
                        <span>SGST ({sale.sgst_rate || 1.5}%):</span>
                        <span>+ {renderPrice(sale.sgst_amount)}</span>
                    </div>
                    <div style={{ borderTop: '3px double #B8960C', margin: '0.75rem 0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Grand Total:</span>
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 700, color: '#B8960C' }}>{renderPrice(sale.final_amount)}</span>
                    </div>
                </div>
            </div>

            <div style={{ borderTop: '1px solid #E5E1D8', paddingTop: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>{billFooter}</p>
                <p style={{ fontSize: '0.75rem', color: '#999' }}>This is a computer-generated invoice. No signature required.</p>
            </div>
        </div>
    );
});

export default BillTemplate;
