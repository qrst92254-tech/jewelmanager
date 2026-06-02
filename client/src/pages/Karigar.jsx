import React, { useState, useEffect } from 'react';
import { Plus, User, Hammer, ShieldAlert, Award, FileText, ArrowUpRight, ArrowDownLeft, X, CheckCircle } from 'lucide-react';

const API_URL = '';

const Karigar = () => {
    const [karigars, setKarigars] = useState([]);
    const [jobCards, setJobCards] = useState([]);
    const [selectedKarigar, setSelectedKarigar] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeDetailTab, setActiveDetailTab] = useState('jobs');

    // Modals
    const [isKarigarModalOpen, setIsKarigarModalOpen] = useState(false);
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [isResolveJobModalOpen, setIsResolveJobModalOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);

    // Form states
    const [karigarForm, setKarigarForm] = useState({ name: '', phone: '', address: '', skill_type: '', id_proof: '' });
    const [txForm, setTxForm] = useState({ transaction_type: 'issue', metal: 'gold', gross_weight: 0, fine_weight: 0, purity: '22K', making_charges: 0, wastage_percent: 0, wastage_grams: 0, order_description: '', expected_date: '', notes: '' });
    const [jobForm, setJobForm] = useState({ product_description: '', category: 'chain', purity: '22K', gold_issued_grams: 0, making_charges: 0, order_date: new Date().toISOString().split('T')[0], expected_date: '', notes: '' });
    const [resolveJobForm, setResolveJobForm] = useState({ status: 'completed', gold_received_grams: 0, wastage_grams: 0, wastage_percent: 0, completion_date: new Date().toISOString().split('T')[0] });

    const fetchKarigars = async () => {
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/karigar`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (res.ok) setKarigars(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchJobCards = async () => {
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/karigar/job-cards/all`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (res.ok) setJobCards(await res.json());
        } catch (e) { console.error(e); }
    };

    const loadKarigarDetails = async (karigar) => {
        setSelectedKarigar(karigar);
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/karigar/${karigar.id}/transactions`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (res.ok) setTransactions(await res.json());
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchKarigars(), fetchJobCards()]);
            setLoading(false);
        };
        init();
    }, []);

    const handleCreateKarigar = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/karigar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(karigarForm)
            });
            if (res.ok) {
                setIsKarigarModalOpen(false);
                setKarigarForm({ name: '', phone: '', address: '', skill_type: '', id_proof: '' });
                await fetchKarigars();
            }
        } catch (e) { console.error(e); }
    };

    const handleCreateTx = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/karigar/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({ ...txForm, karigar_id: selectedKarigar.id })
            });
            if (res.ok) {
                setIsTxModalOpen(false);
                setTxForm({ transaction_type: 'issue', metal: 'gold', gross_weight: 0, fine_weight: 0, purity: '22K', making_charges: 0, wastage_percent: 0, wastage_grams: 0, order_description: '', expected_date: '', notes: '' });
                await fetchKarigars();
                if (selectedKarigar) {
                    const refreshed = karigars.find(k => k.id === selectedKarigar.id);
                    if (refreshed) loadKarigarDetails(refreshed);
                    else loadKarigarDetails(selectedKarigar);
                }
            }
        } catch (e) { console.error(e); }
    };

    const handleCreateJob = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/karigar/job-cards`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({ ...jobForm, karigar_id: selectedKarigar.id })
            });
            if (res.ok) {
                setIsJobModalOpen(false);
                setJobForm({ product_description: '', category: 'chain', purity: '22K', gold_issued_grams: 0, making_charges: 0, order_date: new Date().toISOString().split('T')[0], expected_date: '', notes: '' });
                await fetchJobCards();
                if (selectedKarigar) loadKarigarDetails(selectedKarigar);
            }
        } catch (e) { console.error(e); }
    };

    const handleResolveJob = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/karigar/job-cards/${selectedJob.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(resolveJobForm)
            });
            if (res.ok) {
                setIsResolveJobModalOpen(false);
                setSelectedJob(null);
                await fetchJobCards();
                await fetchKarigars();
                if (selectedKarigar) loadKarigarDetails(selectedKarigar);
            }
        } catch (e) { console.error(e); }
    };

    const totalIssuedGold = karigars.reduce((acc, k) => acc + (k.balance_gold_grams || 0), 0);
    const activeJobsCount = jobCards.filter(jc => jc.status !== 'completed' && jc.status !== 'cancelled').length;

    return (
        <div className="page-wrapper main-content fade-in container" style={{ display: 'grid', gridTemplateColumns: selectedKarigar ? '1fr 380px' : '1fr', gap: '1.5rem' }}>
            <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '36px', color: 'var(--text-primary)', margin: 0 }}>Karigar Management</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Track craftsmen job sheets, metal balances, and waste accounts</p>
                    </div>
                    <button className="btn-primary" onClick={() => setIsKarigarModalOpen(true)}>
                        <Plus size={18} style={{ marginRight: '8px' }} /> Add Karigar
                    </button>
                </div>

                {/* Dashboard stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--gold)' }}>
                        <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '50%', color: 'var(--gold)' }}><Hammer size={20} /></div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Craftsmen Registry</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-primary)' }}>{karigars.length} Active</div>
                        </div>
                    </div>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #FF5252' }}>
                        <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '50%', color: '#FF5252' }}><ShieldAlert size={20} /></div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Gold In-Production</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-primary)' }}>{totalIssuedGold.toFixed(2)} g</div>
                        </div>
                    </div>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #4CAF50' }}>
                        <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '50%', color: '#4CAF50' }}><FileText size={20} /></div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Outstanding Orders</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-primary)' }}>{activeJobsCount} Cards</div>
                        </div>
                    </div>
                </div>

                {/* Main List */}
                <div className="card" style={{ padding: 0 }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Craftsmen Ledger</h2>
                    </div>
                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading karigar ledger...</div>
                    ) : karigars.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No registered karigars. Create one to begin.</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Skillset</th>
                                        <th>Mobile</th>
                                        <th style={{ textAlign: 'right' }}>Issued Gold Bal</th>
                                        <th style={{ textAlign: 'right' }}>Issued Silver Bal</th>
                                        <th style={{ textAlign: 'center' }}>Completed Jobs</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {karigars.map(k => (
                                        <tr key={k.id} onClick={() => loadKarigarDetails(k)} style={{ cursor: 'pointer', background: selectedKarigar?.id === k.id ? 'rgba(245, 230, 178, 0.2)' : 'transparent' }}>
                                            <td style={{ fontWeight: 600 }}>{k.name}</td>
                                            <td><span className="gold-badge" style={{ backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' }}>{k.skill_type || 'Generalist'}</span></td>
                                            <td>{k.phone || 'N/A'}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 600, color: k.balance_gold_grams > 0 ? '#FF5252' : 'inherit' }}>{k.balance_gold_grams || 0} g</td>
                                            <td style={{ textAlign: 'right', fontWeight: 600, color: k.balance_silver_grams > 0 ? '#FF5252' : 'inherit' }}>{k.balance_silver_grams || 0} g</td>
                                            <td style={{ textAlign: 'center' }}>{k.total_orders_completed || 0} jobs</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar Details Drawer */}
            {selectedKarigar && (
                <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'fit-content', border: '1px solid var(--gold-light)', alignSelf: 'start', position: 'sticky', top: '80px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', margin: 0 }}>{selectedKarigar.name}</h2>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📱 {selectedKarigar.phone || 'No phone number'}</p>
                        </div>
                        <button onClick={() => setSelectedKarigar(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        <button className="btn-primary" onClick={() => setIsTxModalOpen(true)} style={{ flexGrow: 1, padding: '6px 12px', fontSize: '0.85rem' }}>Issue/Return</button>
                        <button className="btn-secondary" onClick={() => setIsJobModalOpen(true)} style={{ flexGrow: 1, padding: '6px 12px', fontSize: '0.85rem' }}>Create Job</button>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1rem', gap: '1rem' }}>
                        <button onClick={() => setActiveDetailTab('jobs')} style={{ background: 'none', border: 'none', padding: '8px 0', cursor: 'pointer', color: activeDetailTab === 'jobs' ? 'var(--gold)' : 'var(--text-secondary)', borderBottom: activeDetailTab === 'jobs' ? '2px solid var(--gold)' : 'none', fontWeight: 500 }}>Jobs</button>
                        <button onClick={() => setActiveDetailTab('ledger')} style={{ background: 'none', border: 'none', padding: '8px 0', cursor: 'pointer', color: activeDetailTab === 'ledger' ? 'var(--gold)' : 'var(--text-secondary)', borderBottom: activeDetailTab === 'ledger' ? '2px solid var(--gold)' : 'none', fontWeight: 500 }}>Metal Ledger</button>
                    </div>

                    {activeDetailTab === 'jobs' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
                            {jobCards.filter(j => j.karigar_id === selectedKarigar.id).length === 0 ? (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No jobs assigned yet.</div>
                            ) : (
                                jobCards.filter(j => j.karigar_id === selectedKarigar.id).map(j => (
                                    <div key={j.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', background: 'var(--bg)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--gold)' }}>{j.job_card_number}</span>
                                            <span style={{
                                                fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px',
                                                backgroundColor: j.status === 'completed' ? '#E8F5E9' : j.status === 'in_progress' ? '#E3F2FD' : '#FFF3E0',
                                                color: j.status === 'completed' ? '#2E7D32' : j.status === 'in_progress' ? '#1565C0' : '#E65100'
                                            }}>{j.status.toUpperCase()}</span>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', margin: '4px 0', fontWeight: 500 }}>{j.product_description}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            <span>Issued: {j.gold_issued_grams}g ({j.purity})</span>
                                            <span>Expected: {j.expected_date || 'N/A'}</span>
                                        </div>
                                        {j.status !== 'completed' && j.status !== 'cancelled' && (
                                            <button className="btn-secondary" onClick={() => { setSelectedJob(j); setResolveJobForm({ ...resolveJobForm, gold_received_grams: j.gold_issued_grams }); setIsResolveJobModalOpen(true); }} style={{ width: '100%', padding: '4px', fontSize: '0.8rem', marginTop: '8px' }}>Resolve Job</button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto' }}>
                            {transactions.length === 0 ? (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No metal ledger history.</div>
                            ) : (
                                transactions.map(t => (
                                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid var(--bg)', fontSize: '0.85rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {t.transaction_type === 'issue' ? <ArrowUpRight color="#FF5252" size={16} /> : <ArrowDownLeft color="#4CAF50" size={16} />}
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{t.transaction_type.toUpperCase()} ({t.metal.toUpperCase()})</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(t.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 600 }}>{t.gross_weight} g</div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            {isKarigarModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }}>
                    <div style={{ background: 'white', borderRadius: 'var(--radius)', width: '100%', maxWidth: '480px' }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Register New Karigar</h3>
                            <button onClick={() => setIsKarigarModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreateKarigar} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div><label>Name *</label><input type="text" required value={karigarForm.name} onChange={e => setKarigarForm({ ...karigarForm, name: e.target.value })} /></div>
                            <div><label>Phone</label><input type="text" value={karigarForm.phone} onChange={e => setKarigarForm({ ...karigarForm, phone: e.target.value })} /></div>
                            <div><label>Address</label><input type="text" value={karigarForm.address} onChange={e => setKarigarForm({ ...karigarForm, address: e.target.value })} /></div>
                            <div><label>Skill Type (e.g. chains, setting)</label><input type="text" value={karigarForm.skill_type} onChange={e => setKarigarForm({ ...karigarForm, skill_type: e.target.value })} /></div>
                            <div><label>ID Proof Detail (Aadhaar/PAN)</label><input type="text" value={karigarForm.id_proof} onChange={e => setKarigarForm({ ...karigarForm, id_proof: e.target.value })} /></div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setIsKarigarModalOpen(false)} className="btn-secondary" style={{ padding: '6px 12px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ padding: '6px 16px' }}>Save Craftsman</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isTxModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }}>
                    <div style={{ background: 'white', borderRadius: 'var(--radius)', width: '100%', maxWidth: '480px' }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Log Metal Transaction</h3>
                            <button onClick={() => setIsTxModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreateTx} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label>Transaction Type</label>
                                <select value={txForm.transaction_type} onChange={e => setTxForm({ ...txForm, transaction_type: e.target.value })}>
                                    <option value="issue">Issue raw metal to karigar</option>
                                    <option value="receive">Receive return metal from karigar</option>
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label>Metal</label>
                                    <select value={txForm.metal} onChange={e => setTxForm({ ...txForm, metal: e.target.value })}>
                                        <option value="gold">Gold</option>
                                        <option value="silver">Silver</option>
                                    </select>
                                </div>
                                <div><label>Purity</label><input type="text" value={txForm.purity} onChange={e => setTxForm({ ...txForm, purity: e.target.value })} /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div><label>Gross Weight (grams) *</label><input type="number" step="0.001" required value={txForm.gross_weight} onChange={e => setTxForm({ ...txForm, gross_weight: parseFloat(e.target.value) || 0 })} /></div>
                                <div><label>Fine Weight (grams)</label><input type="number" step="0.001" value={txForm.fine_weight} onChange={e => setTxForm({ ...txForm, fine_weight: parseFloat(e.target.value) || 0 })} /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div><label>Wastage (%)</label><input type="number" step="0.01" value={txForm.wastage_percent} onChange={e => setTxForm({ ...txForm, wastage_percent: parseFloat(e.target.value) || 0 })} /></div>
                                <div><label>Labor/Making Charge (₹)</label><input type="number" value={txForm.making_charges} onChange={e => setTxForm({ ...txForm, making_charges: parseFloat(e.target.value) || 0 })} /></div>
                            </div>
                            <div><label>Remarks / Notes</label><input type="text" value={txForm.notes} onChange={e => setTxForm({ ...txForm, notes: e.target.value })} /></div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setIsTxModalOpen(false)} className="btn-secondary" style={{ padding: '6px 12px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ padding: '6px 16px' }}>Save Log</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isJobModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }}>
                    <div style={{ background: 'white', borderRadius: 'var(--radius)', width: '100%', maxWidth: '480px' }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Create Job Card</h3>
                            <button onClick={() => setIsJobModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreateJob} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div><label>Product Description *</label><input type="text" required value={jobForm.product_description} onChange={e => setJobForm({ ...jobForm, product_description: e.target.value })} placeholder="e.g. Antique Style Gold Bangle" /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label>Category</label>
                                    <select value={jobForm.category} onChange={e => setJobForm({ ...jobForm, category: e.target.value })}>
                                        <option value="chain">Chain</option>
                                        <option value="bangle">Bangle</option>
                                        <option value="ring">Ring</option>
                                        <option value="necklace">Necklace</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div><label>Purity</label><input type="text" value={jobForm.purity} onChange={e => setJobForm({ ...jobForm, purity: e.target.value })} /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div><label>Gold Issued (grams) *</label><input type="number" step="0.001" required value={jobForm.gold_issued_grams} onChange={e => setJobForm({ ...jobForm, gold_issued_grams: parseFloat(e.target.value) || 0 })} /></div>
                                <div><label>Labor Charge (₹)</label><input type="number" value={jobForm.making_charges} onChange={e => setJobForm({ ...jobForm, making_charges: parseFloat(e.target.value) || 0 })} /></div>
                            </div>
                            <div><label>Expected Completion Date</label><input type="date" value={jobForm.expected_date} onChange={e => setJobForm({ ...jobForm, expected_date: e.target.value })} /></div>
                            <div><label>Special Instructions</label><input type="text" value={jobForm.notes} onChange={e => setJobForm({ ...jobForm, notes: e.target.value })} /></div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setIsJobModalOpen(false)} className="btn-secondary" style={{ padding: '6px 12px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ padding: '6px 16px' }}>Generate Job Card</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isResolveJobModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }}>
                    <div style={{ background: 'white', borderRadius: 'var(--radius)', width: '100%', maxWidth: '480px' }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Resolve Job Card ({selectedJob?.job_card_number})</h3>
                            <button onClick={() => setIsResolveJobModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleResolveJob} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label>Status</label>
                                <select value={resolveJobForm.status} onChange={e => setResolveJobForm({ ...resolveJobForm, status: e.target.value })}>
                                    <option value="completed">Completed Successfully</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            {resolveJobForm.status === 'completed' && (
                                <>
                                    <div><label>Gold Received (grams) *</label><input type="number" step="0.001" required value={resolveJobForm.gold_received_grams} onChange={e => setResolveJobForm({ ...resolveJobForm, gold_received_grams: parseFloat(e.target.value) || 0 })} /></div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div><label>Wastage (grams)</label><input type="number" step="0.001" value={resolveJobForm.wastage_grams} onChange={e => setResolveJobForm({ ...resolveJobForm, wastage_grams: parseFloat(e.target.value) || 0 })} /></div>
                                        <div><label>Wastage (%)</label><input type="number" step="0.01" value={resolveJobForm.wastage_percent} onChange={e => setResolveJobForm({ ...resolveJobForm, wastage_percent: parseFloat(e.target.value) || 0 })} /></div>
                                    </div>
                                </>
                            )}
                            <div><label>Completion Date</label><input type="date" value={resolveJobForm.completion_date} onChange={e => setResolveJobForm({ ...resolveJobForm, completion_date: e.target.value })} /></div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setIsResolveJobModalOpen(false)} className="btn-secondary" style={{ padding: '6px 12px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ padding: '6px 16px' }}><CheckCircle size={14} style={{ marginRight: '6px' }} /> Save Resolution</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Karigar;
