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

router.get('/', (req, res) => {
  const uid = tenantId(req);
  const db = getDatabase();
  try {
    res.json(toObjects(db.exec('SELECT * FROM quotations WHERE user_id = ? ORDER BY created_at DESC', [uid])));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', (req, res) => {
  const uid = tenantId(req);
  const db = getDatabase();
  try {
    const rows = toObjects(db.exec('SELECT * FROM quotations WHERE id=? AND user_id=?', [req.params.id, uid]));
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const items = toObjects(db.exec('SELECT * FROM quotation_items WHERE quotation_id=?', [req.params.id]));
    res.json({ ...rows[0], items });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', (req, res) => {
  const uid = tenantId(req);
  const db = getDatabase();
  const { customer_name, customer_phone, gold_rate_used, silver_rate_used, valid_until,
    subtotal, gst_amount, grand_total, notes, items } = req.body;
  try {
    const quotation_number = nextSequentialNumber('quotations', 'quotation_number', 'QUO');
    db.run(`INSERT INTO quotations 
      (user_id, quotation_number, customer_name, customer_phone, gold_rate_used, silver_rate_used, valid_until, subtotal, gst_amount, grand_total, notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [uid, quotation_number, customer_name || null, customer_phone || null, gold_rate_used || null,
        silver_rate_used || null, valid_until || null, subtotal || 0, gst_amount || 0, grand_total || 0, notes || null]);
    const id = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    if (items && items.length > 0) {
      for (const item of items) {
        db.run(`INSERT INTO quotation_items (quotation_id,product_name,category,purity,net_weight,rate_per_gram,metal_value,making_charges,stone_charges,gst_amount,item_total,quantity)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
          [id, item.product_name, item.category || null, item.purity || null, item.net_weight || 0,
            item.rate_per_gram || 0, item.metal_value || 0, item.making_charges || 0, item.stone_charges || 0,
            item.gst_amount || 0, item.item_total || 0, item.quantity || 1]);
      }
    }
    saveDatabase();
    res.status(201).json({ id, quotation_number });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', (req, res) => {
  const uid = tenantId(req);
  const db = getDatabase();
  const { status, converted_to_sale_id } = req.body;
  try {
    db.run('UPDATE quotations SET status=?, converted_to_sale_id=? WHERE id=? AND user_id=?',
      [status, converted_to_sale_id || null, req.params.id, uid]);
    if (db.getRowsModified() === 0) return res.status(404).json({ error: 'Not found' });
    saveDatabase();
    res.json({ message: 'Updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
