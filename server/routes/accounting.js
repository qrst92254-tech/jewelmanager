const express = require('express');
const router = express.Router();
const { queryAll, queryOne, insert, deleteRow } = require('../db/database');
const { tenantId } = require('../db/tenant');
const { supabase } = require('../services/supabase');

router.get('/ledger', async (req, res) => {
  const uid = tenantId(req);
  const { account, from, to } = req.query;
  try {
    let options = {
      order: [{ column: 'entry_date', ascending: false }, { column: 'id', ascending: false }]
    };

    if (account) {
      options.ilike = { account_name: `%${account}%` };
    }
    if (from) {
      options.gte = { entry_date: from };
    }
    if (to) {
      options.lte = { entry_date: to };
    }

    const entries = await queryAll('ledger_entries', options, uid);
    res.json(entries);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/ledger', async (req, res) => {
  const uid = tenantId(req);
  const { entry_date, entry_type, account_name, description, debit, credit, reference_id, reference_type } = req.body;
  try {
    const prev = await queryAll('ledger_entries', {
      eq: { account_name },
      order: [{ column: 'entry_date', ascending: false }, { column: 'id', ascending: false }],
      limit: 1
    }, uid);
    
    const prevBalance = prev[0]?.balance || 0;
    const balance = prevBalance + (credit || 0) - (debit || 0);
    
    const entryData = {
      entry_date, entry_type, account_name, description, debit, credit, balance,
      reference_id, reference_type
    };
    
    const result = await insert('ledger_entries', entryData, uid);
    res.status(201).json({ message: 'Entry added', balance });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/expenses', async (req, res) => {
  const uid = tenantId(req);
  const { from, to } = req.query;
  try {
    let options = {
      order: { column: 'expense_date', ascending: false }
    };

    if (from) {
      options.gte = { expense_date: from };
    }
    if (to) {
      options.lte = { expense_date: to };
    }

    const expenses = await queryAll('expenses', options, uid);
    res.json(expenses);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/expenses', async (req, res) => {
  const uid = tenantId(req);
  const { expense_date, category, description, amount, payment_method, paid_to, notes } = req.body;
  if (!expense_date || !category || !amount) return res.status(400).json({ error: 'Required fields missing' });
  try {
    const expenseData = {
      expense_date, category, description, amount, payment_method, paid_to, notes
    };
    const result = await insert('expenses', expenseData, uid);
    
    // Also add to ledger
    const ledgerData = {
      entry_date: expense_date,
      entry_type: 'expense',
      account_name: category,
      description: description || category,
      debit: amount,
      credit: 0,
      balance: 0
    };
    await insert('ledger_entries', ledgerData, uid);
    
    res.status(201).json({ id: result.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/cashbook', async (req, res) => {
  const uid = tenantId(req);
  const { date } = req.query;
  const d = date || new Date().toISOString().split('T')[0];
  try {
    const { data: salesIn, error: salesError } = await supabase
      .from('sales')
      .select('bill_number,customer_name,final_amount,payment_mode,sale_date')
      .eq('user_id', uid)
      .eq('payment_mode', 'Cash')
      .gte('sale_date', d + 'T00:00:00.000Z')
      .lte('sale_date', d + 'T23:59:59.999Z');

    if (salesError) throw salesError;

    const { data: expOut, error: expError } = await supabase
      .from('expenses')
      .select('category,paid_to,amount,payment_method,expense_date')
      .eq('user_id', uid)
      .eq('payment_method', 'cash')
      .eq('expense_date', d);

    if (expError) throw expError;

    const totalIn = (salesIn || []).reduce((a, s) => a + (s.final_amount || 0), 0);
    const totalOut = (expOut || []).reduce((a, e) => a + (e.amount || 0), 0);
    
    res.json({ 
      date: d, 
      cashIn: (salesIn || []).map(s => ({
        type: 'sale',
        date: s.sale_date,
        ref: s.bill_number,
        party: s.customer_name,
        amount: s.final_amount,
        method: s.payment_mode
      })),
      cashOut: (expOut || []).map(e => ({
        type: 'expense',
        date: e.expense_date,
        ref: e.category,
        party: e.paid_to,
        amount: e.amount,
        method: e.payment_method
      })),
      totalIn, 
      totalOut, 
      netCash: totalIn - totalOut 
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/expenses/:id', async (req, res) => {
  const uid = tenantId(req);
  try {
    const result = await deleteRow('expenses', { id: parseInt(req.params.id) }, uid);
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
