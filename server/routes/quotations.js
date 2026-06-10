const express = require('express');
const router = express.Router();
const { queryAll, queryOne, insert, update } = require('../db/database');
const { tenantId } = require('../db/tenant');
const { supabase } = require('../services/supabase');

// Helper function to generate next sequential number
async function nextSequentialNumber(table, column, prefix, uid) {
  let query = supabase.from(table).select(column);
  // REMOVED: user_id filter - quotations table does not have user_id column
  // if (uid) query = query.eq('user_id', uid);
  const { data, error } = await query.order(column, { ascending: false }).limit(1);
  
  if (error || !data || data.length === 0) {
    return `${prefix}-0001`;
  }
  
  const lastNumber = data[0][column];
  const num = parseInt(lastNumber.split('-')[1]) || 0;
  return `${prefix}-${String(num + 1).padStart(4, '0')}`;
}

router.get('/', async (req, res) => {
  const uid = tenantId(req);
  try {
    const quotations = await queryAll('quotations', {
      order: { column: 'created_at', ascending: false }
    }, uid);
    res.json(quotations);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  const uid = tenantId(req);
  try {
    const quotation = await queryOne('quotations', { eq: { id: parseInt(req.params.id) } }, uid);
    if (!quotation) return res.status(404).json({ error: 'Not found' });
    
    const { data: items, error: itemsError } = await supabase
      .from('quotation_items')
      .select('*')
      .eq('quotation_id', parseInt(req.params.id));

    if (itemsError) {
      console.error('Error fetching quotation items:', itemsError.message);
      return res.status(500).json({ error: itemsError.message });
    }

    res.json({ ...quotation, items: items || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const uid = tenantId(req);
  const { customer_name, customer_phone, gold_rate_used, silver_rate_used, valid_until,
    subtotal, gst_amount, grand_total, notes, items } = req.body;
  try {
    const quotation_number = await nextSequentialNumber('quotations', 'quotation_number', 'QUO', uid);
    const quotationData = {
      quotation_number, customer_name, customer_phone, gold_rate_used, silver_rate_used, valid_until,
      subtotal, gst_amount, grand_total, notes
    };
    const result = await insert('quotations', quotationData, uid);
    const quotation_id = result.id;

    if (items && items.length > 0) {
      const itemsToInsert = items.map(item => ({
        quotation_id,
        user_id: uid,
        product_name: item.product_name,
        category: item.category,
        purity: item.purity,
        net_weight: item.net_weight,
        rate_per_gram: item.rate_per_gram,
        metal_value: item.metal_value,
        making_charges: item.making_charges,
        stone_charges: item.stone_charges,
        gst_amount: item.gst_amount,
        item_total: item.item_total,
        quantity: item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('quotation_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    res.status(201).json({ id: quotation_id, quotation_number: result.quotation_number });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  const uid = tenantId(req);
  const { status, converted_to_sale_id } = req.body;
  try {
    const updateData = { status, converted_to_sale_id };
    const result = await update('quotations', updateData, { id: parseInt(req.params.id) }, uid);
    if (!result || result.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
