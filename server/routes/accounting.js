const express = require('express');
const router = express.Router();
const { getDatabase, saveDatabase } = require('../db/database');
const { tenantId } = require('../db/tenant');

const toObjects = (res) => {
  if (!res || res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => { const obj = {}; cols.forEach((c, i) => (obj[c] = row[i])); return obj; });
};

router.get('/ledger', (req, res) => {
  const uid = tenantId(req);
  const { account, from, to } = req.query;
  const db = getDatabase();
  try {
    let sql = 'SELECT * FROM ledger_entries WHERE user_id = ?';
    const params = [uid];
    if (account) { sql += ' AND account_name LIKE ?'; params.push(`%${account}%`); }
    if (from) { sql += ' AND entry_date >= ?'; params.push(from); }
    if (to) { sql += ' AND entry_date <= ?'; params.push(to); }
    sql += ' ORDER BY entry_date DESC, id DESC';
    res.json(toObjects(db.exec(sql, params)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/ledger', (req, res) => {
  const uid = tenantId(req);
  const db = getDatabase();
  const { entry_date, entry_type, account_name, description, debit, credit, reference_id, reference_type } = req.body;
  try {
    const prev = toObjects(db.exec(
      'SELECT balance FROM ledger_entries WHERE user_id = ? AND account_name=? ORDER BY entry_date DESC, id DESC LIMIT 1',
      [uid, account_name]
    ));
    const prevBalance = prev[0]?.balance || 0;
    const balance = prevBalance + (credit || 0) - (debit || 0);
    db.run(`INSERT INTO ledger_entries (user_id, entry_date, entry_type, account_name, description, debit, credit, balance, reference_id, reference_type)
      VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [uid, entry_date, entry_type, account_name, description || null, debit || 0, credit || 0, balance,
        reference_id || null, reference_type || null]);
    saveDatabase();
    res.status(201).json({ message: 'Entry added', balance });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/expenses', (req, res) => {
  const uid = tenantId(req);
  const { from, to } = req.query;
  const db = getDatabase();
  try {
    let sql = 'SELECT * FROM expenses WHERE user_id = ?';
    const params = [uid];
    if (from) { sql += ' AND expense_date >= ?'; params.push(from); }
    if (to) { sql += ' AND expense_date <= ?'; params.push(to); }
    sql += ' ORDER BY expense_date DESC';
    res.json(toObjects(db.exec(sql, params)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/expenses', (req, res) => {
  const uid = tenantId(req);
  const db = getDatabase();
  const { expense_date, category, description, amount, payment_method, paid_to, notes } = req.body;
  if (!expense_date || !category || !amount) return res.status(400).json({ error: 'Required fields missing' });
  try {
    db.run('INSERT INTO expenses (user_id, expense_date, category, description, amount, payment_method, paid_to, notes) VALUES (?,?,?,?,?,?,?,?)',
      [uid, expense_date, category, description || null, amount, payment_method || 'cash', paid_to || null, notes || null]);
    db.run(`INSERT INTO ledger_entries (user_id, entry_date, entry_type, account_name, description, debit, credit, balance)
      VALUES (?,?,?,?,?,0,0)`,
      [uid, expense_date, 'expense', category, description || category, amount]);
    const id = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    saveDatabase();
    res.status(201).json({ id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/cashbook', (req, res) => {
  const uid = tenantId(req);
  const { date } = req.query;
  const d = date || new Date().toISOString().split('T')[0];
  const db = getDatabase();
  try {
    const salesIn = toObjects(db.exec(`SELECT 'sale' as type, sale_date as date, bill_number as ref, customer_name as party, final_amount as amount, payment_mode as method
      FROM sales WHERE user_id = ? AND date(sale_date)=? AND payment_mode='Cash'`, [uid, d]));
    const expOut = toObjects(db.exec(`SELECT 'expense' as type, expense_date as date, category as ref, paid_to as party, amount, payment_method as method
      FROM expenses WHERE user_id = ? AND expense_date=? AND payment_method='cash'`, [uid, d]));
    const totalIn = salesIn.reduce((a, s) => a + (s.amount || 0), 0);
    const totalOut = expOut.reduce((a, e) => a + (e.amount || 0), 0);
    res.json({ date: d, cashIn: salesIn, cashOut: expOut, totalIn, totalOut, netCash: totalIn - totalOut });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/expenses/:id', (req, res) => {
  const uid = tenantId(req);
  const db = getDatabase();
  try {
    db.run('DELETE FROM expenses WHERE id=? AND user_id=?', [req.params.id, uid]);
    if (db.getRowsModified() === 0) return res.status(404).json({ error: 'Not found' });
    saveDatabase();
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
