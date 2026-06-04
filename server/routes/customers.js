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

router.get('/', (req, res) => {
  const uid = tenantId(req);
  const { q } = req.query;
  const db = getDatabase();
  let sql = 'SELECT * FROM customers WHERE user_id = ?';
  const params = [uid];
  if (q) {
    sql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  sql += ' ORDER BY created_at DESC';
  try {
    const result = db.exec(sql, params);
    res.json(toObjects(result));
  } catch (err) {
    console.error('Error fetching customers:', err.message);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

router.get('/:id/purchases', (req, res) => {
  const uid = tenantId(req);
  const { id } = req.params;
  const db = getDatabase();

  try {
    const customerRes = db.exec('SELECT * FROM customers WHERE id = ? AND user_id = ?', [id, uid]);
    const customer = toObjects(customerRes)[0];
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const params = [uid];
    let sql = 'SELECT id, bill_number, sale_date, final_amount, payment_mode FROM sales WHERE user_id = ?';
    if (customer.phone) {
      sql += ' AND (customer_phone = ? OR customer_name = ?)';
      params.push(customer.phone, customer.name);
    } else {
      sql += ' AND customer_name = ?';
      params.push(customer.name);
    }
    sql += ' ORDER BY sale_date DESC';

    res.json(toObjects(db.exec(sql, params)));
  } catch (err) {
    console.error('Error fetching customer purchases:', err.message);
    res.status(500).json({ error: 'Failed to fetch customer purchases' });
  }
});

router.get('/:id/summary', (req, res) => {
  const uid = tenantId(req);
  const { id } = req.params;
  const db = getDatabase();

  try {
    const customerRes = db.exec('SELECT * FROM customers WHERE id = ? AND user_id = ?', [id, uid]);
    const customer = toObjects(customerRes)[0];
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const purchasesRes = db.exec(
      'SELECT sum(final_amount) as total_sales, count(*) as purchases_count FROM sales WHERE user_id = ? AND (customer_name = ? OR customer_phone = ?)',
      [uid, customer.name, customer.phone]
    );
    const purchaseSummary = toObjects(purchasesRes)[0] || { total_sales: 0, purchases_count: 0 };

    const upcomingBirthday = customer.date_of_birth ? (() => {
      const today = new Date();
      const dob = new Date(customer.date_of_birth);
      const next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      if (next < today) next.setFullYear(next.getFullYear() + 1);
      return next.toISOString().split('T')[0];
    })() : null;

    const upcomingAnniversary = customer.anniversary_date ? (() => {
      const today = new Date();
      const ann = new Date(customer.anniversary_date);
      const next = new Date(today.getFullYear(), ann.getMonth(), ann.getDate());
      if (next < today) next.setFullYear(next.getFullYear() + 1);
      return next.toISOString().split('T')[0];
    })() : null;

    res.json({
      customer,
      total_sales: purchaseSummary.total_sales || 0,
      purchases_count: purchaseSummary.purchases_count || 0,
      upcomingBirthday,
      upcomingAnniversary,
    });
  } catch (err) {
    console.error('Error fetching customer summary:', err.message);
    res.status(500).json({ error: 'Failed to fetch customer summary' });
  }
});

router.get('/:id', (req, res) => {
  const uid = tenantId(req);
  const { id } = req.params;
  const db = getDatabase();
  try {
    const result = db.exec('SELECT * FROM customers WHERE id = ? AND user_id = ?', [id, uid]);
    const customers = toObjects(result);
    if (customers.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(customers[0]);
  } catch (err) {
    console.error('Error fetching customer:', err.message);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

router.post('/', (req, res) => {
  const uid = tenantId(req);
  const {
    name, phone, address, aadhaar_number, pan_number, date_of_birth, anniversary_date,
    photo_path, customer_type, loyalty_points = 0, credit_limit = 0, outstanding_amount = 0,
    notes, city, gstin, email,
  } = req.body;

  if (!name) return res.status(400).json({ error: 'Name is required' });

  const sql = `INSERT INTO customers (user_id, name, phone, address, aadhaar_number, pan_number, date_of_birth, anniversary_date, photo_path, customer_type, loyalty_points, credit_limit, outstanding_amount, notes, city, gstin, email)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
  const params = [
    uid, name, phone || null, address || null, aadhaar_number || null, pan_number || null,
    date_of_birth || null, anniversary_date || null, photo_path || null, customer_type || 'retail',
    loyalty_points, credit_limit, outstanding_amount, notes || null, city || null, gstin || null, email || null,
  ];
  try {
    const db = getDatabase();
    db.run(sql, params);
    const id = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    saveDatabase();
    res.status(201).json({ id, message: 'Customer created' });
  } catch (err) {
    console.error('Error creating customer:', err.message);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

router.put('/:id', (req, res) => {
  const uid = tenantId(req);
  const { id } = req.params;
  const {
    name, phone, address, aadhaar_number, pan_number, date_of_birth, anniversary_date,
    photo_path, customer_type, loyalty_points, credit_limit, outstanding_amount, notes, city, gstin, email,
  } = req.body;

  const sql = `UPDATE customers SET
    name = ?, phone = ?, address = ?, aadhaar_number = ?, pan_number = ?,
    date_of_birth = ?, anniversary_date = ?, photo_path = ?, customer_type = ?,
    loyalty_points = ?, credit_limit = ?, outstanding_amount = ?, notes = ?, city = ?, gstin = ?, email = ?
    WHERE id = ? AND user_id = ?`;
  const params = [
    name, phone, address, aadhaar_number, pan_number, date_of_birth, anniversary_date,
    photo_path, customer_type, loyalty_points, credit_limit, outstanding_amount, notes, city, gstin, email, id, uid,
  ];
  try {
    const db = getDatabase();
    db.run(sql, params);
    if (db.getRowsModified() === 0) return res.status(404).json({ error: 'Customer not found' });
    saveDatabase();
    res.json({ message: 'Customer updated' });
  } catch (err) {
    console.error('Error updating customer:', err.message);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

router.delete('/:id', (req, res) => {
  const uid = tenantId(req);
  const { id } = req.params;
  const db = getDatabase();
  const colCheck = db.exec('PRAGMA table_info(customers)');
  const cols = colCheck[0].values.map(v => v[1]);
  const hasActive = cols.includes('is_active');
  const sql = hasActive
    ? 'UPDATE customers SET is_active = 0 WHERE id = ? AND user_id = ?'
    : 'DELETE FROM customers WHERE id = ? AND user_id = ?';
  try {
    db.run(sql, [id, uid]);
    if (db.getRowsModified() === 0) return res.status(404).json({ error: 'Customer not found' });
    saveDatabase();
    res.json({ message: hasActive ? 'Customer deactivated' : 'Customer deleted' });
  } catch (err) {
    console.error('Error deleting customer:', err.message);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

router.patch('/:id/loyalty', (req, res) => {
  const uid = tenantId(req);
  const { id } = req.params;
  const { delta } = req.body;
  if (typeof delta !== 'number') return res.status(400).json({ error: 'delta must be a number' });
  const db = getDatabase();
  try {
    const curRes = db.exec('SELECT loyalty_points FROM customers WHERE id = ? AND user_id = ?', [id, uid]);
    if (!curRes[0]?.values.length) return res.status(404).json({ error: 'Customer not found' });
    const cur = curRes[0].values[0][0] ?? 0;
    const newPoints = cur + delta;
    db.run('UPDATE customers SET loyalty_points = ? WHERE id = ? AND user_id = ?', [newPoints, id, uid]);
    saveDatabase();
    res.json({ loyalty_points: newPoints });
  } catch (err) {
    console.error('Error updating loyalty points:', err.message);
    res.status(500).json({ error: 'Failed to update loyalty points' });
  }
});

module.exports = router;
