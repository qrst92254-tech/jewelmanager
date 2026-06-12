import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Store, Shield, Key } from 'lucide-react';
import { authFetch } from '../utils/authFetch';

const API_URL = '';

const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    // Settings state
    const [shopName, setShopName] = useState('JewelManager Pro');
    const [address, setAddress] = useState('101 Gold Bazaar');
    const [phone, setPhone] = useState('+91 99999 88888');
    const [gstin, setGstin] = useState('27AAAAA0000A1Z1');
    const [invoiceTerms, setInvoiceTerms] = useState('Goods once sold cannot be returned. Weight differences subject to verification.');
    
    // GST settings state
    const [gstOnMaking, setGstOnMaking] = useState(5);
    const [gstOnMetal, setGstOnMetal] = useState(3);
    const [gstOnPurchase, setGstOnPurchase] = useState(3);
    const [cgstRate, setCgstRate] = useState(1.5);
    const [sgstRate, setSgstRate] = useState(1.5);
    
    // Auth passwords state
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    const fetchSettings = async () => {
        try {
            const data = await authFetch(`${API_URL}/api/settings`);
            if (data.shop_name) setShopName(data.shop_name);
            if (data.shop_address || data.address) setAddress(data.shop_address || data.address);
            if (data.shop_phone || data.phone) setPhone(data.shop_phone || data.phone);
            if (data.shop_gstin || data.gstin) setGstin(data.shop_gstin || data.gstin);
            if (data.bill_footer || data.invoice_terms) setInvoiceTerms(data.bill_footer || data.invoice_terms);
            if (data.gst_on_making) setGstOnMaking(parseFloat(data.gst_on_making));
            if (data.gst_on_metal) setGstOnMetal(parseFloat(data.gst_on_metal));
            if (data.gst_on_purchase) setGstOnPurchase(parseFloat(data.gst_on_purchase));
            if (data.cgst_rate) setCgstRate(parseFloat(data.cgst_rate));
            if (data.sgst_rate) setSgstRate(parseFloat(data.sgst_rate));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            await authFetch(`${API_URL}/api/settings/batch`, {
                method: 'POST',
                body: JSON.stringify({
                    settings: {
                        shop_name: shopName,
                        shop_address: address,
                        shop_phone: phone,
                        shop_gstin: gstin,
                        bill_footer: invoiceTerms,
                        address,
                        phone,
                        gstin,
                        invoice_terms: invoiceTerms,
                        gst_on_making: String(gstOnMaking),
                        gst_on_metal: String(gstOnMetal),
                        gst_on_purchase: String(gstOnPurchase),
                        cgst_rate: String(cgstRate),
                        sgst_rate: String(sgstRate),
                    }
                })
            });
            setMessage('Settings saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert('Confirm password does not match new password.');
            return;
        }
        try {
            const res = await fetch(`${API_URL}/api/settings/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                })
            });
            if (res.ok) {
                alert('Password changed successfully!');
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                const err = await res.json();
                alert(`Error: ${err.message || 'Failed to change password'}`);
            }
        } catch (e) { console.error(e); }
    };

    if (loading) {
        return (
            <div className="page-wrapper main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: 'var(--gold)', fontSize: '20px' }}>Loading settings...</div>
            </div>
        );
    }

    return (
        <div className="page-wrapper main-content fade-in container">
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '36px', color: 'var(--text-primary)', margin: 0 }}>System Settings</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Manage store profile configurations, billing metadata, and security passwords</p>
            </div>

            {message && (
                <div style={{ padding: '1rem', background: '#E8F5E9', borderLeft: '4px solid #2E7D32', color: '#2E7D32', borderRadius: '4px', marginBottom: '1.5rem', fontWeight: 500 }}>
                    {message}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                {/* Shop Config */}
                <div className="card">
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                        <Store size={20} color="var(--gold)" /> Company Store Profile
                    </h3>
                    <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label>Shop Name *</label>
                            <input type="text" required value={shopName} onChange={e => setShopName(e.target.value)} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label>Phone / Contact *</label>
                                <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} />
                            </div>
                            <div>
                                <label>GSTIN Tax Code</label>
                                <input type="text" value={gstin} onChange={e => setGstin(e.target.value.toUpperCase())} />
                            </div>
                        </div>
                        <div>
                            <label>Store Address *</label>
                            <input type="text" required value={address} onChange={e => setAddress(e.target.value)} />
                        </div>
                        <div>
                            <label>Invoice Terms & Disclaimers</label>
                            <textarea value={invoiceTerms} onChange={e => setInvoiceTerms(e.target.value)} rows="3" style={{ resize: 'none' }} />
                        </div>
                        <div className="settings-section" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', color: 'var(--gold)' }}>GST Configuration</h4>
                            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                These rates are used for automatic GST calculation on invoices.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label>GST on Making (%)</label>
                                    <input type="number" step="0.01" min="0" max="30" value={gstOnMaking} onChange={e => setGstOnMaking(e.target.value)} />
                                </div>
                                <div>
                                    <label>GST on Metal (%)</label>
                                    <input type="number" step="0.01" min="0" max="30" value={gstOnMetal} onChange={e => setGstOnMetal(e.target.value)} />
                                </div>
                                <div>
                                    <label>GST on Purchases (%)</label>
                                    <input type="number" step="0.01" min="0" max="30" value={gstOnPurchase} onChange={e => setGstOnPurchase(e.target.value)} />
                                </div>
                                <div>
                                    <label>CGST Rate (%)</label>
                                    <input type="number" step="0.01" min="0" max="15" value={cgstRate} onChange={e => setCgstRate(e.target.value)} />
                                </div>
                                <div>
                                    <label>SGST Rate (%)</label>
                                    <input type="number" step="0.01" min="0" max="15" value={sgstRate} onChange={e => setSgstRate(e.target.value)} />
                                </div>
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block' }}>
                                CGST + SGST = Total GST. Example: 3% GST = 1.5% CGST + 1.5% SGST
                            </span>
                        </div>
                        <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }} disabled={saving}>
                            <Save size={16} style={{ marginRight: '6px' }} /> {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </form>
                </div>

                {/* Password Change */}
                <div className="card" style={{ height: 'fit-content' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                        <Shield size={20} color="var(--gold)" /> Login Security Credentials
                    </h3>
                    <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label>Old Password *</label>
                            <input type="password" required value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
                        </div>
                        <div>
                            <label>New Password *</label>
                            <input type="password" required value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
                        </div>
                        <div>
                            <label>Confirm New Password *</label>
                            <input type="password" required value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
                        </div>
                        <button type="submit" className="btn-secondary" style={{ marginTop: '0.5rem' }}>
                            <Key size={16} style={{ marginRight: '6px' }} /> Update Password
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;
