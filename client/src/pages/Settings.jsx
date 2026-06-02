import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Store, Shield, Key } from 'lucide-react';

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
    
    // Auth passwords state
    const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/settings`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.shop_name) setShopName(data.shop_name);
                if (data.address) setAddress(data.address);
                if (data.phone) setPhone(data.phone);
                if (data.gstin) setGstin(data.gstin);
                if (data.invoice_terms) setInvoiceTerms(data.invoice_terms);
            }
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
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/settings/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    settings: {
                        shop_name: shopName,
                        address,
                        phone,
                        gstin,
                        invoice_terms: invoiceTerms
                    }
                })
            });
            if (res.ok) {
                setMessage('Settings saved successfully!');
                setTimeout(() => setMessage(''), 3000);
            } else {
                throw new Error('Failed to save settings');
            }
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
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    oldPassword: passwordForm.oldPassword,
                    newPassword: passwordForm.newPassword
                })
            });
            if (res.ok) {
                alert('Password changed successfully!');
                setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                const err = await res.json();
                alert(`Error: ${err.error || 'Failed to change password'}`);
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
                            <input type="password" required value={passwordForm.oldPassword} onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })} />
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
