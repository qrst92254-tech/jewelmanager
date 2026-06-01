const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db/database');

const toObjects = (res) => {
  if (!res || res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => { const obj = {}; cols.forEach((c, i) => (obj[c] = row[i])); return obj; });
};

// GET daily sales report
router.get('/sales/daily', (req, res) => {
  const { from, to } = req.query;
  const db = getDatabase();
  const fromDate = from || new Date().toISOString().split('T')[0];
  const toDate = to || fromDate;
  try {
    const sales = toObjects(db.exec(`SELECT s.*, COUNT(si.id) as item_count 
      FROM sales s LEFT JOIN sale_items si ON s.id=si.sale_id 
      WHERE date(s.sale_date) BETWEEN ? AND ? GROUP BY s.id ORDER BY s.sale_date DESC`,
      [fromDate, toDate]));
    const summary = toObjects(db.exec(`SELECT COUNT(id) as total_bills, SUM(final_amount) as total_revenue,
      SUM(cgst_amount) as total_cgst, SUM(sgst_amount) as total_sgst FROM sales WHERE date(sale_date) BETWEEN ? AND ?`,
      [fromDate, toDate]))[0];
    res.json({ sales, summary, from: fromDate, to: toDate });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET GST report
router.get('/gst', (req, res) => {
  const { month, year } = req.query;
  const db = getDatabase();
  const m = month || (new Date().getMonth() + 1);
  const y = year || new Date().getFullYear();
  try {
    const sales = toObjects(db.exec(`SELECT * FROM sales WHERE strftime('%m', sale_date)=? AND strftime('%Y', sale_date)=? ORDER BY sale_date`,
      [String(m).padStart(2, '0'), String(y)]));
    const totals = toObjects(db.exec(`SELECT SUM(total_amount) as taxable, SUM(cgst_amount) as cgst, SUM(sgst_amount) as sgst, SUM(final_amount) as total 
      FROM sales WHERE strftime('%m', sale_date)=? AND strftime('%Y', sale_date)=?`,
      [String(m).padStart(2, '0'), String(y)]))[0];
    res.json({ sales, totals, month: m, year: y });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET stock report
router.get('/stock', (req, res) => {
  const db = getDatabase();
  try {
    const products = toObjects(db.exec('SELECT * FROM products ORDER BY category, name'));
    const lowStock = products.filter(p => p.quantity <= (p.stock_alert_threshold || 1));
    res.json({ products, lowStock, total: products.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET top selling products
router.get('/top-products', (req, res) => {
  const { limit } = req.query;
  const db = getDatabase();
  try {
    const result = toObjects(db.exec(`SELECT p.name, p.sku, p.category, p.metal, p.purity, 
      SUM(si.quantity) as total_sold, SUM(si.price_at_sale * si.quantity) as total_revenue
      FROM sale_items si JOIN products p ON si.product_id=p.id GROUP BY p.id ORDER BY total_sold DESC LIMIT ?`,
      [Number(limit)||10]));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET customer purchase history
router.get('/customers/:phone', (req, res) => {
  const db = getDatabase();
  try {
    const sales = toObjects(db.exec(`SELECT * FROM sales WHERE customer_phone=? OR customer_name LIKE ? ORDER BY sale_date DESC`,
      [req.params.phone, `%${req.params.phone}%`]));
    res.json(sales);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET financial summary
router.get('/financial', (req, res) => {
  const { from, to } = req.query;
  const db = getDatabase();
  const fromDate = from || new Date().toISOString().split('T')[0];
  const toDate = to || fromDate;
  try {
    const revenue = toObjects(db.exec(`SELECT SUM(final_amount) as total FROM sales WHERE date(sale_date) BETWEEN ? AND ?`, [fromDate, toDate]))[0];
    const expenses = toObjects(db.exec(`SELECT SUM(amount) as total FROM expenses WHERE expense_date BETWEEN ? AND ?`, [fromDate, toDate]))[0];
    const girviLoans = toObjects(db.exec(`SELECT SUM(loan_amount) as total FROM girvi_records WHERE status='active'`))[0];
    const customerOutstanding = toObjects(db.exec(`SELECT SUM(outstanding_amount) as total FROM customers WHERE outstanding_amount > 0`))[0];
    res.json({
      revenue: revenue?.total || 0,
      expenses: expenses?.total || 0,
      profit: (revenue?.total || 0) - (expenses?.total || 0),
      activeGirviLoans: girviLoans?.total || 0,
      customerOutstanding: customerOutstanding?.total || 0,
      from: fromDate,
      to: toDate
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
