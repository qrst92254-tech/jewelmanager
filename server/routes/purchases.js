const express = require('express');
const router = express.Router();
const { queryAll, queryOne, insert, update } = require('../db/database');
const { tenantId } = require('../db/tenant');
const { supabase } = require('../services/supabase');

// Helper function to generate next sequential number
async function nextSequentialNumber(table, column, prefix, uid) {
  let query = supabase.from(table).select(column);
  if (uid) query = query.eq('user_id', uid);
  const { data, error } = await query.order(column, { ascending: false }).limit(1);
  
  if (error || !data || data.length === 0) {
    return `${prefix}-0001`;
  }
  
  const lastNumber = data[0][column];
  const num = parseInt(lastNumber.split('-')[1]) || 0;
  return `${prefix}-${String(num + 1).padStart(4, '0')}`;
}

router.get('/suppliers', async (req, res) => {
  const uid = tenantId(req);
  try {
    const suppliers = await queryAll('suppliers', {
      eq: { is_active: true },
      order: { column: 'name', ascending: true }
    }, uid);
    res.json(suppliers);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/suppliers', async (req, res) => {
  const uid = tenantId(req);
  const { name, contact_person, phone, email, address, gstin, supplier_type } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    const supplierData = {
      name, contact_person, phone, email, address, gstin, supplier_type
    };
    const result = await insert('suppliers', supplierData, uid);
    res.status(201).json({ id: result.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/suppliers/:id', async (req, res) => {
  const uid = tenantId(req);
  const { name, contact_person, phone, email, address, gstin, supplier_type } = req.body;
  try {
    const updateData = {
      name, contact_person, phone, email, address, gstin, supplier_type
    };
    const result = await update('suppliers', updateData, { id: parseInt(req.params.id) }, uid);
    if (!result || result.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/orders', async (req, res) => {
  const uid = tenantId(req);
  try {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        suppliers!inner(name, user_id)
      `)
      .eq('suppliers.user_id', uid)
      .eq('user_id', uid)
      .order('order_date', { ascending: false });

    if (error) {
      console.error('Error fetching purchase orders:', error.message);
      return res.status(500).json({ error: error.message });
    }

    const result = data.map(item => ({
      ...item,
      supplier_name: item.suppliers.name
    }));

    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/orders/:id', async (req, res) => {
  const uid = tenantId(req);
  try {
    const { data: orders, error: orderError } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        suppliers!inner(name, user_id)
      `)
      .eq('suppliers.user_id', uid)
      .eq('id', parseInt(req.params.id))
      .eq('user_id', uid)
      .single();

    if (orderError || !orders) {
      return res.status(404).json({ error: 'Not found' });
    }

    const { data: items, error: itemsError } = await supabase
      .from('purchase_items')
      .select('*')
      .eq('po_id', parseInt(req.params.id));

    if (itemsError) {
      console.error('Error fetching purchase items:', itemsError.message);
      return res.status(500).json({ error: itemsError.message });
    }

    res.json({ ...orders, supplier_name: orders.suppliers.name, items: items || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/orders', async (req, res) => {
  const uid = tenantId(req);
  const { supplier_id, order_date, expected_date, subtotal, gst_amount, grand_total,
    amount_paid, payment_method, notes, items } = req.body;
  if (!supplier_id || !order_date) return res.status(400).json({ error: 'Supplier and date required' });
  try {
    const supplier = await queryOne('suppliers', { eq: { id: supplier_id } }, uid);
    if (!supplier) return res.status(400).json({ error: 'Supplier not found' });

    const po_number = await nextSequentialNumber('purchase_orders', 'po_number', 'PO', uid);
    const orderData = {
      po_number, supplier_id, order_date, expected_date, subtotal, gst_amount, grand_total,
      amount_paid, payment_method, notes
    };
    const result = await insert('purchase_orders', orderData, uid);
    const po_id = result.id;

    if (items && items.length > 0) {
      const itemsToInsert = items.map(item => ({
        po_id,
        product_name: item.product_name,
        category: item.category,
        metal: item.metal,
        purity: item.purity,
        gross_weight: item.gross_weight,
        net_weight: item.net_weight,
        quantity: item.quantity,
        rate_per_gram: item.rate_per_gram,
        making_charges: item.making_charges,
        item_total: item.item_total
      }));

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    const remaining = (grand_total || 0) - (amount_paid || 0);
    await update('suppliers', {
      outstanding_amount: supplier.outstanding_amount + remaining,
      total_purchases: supplier.total_purchases + (grand_total || 0)
    }, { id: supplier_id }, uid);

    res.status(201).json({ id: po_id, po_number: result.po_number });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/orders/:id', async (req, res) => {
  const uid = tenantId(req);
  const { status, received_date, amount_paid } = req.body;
  try {
    const updateData = { status, received_date, amount_paid };
    const result = await update('purchase_orders', updateData, { id: parseInt(req.params.id) }, uid);
    if (!result || result.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
