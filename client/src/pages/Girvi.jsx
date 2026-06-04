import React, { useState, useEffect } from 'react';
import { Plus, Search, Scale, ShieldAlert, Award, FileText, X, CheckCircle, TrendingUp, AlertTriangle, Share2 } from 'lucide-react';
import { authFetch } from '../utils/authFetch';

const API_URL = '';

const Girvi = () => {
    const [loans, setLoans] = useState([]);
    const [overdueSummary, setOverdueSummary] = useState({ overdue: [], dueSoon: [] });
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');

    // Modals
    const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);

    // Form states
    const [loanForm, setLoanForm] = useState({
        customer_name: '', customer_phone: '', customer_address: '', customer_id_proof: '',
        item_description: '', item_type: 'ornament', metal: 'gold', purity: '22K', gross_weight: 0, net_weight: 0, stone_weight: 0,
        valuation_rate: 6000, metal_value: 0, loan_amount: 0, interest_rate: 2.0, interest_type: 'simple',
        pledge_date: new Date().toISOString().split('T')[0], due_date: '', notes: ''
    });

    const [paymentForm, setPaymentForm] = useState({
        payment_date: new Date().toISOString().split('T')[0], amount_paid: 0, interest_amount: 0, principal_amount: 0, payment_method: 'cash', notes: ''
    });

    const [releaseForm, setReleaseForm] = useState({
        status: 'released', release_date: new Date().toISOString().split('T')[0], notes: ''
    });

    const fetchLoans = async () => {
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/girvi?status=${statusFilter}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (res.ok) setLoans(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchOverdueSummary = async () => {
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/girvi/summary/overdue`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (res.ok) setOverdueSummary(await res.json());
        } catch (e) { console.error(e); }
    };

    const loadLoanDetails = async (loan) => {
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/girvi/${loan.id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (res.ok) {
                const data = await res.json();
                setSelectedLoan(data);
                setPayments(data.payments || []);
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchLoans(), fetchOverdueSummary()]);
            setLoading(false);
        };
        init();
    }, [statusFilter]);

    // Live valuation updates
    useEffect(() => {
        const wt = parseFloat(loanForm.net_weight || loanForm.gross_weight) || 0;
        const rate = parseFloat(loanForm.valuation_rate) || 0;
        const val = wt * rate;
        
        // Auto recommend safe loan amount (70% LTV)
        const recLoan = Math.round(val * 0.70);
        
        setLoanForm(prev => ({
            ...prev,
            metal_value: val,
            loan_amount: prev.loan_amount || recLoan
        }));
    }, [loanForm.gross_weight, loanForm.net_weight, loanForm.valuation_rate]);

    const handleCreateLoan = async (e) => {
        e.preventDefault();
        try {
            await authFetch(`${API_URL}/api/girvi`, {
                method: 'POST',
                body: JSON.stringify(loanForm),
            });
            setIsLoanModalOpen(false);
            setLoanForm({
                customer_name: '', customer_phone: '', customer_address: '', customer_id_proof: '',
                item_description: '', item_type: 'ornament', metal: 'gold', purity: '22K', gross_weight: 0, net_weight: 0, stone_weight: 0,
                valuation_rate: 6000, metal_value: 0, loan_amount: 0, interest_rate: 2.0, interest_type: 'simple',
                pledge_date: new Date().toISOString().split('T')[0], due_date: '', notes: ''
            });
            await Promise.all([fetchLoans(), fetchOverdueSummary()]);
        } catch (err) {
            alert(err.message || 'Failed to create loan');
        }
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/girvi/${selectedLoan.id}/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(paymentForm)
            });
            if (res.ok) {
                setIsPaymentModalOpen(false);
                setPaymentForm({
                    payment_date: new Date().toISOString().split('T')[0], amount_paid: 0, interest_amount: 0, principal_amount: 0, payment_method: 'cash', notes: ''
                });
                await Promise.all([fetchLoans(), fetchOverdueSummary()]);
                if (selectedLoan) loadLoanDetails(selectedLoan);
            }
        } catch (e) { console.error(e); }
    };

    const handleReleaseLoan = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/girvi/${selectedLoan.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(releaseForm)
            });
            if (res.ok) {
                setIsReleaseModalOpen(false);
                await Promise.all([fetchLoans(), fetchOverdueSummary()]);
                setSelectedLoan(null);
            }
        } catch (e) { console.error(e); }
    };

    const handleWhatsAppShare = () => {
        if (!selectedLoan) return;
        const msg = `Hello ${selectedLoan.customer_name}, your gold loan account ${selectedLoan.girvi_number} for item "${selectedLoan.item_description}" is currently marked as: ${selectedLoan.status.toUpperCase()}. Sanctioned amount: ₹${selectedLoan.loan_amount.toLocaleString()}. Thank you!`;
        const phone = selectedLoan.customer_phone ? selectedLoan.customer_phone.replace(/\D/g, '') : '';
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const totalActiveLoanVal = loans.filter(l => l.status === 'active').reduce((acc, l) => acc + (l.loan_amount || 0), 0);
    const activeLoansCount = loans.filter(l => l.status === 'active').length;
    const totalOverdueCount = overdueSummary.overdue?.length || 0;

    return (
        <div className="page-wrapper main-content fade-in container" style={{ display: 'grid', gridTemplateColumns: selectedLoan ? '1fr 380px' : '1fr', gap: '1.5rem' }}>
            <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '36px', color: 'var(--text-primary)', margin: 0 }}>Girvi (Gold Loan) Manager</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Log secure collateral gold loans, monthly interest accounts, and overdue releases</p>
                    </div>
                    <button className="btn-primary" onClick={() => setIsLoanModalOpen(true)}>
                        <Plus size={18} style={{ marginRight: '8px' }} /> New Loan
                    </button>
                </div>

                {/* Dashboard Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--gold)' }}>
                        <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '50%', color: 'var(--gold)' }}><Scale size={20} /></div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Collateral Loan Book</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>₹{totalActiveLoanVal.toLocaleString('en-IN')}</div>
                        </div>
                    </div>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #4CAF50' }}>
                        <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '50%', color: '#4CAF50' }}><Award size={20} /></div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Active Pledge Ledgers</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{activeLoansCount} Accounts</div>
                        </div>
                    </div>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #FF5252' }}>
                        <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '50%', color: '#FF5252' }}><ShieldAlert size={20} /></div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Overdue Redemptions</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{totalOverdueCount} Accounts</div>
                        </div>
                    </div>
                </div>

                {/* Main List */}
                <div className="card" style={{ padding: 0 }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Pledge Registers</h2>
                        <div>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '4px 8px', fontSize: '0.85rem', width: 'auto' }}>
                                <option value="all">All Accounts</option>
                                <option value="active">Active Only</option>
                                <option value="released">Released Only</option>
                                <option value="defaulted">Auctioned/Defaulted</option>
                            </select>
                        </div>
                    </div>
                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading pledge registry...</div>
                    ) : loans.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No loans matching selected filter.</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Loan ID</th>
                                        <th>Customer</th>
                                        <th>Pledged Collateral</th>
                                        <th style={{ textAlign: 'right' }}>Loan Value</th>
                                        <th style={{ textAlign: 'right' }}>Interest Rate</th>
                                        <th style={{ textAlign: 'center' }}>Due Date</th>
                                        <th style={{ textAlign: 'center' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loans.map(l => (
                                        <tr key={l.id} onClick={() => loadLoanDetails(l)} style={{ cursor: 'pointer', background: selectedLoan?.id === l.id ? 'rgba(245, 230, 178, 0.2)' : 'transparent' }}>
                                            <td style={{ fontWeight: 600, color: 'var(--gold)' }}>{l.girvi_number}</td>
                                            <td>
                                                <div style={{ fontWeight: 500 }}>{l.customer_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📞 {l.customer_phone}</div>
                                            </td>
                                            <td>{l.item_description} ({l.gross_weight}g / {l.purity})</td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{l.loan_amount.toLocaleString('en-IN')}</td>
                                            <td style={{ textAlign: 'right' }}>{l.interest_rate}% / mo</td>
                                            <td style={{ textAlign: 'center' }}>{new Date(l.due_date).toLocaleDateString('en-IN')}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span style={{
                                                    fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px',
                                                    backgroundColor: l.status === 'active' ? '#E3F2FD' : l.status === 'released' ? '#E8F5E9' : '#FFEBEE',
                                                    color: l.status === 'active' ? '#1565C0' : l.status === 'released' ? '#2E7D32' : '#C62828'
                                                }}>{l.status.toUpperCase()}</span>
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
            {selectedLoan && (
                <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'fit-content', border: '1px solid var(--gold-light)', alignSelf: 'start', position: 'sticky', top: '80px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>Pledge Details</h2>
                            <p style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 600 }}>{selectedLoan.girvi_number}</p>
                        </div>
                        <button onClick={() => setSelectedLoan(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                        <div style={{ padding: '10px', background: 'var(--bg)', borderRadius: '8px' }}>
                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Customer Info</div>
                            <div>👦 {selectedLoan.customer_name}</div>
                            <div>📞 {selectedLoan.customer_phone}</div>
                            <div>📍 {selectedLoan.customer_address || 'No Address Logged'}</div>
                        </div>

                        <div style={{ padding: '10px', background: 'var(--bg)', borderRadius: '8px' }}>
                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Collateral Info</div>
                            <div>📦 {selectedLoan.item_description}</div>
                            <div>⚖️ Weight: {selectedLoan.gross_weight}g (Net: {selectedLoan.net_weight || selectedLoan.gross_weight}g)</div>
                            <div>💎 Purity: {selectedLoan.purity} (Metal: {selectedLoan.metal?.toUpperCase()})</div>
                            <div>💰 Est Value: ₹{selectedLoan.metal_value?.toLocaleString('en-IN') || 'N/A'}</div>
                        </div>

                        <div style={{ padding: '10px', background: 'var(--bg)', borderRadius: '8px' }}>
                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Financial Info</div>
                            <div>💵 Principal Amount: ₹{selectedLoan.loan_amount.toLocaleString('en-IN')}</div>
                            <div>📈 Interest Rate: {selectedLoan.interest_rate}% / month</div>
                            <div>📅 Date Pledged: {new Date(selectedLoan.pledge_date).toLocaleDateString()}</div>
                            <div>💰 Total Paid to Date: ₹{(selectedLoan.total_paid || 0).toLocaleString('en-IN')}</div>
                        </div>
                    </div>

                    {selectedLoan.status === 'active' && (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button className="btn-primary" onClick={() => setIsPaymentModalOpen(true)} style={{ flexGrow: 1, padding: '8px 12px', fontSize: '0.85rem', minWidth: '80px' }}>Repay</button>
                            <button className="btn-secondary" onClick={handleWhatsAppShare} style={{ flexGrow: 1, padding: '8px 12px', fontSize: '0.85rem', minWidth: '80px' }}><Share2 size={14} style={{ marginRight: '4px' }} /> Share</button>
                            <button className="btn-secondary" onClick={() => setIsReleaseModalOpen(true)} style={{ flexGrow: 1, padding: '8px 12px', fontSize: '0.85rem', minWidth: '80px' }}>Close</button>
                        </div>
                    )}

                    {payments.length > 0 && (
                        <div style={{ marginTop: '1.25rem' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>Repayment Ledger</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                                {payments.map(p => (
                                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px', background: '#F9FAFB', borderRadius: '4px', fontSize: '0.8rem' }}>
                                        <div>
                                            <div style={{ fontWeight: 500 }}>Paid: ₹{p.amount_paid.toLocaleString()}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(p.payment_date).toLocaleDateString()} via {p.payment_method}</div>
                                        </div>
                                        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            <div>Int: ₹{p.interest_amount || 0}</div>
                                            <div>Prin: ₹{p.principal_amount || 0}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            {isLoanModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }}>
                    <div style={{ background: 'white', borderRadius: 'var(--radius)', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Register Gold Loan Account</h3>
                            <button onClick={() => setIsLoanModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreateLoan} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gold)', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>1. Customer Registry</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div><label>Customer Name *</label><input type="text" required value={loanForm.customer_name} onChange={e => setLoanForm({ ...loanForm, customer_name: e.target.value })} /></div>
                                <div><label>Phone Number *</label><input type="text" required value={loanForm.customer_phone} onChange={e => setLoanForm({ ...loanForm, customer_phone: e.target.value })} /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div><label>Address</label><input type="text" value={loanForm.customer_address} onChange={e => setLoanForm({ ...loanForm, customer_address: e.target.value })} /></div>
                                <div><label>KYC ID Proof (PAN/Aadhaar)</label><input type="text" value={loanForm.customer_id_proof} onChange={e => setLoanForm({ ...loanForm, customer_id_proof: e.target.value })} /></div>
                            </div>

                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gold)', borderBottom: '1px solid var(--border)', paddingBottom: '4px', marginTop: '0.5rem' }}>2. Collateral & Valuation</div>
                            <div><label>Item Description *</label><input type="text" required value={loanForm.item_description} onChange={e => setLoanForm({ ...loanForm, item_description: e.target.value })} placeholder="e.g. 2 Gold Bangles and 1 Ring" /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                                <div>
                                    <label>Metal</label>
                                    <select value={loanForm.metal} onChange={e => setLoanForm({ ...loanForm, metal: e.target.value })}>
                                        <option value="gold">Gold</option>
                                        <option value="silver">Silver</option>
                                    </select>
                                </div>
                                <div><label>Purity</label><input type="text" value={loanForm.purity} onChange={e => setLoanForm({ ...loanForm, purity: e.target.value })} /></div>
                                <div><label>Gross Wt (g) *</label><input type="number" step="0.01" required value={loanForm.gross_weight} onChange={e => setLoanForm({ ...loanForm, gross_weight: parseFloat(e.target.value) || 0 })} /></div>
                                <div><label>Net Wt (g)</label><input type="number" step="0.01" value={loanForm.net_weight} onChange={e => setLoanForm({ ...loanForm, net_weight: parseFloat(e.target.value) || 0 })} /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div><label>Valuation Rate (₹ / gram)</label><input type="number" value={loanForm.valuation_rate} onChange={e => setLoanForm({ ...loanForm, valuation_rate: parseFloat(e.target.value) || 0 })} /></div>
                                <div><label>Calculated Collateral Value</label><input type="number" disabled value={loanForm.metal_value} style={{ background: '#F3F4F6' }} /></div>
                            </div>

                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gold)', borderBottom: '1px solid var(--border)', paddingBottom: '4px', marginTop: '0.5rem' }}>3. Loan Calculation</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                <div><label>Principal Amount (₹) *</label><input type="number" required value={loanForm.loan_amount} onChange={e => setLoanForm({ ...loanForm, loan_amount: parseFloat(e.target.value) || 0 })} /></div>
                                <div><label>Interest Rate (%/mo)</label><input type="number" step="0.1" value={loanForm.interest_rate} onChange={e => setLoanForm({ ...loanForm, interest_rate: parseFloat(e.target.value) || 0 })} /></div>
                                <div>
                                    <label>Interest Type</label>
                                    <select value={loanForm.interest_type} onChange={e => setLoanForm({ ...loanForm, interest_type: e.target.value })}>
                                        <option value="simple">Simple Interest</option>
                                        <option value="compound">Compound Interest</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div><label>Pledge Date *</label><input type="date" required value={loanForm.pledge_date} onChange={e => setLoanForm({ ...loanForm, pledge_date: e.target.value })} /></div>
                                <div><label>Maturity Due Date</label><input type="date" required value={loanForm.due_date} onChange={e => setLoanForm({ ...loanForm, due_date: e.target.value })} /></div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setIsLoanModalOpen(false)} className="btn-secondary" style={{ padding: '6px 12px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ padding: '6px 16px' }}>Sanction Gold Loan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isPaymentModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }}>
                    <div style={{ background: 'white', borderRadius: 'var(--radius)', width: '100%', maxWidth: '440px' }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Record Loan Repayment</h3>
                            <button onClick={() => setIsPaymentModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleAddPayment} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div><label>Repayment Date</label><input type="date" value={paymentForm.payment_date} onChange={e => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} /></div>
                            <div><label>Total Cash Received (₹) *</label><input type="number" required value={paymentForm.amount_paid} onChange={e => setPaymentForm({ ...paymentForm, amount_paid: parseFloat(e.target.value) || 0, interest_amount: parseFloat(e.target.value) || 0 })} /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div><label>Interest Portion (₹)</label><input type="number" value={paymentForm.interest_amount} onChange={e => setPaymentForm({ ...paymentForm, interest_amount: parseFloat(e.target.value) || 0 })} /></div>
                                <div><label>Principal Portion (₹)</label><input type="number" value={paymentForm.principal_amount} onChange={e => setPaymentForm({ ...paymentForm, principal_amount: parseFloat(e.target.value) || 0 })} /></div>
                            </div>
                            <div>
                                <label>Payment Method</label>
                                <select value={paymentForm.payment_method} onChange={e => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}>
                                    <option value="cash">Cash</option>
                                    <option value="upi">UPI / Online</option>
                                    <option value="bank">Bank Transfer</option>
                                </select>
                            </div>
                            <div><label>Remarks</label><input type="text" value={paymentForm.notes} onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} /></div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="btn-secondary" style={{ padding: '6px 12px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ padding: '6px 16px' }}>Save Repayment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isReleaseModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }}>
                    <div style={{ background: 'white', borderRadius: 'var(--radius)', width: '100%', maxWidth: '440px' }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Close Collateral Gold Loan</h3>
                            <button onClick={() => setIsReleaseModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleReleaseLoan} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label>Resolution Status</label>
                                <select value={releaseForm.status} onChange={e => setReleaseForm({ ...releaseForm, status: e.target.value })}>
                                    <option value="released">Released (Customer repaid principal and collected metal)</option>
                                    <option value="defaulted">Defaulted / Auctioned (Collateral liquidated)</option>
                                </select>
                            </div>
                            <div><label>Resolution Date</label><input type="date" value={releaseForm.release_date} onChange={e => setReleaseForm({ ...releaseForm, release_date: e.target.value })} /></div>
                            <div><label>Resolution Details / Notes</label><input type="text" value={releaseForm.notes} onChange={e => setReleaseForm({ ...releaseForm, notes: e.target.value })} placeholder="Auction buyer details, final closure notes" /></div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setIsReleaseModalOpen(false)} className="btn-secondary" style={{ padding: '6px 12px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ padding: '6px 16px' }}><CheckCircle size={14} style={{ marginRight: '6px' }} /> Confirm Closure</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Girvi;
