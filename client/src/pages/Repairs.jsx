import React, { useState, useEffect } from 'react';
import { Plus, Search, Wrench, X, CheckCircle, Printer, Clock, Share2 } from 'lucide-react';

const API_URL = '';

const Repairs = () => {
    const [repairs, setRepairs] = useState([]);
    const [karigars, setKarigars] = useState([]);
    const [selectedRepair, setSelectedRepair] = useState(null);
    const [counts, setCounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');

    // Modals
    const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
    const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

    // Form states
    const [repairForm, setRepairForm] = useState({
        customer_name: '', customer_phone: '', item_description: '', item_type: 'ornament', metal: 'gold', purity: '22K', weight: 0,
        repair_type: 'resizing', problem_description: '', estimated_charges: 0, advance_paid: 0,
        received_date: new Date().toISOString().split('T')[0], promised_date: '', assigned_to_karigar_id: '', notes: ''
    });

    const [resolveForm, setResolveForm] = useState({
        status: 'completed', actual_charges: 0, advance_paid: 0, completion_date: new Date().toISOString().split('T')[0], delivery_date: '', notes: ''
    });

    const fetchRepairs = async () => {
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/repairs?status=${statusFilter}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (res.ok) setRepairs(await res.json());
        } catch (e) { console.error(e); }
    };

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

    const fetchCounts = async () => {
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/repairs/summary/counts`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (res.ok) setCounts(await res.json());
        } catch (e) { console.error(e); }
    };

    const loadRepairDetails = async (repair) => {
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/repairs/${repair.id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            if (res.ok) setSelectedRepair(await res.json());
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchRepairs(), fetchKarigars(), fetchCounts()]);
            setLoading(false);
        };
        init();
    }, [statusFilter]);

    const handleCreateRepair = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/repairs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(repairForm)
            });
            if (res.ok) {
                setIsRepairModalOpen(false);
                setRepairForm({
                    customer_name: '', customer_phone: '', item_description: '', item_type: 'ornament', metal: 'gold', purity: '22K', weight: 0,
                    repair_type: 'resizing', problem_description: '', estimated_charges: 0, advance_paid: 0,
                    received_date: new Date().toISOString().split('T')[0], promised_date: '', assigned_to_karigar_id: '', notes: ''
                });
                await Promise.all([fetchRepairs(), fetchCounts()]);
            }
        } catch (e) { console.error(e); }
    };

    const handleResolveRepair = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('jewel_token');
            const res = await fetch(`${API_URL}/api/repairs/${selectedRepair.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(resolveForm)
            });
            if (res.ok) {
                setIsResolveModalOpen(false);
                await Promise.all([fetchRepairs(), fetchCounts()]);
                setSelectedRepair(null);
            }
        } catch (e) { console.error(e); }
    };

    const handlePrintReceipt = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Repair Receipt - ${selectedRepair.job_number}</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; line-height: 1.5; color: #333; }
                        .header { text-align: center; border-bottom: 2px solid #B8960C; padding-bottom: 10px; margin-bottom: 20px; }
                        .section { margin-bottom: 15px; }
                        .label { font-weight: bold; }
                        .footer { text-align: center; font-size: 0.8rem; color: #666; border-top: 1px solid #ddd; margin-top: 30px; padding-top: 10px; }
                    </style>
                </head>
                <body onload="window.print();window.close();">
                    <div class="header">
                        <h2>JEWELMANAGER PRO</h2>
                        <p>Repair & Service Order Receipt</p>
                    </div>
                    <div class="section">
                        <div><span class="label">Job Number:</span> ${selectedRepair.job_number}</div>
                        <div><span class="label">Date Received:</span> ${new Date(selectedRepair.received_date).toLocaleDateString()}</div>
                        <div><span class="label">Expected Delivery:</span> ${selectedRepair.promised_date ? new Date(selectedRepair.promised_date).toLocaleDateString() : 'N/A'}</div>
                    </div>
                    <div class="section" style="border-top: 1px solid #eee; padding-top: 10px;">
                        <div><span class="label">Customer Name:</span> ${selectedRepair.customer_name}</div>
                        <div><span class="label">Phone:</span> ${selectedRepair.customer_phone || 'N/A'}</div>
                    </div>
                    <div class="section" style="border-top: 1px solid #eee; padding-top: 10px;">
                        <div><span class="label">Item:</span> ${selectedRepair.item_description} (${selectedRepair.weight}g)</div>
                        <div><span class="label">Repair Type:</span> ${selectedRepair.repair_type}</div>
                        <div><span class="label">Instructions:</span> ${selectedRepair.problem_description || 'None'}</div>
                    </div>
                    <div class="section" style="border-top: 1px solid #eee; padding-top: 10px;">
                        <div><span class="label">Est Charges:</span> ₹${selectedRepair.estimated_charges || 0}</div>
                        <div><span class="label">Advance Paid:</span> ₹${selectedRepair.advance_paid || 0}</div>
                    </div>
                    <div class="footer">
                        <p>Thank you for choosing JewelManager Pro. Please bring this receipt for picking up your item.</p>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleWhatsAppShare = () => {
        if (!selectedRepair) return;
        const msg = `Hello ${selectedRepair.customer_name}, your repair order ${selectedRepair.job_number} for your "${selectedRepair.item_description}" is marked as ${selectedRepair.status.toUpperCase()}. Est Charges: ₹${selectedRepair.estimated_charges}. Thank you!`;
        const phone = selectedRepair.customer_phone ? selectedRepair.customer_phone.replace(/\D/g, '') : '';
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const getStatusCount = (status) => {
        return counts.find(c => c.status === status)?.count || 0;
    };

    const activeRepairsCount = repairs.filter(r => r.status !== 'delivered' && r.status !== 'cancelled').length;

    return (
        <div className="page-wrapper main-content fade-in container" style={{ display: 'grid', gridTemplateColumns: selectedRepair ? '1fr 380px' : '1fr', gap: '1.5rem' }}>
            <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '36px', color: 'var(--text-primary)', margin: 0 }}>Repair & Service Orders</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Log custom customer repairs, assign craftspeople, and track completion progress</p>
                    </div>
                    <button className="btn-primary" onClick={() => setIsRepairModalOpen(true)}>
                        <Plus size={18} style={{ marginRight: '8px' }} /> New Repair Order
                    </button>
                </div>

                {/* Dashboard Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--gold)' }}>
                        <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '50%', color: 'var(--gold)' }}><Wrench size={20} /></div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Active Repairs</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-primary)' }}>{activeRepairsCount} orders</div>
                        </div>
                    </div>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #E65100' }}>
                        <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '50%', color: '#E65100' }}><Clock size={20} /></div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pending Workbench</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-primary)' }}>{getStatusCount('received') + getStatusCount('in_progress')} jobs</div>
                        </div>
                    </div>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #2E7D32' }}>
                        <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '50%', color: '#2E7D32' }}><CheckCircle size={20} /></div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ready for Delivery</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-primary)' }}>{getStatusCount('ready')} jobs</div>
                        </div>
                    </div>
                </div>

                {/* Main List */}
                <div className="card" style={{ padding: 0 }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Repair Pipeline</h2>
                        <div>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '4px 8px', fontSize: '0.85rem', width: 'auto' }}>
                                <option value="all">All Statuses</option>
                                <option value="received">Received / Logged</option>
                                <option value="in_progress">In Progress</option>
                                <option value="ready">Ready for Pickup</option>
                                <option value="delivered">Delivered / Closed</option>
                            </select>
                        </div>
                    </div>
                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading repairs...</div>
                    ) : repairs.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No repair orders logged.</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Job ID</th>
                                        <th>Customer</th>
                                        <th>Item Detail</th>
                                        <th>Service Needed</th>
                                        <th style={{ textAlign: 'right' }}>Est Charges</th>
                                        <th style={{ textAlign: 'center' }}>Promised Date</th>
                                        <th style={{ textAlign: 'center' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {repairs.map(r => (
                                        <tr key={r.id} onClick={() => loadRepairDetails(r)} style={{ cursor: 'pointer', background: selectedRepair?.id === r.id ? 'rgba(245, 230, 178, 0.2)' : 'transparent' }}>
                                            <td style={{ fontWeight: 600, color: 'var(--gold)' }}>{r.job_number}</td>
                                            <td>
                                                <div style={{ fontWeight: 500 }}>{r.customer_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📞 {r.customer_phone || 'N/A'}</div>
                                            </td>
                                            <td>{r.item_description} ({r.weight ? `${r.weight}g` : 'N/A'} / {r.purity || ''})</td>
                                            <td><span className="gold-badge" style={{ backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' }}>{r.repair_type}</span></td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{(r.estimated_charges || 0).toLocaleString()}</td>
                                            <td style={{ textAlign: 'center' }}>{r.promised_date ? new Date(r.promised_date).toLocaleDateString('en-IN') : 'N/A'}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span style={{
                                                    fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px',
                                                    backgroundColor: r.status === 'received' ? '#ECEFF1' : r.status === 'in_progress' ? '#E3F2FD' : r.status === 'ready' ? '#FFF3E0' : '#E8F5E9',
                                                    color: r.status === 'received' ? '#37474F' : r.status === 'in_progress' ? '#1565C0' : r.status === 'ready' ? '#E65100' : '#2E7D32'
                                                }}>{r.status.toUpperCase()}</span>
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
            {selectedRepair && (
                <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'fit-content', border: '1px solid var(--gold-light)', alignSelf: 'start', position: 'sticky', top: '80px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>Repair Order</h2>
                            <p style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 600 }}>{selectedRepair.job_number}</p>
                        </div>
                        <button onClick={() => setSelectedRepair(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                        <div style={{ padding: '10px', background: 'var(--bg)', borderRadius: '8px' }}>
                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Customer Detail</div>
                            <div>👦 {selectedRepair.customer_name}</div>
                            <div>📞 {selectedRepair.customer_phone || 'No Phone'}</div>
                        </div>

                        <div style={{ padding: '10px', background: 'var(--bg)', borderRadius: '8px' }}>
                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Item Specification</div>
                            <div>🔧 Description: {selectedRepair.item_description}</div>
                            <div>⚖️ Weight: {selectedRepair.weight ? `${selectedRepair.weight} g` : 'N/A'}</div>
                            <div>🏷️ Type: {selectedRepair.repair_type}</div>
                            {selectedRepair.problem_description && <div>⚠️ Defect Note: {selectedRepair.problem_description}</div>}
                        </div>

                        <div style={{ padding: '10px', background: 'var(--bg)', borderRadius: '8px' }}>
                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Charges Ledger</div>
                            <div>💵 Estimated Fee: ₹{selectedRepair.estimated_charges?.toLocaleString() || 0}</div>
                            <div>💸 Advance Deposit: ₹{selectedRepair.advance_paid?.toLocaleString() || 0}</div>
                            {selectedRepair.actual_charges && <div style={{ color: '#2E7D32', fontWeight: 600 }}>💵 Actual Closed Fee: ₹{selectedRepair.actual_charges.toLocaleString()}</div>}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button className="btn-secondary" onClick={handlePrintReceipt} style={{ flexGrow: 1, padding: '8px', minWidth: '80px' }}><Printer size={14} style={{ marginRight: '6px' }} /> Print</button>
                        <button className="btn-secondary" onClick={handleWhatsAppShare} style={{ flexGrow: 1, padding: '8px', minWidth: '80px' }}><Share2 size={14} style={{ marginRight: '6px' }} /> Share</button>
                        {selectedRepair.status !== 'delivered' && selectedRepair.status !== 'cancelled' && (
                            <button className="btn-primary" onClick={() => { setResolveForm({ ...resolveForm, actual_charges: selectedRepair.estimated_charges, advance_paid: selectedRepair.advance_paid }); setIsResolveModalOpen(true); }} style={{ flexGrow: 1, padding: '8px', minWidth: '80px' }}>Resolve</button>
                        )}
                    </div>
                </div>
            )}

            {/* Modals */}
            {isRepairModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }}>
                    <div style={{ background: 'white', borderRadius: 'var(--radius)', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Register Repair Order</h3>
                            <button onClick={() => setIsRepairModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreateRepair} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div><label>Customer Name *</label><input type="text" required value={repairForm.customer_name} onChange={e => setRepairForm({ ...repairForm, customer_name: e.target.value })} /></div>
                                <div><label>Phone Number</label><input type="text" value={repairForm.customer_phone} onChange={e => setRepairForm({ ...repairForm, customer_phone: e.target.value })} /></div>
                            </div>
                            <div><label>Item Description *</label><input type="text" required value={repairForm.item_description} onChange={e => setRepairForm({ ...repairForm, item_description: e.target.value })} placeholder="e.g. Gold Chain with broken clasp" /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                <div>
                                    <label>Metal</label>
                                    <select value={repairForm.metal} onChange={e => setRepairForm({ ...repairForm, metal: e.target.value })}>
                                        <option value="gold">Gold</option>
                                        <option value="silver">Silver</option>
                                        <option value="platinum">Platinum</option>
                                    </select>
                                </div>
                                <div><label>Purity</label><input type="text" value={repairForm.purity} onChange={e => setRepairForm({ ...repairForm, purity: e.target.value })} /></div>
                                <div><label>Weight (grams)</label><input type="number" step="0.01" value={repairForm.weight} onChange={e => setRepairForm({ ...repairForm, weight: parseFloat(e.target.value) || 0 })} /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div><label>Repair Type / Job</label><input type="text" value={repairForm.repair_type} onChange={e => setRepairForm({ ...repairForm, repair_type: e.target.value })} placeholder="e.g. resizing, polishing" /></div>
                                <div>
                                    <label>Assign to Karigar</label>
                                    <select value={repairForm.assigned_to_karigar_id} onChange={e => setRepairForm({ ...repairForm, assigned_to_karigar_id: e.target.value })}>
                                        <option value="">Do not assign yet (Store Desk)</option>
                                        {karigars.map(k => (
                                            <option key={k.id} value={k.id}>{k.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div><label>Estimated Charges (₹)</label><input type="number" value={repairForm.estimated_charges} onChange={e => setRepairForm({ ...repairForm, estimated_charges: parseFloat(e.target.value) || 0 })} /></div>
                                <div><label>Advance Deposit (₹)</label><input type="number" value={repairForm.advance_paid} onChange={e => setRepairForm({ ...repairForm, advance_paid: parseFloat(e.target.value) || 0 })} /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div><label>Date Received *</label><input type="date" required value={repairForm.received_date} onChange={e => setRepairForm({ ...repairForm, received_date: e.target.value })} /></div>
                                <div><label>Promised Delivery Date</label><input type="date" value={repairForm.promised_date} onChange={e => setRepairForm({ ...repairForm, promised_date: e.target.value })} /></div>
                            </div>
                            <div><label>Problem Details / Defects</label><input type="text" value={repairForm.problem_description} onChange={e => setRepairForm({ ...repairForm, problem_description: e.target.value })} /></div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setIsRepairModalOpen(false)} className="btn-secondary" style={{ padding: '6px 12px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ padding: '6px 16px' }}>Generate Repair Ticket</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isResolveModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }}>
                    <div style={{ background: 'white', borderRadius: 'var(--radius)', width: '100%', maxWidth: '400px' }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Resolve Repair Order</h3>
                            <button onClick={() => setIsResolveModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleResolveRepair} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label>Repair Status</label>
                                <select value={resolveForm.status} onChange={e => setResolveForm({ ...resolveForm, status: e.target.value })}>
                                    <option value="in_progress">Mark as In-Progress</option>
                                    <option value="ready">Mark as Ready for pickup</option>
                                    <option value="delivered">Mark as Delivered / Picked Up</option>
                                    <option value="cancelled">Mark as Cancelled</option>
                                </select>
                            </div>
                            <div><label>Actual / Final Charges (₹)</label><input type="number" value={resolveForm.actual_charges} onChange={e => setResolveForm({ ...resolveForm, actual_charges: parseFloat(e.target.value) || 0 })} /></div>
                            <div><label>Total Advance Deposit (₹)</label><input type="number" value={resolveForm.advance_paid} onChange={e => setResolveForm({ ...resolveForm, advance_paid: parseFloat(e.target.value) || 0 })} /></div>
                            {resolveForm.status === 'delivered' && (
                                <div><label>Date Handed Over</label><input type="date" value={resolveForm.delivery_date} onChange={e => setResolveForm({ ...resolveForm, delivery_date: e.target.value })} /></div>
                            )}
                            <div><label>Work Log / Resolution Remarks</label><input type="text" value={resolveForm.notes} onChange={e => setResolveForm({ ...resolveForm, notes: e.target.value })} /></div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setIsResolveModalOpen(false)} className="btn-secondary" style={{ padding: '6px 12px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ padding: '6px 16px' }}><CheckCircle size={14} style={{ marginRight: '6px' }} /> Update Resolution</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Repairs;
