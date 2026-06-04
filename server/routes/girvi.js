const express = require('express');
const router = express.Router();
const { getDatabase, saveDatabase } = require('../db/database');
const { tenantId } = require('../db/tenant');

const toObjects = (res) => {
  if (!res || res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => {
    const obj = {};
    cols.forEach((c, i) => (obj[c] = row[i]));
    return obj;
  });
};

const genGirviNumber = (db, uid) => {
  const yr = new Date().getFullYear();
  const last = db.exec('SELECT COUNT(*) as c FROM girvi_records WHERE user_id=?', [uid])[0]?.values[0][0] || 0;
  return `GRV-${yr}-${String(Number(last) + 1).padStart(4, '0')}`;
};

router.get('/summary/overdue', (req, res) => {
  const uid = tenantId(req);
  const db = getDatabase();
  try {
    const today = new Date().toISOString().split('T')[0];
    const overdue = toObjects(db.exec(
      `SELECT * FROM girvi_records WHERE user_id=? AND status='active' AND due_date < ? ORDER BY due_date ASC`,
      [uid, today]
    ));
    const dueSoon = toObjects(db.exec(
      `SELECT * FROM girvi_records WHERE user_id=? AND status='active' AND due_date BETWEEN ? AND date(?,'+7 days') ORDER BY due_date ASC`,
      [uid, today, today]
    ));
    res.json({ overdue, dueSoon });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', (req, res) => {
  const uid = tenantId(req);
  const { status } = req.query;
  const db = getDatabase();
  try {
    let sql = 'SELECT * FROM girvi_records WHERE user_id = ?';
    const params = [uid];
    if (status && status !== 'all') { sql += ' AND status=?'; params.push(status); }
    sql += ' ORDER BY created_at DESC';
    res.json(toObjects(db.exec(sql, params)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', (req, res) => {
  const uid = tenantId(req);
  const db = getDatabase();
  try {
    const rows = toObjects(db.exec('SELECT * FROM girvi_records WHERE id=? AND user_id=?', [req.params.id, uid]));
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const payments = toObjects(db.exec('SELECT * FROM girvi_payments WHERE girvi_id=? ORDER BY payment_date DESC', [req.params.id]));
    res.json({ ...rows[0], payments });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', (req, res) => {
  const uid = tenantId(req);
  const db = getDatabase();
  const { customer_name, customer_phone, customer_address, customer_id_proof,
    item_description, item_type, metal, purity, gross_weight, net_weight, stone_weight,
    valuation_rate, metal_value, loan_amount, interest_rate, interest_type,
    pledge_date, due_date, notes } = req.body;
  if (!customer_name || !customer_phone || !item_description || !gross_weight || !loan_amount || !pledge_date) {
    return res.status(400).json({ error: 'Required fields missing' });
  }
  try {
    const girvi_number = genGirviNumber(db, uid);
    db.run(`INSERT INTO girvi_records 
      (user_id, girvi_number, customer_name, customer_phone, customer_address, customer_id_proof,
       item_description, item_type, metal, purity, gross_weight, net_weight, stone_weight,
       valuation_rate, metal_value, loan_amount, interest_rate, interest_type, pledge_date, due_date, notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [uid, girvi_number, customer_name, customer_phone, customer_address || null, customer_id_proof || null,
        item_description, item_type || null, metal || null, purity || null, gross_weight, net_weight || null, stone_weight || 0,
        valuation_rate || null, metal_value || null, loan_amount, interest_rate || 2.0, interest_type || 'simple',
        pledge_date, due_date || null, notes || null]);
    const id = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    saveDatabase();
    res.status(201).json({ id, girvi_number });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', (req, res) => {
  const uid = tenantId(req);
  const db = getDatabase();
  const { status, release_date, notes, transferred_to } = req.body;
  try {
    db.run('UPDATE girvi_records SET status=?, release_date=?, notes=?, transferred_to=? WHERE id=? AND user_id=?',
      [status, release_date || null, notes || null, transferred_to || null, req.params.id, uid]);
    if (db.getRowsModified() === 0) return res.status(404).json({ error: 'Not found' });
    saveDatabase();
    res.json({ message: 'Updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/payments', (req, res) => {
  const uid = tenantId(req);
  const db = getDatabase();
  const { payment_date, amount_paid, interest_amount, principal_amount, payment_method, notes } = req.body;
  try {
    const owned = toObjects(db.exec('SELECT id FROM girvi_records WHERE id=? AND user_id=?', [req.params.id, uid]));
    if (!owned.length) return res.status(404).json({ error: 'Not found' });
    db.run(`INSERT INTO girvi_payments (girvi_id,payment_date,amount_paid,interest_amount,principal_amount,payment_method,notes)
      VALUES (?,?,?,?,?,?,?)`,
      [req.params.id, payment_date, amount_paid, interest_amount || null, principal_amount || null, payment_method || 'cash', notes || null]);
    db.run('UPDATE girvi_records SET total_paid = total_paid + ? WHERE id=? AND user_id=?', [amount_paid, req.params.id, uid]);
    saveDatabase();
    res.status(201).json({ message: 'Payment recorded' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
