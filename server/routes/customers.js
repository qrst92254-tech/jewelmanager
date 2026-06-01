// server/routes/customers.js
const express = require('express');
const router = express.Router();
const { getDatabase, saveDatabase } = require('../db/database');

// Helper to convert sql.js result set to array of objects
const toObjects = (res) => {
  if (!res || res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => {
    const obj = {};
    cols.forEach((c, i) => (obj[c] = row[i]));
    return obj;
  });
};

// GET /api/customers - list with optional search query (by name, phone, or email)
router.get('/', (req, res) => {
  const { q } = req.query;
  const db = getDatabase();
  let sql = 'SELECT * FROM customers';
  const params = [];
  if (q) {
    sql += " WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?";
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  sql += ' ORDER BY created_at DESC';
  try {
    const result = db.exec(sql, params);
    const customers = toObjects(result);
    res.json(customers);
  } catch (err) {
    console.error('Error fetching customers:', err.message);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET /api/customers/:id/purchases - purchase history for customer
router.get('/:id/purchases', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();

  try {
    const customerRes = db.exec('SELECT * FROM customers WHERE id = ?', [id]);
    const customer = toObjects(customerRes)[0];
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const params = [];
    let sql = 'SELECT id, bill_number, sale_date, final_amount, payment_mode FROM sales WHERE 1=1';
    if (customer.phone) {
      sql += ' AND (customer_phone = ? OR customer_name = ?)';
      params.push(customer.phone, customer.name);
    } else {
      sql += ' AND customer_name = ?';
      params.push(customer.name);
    }
    sql += ' ORDER BY sale_date DESC';

    const salesRes = db.exec(sql, params);
    const purchases = toObjects(salesRes);
    res.json(purchases);
  } catch (err) {
    console.error('Error fetching customer purchases:', err.message);
    res.status(500).json({ error: 'Failed to fetch customer purchases' });
  }
});

// GET /api/customers/:id/summary - customer summary and alerts
router.get('/:id/summary', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();

  try {
    const customerRes = db.exec('SELECT * FROM customers WHERE id = ?', [id]);
    const customer = toObjects(customerRes)[0];
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const purchasesRes = db.exec('SELECT sum(final_amount) as total_sales, count(*) as purchases_count FROM sales WHERE customer_name = ? OR customer_phone = ?', [customer.name, customer.phone]);
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
      upcomingAnniversary
    });
  } catch (err) {
    console.error('Error fetching customer summary:', err.message);
    res.status(500).json({ error: 'Failed to fetch customer summary' });
  }
});

// GET /api/customers/:id - detail
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  const sql = 'SELECT * FROM customers WHERE id = ?';
  try {
    const result = db.exec(sql, [id]);
    const customers = toObjects(result);
    if (customers.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(customers[0]);
  } catch (err) {
    console.error('Error fetching customer:', err.message);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// POST /api/customers - create new customer
router.post('/', (req, res) => {
  const {
    name,
    phone,
    address,
    aadhaar_number,
    pan_number,
    date_of_birth,
    anniversary_date,
    photo_path,
    customer_type,
    loyalty_points = 0,
    credit_limit = 0,
    outstanding_amount = 0,
    notes,
    city,
    gstin,
    email
  } = req.body;

  if (!name) return res.status(400).json({ error: 'Name is required' });

  const sql = `INSERT INTO customers (name, phone, address, aadhaar_number, pan_number, date_of_birth, anniversary_date, photo_path, customer_type, loyalty_points, credit_limit, outstanding_amount, notes, city, gstin, email)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
  const params = [
    name,
    phone || null,
    address || null,
    aadhaar_number || null,
    pan_number || null,
    date_of_birth || null,
    anniversary_date || null,
    photo_path || null,
    customer_type || 'retail',
    loyalty_points,
    credit_limit,
    outstanding_amount,
    notes || null,
    city || null,
    gstin || null,
    email || null
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

// PUT /api/customers/:id - update existing
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    name,
    phone,
    address,
    aadhaar_number,
    pan_number,
    date_of_birth,
    anniversary_date,
    photo_path,
    customer_type,
    loyalty_points,
    credit_limit,
    outstanding_amount,
    notes,
    city,
    gstin,
    email
  } = req.body;

  const sql = `UPDATE customers SET
    name = ?,
    phone = ?,
    address = ?,
    aadhaar_number = ?,
    pan_number = ?,
    date_of_birth = ?,
    anniversary_date = ?,
    photo_path = ?,
    customer_type = ?,
    loyalty_points = ?,
    credit_limit = ?,
    outstanding_amount = ?,
    notes = ?,
    city = ?,
    gstin = ?,
    email = ?
    WHERE id = ?`;
  const params = [
    name,
    phone,
    address,
    aadhaar_number,
    pan_number,
    date_of_birth,
    anniversary_date,
    photo_path,
    customer_type,
    loyalty_points,
    credit_limit,
    outstanding_amount,
    notes,
    city,
    gstin,
    email,
    id
  ];
  try {
    const db = getDatabase();
    db.run(sql, params);
    saveDatabase();
    res.json({ message: 'Customer updated' });
  } catch (err) {
    console.error('Error updating customer:', err.message);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// DELETE /api/customers/:id - soft delete (set is_active = 0) if column exists, else hard delete
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  // Check if column exists
  const colCheck = db.exec("PRAGMA table_info(customers)");
  const cols = colCheck[0].values.map(v => v[1]);
  const hasActive = cols.includes('is_active');
  const sql = hasActive
    ? 'UPDATE customers SET is_active = 0 WHERE id = ?'
    : 'DELETE FROM customers WHERE id = ?';
  try {
    db.run(sql, [id]);
    saveDatabase();
    res.json({ message: hasActive ? 'Customer deactivated' : 'Customer deleted' });
  } catch (err) {
    console.error('Error deleting customer:', err.message);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// PATCH /api/customers/:id/loyalty - add/subtract loyalty points
router.patch('/:id/loyalty', (req, res) => {
  const { id } = req.params;
  const { delta } = req.body; // delta can be positive or negative
  if (typeof delta !== 'number') return res.status(400).json({ error: 'delta must be a number' });
  const db = getDatabase();
  try {
    const curRes = db.exec('SELECT loyalty_points FROM customers WHERE id = ?', [id]);
    const cur = curRes[0]?.values[0][0] ?? 0;
    const newPoints = cur + delta;
    db.run('UPDATE customers SET loyalty_points = ? WHERE id = ?', [newPoints, id]);
    saveDatabase();
    res.json({ loyalty_points: newPoints });
  } catch (err) {
    console.error('Error updating loyalty points:', err.message);
    res.status(500).json({ error: 'Failed to update loyalty points' });
  }
});

module.exports = router;
