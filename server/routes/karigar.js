const express = require('express');
const router = express.Router();
const { queryAll, queryOne, insert, update, deleteRow } = require('../db/database');
const { tenantId } = require('../db/tenant');
const { supabase } = require('../services/supabase');
const { checkLimit } = require('../utils/limitCheck');

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

router.get('/job-cards/all', async (req, res) => {
  const uid = tenantId(req);
  try {
    const { data, error } = await supabase
      .from('karigar_job_cards')
      .select(`
        *,
        karigars!inner(name, user_id)
      `)
      .eq('karigars.user_id', uid)
      .order('id', { ascending: false });

    if (error) {
      console.error('Error fetching job cards:', error.message);
      return res.status(500).json({ error: error.message });
    }

    const result = data.map(item => ({
      ...item,
      karigar_name: item.karigars.name
    }));

    res.json(result);
  } catch (e) { 
    res.status(500).json({ error: e.message }); 
  }
});

router.get('/', async (req, res) => {
  const uid = tenantId(req);
  try {
    const karigars = await queryAll('karigars', {
      order: { column: 'created_at', ascending: false }
    }, uid);
    res.json(karigars);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  const uid = tenantId(req);
  try {
    const karigar = await queryOne('karigars', { eq: { id: parseInt(req.params.id) } }, uid);
    if (!karigar) return res.status(404).json({ error: 'Not found' });
    res.json(karigar);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const uid = tenantId(req);
  const { name, phone, address, skill_type, id_proof } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  
  try {
    const limitResult = await checkLimit('karigars', uid);
    if (!limitResult.allowed) {
      return res.status(403).json({ message: limitResult.message });
    }
    const karigarData = {
      name, phone, address, skill_type, id_proof
    };
    const result = await insert('karigars', karigarData, uid);
    res.status(201).json({ id: result.id, message: 'Karigar created' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  const uid = tenantId(req);
  const { name, phone, address, skill_type, id_proof, is_active } = req.body;
  
  try {
    const updateData = {
      name, phone, address, skill_type, id_proof, is_active: is_active ?? true
    };
    const result = await update('karigars', updateData, { id: parseInt(req.params.id) }, uid);
    if (!result || result.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  const uid = tenantId(req);
  try {
    const result = await update('karigars', { is_active: false }, { id: parseInt(req.params.id) }, uid);
    if (!result || result.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Karigar removed' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/transactions', async (req, res) => {
  const uid = tenantId(req);
  try {
    const karigar = await queryOne('karigars', { eq: { id: parseInt(req.params.id) } }, uid);
    if (!karigar) return res.status(404).json({ error: 'Not found' });
    
    const { data, error } = await supabase
      .from('karigar_transactions')
      .select('*')
      .eq('karigar_id', parseInt(req.params.id))
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error.message);
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/transactions', async (req, res) => {
  const uid = tenantId(req);
  const { karigar_id, transaction_type, metal, gross_weight, fine_weight, purity,
    making_charges, wastage_percent, wastage_grams, order_description, expected_date, notes } = req.body;
  
  try {
    const karigar = await queryOne('karigars', { eq: { id: karigar_id } }, uid);
    if (!karigar) return res.status(404).json({ error: 'Karigar not found' });

    const transactionData = {
      karigar_id, transaction_type, metal, gross_weight, fine_weight, purity,
      making_charges, wastage_percent, wastage_grams, order_description, expected_date, notes
    };

    const { data: transResult, error: transError } = await supabase
      .from('karigar_transactions')
      .insert(transactionData)
      .select()
      .single();

    if (transError) throw transError;

    // Update karigar balance
    const delta = transaction_type === 'issue' ? (gross_weight || 0) : -(gross_weight || 0);
    if (metal === 'gold') {
      await update('karigars', { balance_gold_grams: karigar.balance_gold_grams + delta }, { id: karigar_id }, uid);
    } else {
      await update('karigars', { balance_silver_grams: karigar.balance_silver_grams + delta }, { id: karigar_id }, uid);
    }

    res.status(201).json({ id: transResult.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/job-cards', async (req, res) => {
  const uid = tenantId(req);
  const { karigar_id, product_description, category, purity, gold_issued_grams,
    making_charges, order_date, expected_date, notes } = req.body;
  
  try {
    const karigar = await queryOne('karigars', { eq: { id: karigar_id } }, uid);
    if (!karigar) return res.status(404).json({ error: 'Karigar not found' });

    const job_card_number = await nextSequentialNumber('karigar_job_cards', 'job_card_number', 'JOB', uid);

    const jobCardData = {
      karigar_id, job_card_number, product_description, category, purity,
      gold_issued_grams, making_charges, order_date, expected_date, notes
    };

    const result = await supabase
      .from('karigar_job_cards')
      .insert(jobCardData)
      .select()
      .single();

    if (result.error) throw result.error;

    res.status(201).json({ id: result.data.id, job_card_number });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/job-cards/:id', async (req, res) => {
  const uid = tenantId(req);
  const { status, gold_received_grams, wastage_grams, wastage_percent, completion_date } = req.body;
  
  try {
    // Get the job card to find karigar_id
    const { data: jobCard, error: jobCardError } = await supabase
      .from('karigar_job_cards')
      .select('karigar_id')
      .eq('id', parseInt(req.params.id))
      .single();

    if (jobCardError || !jobCard) {
      return res.status(404).json({ error: 'Job card not found' });
    }

    // Verify karigar belongs to user
    const karigar = await queryOne('karigars', { eq: { id: jobCard.karigar_id } }, uid);
    if (!karigar) return res.status(404).json({ error: 'Not found' });

    const updateData = {
      status, gold_received_grams, wastage_grams, wastage_percent, completion_date
    };

    const { error: updateError } = await supabase
      .from('karigar_job_cards')
      .update(updateData)
      .eq('id', parseInt(req.params.id));

    if (updateError) throw updateError;

    if (status === 'completed') {
      await update('karigars', { 
        total_orders_completed: karigar.total_orders_completed + 1 
      }, { id: jobCard.karigar_id }, uid);
    }

    res.json({ message: 'Updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
