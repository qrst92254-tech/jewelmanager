const express = require('express');
const router = express.Router();
const { getDatabase, saveDatabase } = require('../db/database');

const toObjects = (res) => {
  if (!res || res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => { const obj = {}; cols.forEach((c, i) => (obj[c] = row[i])); return obj; });
};

// ---- SUPPLIERS ----
router.get('/suppliers', (req, res) => {
  const db = getDatabase();
  try { res.json(toObjects(db.exec('SELECT * FROM suppliers WHERE is_active=1 ORDER BY name'))); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/suppliers', (req, res) => {
  const db = getDatabase();
  const { name, contact_person, phone, email, address, gstin, supplier_type } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    db.run('INSERT INTO suppliers (name,contact_person,phone,email,address,gstin,supplier_type) VALUES (?,?,?,?,?,?,?)',
      [name, contact_person||null, phone||null, email||null, address||null, gstin||null, supplier_type||'wholesaler']);
    const id = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    saveDatabase();
    res.status(201).json({ id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/suppliers/:id', (req, res) => {
  const db = getDatabase();
  const { name, contact_person, phone, email, address, gstin, supplier_type } = req.body;
  try {
    db.run('UPDATE suppliers SET name=?,contact_person=?,phone=?,email=?,address=?,gstin=?,supplier_type=? WHERE id=?',
      [name, contact_person, phone, email, address, gstin, supplier_type, req.params.id]);
    saveDatabase();
    res.json({ message: 'Updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- PURCHASE ORDERS ----
router.get('/orders', (req, res) => {
  const db = getDatabase();
  try {
    const result = db.exec(`SELECT po.*, s.name as supplier_name FROM purchase_orders po 
      LEFT JOIN suppliers s ON po.supplier_id=s.id ORDER BY po.order_date DESC`);
    res.json(toObjects(result));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/orders/:id', (req, res) => {
  const db = getDatabase();
  try {
    const rows = toObjects(db.exec(`SELECT po.*, s.name as supplier_name FROM purchase_orders po 
      LEFT JOIN suppliers s ON po.supplier_id=s.id WHERE po.id=?`, [req.params.id]));
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const items = toObjects(db.exec('SELECT * FROM purchase_items WHERE po_id=?', [req.params.id]));
    res.json({ ...rows[0], items });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/orders', (req, res) => {
  const db = getDatabase();
  const { supplier_id, order_date, expected_date, subtotal, gst_amount, grand_total,
    amount_paid, payment_method, notes, items } = req.body;
  if (!supplier_id || !order_date) return res.status(400).json({ error: 'Supplier and date required' });
  try {
    const yr = new Date().getFullYear();
    const cnt = db.exec('SELECT COUNT(*) as c FROM purchase_orders')[0]?.values[0][0] || 0;
    const po_number = `PO-${yr}-${String(Number(cnt)+1).padStart(4,'0')}`;
    db.run(`INSERT INTO purchase_orders (po_number,supplier_id,order_date,expected_date,subtotal,gst_amount,grand_total,amount_paid,payment_method,notes)
      VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [po_number, supplier_id, order_date, expected_date||null, subtotal||0, gst_amount||0,
       grand_total||0, amount_paid||0, payment_method||null, notes||null]);
    const id = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    if (items && items.length > 0) {
      for (const item of items) {
        db.run(`INSERT INTO purchase_items (po_id,product_name,category,metal,purity,gross_weight,net_weight,quantity,rate_per_gram,making_charges,item_total)
          VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
          [id, item.product_name, item.category||null, item.metal||null, item.purity||null,
           item.gross_weight||0, item.net_weight||0, item.quantity||1, item.rate_per_gram||0, item.making_charges||0, item.item_total||0]);
      }
    }
    // Update supplier outstanding
    const remaining = (grand_total||0) - (amount_paid||0);
    db.run('UPDATE suppliers SET outstanding_amount=outstanding_amount+?,total_purchases=total_purchases+? WHERE id=?',
      [remaining, grand_total||0, supplier_id]);
    saveDatabase();
    res.status(201).json({ id, po_number });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/orders/:id', (req, res) => {
  const db = getDatabase();
  const { status, received_date, amount_paid } = req.body;
  try {
    db.run('UPDATE purchase_orders SET status=?,received_date=?,amount_paid=? WHERE id=?',
      [status, received_date||null, amount_paid||null, req.params.id]);
    saveDatabase();
    res.json({ message: 'Updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
