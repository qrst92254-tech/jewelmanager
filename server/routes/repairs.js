const express = require('express');
const router = express.Router();
const { queryAll, queryOne, insert, update } = require('../db/database');
const { tenantId } = require('../db/tenant');
const { supabase } = require('../services/supabase');

const parseIntOrNull = (val) => {
  if (val === '' || val === null || val === undefined) return null;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? null : parsed;
};

const parseFloatOrNull = (val) => {
  if (val === '' || val === null || val === undefined) return null;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? null : parsed;
};

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

router.get('/summary/counts', async (req, res) => {
  const uid = tenantId(req);
  try {
    const { data, error } = await supabase
      .from('repair_orders')
      .select('status')
      .eq('user_id', uid);

    if (error) {
      console.error('Error fetching repair counts:', error.message);
      return res.status(500).json({ error: error.message });
    }

    const counts = {};
    data.forEach(item => {
      counts[item.status] = (counts[item.status] || 0) + 1;
    });

    res.json(Object.entries(counts).map(([status, count]) => ({ status, count })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', async (req, res) => {
  const uid = tenantId(req);
  const { status } = req.query;
  try {
    let options = {
      order: { column: 'created_at', ascending: false }
    };

    if (status && status !== 'all') {
      options.eq = { status };
    }

    const repairs = await queryAll('repair_orders', options, uid);
    res.json(repairs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  const uid = tenantId(req);
  try {
    const repair = await queryOne('repair_orders', { eq: { id: parseInt(req.params.id) } }, uid);
    if (!repair) return res.status(404).json({ error: 'Not found' });
    res.json(repair);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const uid = tenantId(req);
  const { customer_name, customer_phone, item_description, item_type, metal, purity, weight,
    repair_type, problem_description, estimated_charges, advance_paid, received_date, promised_date,
    assigned_to_karigar_id, notes } = req.body;
  if (!customer_name || !item_description || !received_date) {
    return res.status(400).json({ error: 'Required fields missing' });
  }
  try {
    const job_number = await nextSequentialNumber('repair_orders', 'job_number', 'REP', uid);
    const repairData = {
      job_number, customer_name, customer_phone, item_description, item_type, metal, purity,
      weight: parseFloatOrNull(weight),
      repair_type, problem_description,
      estimated_charges: parseFloatOrNull(estimated_charges),
      advance_paid: parseFloatOrNull(advance_paid),
      received_date, promised_date,
      assigned_to_karigar_id: parseIntOrNull(assigned_to_karigar_id),
      notes
    };
    const result = await insert('repair_orders', repairData, uid);
    res.status(201).json({ id: result.id, job_number: result.job_number });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  const uid = tenantId(req);
  const { status, actual_charges, advance_paid, completion_date, delivery_date, notes } = req.body;
  try {
    const updateData = {
      status, actual_charges, advance_paid, completion_date, delivery_date, notes
    };
    const result = await update('repair_orders', updateData, { id: parseInt(req.params.id) }, uid);
    if (!result || result.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
