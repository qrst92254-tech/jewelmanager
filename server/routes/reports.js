const express = require('express');
const router = express.Router();
const { queryAll } = require('../db/database');
const { tenantId } = require('../db/tenant');
const { supabase } = require('../services/supabase');

router.get('/sales/daily', async (req, res) => {
  const uid = tenantId(req);
  const { from, to } = req.query;
  const fromDate = from || new Date().toISOString().split('T')[0];
  const toDate = to || fromDate;
  try {
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('*, sale_items!inner(id)')
      .eq('user_id', uid)
      .gte('sale_date', fromDate + 'T00:00:00.000Z')
      .lte('sale_date', toDate + 'T23:59:59.999Z')
      .order('sale_date', { ascending: false });

    if (salesError) throw salesError;

    const salesWithItemCount = sales.map(s => ({
      ...s,
      item_count: s.sale_items?.length || 0
    }));

    const { data: summary, error: summaryError } = await supabase
      .from('sales')
      .select('id, final_amount, cgst_amount, sgst_amount')
      .eq('user_id', uid)
      .gte('sale_date', fromDate + 'T00:00:00.000Z')
      .lte('sale_date', toDate + 'T23:59:59.999Z');

    if (summaryError) throw summaryError;

    const summaryData = {
      total_bills: summary.length,
      total_revenue: summary.reduce((sum, s) => sum + (parseFloat(s.final_amount) || 0), 0),
      total_cgst: summary.reduce((sum, s) => sum + (parseFloat(s.cgst_amount) || 0), 0),
      total_sgst: summary.reduce((sum, s) => sum + (parseFloat(s.sgst_amount) || 0), 0)
    };

    res.json({ sales: salesWithItemCount, summary: summaryData, from: fromDate, to: toDate });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/gst', async (req, res) => {
  const uid = tenantId(req);
  const { month, year } = req.query;
  const m = month || (new Date().getMonth() + 1);
  const y = year || new Date().getFullYear();
  try {
    const startDate = `${y}-${String(m).padStart(2, '0')}-01T00:00:00.000Z`;
    const endDate = new Date(y, m, 0);
    const endDateStr = `${y}-${String(m).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}T23:59:59.999Z`;

    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('*')
      .eq('user_id', uid)
      .gte('sale_date', startDate)
      .lte('sale_date', endDateStr)
      .order('sale_date', { ascending: true });

    if (salesError) throw salesError;

    const totals = {
      taxable: sales.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0),
      cgst: sales.reduce((sum, s) => sum + (parseFloat(s.cgst_amount) || 0), 0),
      sgst: sales.reduce((sum, s) => sum + (parseFloat(s.sgst_amount) || 0), 0),
      total: sales.reduce((sum, s) => sum + (parseFloat(s.final_amount) || 0), 0)
    };

    res.json({ sales, totals, month: m, year: y });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/stock', async (req, res) => {
  const uid = tenantId(req);
  try {
    const products = await queryAll('products', {
      order: [{ column: 'category', ascending: true }, { column: 'name', ascending: true }]
    }, uid);
    const lowStock = products.filter(p => p.quantity <= (p.stock_alert_threshold || 1));
    res.json({ products, lowStock, total: products.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/top-products', async (req, res) => {
  const uid = tenantId(req);
  const { limit } = req.query;
  try {
    const { data, error } = await supabase
      .from('sale_items')
      .select(`
        quantity,
        price_at_sale,
        products!inner(name, sku, category, metal, purity, user_id)
      `)
      .eq('products.user_id', uid)
      .order('quantity', { ascending: false })
      .limit(Number(limit) || 10);

    if (error) throw error;

    const result = data.map(item => ({
      name: item.products.name,
      sku: item.products.sku,
      category: item.products.category,
      metal: item.products.metal,
      purity: item.products.purity,
      total_sold: item.quantity,
      total_revenue: item.quantity * item.price_at_sale
    }));

    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/customers/:phone', async (req, res) => {
  const uid = tenantId(req);
  try {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('user_id', uid)
      .or(`customer_phone.eq.${req.params.phone},customer_name.ilike.%${req.params.phone}%`)
      .order('sale_date', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/financial', async (req, res) => {
  const uid = tenantId(req);
  const { from, to } = req.query;
  const fromDate = from || new Date().toISOString().split('T')[0];
  const toDate = to || fromDate;
  try {
    const { data: revenue, error: revenueError } = await supabase
      .from('sales')
      .select('final_amount')
      .eq('user_id', uid)
      .gte('sale_date', fromDate + 'T00:00:00.000Z')
      .lte('sale_date', toDate + 'T23:59:59.999Z');

    if (revenueError) throw revenueError;

    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', uid)
      .gte('expense_date', fromDate)
      .lte('expense_date', toDate);

    if (expensesError) throw expensesError;

    const { data: girviLoans, error: girviError } = await supabase
      .from('girvi_records')
      .select('loan_amount')
      .eq('user_id', uid)
      .eq('status', 'active');

    if (girviError) throw girviError;

    const { data: customerOutstanding, error: customerError } = await supabase
      .from('customers')
      .select('outstanding_amount')
      .eq('user_id', uid)
      .gt('outstanding_amount', 0);

    if (customerError) throw customerError;

    res.json({
      revenue: (revenue || []).reduce((sum, s) => sum + (parseFloat(s.final_amount) || 0), 0),
      expenses: (expenses || []).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
      profit: (revenue || []).reduce((sum, s) => sum + (parseFloat(s.final_amount) || 0), 0) - 
              (expenses || []).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
      activeGirviLoans: (girviLoans || []).reduce((sum, g) => sum + (parseFloat(g.loan_amount) || 0), 0),
      customerOutstanding: (customerOutstanding || []).reduce((sum, c) => sum + (parseFloat(c.outstanding_amount) || 0), 0),
      from: fromDate,
      to: toDate,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
