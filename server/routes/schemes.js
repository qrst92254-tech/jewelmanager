const express = require('express');
const router = express.Router();
const { getDatabase, saveDatabase } = require('../db/database');

const toObjects = (res) => {
  if (!res || res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => { const obj = {}; cols.forEach((c, i) => (obj[c] = row[i])); return obj; });
};

// GET all scheme plans
router.get('/plans', (req, res) => {
  const db = getDatabase();
  try { res.json(toObjects(db.exec('SELECT * FROM scheme_plans WHERE is_active=1 ORDER BY id'))); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// POST create plan
router.post('/plans', (req, res) => {
  const db = getDatabase();
  const { plan_name, duration_months, monthly_amount, bonus_month, scheme_type, description } = req.body;
  try {
    db.run('INSERT INTO scheme_plans (plan_name,duration_months,monthly_amount,bonus_month,scheme_type,description) VALUES (?,?,?,?,?,?)',
      [plan_name, duration_months, monthly_amount, bonus_month||1, scheme_type||'gold', description||null]);
    const id = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    saveDatabase();
    res.status(201).json({ id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET all enrollments
router.get('/enrollments', (req, res) => {
  const db = getDatabase();
  try {
    const result = db.exec(`SELECT e.*, p.plan_name, p.duration_months FROM scheme_enrollments e 
      LEFT JOIN scheme_plans p ON e.plan_id=p.id ORDER BY e.created_at DESC`);
    res.json(toObjects(result));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST new enrollment
router.post('/enrollments', (req, res) => {
  const db = getDatabase();
  const { plan_id, customer_name, customer_phone, start_date, monthly_amount, notes } = req.body;
  try {
    const yr = new Date().getFullYear();
    const cnt = db.exec('SELECT COUNT(*) as c FROM scheme_enrollments')[0]?.values[0][0] || 0;
    const scheme_number = `SCH-${yr}-${String(Number(cnt)+1).padStart(4,'0')}`;
    // Calculate end date
    const plan = toObjects(db.exec('SELECT * FROM scheme_plans WHERE id=?', [plan_id]))[0];
    const start = new Date(start_date);
    const end = new Date(start);
    end.setMonth(end.getMonth() + (plan?.duration_months || 12));
    const end_date = end.toISOString().split('T')[0];
    db.run(`INSERT INTO scheme_enrollments (scheme_number,plan_id,customer_name,customer_phone,start_date,end_date,monthly_amount,notes)
      VALUES (?,?,?,?,?,?,?,?)`,
      [scheme_number, plan_id, customer_name, customer_phone||null, start_date, end_date, monthly_amount, notes||null]);
    const id = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    saveDatabase();
    res.status(201).json({ id, scheme_number });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST record monthly payment
router.post('/enrollments/:id/payments', (req, res) => {
  const db = getDatabase();
  const { payment_date, amount_paid, payment_method } = req.body;
  try {
    // Get current months_paid
    const enr = toObjects(db.exec('SELECT * FROM scheme_enrollments WHERE id=?', [req.params.id]))[0];
    const month_number = (enr?.months_paid || 0) + 1;
    const yr = new Date().getFullYear();
    const cnt = db.exec('SELECT COUNT(*) as c FROM scheme_payments')[0]?.values[0][0] || 0;
    const receipt_number = `RCP-${yr}-${String(Number(cnt)+1).padStart(4,'0')}`;
    db.run(`INSERT INTO scheme_payments (enrollment_id,payment_date,month_number,amount_paid,payment_method,receipt_number)
      VALUES (?,?,?,?,?,?)`,
      [req.params.id, payment_date, month_number, amount_paid, payment_method||'cash', receipt_number]);
    db.run('UPDATE scheme_enrollments SET months_paid=months_paid+1, total_paid=total_paid+? WHERE id=?',
      [amount_paid, req.params.id]);
    // Check completion
    if (enr && month_number >= enr.monthly_amount) { // simple check
      db.run("UPDATE scheme_enrollments SET status='completed' WHERE id=? AND months_paid >= (SELECT duration_months FROM scheme_plans WHERE id=plan_id)", [req.params.id]);
    }
    saveDatabase();
    res.status(201).json({ receipt_number });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET enrollment payments
router.get('/enrollments/:id/payments', (req, res) => {
  const db = getDatabase();
  try { res.json(toObjects(db.exec('SELECT * FROM scheme_payments WHERE enrollment_id=? ORDER BY month_number', [req.params.id]))); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
