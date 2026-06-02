import React, { useState, useEffect } from 'react';
import { Plus, Search, User, CreditCard, Award, UserCheck, Calendar, MapPin, Phone, Mail, X, Trash2, Edit } from 'lucide-react';

const API_URL = '';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');
    const [customerSales, setCustomerSales] = useState([]);
    const [salesLoading, setSalesLoading] = useState(false);
    const [salesError, setSalesError] = useState(null);
    const [customerSummary, setCustomerSummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState(null);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        aadhaar_number: '',
        pan_number: '',
        date_of_birth: '',
        anniversary_date: '',
        customer_type: 'retail',
        credit_limit: 0,
        loyalty_points: 0,
        outstanding_amount: 0,
        notes: '',
        gstin: ''
    });

    const fetchCustomers = async (query = '') => {
        setLoading(true);
        try {
            const token = localStorage.getItem('jewel_token');
            const url = query ? `${API_URL}/api/customers?q=${encodeURIComponent(query)}` : `${API_URL}/api/customers`;
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (!response.ok) throw new Error('Failed to fetch customers');
            const data = await response.json();
            setCustomers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomerSales = async (customerId) => {
        setSalesLoading(true);
        setSalesError(null);
        try {
            const token = localStorage.getItem('jewel_token');
            const response = await fetch(`${API_URL}/api/customers/${customerId}/purchases`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (!response.ok) throw new Error('Failed to fetch purchase history');
            const data = await response.json();
            setCustomerSales(data);
        } catch (err) {
            setSalesError(err.message);
        } finally {
            setSalesLoading(false);
        }
    };

    const fetchCustomerSummary = async (customerId) => {
        setSummaryLoading(true);
        setSummaryError(null);
        try {
            const token = localStorage.getItem('jewel_token');
            const response = await fetch(`${API_URL}/api/customers/${customerId}/summary`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (!response.ok) throw new Error('Failed to fetch customer summary');
            const data = await response.json();
            setCustomerSummary(data);
        } catch (err) {
            setSummaryError(err.message);
        } finally {
            setSummaryLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        if (selectedCustomer) {
            fetchCustomerSales(selectedCustomer.id);
            fetchCustomerSummary(selectedCustomer.id);
        } else {
            setCustomerSales([]);
            setCustomerSummary(null);
        }
    }, [selectedCustomer]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        fetchCustomers(e.target.value);
    };

    const handleOpenAddModal = () => {
        setIsEditMode(false);
        setFormData({
            name: '',
            phone: '',
            email: '',
            address: '',
            city: '',
            aadhaar_number: '',
            pan_number: '',
            date_of_birth: '',
            anniversary_date: '',
            customer_type: 'retail',
            credit_limit: 0,
            loyalty_points: 0,
            outstanding_amount: 0,
            notes: '',
            gstin: ''
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (customer) => {
        setIsEditMode(true);
        setFormData({ ...customer });
        setIsModalOpen(true);
    };

    const handleSaveCustomer = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('jewel_token');
            const method = isEditMode ? 'PUT' : 'POST';
            const url = isEditMode ? `${API_URL}/api/customers/${formData.id}` : `${API_URL}/api/customers`;
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to save customer');
            }

            setIsModalOpen(false);
            fetchCustomers(searchTerm);
            if (selectedCustomer && selectedCustomer.id === formData.id) {
                // Refresh details
                const updatedCustomer = await fetch(`${API_URL}/api/customers/${formData.id}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token && { 'Authorization': `Bearer ${token}` })
                    }
                }).then(r => r.json());
                setSelectedCustomer(updatedCustomer);
                fetchCustomerSummary(formData.id);
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const handleDeleteCustomer = async (id) => {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            try {
                const token = localStorage.getItem('jewel_token');
                const response = await fetch(`${API_URL}/api/customers/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token && { 'Authorization': `Bearer ${token}` })
                    }
                });
                if (!response.ok) throw new Error('Failed to delete customer');
                fetchCustomers(searchTerm);
                if (selectedCustomer?.id === id) setSelectedCustomer(null);
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        }
    };

    const handleUpdateLoyalty = async (delta) => {
        if (!selectedCustomer) return;
        try {
            const token = localStorage.getItem('jewel_token');
            const response = await fetch(`${API_URL}/api/customers/${selectedCustomer.id}/loyalty`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({ delta })
            });
            if (!response.ok) throw new Error('Failed to update loyalty points');
            const data = await response.json();
            setSelectedCustomer({ ...selectedCustomer, loyalty_points: data.loyalty_points });
            fetchCustomers(searchTerm);
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const getMonthDay = (value) => {
        if (!value) return null;
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return null;
        return { month: parsed.getMonth(), day: parsed.getDate() };
    };

    const matchesCurrentMonth = (value) => {
        const date = getMonthDay(value);
        if (!date) return false;
        return date.month === new Date().getMonth();
    };

    const totalCount = customers.length;
    const vipCount = customers.filter(c => c.customer_type === 'vip').length;
    const totalOutstanding = customers.reduce((sum, c) => sum + (c.outstanding_amount || 0), 0);
    const birthdayCount = customers.filter(c => matchesCurrentMonth(c.date_of_birth)).length;
    const anniversaryCount = customers.filter(c => matchesCurrentMonth(c.anniversary_date)).length;

    return (
        <div className="page-wrapper main-content fade-in container" style={{ display: 'grid', gridTemplateColumns: selectedCustomer ? '1fr 380px' : '1fr', gap: '1.5rem', transition: 'all 0.3s ease' }}>
            <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '36px', color: 'var(--text-primary)', margin: 0 }}>Customer Directory & CRM</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Manage profiles, KYC records, loyalty points and credit accounts</p>
                    </div>
                    <button className="btn-primary" onClick={handleOpenAddModal}>
                        <Plus size={18} style={{ marginRight: '8px' }} /> Add Customer
                    </button>
                </div>

                {/* Summary Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--gold)' }}>
                        <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '50%', color: 'var(--gold)' }}><User size={20} /></div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Customers</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-primary)' }}>{totalCount}</div>
                        </div>
                    </div>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #4CAF50' }}>
                        <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '50%', color: '#4CAF50' }}><UserCheck size={20} /></div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>VIP Customers</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-primary)' }}>{vipCount}</div>
                        </div>
                    </div>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #FF5252' }}>
                        <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '50%', color: '#FF5252' }}><CreditCard size={20} /></div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Outstanding</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-primary)' }}>₹{totalOutstanding.toLocaleString('en-IN')}</div>
                        </div>
                    </div>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #FFB400' }}>
                        <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '50%', color: '#FFB400' }}><Calendar size={20} /></div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Birthdays This Month</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-primary)' }}>{birthdayCount}</div>
                        </div>
                    </div>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #6C63FF' }}>
                        <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '50%', color: '#6C63FF' }}><Calendar size={20} /></div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Anniversaries This Month</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-primary)' }}>{anniversaryCount}</div>
                        </div>
                    </div>
                </div>

                {/* Search & List */}
                <div className="card" style={{ padding: 0 }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flexGrow: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search by name, phone or email..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                style={{ paddingLeft: '38px', width: '100%' }}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading customer directory...</div>
                    ) : customers.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <h3>No Customers Found</h3>
                            <p style={{ marginTop: '0.5rem' }}>Create a new customer profile to get started.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Contact Details</th>
                                        <th>KYC / ID</th>
                                        <th>Type</th>
                                        <th style={{ textAlign: 'right' }}>Credit Limit</th>
                                        <th style={{ textAlign: 'right' }}>Outstanding</th>
                                        <th style={{ textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.map(c => (
                                        <tr 
                                            key={c.id} 
                                            onClick={() => setSelectedCustomer(c)}
                                            style={{ cursor: 'pointer', background: selectedCustomer?.id === c.id ? 'rgba(245, 230, 178, 0.2)' : 'transparent' }}
                                        >
                                            <td style={{ fontWeight: 600 }}>{c.name}</td>
                                            <td>
                                                <div style={{ fontSize: '0.85rem' }}>📞 {c.phone || 'N/A'}</div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>📧 {c.email || 'N/A'}</div>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '0.8rem' }}>PAN: {c.pan_number || 'N/A'}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>UID: {c.aadhaar_number || 'N/A'}</div>
                                            </td>
                                            <td>
                                                <span className="gold-badge" style={{ backgroundColor: c.customer_type === 'vip' ? 'var(--gold-light)' : 'var(--bg)', color: c.customer_type === 'vip' ? 'var(--gold-dark)' : 'var(--text-secondary)' }}>
                                                    {c.customer_type.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>₹{(c.credit_limit || 0).toLocaleString('en-IN')}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 600, color: c.outstanding_amount > 0 ? '#FF5252' : 'inherit' }}>
                                                ₹{(c.outstanding_amount || 0).toLocaleString('en-IN')}
                                            </td>
                                            <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                                                <button onClick={() => handleOpenEditModal(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold)', padding: '4px' }}><Edit size={16} /></button>
                                                <button onClick={() => handleDeleteCustomer(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF5252', padding: '4px', marginLeft: '8px' }}><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar Details View */}
            {selectedCustomer && (
                <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'fit-content', border: '1px solid var(--gold-light)', alignSelf: 'start', position: 'sticky', top: '80px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', margin: 0 }}>{selectedCustomer.name}</h2>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registered: {new Date(selectedCustomer.created_at || Date.now()).toLocaleDateString()}</p>
                        </div>
                        <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                            <X size={18} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1rem', gap: '1rem' }}>
                        <button 
                            onClick={() => setActiveTab('profile')} 
                            style={{ background: 'none', border: 'none', padding: '8px 0', cursor: 'pointer', color: activeTab === 'profile' ? 'var(--gold)' : 'var(--text-secondary)', borderBottom: activeTab === 'profile' ? '2px solid var(--gold)' : 'none', fontWeight: 500 }}
                        >
                            Profile
                        </button>
                        <button 
                            onClick={() => setActiveTab('history')} 
                            style={{ background: 'none', border: 'none', padding: '8px 0', cursor: 'pointer', color: activeTab === 'history' ? 'var(--gold)' : 'var(--text-secondary)', borderBottom: activeTab === 'history' ? '2px solid var(--gold)' : 'none', fontWeight: 500 }}
                        >
                            Purchase History
                        </button>
                        <button 
                            onClick={() => setActiveTab('loyalty')} 
                            style={{ background: 'none', border: 'none', padding: '8px 0', cursor: 'pointer', color: activeTab === 'loyalty' ? 'var(--gold)' : 'var(--text-secondary)', borderBottom: activeTab === 'loyalty' ? '2px solid var(--gold)' : 'none', fontWeight: 500 }}
                        >
                            Loyalty
                        </button>
                    </div>

                    {activeTab === 'profile' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                            <div>
                                <label>Contact Info</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}><Phone size={14} color="var(--text-secondary)" /> {selectedCustomer.phone || 'No phone'}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}><Mail size={14} color="var(--text-secondary)" /> {selectedCustomer.email || 'No email'}</div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', borderTop: '1px solid var(--bg)', paddingTop: '0.75rem' }}>
                                <div style={{ background: 'var(--bg)', borderRadius: '12px', padding: '0.85rem' }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Total Purchases</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>{customerSummary ? customerSummary.purchases_count : '--'}</div>
                                </div>
                                <div style={{ background: 'var(--bg)', borderRadius: '12px', padding: '0.85rem' }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Lifetime Sales</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>₹{customerSummary ? (customerSummary.total_sales || 0).toLocaleString('en-IN') : '--'}</div>
                                </div>
                                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <div style={{ flex: 1, background: 'var(--bg)', borderRadius: '12px', padding: '0.85rem' }}>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Upcoming Birthday</div>
                                        <div style={{ marginTop: '0.35rem', fontWeight: 600 }}>{customerSummary?.upcomingBirthday || 'N/A'}</div>
                                    </div>
                                    <div style={{ flex: 1, background: 'var(--bg)', borderRadius: '12px', padding: '0.85rem' }}>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Upcoming Anniversary</div>
                                        <div style={{ marginTop: '0.35rem', fontWeight: 600 }}>{customerSummary?.upcomingAnniversary || 'N/A'}</div>
                                    </div>
                                </div>
                                {(summaryLoading || summaryError) && (
                                    <div style={{ gridColumn: 'span 2', fontSize: '0.85rem', color: summaryError ? '#FF5252' : 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                        {summaryLoading ? 'Loading customer summary...' : summaryError}
                                    </div>
                                )}
                            </div>
                            <div style={{ borderTop: '1px solid var(--bg)', paddingTop: '0.5rem' }}>
                                <label>Location</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}><MapPin size={14} color="var(--text-secondary)" /> {selectedCustomer.address || 'No address'}, {selectedCustomer.city || ''}</div>
                            </div>
                            <div style={{ borderTop: '1px solid var(--bg)', paddingTop: '0.5rem' }}>
                                <label>KYC Documents</label>
                                <div style={{ marginTop: '2px' }}>Aadhaar: <span style={{ fontWeight: 500 }}>{selectedCustomer.aadhaar_number || 'N/A'}</span></div>
                                <div style={{ marginTop: '2px' }}>PAN: <span style={{ fontWeight: 500 }}>{selectedCustomer.pan_number || 'N/A'}</span></div>
                                {selectedCustomer.gstin && <div style={{ marginTop: '2px' }}>GSTIN: <span style={{ fontWeight: 500 }}>{selectedCustomer.gstin}</span></div>}
                            </div>
                            <div style={{ borderTop: '1px solid var(--bg)', paddingTop: '0.5rem' }}>
                                <label>Personal Milestones</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}><Calendar size={14} color="var(--text-secondary)" /> DOB: {selectedCustomer.date_of_birth || 'N/A'}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}><Calendar size={14} color="var(--text-secondary)" /> Anniversary: {selectedCustomer.anniversary_date || 'N/A'}</div>
                            </div>
                            {selectedCustomer.notes && (
                                <div style={{ borderTop: '1px solid var(--bg)', paddingTop: '0.5rem' }}>
                                    <label>Internal Notes</label>
                                    <div style={{ fontStyle: 'italic', background: 'var(--bg)', padding: '6px 10px', borderRadius: '4px', marginTop: '2px' }}>{selectedCustomer.notes}</div>
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'history' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Purchase History</div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)' }}>{customerSales.length} invoices</div>
                                </div>
                                {salesLoading && <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>}
                                {salesError && <div style={{ color: '#FF5252' }}>{salesError}</div>}
                            </div>
                            {customerSales.length === 0 ? (
                                <div style={{ padding: '1rem', background: 'var(--bg)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                                    No sales history found for this customer yet.
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ minWidth: '100%' }}>
                                        <thead>
                                            <tr>
                                                <th>Invoice</th>
                                                <th>Date</th>
                                                <th>Amount</th>
                                                <th>Payment</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {customerSales.map((sale) => (
                                                <tr key={sale.id}>
                                                    <td>{sale.bill_number}</td>
                                                    <td>{new Date(sale.sale_date).toLocaleDateString()}</td>
                                                    <td>₹{(sale.final_amount || 0).toLocaleString('en-IN')}</td>
                                                    <td>{sale.payment_mode || 'Cash'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', padding: '1rem 0' }}>
                            <Award size={48} color="var(--gold)" />
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Loyalty Wallet Balance</div>
                                <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--gold)', marginTop: '0.25rem' }}>{selectedCustomer.loyalty_points || 0} pts</div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '0.5rem' }}>
                                <button className="btn-secondary" onClick={() => handleUpdateLoyalty(100)} style={{ flexGrow: 1, padding: '0.5rem' }}>+100 Points</button>
                                <button className="btn-secondary" onClick={() => handleUpdateLoyalty(-100)} style={{ flexGrow: 1, padding: '0.5rem', borderColor: '#FF5252', color: '#FF5252' }} disabled={(selectedCustomer.loyalty_points || 0) < 100}>-100 Points</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }}>
                    <div style={{ background: 'white', borderRadius: 'var(--radius)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{isEditMode ? 'Modify Customer Profile' : 'New Customer Registration'}</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSaveCustomer} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflowY: 'auto' }}>
                            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label>Customer Name *</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Full Name" />
                                </div>
                                <div>
                                    <label>Phone Number</label>
                                    <input type="text" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="Mobile Number" />
                                </div>
                                <div>
                                    <label>Email Address</label>
                                    <input type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@address.com" />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label>Address</label>
                                    <input type="text" value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Street Address, Block/Shop No." />
                                </div>
                                <div>
                                    <label>City</label>
                                    <input type="text" value={formData.city || ''} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="City" />
                                </div>
                                <div>
                                    <label>Customer Type</label>
                                    <select value={formData.customer_type} onChange={e => setFormData({ ...formData, customer_type: e.target.value })}>
                                        <option value="retail">Retail</option>
                                        <option value="vip">VIP</option>
                                        <option value="wholesale">Wholesale</option>
                                    </select>
                                </div>
                                <div>
                                    <label>Aadhaar Number (UID)</label>
                                    <input type="text" value={formData.aadhaar_number || ''} onChange={e => setFormData({ ...formData, aadhaar_number: e.target.value })} placeholder="12-digit UID" />
                                </div>
                                <div>
                                    <label>PAN Card Number</label>
                                    <input type="text" value={formData.pan_number || ''} onChange={e => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })} placeholder="10-digit PAN" />
                                </div>
                                <div>
                                    <label>Date of Birth</label>
                                    <input type="date" value={formData.date_of_birth || ''} onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })} />
                                </div>
                                <div>
                                    <label>Anniversary Date</label>
                                    <input type="date" value={formData.anniversary_date || ''} onChange={e => setFormData({ ...formData, anniversary_date: e.target.value })} />
                                </div>
                                <div>
                                    <label>Credit Limit (₹)</label>
                                    <input type="number" value={formData.credit_limit || 0} onChange={e => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || 0 })} />
                                </div>
                                <div>
                                    <label>Outstanding Balance (₹)</label>
                                    <input type="number" value={formData.outstanding_amount || 0} onChange={e => setFormData({ ...formData, outstanding_amount: parseFloat(e.target.value) || 0 })} />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label>GSTIN</label>
                                    <input type="text" value={formData.gstin || ''} onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })} placeholder="15-digit GSTIN" />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label>Internal Relationship Notes</label>
                                    <textarea value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Preferences, special remarks, etc." rows="3" style={{ resize: 'none' }} />
                                </div>
                            </div>
                            <div style={{ padding: '1rem 1.5rem', background: 'var(--bg)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1.25rem' }}>Save Profile</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
