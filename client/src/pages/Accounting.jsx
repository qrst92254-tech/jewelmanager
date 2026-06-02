import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, DollarSign, Wallet, ArrowDownRight, ArrowUpRight, X, Trash2 } from 'lucide-react';

const API_URL = '';

const Accounting = () => {
    const [activeTab, setActiveTab] = useState('cashbook');
    const [loading, setLoading] = useState(true);

    // Ledger state
    const [ledger, setLedger] = useState([]);
    const [ledgerSearch, setLedgerSearch] = useState('');
    
    // Expense state
    const [expenses, setExpenses] = useState([]);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [expenseForm, setExpenseForm] = useState({
        expense_date: new Date().toISOString().split('T')[0], category: 'rent', description: '', amount: 0, payment_method: 'cash', paid_to: '', notes: ''
    });

    // Cashbook state
    const [cashbook, setCashbook] = useState({ cashIn: [], cashOut: [], totalIn: 0, totalOut: 0, netCash: 0 });
    const [cashbookDate, setCashbookDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchLedger = async () => {
        try {
            const url = ledgerSearch ? `${API_URL}/api/accounting/ledger?account=${encodeURIComponent(ledgerSearch)}` : `${API_URL}/api/accounting/ledger`;
            const res = await fetch(url);
            if (res.ok) setLedger(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchExpenses = async () => {
        try {
            const res = await fetch(`${API_URL}/api/accounting/expenses`);
            if (res.ok) setExpenses(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchCashbook = async () => {
        try {
            const res = await fetch(`${API_URL}/api/accounting/cashbook?date=${cashbookDate}`);
            if (res.ok) setCashbook(await res.json());
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            if (activeTab === 'cashbook') await fetchCashbook();
            else if (activeTab === 'ledger') await fetchLedger();
            else if (activeTab === 'expenses') await fetchExpenses();
            setLoading(false);
        };
        load();
    }, [activeTab, cashbookDate, ledgerSearch]);

    const handleCreateExpense = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/accounting/expenses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expenseForm)
            });
            if (res.ok) {
                setIsExpenseModalOpen(false);
                setExpenseForm({ expense_date: new Date().toISOString().split('T')[0], category: 'rent', description: '', amount: 0, payment_method: 'cash', paid_to: '', notes: '' });
                await fetchExpenses();
            }
        } catch (e) { console.error(e); }
    };

    const handleDeleteExpense = async (id) => {
        if (window.confirm('Delete this expense? This will also remove the transaction entry.')) {
            try {
                const res = await fetch(`${API_URL}/api/accounting/expenses/${id}`, { method: 'DELETE' });
                if (res.ok) await fetchExpenses();
            } catch (e) { console.error(e); }
        }
    };

    return (
        <div className="page-wrapper main-content fade-in container">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '36px', color: 'var(--text-primary)', margin: 0 }}>Ledger & Accounts</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Review internal ledger journals, daily cash book entries, and operating expenses</p>
                </div>
                {activeTab === 'expenses' && (
                    <button className="btn-primary" onClick={() => setIsExpenseModalOpen(true)}>
                        <Plus size={18} style={{ marginRight: '8px' }} /> Record Expense
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
                <button onClick={() => setActiveTab('cashbook')} style={{ background: 'none', border: 'none', padding: '12px 16px', cursor: 'pointer', fontWeight: 600, color: activeTab === 'cashbook' ? 'var(--gold)' : 'var(--text-secondary)', borderBottom: activeTab === 'cashbook' ? '3px solid var(--gold)' : 'none' }}>Daily Cash Book</button>
                <button onClick={() => setActiveTab('ledger')} style={{ background: 'none', border: 'none', padding: '12px 16px', cursor: 'pointer', fontWeight: 600, color: activeTab === 'ledger' ? 'var(--gold)' : 'var(--text-secondary)', borderBottom: activeTab === 'ledger' ? '3px solid var(--gold)' : 'none' }}>Account Ledgers</button>
                <button onClick={() => setActiveTab('expenses')} style={{ background: 'none', border: 'none', padding: '12px 16px', cursor: 'pointer', fontWeight: 600, color: activeTab === 'expenses' ? 'var(--gold)' : 'var(--text-secondary)', borderBottom: activeTab === 'expenses' ? '3px solid var(--gold)' : 'none' }}>Store Expenses</button>
            </div>

            {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading financial ledger...</div>
            ) : (
                <>
                    {activeTab === 'cashbook' && (
                        <div>
                            {/* Date Filter & Summary */}
                            <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '12px 20px', marginBottom: '2rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 500 }}><Calendar size={16} /> Cash Book Date:</div>
                                <div style={{ width: '180px' }}><input type="date" value={cashbookDate} onChange={e => setCashbookDate(e.target.value)} style={{ padding: '4px 8px' }} /></div>
                                <div style={{ display: 'flex', gap: '1rem', marginLeft: 'auto', fontSize: '0.9rem' }}>
                                    <div style={{ padding: '6px 12px', background: '#E8F5E9', color: '#2E7D32', borderRadius: '4px', fontWeight: 600 }}>Cash In: ₹{cashbook.totalIn.toLocaleString()}</div>
                                    <div style={{ padding: '6px 12px', background: '#FFEBEE', color: '#C62828', borderRadius: '4px', fontWeight: 600 }}>Cash Out: ₹{cashbook.totalOut.toLocaleString()}</div>
                                    <div style={{ padding: '6px 12px', background: 'var(--gold-light)', color: 'var(--gold-dark)', borderRadius: '4px', fontWeight: 600 }}>Net Cash: ₹{cashbook.netCash.toLocaleString()}</div>
                                </div>
                            </div>

                            {/* Dual Side-by-Side Tables */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="card" style={{ padding: 0 }}>
                                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: '#E8F5E9', color: '#2E7D32', borderTopLeftRadius: 'var(--radius)', borderTopRightRadius: 'var(--radius)' }}>
                                        <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}><ArrowDownRight size={18} /> Cash Inflow (Sales)</h3>
                                    </div>
                                    {cashbook.cashIn?.length === 0 ? (
                                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No cash sales recorded today.</div>
                                    ) : (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Ref Bill</th>
                                                        <th>Customer</th>
                                                        <th style={{ textAlign: 'right' }}>Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {cashbook.cashIn.map((s, idx) => (
                                                        <tr key={idx}>
                                                            <td style={{ fontWeight: 600, color: 'var(--gold)' }}>{s.ref}</td>
                                                            <td>{s.party}</td>
                                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{s.amount.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                <div className="card" style={{ padding: 0 }}>
                                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: '#FFEBEE', color: '#C62828', borderTopLeftRadius: 'var(--radius)', borderTopRightRadius: 'var(--radius)' }}>
                                        <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}><ArrowUpRight size={18} /> Cash Outflow (Expenses)</h3>
                                    </div>
                                    {cashbook.cashOut?.length === 0 ? (
                                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No cash expenses recorded today.</div>
                                    ) : (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Expense Category</th>
                                                        <th>Paid To</th>
                                                        <th style={{ textAlign: 'right' }}>Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {cashbook.cashOut.map((e, idx) => (
                                                        <tr key={idx}>
                                                            <td style={{ fontWeight: 600 }}>{e.ref.toUpperCase()}</td>
                                                            <td>{e.party || 'N/A'}</td>
                                                            <td style={{ textAlign: 'right', fontWeight: 600, color: '#C62828' }}>₹{e.amount.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ledger' && (
                        <div>
                            {/* Search bar */}
                            <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ position: 'relative', flexGrow: 1 }}>
                                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="text"
                                        placeholder="Filter ledger by Account Name (e.g. Sales, Rent, Gold Purchases)..."
                                        value={ledgerSearch}
                                        onChange={e => setLedgerSearch(e.target.value)}
                                        style={{ paddingLeft: '38px', width: '100%' }}
                                    />
                                </div>
                            </div>

                            {/* Ledger journal */}
                            <div className="card" style={{ padding: 0 }}>
                                {ledger.length === 0 ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No transaction ledger lines found.</div>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Entry Date</th>
                                                    <th>Account Name</th>
                                                    <th>Type</th>
                                                    <th>Description</th>
                                                    <th style={{ textAlign: 'right' }}>Debit (Out)</th>
                                                    <th style={{ textAlign: 'right' }}>Credit (In)</th>
                                                    <th style={{ textAlign: 'right' }}>Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ledger.map(l => (
                                                    <tr key={l.id}>
                                                        <td>{new Date(l.entry_date).toLocaleDateString('en-IN')}</td>
                                                        <td style={{ fontWeight: 600 }}>{l.account_name.toUpperCase()}</td>
                                                        <td><span className="gold-badge" style={{ backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' }}>{l.entry_type}</span></td>
                                                        <td>{l.description}</td>
                                                        <td style={{ textAlign: 'right', color: l.debit > 0 ? '#C62828' : 'inherit' }}>{l.debit > 0 ? `₹${l.debit.toLocaleString()}` : '-'}</td>
                                                        <td style={{ textAlign: 'right', color: l.credit > 0 ? '#2E7D32' : 'inherit' }}>{l.credit > 0 ? `₹${l.credit.toLocaleString()}` : '-'}</td>
                                                        <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{(l.balance || 0).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'expenses' && (
                        <div>
                            {/* Expense log */}
                            <div className="card" style={{ padding: 0 }}>
                                {expenses.length === 0 ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No expense logs. Register store expenses.</div>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Date Paid</th>
                                                    <th>Category</th>
                                                    <th>Paid To</th>
                                                    <th>Payment Method</th>
                                                    <th>Description</th>
                                                    <th style={{ textAlign: 'right' }}>Amount Paid</th>
                                                    <th style={{ textAlign: 'center' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {expenses.map(e => (
                                                    <tr key={e.id}>
                                                        <td>{new Date(e.expense_date).toLocaleDateString('en-IN')}</td>
                                                        <td style={{ fontWeight: 600 }}>{e.category.toUpperCase()}</td>
                                                        <td>{e.paid_to || 'N/A'}</td>
                                                        <td><span className="gold-badge">{e.payment_method}</span></td>
                                                        <td>{e.description}</td>
                                                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#C62828' }}>₹{e.amount.toLocaleString()}</td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <button onClick={() => handleDeleteExpense(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF5252' }}><Trash2 size={16} /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Expense Creation Modal */}
            {isExpenseModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }}>
                    <div style={{ background: 'white', borderRadius: 'var(--radius)', width: '100%', maxWidth: '440px' }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Record Business Expense</h3>
                            <button onClick={() => setIsExpenseModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreateExpense} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div><label>Payment Date *</label><input type="date" required value={expenseForm.expense_date} onChange={e => setExpenseForm({ ...expenseForm, expense_date: e.target.value })} /></div>
                            <div>
                                <label>Category *</label>
                                <select value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                                    <option value="rent">Rent / Property Lease</option>
                                    <option value="salaries">Staff Salaries</option>
                                    <option value="electricity">Utility (Electricity / Water)</option>
                                    <option value="advertising">Marketing / Ads</option>
                                    <option value="making_charges">Craftsmen Labor Settlement</option>
                                    <option value="other">Other Misc Expense</option>
                                </select>
                            </div>
                            <div><label>Amount Paid (₹) *</label><input type="number" required value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })} /></div>
                            <div><label>Recipient Name (Paid To)</label><input type="text" value={expenseForm.paid_to} onChange={e => setExpenseForm({ ...expenseForm, paid_to: e.target.value })} /></div>
                            <div>
                                <label>Payment Method</label>
                                <select value={expenseForm.payment_method} onChange={e => setExpenseForm({ ...expenseForm, payment_method: e.target.value })}>
                                    <option value="cash">Cash Desk</option>
                                    <option value="bank">Bank Ledger</option>
                                    <option value="upi">UPI Ledger</option>
                                </select>
                            </div>
                            <div><label>Short Description</label><input type="text" value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} /></div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="btn-secondary" style={{ padding: '6px 12px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ padding: '6px 16px' }}>Save Expense</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Accounting;
