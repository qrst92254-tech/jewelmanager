const express = require('express');
const router = express.Router();
const { queryAll, queryOne, insert, update, deleteRow } = require('../db/database');
const { tenantId } = require('../db/tenant');

router.get('/', async (req, res) => {
  const uid = tenantId(req);
  const { q } = req.query;
  try {
    let options = {
      order: { column: 'created_at', ascending: false }
    };

    if (q) {
      options.ilike = {
        name: `%${q}%`,
        phone: `%${q}%`,
        email: `%${q}%`
      };
    }

    const customers = await queryAll('customers', options, uid);
    res.json(customers);
  } catch (err) {
    console.error('Error fetching customers:', err.message);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

router.get('/:id/purchases', async (req, res) => {
  const uid = tenantId(req);
  const { id } = req.params;

  try {
    const customer = await queryOne('customers', { eq: { id: parseInt(id) } }, uid);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    let options = {
      select: 'id,bill_number,sale_date,final_amount,payment_mode',
      order: { column: 'sale_date', ascending: false }
    };

    if (customer.phone) {
      options.or = [
        { customer_phone: customer.phone },
        { customer_name: customer.name }
      ];
    } else {
      options.eq = { customer_name: customer.name };
    }

    // Use direct Supabase query for OR condition
    const { supabase } = require('../services/supabase');
    let query = supabase
      .from('sales')
      .select('id,bill_number,sale_date,final_amount,payment_mode')
      .eq('user_id', uid);

    if (customer.phone) {
      query = query.or(`customer_phone.eq.${customer.phone},customer_name.eq.${customer.name}`);
    } else {
      query = query.eq('customer_name', customer.name);
    }

    query = query.order('sale_date', { ascending: false });
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching customer purchases:', error.message);
      return res.status(500).json({ error: 'Failed to fetch customer purchases' });
    }

    res.json(data || []);
  } catch (err) {
    console.error('Error fetching customer purchases:', err.message);
    res.status(500).json({ error: 'Failed to fetch customer purchases' });
  }
});

router.get('/:id/summary', async (req, res) => {
  const uid = tenantId(req);
  const { id } = req.params;

  try {
    const customer = await queryOne('customers', { eq: { id: parseInt(id) } }, uid);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    // Get purchase summary using direct Supabase query
    const { supabase } = require('../services/supabase');
    let query = supabase
      .from('sales')
      .select('final_amount')
      .eq('user_id', uid);

    if (customer.phone) {
      query = query.or(`customer_phone.eq.${customer.phone},customer_name.eq.${customer.name}`);
    } else {
      query = query.eq('customer_name', customer.name);
    }

    const { data: sales, error: salesError } = await query;

    if (salesError) {
      console.error('Error fetching customer summary:', salesError.message);
      return res.status(500).json({ error: 'Failed to fetch customer summary' });
    }

    const total_sales = sales.reduce((sum, s) => sum + (parseFloat(s.final_amount) || 0), 0);
    const purchases_count = sales.length;

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
      total_sales,
      purchases_count,
      upcomingBirthday,
      upcomingAnniversary,
    });
  } catch (err) {
    console.error('Error fetching customer summary:', err.message);
    res.status(500).json({ error: 'Failed to fetch customer summary' });
  }
});

router.get('/:id', async (req, res) => {
  const uid = tenantId(req);
  const { id } = req.params;
  try {
    const customer = await queryOne('customers', { eq: { id: parseInt(id) } }, uid);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    console.error('Error fetching customer:', err.message);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

router.post('/', async (req, res) => {
  const uid = tenantId(req);
  const {
    name, phone, address, aadhaar_number, pan_number, date_of_birth, anniversary_date,
    photo_path, customer_type, loyalty_points = 0, credit_limit = 0, outstanding_amount = 0,
    notes, city, gstin, email,
  } = req.body;

  if (!name) return res.status(400).json({ error: 'Name is required' });

  const customerData = {
    name, phone, address, aadhaar_number, pan_number, date_of_birth, anniversary_date,
    photo_path, customer_type, loyalty_points, credit_limit, outstanding_amount,
    notes, city, gstin, email
  };

  try {
    const result = await insert('customers', customerData, uid);
    res.status(201).json({ id: result.id, message: 'Customer created' });
  } catch (err) {
    console.error('Error creating customer:', err.message);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

router.put('/:id', async (req, res) => {
  const uid = tenantId(req);
  const { id } = req.params;
  const {
    name, phone, address, aadhaar_number, pan_number, date_of_birth, anniversary_date,
    photo_path, customer_type, loyalty_points, credit_limit, outstanding_amount, notes, city, gstin, email,
  } = req.body;

  const updateData = {
    name, phone, address, aadhaar_number, pan_number, date_of_birth, anniversary_date,
    photo_path, customer_type, loyalty_points, credit_limit, outstanding_amount,
    notes, city, gstin, email, updated_at: new Date().toISOString()
  };

  try {
    const result = await update('customers', updateData, { id: parseInt(id) }, uid);
    if (!result || result.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Customer updated' });
  } catch (err) {
    console.error('Error updating customer:', err.message);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

router.delete('/:id', async (req, res) => {
  const uid = tenantId(req);
  const { id } = req.params;
  try {
    const result = await deleteRow('customers', { id: parseInt(id) }, uid);
    if (!result) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    console.error('Error deleting customer:', err.message);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

router.patch('/:id/loyalty', async (req, res) => {
  const uid = tenantId(req);
  const { id } = req.params;
  const { delta } = req.body;
  if (typeof delta !== 'number') return res.status(400).json({ error: 'delta must be a number' });
  
  try {
    const customer = await queryOne('customers', { eq: { id: parseInt(id) } }, uid);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    
    const newPoints = (customer.loyalty_points || 0) + delta;
    await update('customers', { loyalty_points: newPoints }, { id: parseInt(id) }, uid);
    
    res.json({ loyalty_points: newPoints });
  } catch (err) {
    console.error('Error updating loyalty points:', err.message);
    res.status(500).json({ error: 'Failed to update loyalty points' });
  }
});

module.exports = router;
