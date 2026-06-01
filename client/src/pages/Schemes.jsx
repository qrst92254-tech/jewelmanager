import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Award, Gift, FileText, X, CheckCircle, CreditCard, ChevronRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Schemes = () => {
    const [plans, setPlans] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [selectedEnrollment, setSelectedEnrollment] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    // Form states
    const [planForm, setPlanForm] = useState({
        plan_name: '', duration_months: 11, monthly_amount: 5000, bonus_month: 1, scheme_type: 'gold', description: ''
    });

    const [enrollForm, setEnrollForm] = useState({
        plan_id: '', customer_name: '', customer_phone: '', start_date: new Date().toISOString().split('T')[0], monthly_amount: 5000, notes: ''
    });

    const [paymentForm, setPaymentForm] = useState({
        payment_date: new Date().toISOString().split('T')[0], amount_paid: 5000, payment_method: 'cash'
    });

    const fetchPlans = async () => {
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/schemes/plans`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (res.ok) {
                const data = await res.json();
                setPlans(data);
                if (data.length > 0 && !enrollForm.plan_id) {
                    setEnrollForm(prev => ({ ...prev, plan_id: data[0].id }));
                }
            }
        } catch (e) { console.error(e); }
    };

    const fetchEnrollments = async () => {
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/schemes/enrollments`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (res.ok) setEnrollments(await res.json());
        } catch (e) { console.error(e); }
    };

    const loadEnrollmentDetails = async (enrollment) => {
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/schemes/enrollments/${enrollment.id}/payments`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (res.ok) {
                setSelectedEnrollment(enrollment);
                setPayments(await res.json());
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchPlans(), fetchEnrollments()]);
            setLoading(false);
        };
        init();
    }, []);

    // Sync monthly amount when plan changes in enrollment form
    useEffect(() => {
        const selectedPlan = plans.find(p => p.id === parseInt(enrollForm.plan_id));
        if (selectedPlan) {
            setEnrollForm(prev => ({ ...prev, monthly_amount: selectedPlan.monthly_amount }));
        }
    }, [enrollForm.plan_id, plans]);

    const handleCreatePlan = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/schemes/plans`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(planForm)
            });
            if (res.ok) {
                setIsPlanModalOpen(false);
                setPlanForm({ plan_name: '', duration_months: 11, monthly_amount: 5000, bonus_month: 1, scheme_type: 'gold', description: '' });
                await fetchPlans();
            }
        } catch (e) { console.error(e); }
    };

    const handleCreateEnrollment = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/schemes/enrollments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(enrollForm)
            });
            if (res.ok) {
                setIsEnrollModalOpen(false);
                setEnrollForm({ plan_id: plans[0]?.id || '', customer_name: '', customer_phone: '', start_date: new Date().toISOString().split('T')[0], monthly_amount: 5000, notes: '' });
                await fetchEnrollments();
            }
        } catch (e) { console.error(e); }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/schemes/enrollments/${selectedEnrollment.id}/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(paymentForm)
            });
            if (res.ok) {
                setIsPaymentModalOpen(false);
                setPaymentForm({ payment_date: new Date().toISOString().split('T')[0], amount_paid: selectedEnrollment.monthly_amount, payment_method: 'cash' });
                await fetchEnrollments();
                if (selectedEnrollment) {
                    const refreshed = enrollments.find(e => e.id === selectedEnrollment.id);
                    if (refreshed) loadEnrollmentDetails(refreshed);
                    else loadEnrollmentDetails(selectedEnrollment);
                }
            }
        } catch (e) { console.error(e); }
    };

    const totalActiveFund = enrollments.filter(e => e.status === 'active').reduce((acc, e) => acc + (e.total_paid || 0), 0);
    const activeSubscribers = enrollments.filter(e => e.status === 'active').length;

    return (
        <div className="page-wrapper main-content fade-in container" style={{ display: 'grid', gridTemplateColumns: selectedEnrollment ? '1fr 380px' : '1fr', gap: '1.5rem' }}>
            <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '36px', color: 'var(--text-primary)', margin: 0 }}>Gold Schemes & Kitty Plans</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Enroll customers in golden savings plans, track monthly installments and reward bonus payouts</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="btn-secondary" onClick={() => setIsPlanModalOpen(true)}>Create Scheme Plan</button>
                        <button className="btn-primary" onClick={() => setIsEnrollModalOpen(true)}>
                            <Plus size={18} style={{ marginRight: '8px' }} /> Enroll Member
                        </button>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--gold)' }}>
                        <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '50%', color: 'var(--gold)' }}><CreditCard size={20} /></div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Scheme Funds</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-primary)' }}>₹{totalActiveFund.toLocaleString('en-IN')}</div>
                        </div>
                    </div>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #4CAF50' }}>
                        <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '50%', color: '#4CAF50' }}><Calendar size={20} /></div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Active Subscribers</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-primary)' }}>{activeSubscribers} enrolled</div>
                        </div>
                    </div>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #8B6F0A' }}>
                        <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '50%', color: '#8B6F0A' }}><Gift size={20} /></div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Active Plans</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-primary)' }}>{plans.length} Schemes</div>
                        </div>
                    </div>
                </div>

                {/* Main List */}
                <div className="card" style={{ padding: 0 }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Active Enrollments</h2>
                    </div>
                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading enrollments...</div>
                    ) : enrollments.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No enrollments logged. Register a customer to begin.</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID / Scheme Card</th>
                                        <th>Customer</th>
                                        <th>Scheme Name</th>
                                        <th style={{ textAlign: 'right' }}>Installment</th>
                                        <th style={{ textAlign: 'center' }}>Months Paid</th>
                                        <th style={{ textAlign: 'right' }}>Total Paid</th>
                                        <th style={{ textAlign: 'center' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {enrollments.map(e => (
                                        <tr key={e.id} onClick={() => loadEnrollmentDetails(e)} style={{ cursor: 'pointer', background: selectedEnrollment?.id === e.id ? 'rgba(245, 230, 178, 0.2)' : 'transparent' }}>
                                            <td style={{ fontWeight: 600, color: 'var(--gold)' }}>{e.scheme_number}</td>
                                            <td>
                                                <div style={{ fontWeight: 500 }}>{e.customer_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📞 {e.customer_phone}</div>
                                            </td>
                                            <td>{e.plan_name}</td>
                                            <td style={{ textAlign: 'right' }}>₹{e.monthly_amount.toLocaleString('en-IN')}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span style={{ fontWeight: 600 }}>{e.months_paid}</span> / {e.duration_months}
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{e.total_paid.toLocaleString('en-IN')}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span style={{
                                                    fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px',
                                                    backgroundColor: e.status === 'active' ? '#E3F2FD' : e.status === 'completed' ? '#E8F5E9' : '#ECEFF1',
                                                    color: e.status === 'active' ? '#1565C0' : e.status === 'completed' ? '#2E7D32' : '#37474F'
                                                }}>{e.status.toUpperCase()}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar Details Drawer */}
            {selectedEnrollment && (
                <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'fit-content', border: '1px solid var(--gold-light)', alignSelf: 'start', position: 'sticky', top: '80px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>Enrollment Profile</h2>
                            <p style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 600 }}>{selectedEnrollment.scheme_number}</p>
                        </div>
                        <button onClick={() => setSelectedEnrollment(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                        <div style={{ padding: '10px', background: 'var(--bg)', borderRadius: '8px' }}>
                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Subscriber Info</div>
                            <div>👦 {selectedEnrollment.customer_name}</div>
                            <div>📞 {selectedEnrollment.customer_phone}</div>
                        </div>

                        <div style={{ padding: '10px', background: 'var(--bg)', borderRadius: '8px' }}>
                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Scheme Settings</div>
                            <div>📋 Plan: {selectedEnrollment.plan_name}</div>
                            <div>💵 Installment: ₹{selectedEnrollment.monthly_amount.toLocaleString()} / month</div>
                            <div>🗓️ Start: {new Date(selectedEnrollment.start_date).toLocaleDateString()}</div>
                            <div>🗓️ Expected End: {new Date(selectedEnrollment.end_date).toLocaleDateString()}</div>
                        </div>
                    </div>

                    {selectedEnrollment.status === 'active' && (
                        <button className="btn-primary" onClick={() => { setPaymentForm({ ...paymentForm, amount_paid: selectedEnrollment.monthly_amount }); setIsPaymentModalOpen(true); }} style={{ width: '100%', padding: '8px' }}>Record Monthly Receipt</button>
                    )}

                    {payments.length > 0 && (
                        <div style={{ marginTop: '1.25rem' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>Receipt Transactions</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                                {payments.map(p => (
                                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px', background: '#F9FAFB', borderRadius: '4px', fontSize: '0.8rem' }}>
                                        <div>
                                            <div style={{ fontWeight: 500 }}>Month #{p.month_number} (₹{p.amount_paid.toLocaleString()})</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.receipt_number} — {new Date(p.payment_date).toLocaleDateString()}</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', color: '#2E7D32' }}><CheckCircle size={14} /></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            {isPlanModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }}>
                    <div style={{ background: 'white', borderRadius: 'var(--radius)', width: '100%', maxWidth: '440px' }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Create Golden Kitty Scheme</h3>
                            <button onClick={() => setIsPlanModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreatePlan} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div><label>Plan Name *</label><input type="text" required value={planForm.plan_name} onChange={e => setPlanForm({ ...planForm, plan_name: e.target.value })} placeholder="e.g. 11+1 Golden Savings Plan" /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div><label>Duration (Months) *</label><input type="number" required value={planForm.duration_months} onChange={e => setPlanForm({ ...planForm, duration_months: parseInt(e.target.value) || 0 })} /></div>
                                <div><label>Monthly Contrib (₹) *</label><input type="number" required value={planForm.monthly_amount} onChange={e => setPlanForm({ ...planForm, monthly_amount: parseFloat(e.target.value) || 0 })} /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div><label>Bonus (Free Months)</label><input type="number" value={planForm.bonus_month} onChange={e => setPlanForm({ ...planForm, bonus_month: parseInt(e.target.value) || 0 })} /></div>
                                <div>
                                    <label>Scheme Type</label>
                                    <select value={planForm.scheme_type} onChange={e => setPlanForm({ ...planForm, scheme_type: e.target.value })}>
                                        <option value="gold">Gold weight accumulator</option>
                                        <option value="cash">Fixed cash savings</option>
                                    </select>
                                </div>
                            </div>
                            <div><label>Description</label><input type="text" value={planForm.description} onChange={e => setPlanForm({ ...planForm, description: e.target.value })} /></div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setIsPlanModalOpen(false)} className="btn-secondary" style={{ padding: '6px 12px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ padding: '6px 16px' }}>Save Plan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isEnrollModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }}>
                    <div style={{ background: 'white', borderRadius: 'var(--radius)', width: '100%', maxWidth: '480px' }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Enroll Customer in Gold Scheme</h3>
                            <button onClick={() => setIsEnrollModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreateEnrollment} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label>Select Savings Plan</label>
                                <select value={enrollForm.plan_id} onChange={e => setEnrollForm({ ...enrollForm, plan_id: e.target.value })}>
                                    {plans.map(p => (
                                        <option key={p.id} value={p.id}>{p.plan_name} (₹{p.monthly_amount}/mo for {p.duration_months} mo)</option>
                                    ))}
                                </select>
                            </div>
                            <div><label>Customer Name *</label><input type="text" required value={enrollForm.customer_name} onChange={e => setEnrollForm({ ...enrollForm, customer_name: e.target.value })} /></div>
                            <div><label>Phone Number *</label><input type="text" required value={enrollForm.customer_phone} onChange={e => setEnrollForm({ ...enrollForm, customer_phone: e.target.value })} /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div><label>Monthly Contribution (₹)</label><input type="number" disabled value={enrollForm.monthly_amount} style={{ background: '#F3F4F6' }} /></div>
                                <div><label>Enrollment Start Date *</label><input type="date" required value={enrollForm.start_date} onChange={e => setEnrollForm({ ...enrollForm, start_date: e.target.value })} /></div>
                            </div>
                            <div><label>Remarks / Notes</label><input type="text" value={enrollForm.notes} onChange={e => setEnrollForm({ ...enrollForm, notes: e.target.value })} /></div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setIsEnrollModalOpen(false)} className="btn-secondary" style={{ padding: '6px 12px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ padding: '6px 16px' }}>Enroll Subscriber</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isPaymentModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }}>
                    <div style={{ background: 'white', borderRadius: 'var(--radius)', width: '100%', maxWidth: '400px' }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Record Installment Payment</h3>
                            <button onClick={() => setIsPaymentModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleRecordPayment} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div><label>Receipt Date</label><input type="date" value={paymentForm.payment_date} onChange={e => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} /></div>
                            <div><label>Amount Received (₹) *</label><input type="number" required value={paymentForm.amount_paid} onChange={e => setPaymentForm({ ...paymentForm, amount_paid: parseFloat(e.target.value) || 0 })} /></div>
                            <div>
                                <label>Payment Method</label>
                                <select value={paymentForm.payment_method} onChange={e => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}>
                                    <option value="cash">Cash</option>
                                    <option value="upi">UPI / Online</option>
                                    <option value="bank">Bank Transfer</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="btn-secondary" style={{ padding: '6px 12px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ padding: '6px 16px' }}>Record Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Schemes;
