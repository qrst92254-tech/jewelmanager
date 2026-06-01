const express = require('express');
const router = express.Router();
const { getDatabase, saveDatabase } = require('../db/database');

const toObjects = (res) => {
  if (!res || res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => { const obj = {}; cols.forEach((c, i) => (obj[c] = row[i])); return obj; });
};

// GET all repairs
router.get('/', (req, res) => {
  const { status } = req.query;
  const db = getDatabase();
  try {
    let sql = 'SELECT * FROM repair_orders';
    const params = [];
    if (status && status !== 'all') { sql += ' WHERE status=?'; params.push(status); }
    sql += ' ORDER BY created_at DESC';
    res.json(toObjects(db.exec(sql, params)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET one repair
router.get('/:id', (req, res) => {
  const db = getDatabase();
  try {
    const rows = toObjects(db.exec('SELECT * FROM repair_orders WHERE id=?', [req.params.id]));
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST new repair order
router.post('/', (req, res) => {
  const db = getDatabase();
  const { customer_name, customer_phone, item_description, item_type, metal, purity, weight,
    repair_type, problem_description, estimated_charges, advance_paid, received_date, promised_date,
    assigned_to_karigar_id, notes } = req.body;
  if (!customer_name || !item_description || !received_date) {
    return res.status(400).json({ error: 'Required fields missing' });
  }
  try {
    const yr = new Date().getFullYear();
    const cnt = db.exec('SELECT COUNT(*) as c FROM repair_orders')[0]?.values[0][0] || 0;
    const job_number = `REP-${yr}-${String(Number(cnt)+1).padStart(4,'0')}`;
    db.run(`INSERT INTO repair_orders 
      (job_number,customer_name,customer_phone,item_description,item_type,metal,purity,weight,
       repair_type,problem_description,estimated_charges,advance_paid,received_date,promised_date,
       assigned_to_karigar_id,notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [job_number, customer_name, customer_phone||null, item_description, item_type||null,
       metal||null, purity||null, weight||null, repair_type||null, problem_description||null,
       estimated_charges||null, advance_paid||0, received_date, promised_date||null,
       assigned_to_karigar_id||null, notes||null]);
    const id = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    saveDatabase();
    res.status(201).json({ id, job_number });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT update repair status/charges
router.put('/:id', (req, res) => {
  const db = getDatabase();
  const { status, actual_charges, advance_paid, completion_date, delivery_date, notes } = req.body;
  try {
    db.run(`UPDATE repair_orders SET status=?,actual_charges=?,advance_paid=?,completion_date=?,delivery_date=?,notes=? WHERE id=?`,
      [status, actual_charges||null, advance_paid||null, completion_date||null, delivery_date||null, notes||null, req.params.id]);
    saveDatabase();
    res.json({ message: 'Updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET status summary counts
router.get('/summary/counts', (req, res) => {
  const db = getDatabase();
  try {
    const counts = toObjects(db.exec(`SELECT status, COUNT(*) as count FROM repair_orders GROUP BY status`));
    res.json(counts);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
