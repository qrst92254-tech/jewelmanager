const express = require('express');
const router = express.Router();
const { getDatabase, saveDatabase } = require('../db/database');
const { tenantId } = require('../db/tenant');
const { nextSequentialNumber } = require('../db/documentNumbers');

const toObjects = (res) => {
  if (!res || res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => { const obj = {}; cols.forEach((c, i) => (obj[c] = row[i])); return obj; });
};

router.get('/plans', (req, res) => {
  const uid = tenantId(req);
  const db = getDatabase();
  try {
    res.json(toObjects(db.exec('SELECT * FROM scheme_plans WHERE user_id = ? AND is_active=1 ORDER BY id', [uid])));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/plans', (req, res) => {
  const uid = tenantId(req);
  const db = getDatabase();
  const { plan_name, duration_months, monthly_amount, bonus_month, scheme_type, description } = req.body;
  try {
    db.run('INSERT INTO scheme_plans (user_id, plan_name, duration_months, monthly_amount, bonus_month, scheme_type, description) VALUES (?,?,?,?,?,?,?)',
      [uid, plan_name, duration_months, monthly_amount, bonus_month || 1, scheme_type || 'gold', description || null]);
    const id = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    saveDatabase();
    res.status(201).json({ id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/enrollments', (req, res) => {
  const uid = tenantId(req);
  const db = getDatabase();
  try {
    const result = db.exec(`SELECT e.*, p.plan_name, p.duration_months FROM scheme_enrollments e 
      LEFT JOIN scheme_plans p ON e.plan_id=p.id AND p.user_id=?
      WHERE e.user_id = ? ORDER BY e.created_at DESC`, [uid, uid]);
    res.json(toObjects(result));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/enrollments', (req, res) => {
  const uid = tenantId(req);
  const db = getDatabase();
  const { plan_id, customer_name, customer_phone, start_date, monthly_amount, notes } = req.body;
  try {
    const plan = toObjects(db.exec('SELECT * FROM scheme_plans WHERE id=? AND user_id=?', [plan_id, uid]))[0];
    if (!plan) return res.status(400).json({ error: 'Plan not found' });

    const scheme_number = nextSequentialNumber('scheme_enrollments', 'scheme_number', 'SCH');
    const start = new Date(start_date);
    const end = new Date(start);
    end.setMonth(end.getMonth() + (plan.duration_months || 12));
    const end_date = end.toISOString().split('T')[0];
    db.run(`INSERT INTO scheme_enrollments (user_id, scheme_number, plan_id, customer_name, customer_phone, start_date, end_date, monthly_amount, notes)
      VALUES (?,?,?,?,?,?,?,?,?)`,
      [uid, scheme_number, plan_id, customer_name, customer_phone || null, start_date, end_date, monthly_amount, notes || null]);
    const id = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    saveDatabase();
    res.status(201).json({ id, scheme_number });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/enrollments/:id/payments', (req, res) => {
  const uid = tenantId(req);
  const db = getDatabase();
  const { payment_date, amount_paid, payment_method } = req.body;
  try {
    const enr = toObjects(db.exec('SELECT * FROM scheme_enrollments WHERE id=? AND user_id=?', [req.params.id, uid]))[0];
    if (!enr) return res.status(404).json({ error: 'Enrollment not found' });
    const month_number = (enr.months_paid || 0) + 1;
    const yr = new Date().getFullYear();
    const cnt = db.exec('SELECT COUNT(*) as c FROM scheme_payments')[0]?.values[0][0] || 0;
    const receipt_number = `RCP-${yr}-${String(Number(cnt) + 1).padStart(4, '0')}`;
    db.run(`INSERT INTO scheme_payments (enrollment_id, payment_date, month_number, amount_paid, payment_method, receipt_number)
      VALUES (?,?,?,?,?,?)`,
      [req.params.id, payment_date, month_number, amount_paid, payment_method || 'cash', receipt_number]);
    db.run('UPDATE scheme_enrollments SET months_paid=months_paid+1, total_paid=total_paid+? WHERE id=? AND user_id=?',
      [amount_paid, req.params.id, uid]);
    db.run("UPDATE scheme_enrollments SET status='completed' WHERE id=? AND user_id=? AND months_paid >= (SELECT duration_months FROM scheme_plans WHERE id=plan_id)", [req.params.id, uid]);
    saveDatabase();
    res.status(201).json({ receipt_number });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/enrollments/:id/payments', (req, res) => {
  const uid = tenantId(req);
  const db = getDatabase();
  try {
    const enr = toObjects(db.exec('SELECT id FROM scheme_enrollments WHERE id=? AND user_id=?', [req.params.id, uid]));
    if (!enr.length) return res.status(404).json({ error: 'Not found' });
    res.json(toObjects(db.exec('SELECT * FROM scheme_payments WHERE enrollment_id=? ORDER BY month_number', [req.params.id])));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
