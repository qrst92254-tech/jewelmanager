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

router.get('/plans', async (req, res) => {
  const uid = tenantId(req);
  try {
    const plans = await queryAll('scheme_plans', {
      eq: { is_active: true },
      order: { column: 'id', ascending: true }
    }, uid);
    res.json(plans);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/plans', async (req, res) => {
  const uid = tenantId(req);
  const { plan_name, duration_months, monthly_amount, bonus_month, scheme_type, description } = req.body;
  try {
    const planData = {
      plan_name, duration_months, monthly_amount, bonus_month, scheme_type, description
    };
    const result = await insert('scheme_plans', planData, uid);
    res.status(201).json({ id: result.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/enrollments', async (req, res) => {
  const uid = tenantId(req);
  try {
    const { data, error } = await supabase
      .from('scheme_enrollments')
      .select(`
        *,
        scheme_plans!inner(plan_name, duration_months, user_id)
      `)
      .eq('scheme_plans.user_id', uid)
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching enrollments:', error.message);
      return res.status(500).json({ error: error.message });
    }

    const result = data.map(item => ({
      ...item,
      plan_name: item.scheme_plans.plan_name,
      duration_months: item.scheme_plans.duration_months
    }));

    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/enrollments', async (req, res) => {
  const uid = tenantId(req);
  const { plan_id, customer_name, customer_phone, start_date, monthly_amount, notes } = req.body;
  try {
    const plan = await queryOne('scheme_plans', { eq: { id: plan_id } }, uid);
    if (!plan) return res.status(400).json({ error: 'Plan not found' });

    const scheme_number = await nextSequentialNumber('scheme_enrollments', 'scheme_number', 'SCH', uid);
    const start = new Date(start_date);
    const end = new Date(start);
    end.setMonth(end.getMonth() + (plan.duration_months || 12));
    const end_date = end.toISOString().split('T')[0];

    const enrollmentData = {
      scheme_number, plan_id, customer_name, customer_phone, start_date, end_date, monthly_amount, notes
    };

    const result = await insert('scheme_enrollments', enrollmentData, uid);
    res.status(201).json({ id: result.id, scheme_number: result.scheme_number });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/enrollments/:id/payments', async (req, res) => {
  const uid = tenantId(req);
  const { payment_date, amount_paid, payment_method } = req.body;
  try {
    const enrollment = await queryOne('scheme_enrollments', { eq: { id: parseInt(req.params.id) } }, uid);
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

    const month_number = (enrollment.months_paid || 0) + 1;
    const scheme_number = enrollment.scheme_number || 'SCH';
    const receipt_number = `RCP-${scheme_number}-${String(month_number).padStart(3, '0')}`;

    const paymentData = {
      enrollment_id: parseInt(req.params.id),
      payment_date, month_number, amount_paid, payment_method, receipt_number
    };

    const { error: paymentError } = await supabase
      .from('scheme_payments')
      .insert(paymentData);

    if (paymentError) throw paymentError;

    // Update enrollment
    await update('scheme_enrollments', {
      months_paid: enrollment.months_paid + 1,
      total_paid: (enrollment.total_paid || 0) + amount_paid
    }, { id: parseInt(req.params.id) }, uid);

    // Check if enrollment should be marked as completed
    const { data: planData } = await supabase
      .from('scheme_plans')
      .select('duration_months')
      .eq('id', enrollment.plan_id)
      .single();

    if (planData && (enrollment.months_paid + 1) >= planData.duration_months) {
      await update('scheme_enrollments', { status: 'completed' }, { id: parseInt(req.params.id) }, uid);
    }

    res.status(201).json({ receipt_number });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/enrollments/:id/payments', async (req, res) => {
  const uid = tenantId(req);
  try {
    const enrollment = await queryOne('scheme_enrollments', { eq: { id: parseInt(req.params.id) } }, uid);
    if (!enrollment) return res.status(404).json({ error: 'Not found' });

    const { data, error } = await supabase
      .from('scheme_payments')
      .select('*')
      .eq('enrollment_id', parseInt(req.params.id))
      .order('month_number', { ascending: true });

    if (error) {
      console.error('Error fetching payments:', error.message);
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
