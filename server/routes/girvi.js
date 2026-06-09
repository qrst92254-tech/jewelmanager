const express = require('express');
const router = express.Router();
const { queryAll, queryOne, insert, update } = require('../db/database');
const { tenantId } = require('../db/tenant');
const { supabase } = require('../services/supabase');

// Helper function to generate next girvi number
async function genGirviNumber(uid) {
  const { data, error } = await supabase
    .from('girvi_records')
    .select('girvi_number')
    .eq('user_id', uid)
    .order('girvi_number', { ascending: false })
    .limit(1);
  
  if (error || !data || data.length === 0) {
    return 'GRV-0001';
  }
  
  const lastNumber = data[0].girvi_number;
  const num = parseInt(lastNumber.split('-')[1]) || 0;
  return `GRV-${String(num + 1).padStart(4, '0')}`;
}

router.get('/summary/overdue', async (req, res) => {
  const uid = tenantId(req);
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const overdue = await queryAll('girvi_records', {
      eq: { status: 'active' },
      lt: { due_date: today },
      order: { column: 'due_date', ascending: true }
    }, uid);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const dueSoon = await queryAll('girvi_records', {
      eq: { status: 'active' },
      gte: { due_date: today },
      lte: { due_date: nextWeekStr },
      order: { column: 'due_date', ascending: true }
    }, uid);

    res.json({ overdue, dueSoon });
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

    const girviRecords = await queryAll('girvi_records', options, uid);
    res.json(girviRecords);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  const uid = tenantId(req);
  try {
    const girvi = await queryOne('girvi_records', { eq: { id: parseInt(req.params.id) } }, uid);
    if (!girvi) return res.status(404).json({ error: 'Not found' });
    
    const { data: payments, error: paymentsError } = await supabase
      .from('girvi_payments')
      .select('*')
      .eq('girvi_id', parseInt(req.params.id))
      .order('payment_date', { ascending: false });

    if (paymentsError) {
      console.error('Error fetching girvi payments:', paymentsError.message);
      return res.status(500).json({ error: paymentsError.message });
    }

    res.json({ ...girvi, payments: payments || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const uid = tenantId(req);
  const { customer_name, customer_phone, customer_address, customer_id_proof,
    item_description, item_type, metal, purity, gross_weight, net_weight, stone_weight,
    valuation_rate, metal_value, loan_amount, interest_rate, interest_type,
    pledge_date, due_date, notes } = req.body;
  
  if (!customer_name || !customer_phone || !item_description || !gross_weight || !loan_amount || !pledge_date) {
    return res.status(400).json({ error: 'Required fields missing' });
  }
  
  try {
    const girvi_number = await genGirviNumber(uid);
    const girviData = {
      customer_name, customer_phone, customer_address, customer_id_proof,
      item_description, item_type, metal, purity, gross_weight, net_weight, stone_weight,
      valuation_rate, metal_value, loan_amount, interest_rate, interest_type,
      pledge_date, due_date, notes
    };

    const result = await insert('girvi_records', girviData, uid);
    res.status(201).json({ id: result.id, girvi_number: result.girvi_number });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  const uid = tenantId(req);
  const { status, release_date, notes, transferred_to } = req.body;
  
  try {
    const updateData = {
      status, release_date, notes, transferred_to
    };
    const result = await update('girvi_records', updateData, { id: parseInt(req.params.id) }, uid);
    if (!result || result.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/payments', async (req, res) => {
  const uid = tenantId(req);
  const { payment_date, amount_paid, interest_amount, principal_amount, payment_method, notes } = req.body;
  
  try {
    const girvi = await queryOne('girvi_records', { eq: { id: parseInt(req.params.id) } }, uid);
    if (!girvi) return res.status(404).json({ error: 'Not found' });

    const paymentData = {
      girvi_id: parseInt(req.params.id),
      user_id: uid,
      payment_date, amount_paid, interest_amount, principal_amount, payment_method, notes
    };

    const { error: paymentError } = await supabase
      .from('girvi_payments')
      .insert(paymentData);

    if (paymentError) throw paymentError;

    await update('girvi_records', { 
      total_paid: (girvi.total_paid || 0) + amount_paid 
    }, { id: parseInt(req.params.id) }, uid);

    res.status(201).json({ message: 'Payment recorded' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
