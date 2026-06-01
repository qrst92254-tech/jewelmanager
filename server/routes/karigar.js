const express = require('express');
const router = express.Router();
const { getDatabase, saveDatabase } = require('../db/database');

const toObjects = (res) => {
  if (!res || res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => {
    const obj = {};
    cols.forEach((c, i) => (obj[c] = row[i]));
    return obj;
  });
};

// GET all karigars
router.get('/', (req, res) => {
  const db = getDatabase();
  try {
    const result = db.exec('SELECT * FROM karigars ORDER BY created_at DESC');
    res.json(toObjects(result));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET one karigar
router.get('/:id', (req, res) => {
  const db = getDatabase();
  try {
    const result = db.exec('SELECT * FROM karigars WHERE id = ?', [req.params.id]);
    const rows = toObjects(result);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST create karigar
router.post('/', (req, res) => {
  const db = getDatabase();
  const { name, phone, address, skill_type, id_proof } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    db.run('INSERT INTO karigars (name,phone,address,skill_type,id_proof) VALUES (?,?,?,?,?)',
      [name, phone||null, address||null, skill_type||null, id_proof||null]);
    const id = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    saveDatabase();
    res.status(201).json({ id, message: 'Karigar created' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT update karigar
router.put('/:id', (req, res) => {
  const db = getDatabase();
  const { name, phone, address, skill_type, id_proof, is_active } = req.body;
  try {
    db.run('UPDATE karigars SET name=?,phone=?,address=?,skill_type=?,id_proof=?,is_active=? WHERE id=?',
      [name, phone, address, skill_type, id_proof, is_active ?? 1, req.params.id]);
    saveDatabase();
    res.json({ message: 'Updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET karigar transactions
router.get('/:id/transactions', (req, res) => {
  const db = getDatabase();
  try {
    const result = db.exec('SELECT * FROM karigar_transactions WHERE karigar_id=? ORDER BY created_at DESC', [req.params.id]);
    res.json(toObjects(result));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST issue/receive metal transaction
router.post('/transactions', (req, res) => {
  const db = getDatabase();
  const { karigar_id, transaction_type, metal, gross_weight, fine_weight, purity,
    making_charges, wastage_percent, wastage_grams, order_description, expected_date, notes } = req.body;
  try {
    db.run(`INSERT INTO karigar_transactions 
      (karigar_id,transaction_type,metal,gross_weight,fine_weight,purity,making_charges,wastage_percent,wastage_grams,order_description,expected_date,notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [karigar_id, transaction_type, metal, gross_weight||0, fine_weight||0, purity,
       making_charges||0, wastage_percent||0, wastage_grams||0, order_description, expected_date||null, notes||null]);
    
    // Update karigar balance
    if (metal === 'gold') {
      const delta = transaction_type === 'issue' ? (gross_weight||0) : -(gross_weight||0);
      db.run('UPDATE karigars SET balance_gold_grams = balance_gold_grams + ? WHERE id=?', [delta, karigar_id]);
    } else {
      const delta = transaction_type === 'issue' ? (gross_weight||0) : -(gross_weight||0);
      db.run('UPDATE karigars SET balance_silver_grams = balance_silver_grams + ? WHERE id=?', [delta, karigar_id]);
    }
    
    const id = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    saveDatabase();
    res.status(201).json({ id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET all job cards
router.get('/job-cards/all', (req, res) => {
  const db = getDatabase();
  try {
    const result = db.exec(`SELECT jc.*, k.name as karigar_name FROM karigar_job_cards jc 
      LEFT JOIN karigars k ON jc.karigar_id = k.id ORDER BY jc.rowid DESC`);
    res.json(toObjects(result));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST create job card
router.post('/job-cards', (req, res) => {
  const db = getDatabase();
  const { karigar_id, product_description, category, purity, gold_issued_grams,
    making_charges, order_date, expected_date, notes } = req.body;
  try {
    // Generate job card number
    const yr = new Date().getFullYear();
    const last = db.exec('SELECT COUNT(*) as c FROM karigar_job_cards')[0]?.values[0][0] || 0;
    const job_card_number = `JOB-${yr}-${String(Number(last)+1).padStart(4,'0')}`;
    
    db.run(`INSERT INTO karigar_job_cards 
      (job_card_number,karigar_id,product_description,category,purity,gold_issued_grams,making_charges,order_date,expected_date,notes)
      VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [job_card_number, karigar_id, product_description, category, purity, gold_issued_grams||0,
       making_charges||0, order_date||null, expected_date||null, notes||null]);
    const id = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    saveDatabase();
    res.status(201).json({ id, job_card_number });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT update job card status
router.put('/job-cards/:id', (req, res) => {
  const db = getDatabase();
  const { status, gold_received_grams, wastage_grams, wastage_percent, completion_date } = req.body;
  try {
    db.run(`UPDATE karigar_job_cards SET status=?,gold_received_grams=?,wastage_grams=?,wastage_percent=?,completion_date=? WHERE id=?`,
      [status, gold_received_grams||null, wastage_grams||null, wastage_percent||null, completion_date||null, req.params.id]);
    if (status === 'completed') {
      db.run('UPDATE karigars SET total_orders_completed = total_orders_completed + 1 WHERE id = (SELECT karigar_id FROM karigar_job_cards WHERE id=?)', [req.params.id]);
    }
    saveDatabase();
    res.json({ message: 'Updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
