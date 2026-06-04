const express = require('express');
const router = express.Router();
const { getDatabase, saveDatabase } = require('../db/database');
const { tenantId } = require('../db/tenant');

const toObjects = (res) => {
  if (!res || res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => { const obj = {}; cols.forEach((c, i) => (obj[c] = row[i])); return obj; });
};

router.get('/summary/counts', (req, res) => {
  const uid = tenantId(req);
  const db = getDatabase();
  try {
    const counts = toObjects(db.exec(
      'SELECT status, COUNT(*) as count FROM repair_orders WHERE user_id = ? GROUP BY status',
      [uid]
    ));
    res.json(counts);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', (req, res) => {
  const uid = tenantId(req);
  const { status } = req.query;
  const db = getDatabase();
  try {
    let sql = 'SELECT * FROM repair_orders WHERE user_id = ?';
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
    const rows = toObjects(db.exec('SELECT * FROM repair_orders WHERE id=? AND user_id=?', [req.params.id, uid]));
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', (req, res) => {
  const uid = tenantId(req);
  const db = getDatabase();
  const { customer_name, customer_phone, item_description, item_type, metal, purity, weight,
    repair_type, problem_description, estimated_charges, advance_paid, received_date, promised_date,
    assigned_to_karigar_id, notes } = req.body;
  if (!customer_name || !item_description || !received_date) {
    return res.status(400).json({ error: 'Required fields missing' });
  }
  try {
    const yr = new Date().getFullYear();
    const cnt = db.exec('SELECT COUNT(*) as c FROM repair_orders WHERE user_id=?', [uid])[0]?.values[0][0] || 0;
    const job_number = `REP-${yr}-${String(Number(cnt) + 1).padStart(4, '0')}`;
    db.run(`INSERT INTO repair_orders 
      (user_id, job_number, customer_name, customer_phone, item_description, item_type, metal, purity, weight,
       repair_type, problem_description, estimated_charges, advance_paid, received_date, promised_date,
       assigned_to_karigar_id, notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [uid, job_number, customer_name, customer_phone || null, item_description, item_type || null,
        metal || null, purity || null, weight || null, repair_type || null, problem_description || null,
        estimated_charges || null, advance_paid || 0, received_date, promised_date || null,
        assigned_to_karigar_id || null, notes || null]);
    const id = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    saveDatabase();
    res.status(201).json({ id, job_number });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', (req, res) => {
  const uid = tenantId(req);
  const db = getDatabase();
  const { status, actual_charges, advance_paid, completion_date, delivery_date, notes } = req.body;
  try {
    db.run(`UPDATE repair_orders SET status=?, actual_charges=?, advance_paid=?, completion_date=?, delivery_date=?, notes=? WHERE id=? AND user_id=?`,
      [status, actual_charges || null, advance_paid || null, completion_date || null, delivery_date || null, notes || null, req.params.id, uid]);
    if (db.getRowsModified() === 0) return res.status(404).json({ error: 'Not found' });
    saveDatabase();
    res.json({ message: 'Updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
