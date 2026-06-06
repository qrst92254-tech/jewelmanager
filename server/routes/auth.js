const express = require('express');
const { supabase } = require('../services/supabase');
const { requireApiAuth, isAdminEmail } = require('../middleware/auth');
const router = express.Router();

router.get('/signup', (req, res) => {
  return res.render('signup', { error: 'Public signup is disabled. Contact the administrator to get an account.' });
});

router.get('/login', (req, res) => {
  return res.render('login', { error: null });
});

router.post('/signup', (req, res) => {
  const isJson = (req.headers['content-type'] || '').includes('application/json');
  const payload = {
    message: 'Public signup is disabled. Contact the administrator to get an account.',
  };
  if (isJson) {
    return res.status(403).json(payload);
  }
  return res.status(403).render('signup', { error: payload.message });
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('[LOGIN] Attempt:', email);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .limit(1);

    console.log('[LOGIN] DB query result:', { found: users?.length, error: error?.message });

    if (error || !users || users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = users[0];
    console.log('[LOGIN] Hash prefix:', user.password_hash?.substring(0, 7));

    const bcrypt = require('bcryptjs');
    const match = await bcrypt.compare(password, user.password_hash);
    console.log('[LOGIN] bcrypt.compare result:', match);

    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name
    };

    req.session.save((err) => {
      if (err) {
        console.error('[LOGIN] Session save error:', err);
        return res.status(500).json({ error: 'Session error.' });
      }
      console.log('[LOGIN] Session saved, userId:', req.session.userId);
      return res.json({ success: true, user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name } });
    });

  } catch (err) {
    console.error('[LOGIN] Unexpected error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

router.get('/me', requireApiAuth, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    isAdmin: isAdminEmail(req.user.email),
  });
});

router.get('/dashboard-stats', requireApiAuth, async (req, res) => {
  const { queryAll } = require('../db/database');

  try {
    const uid = req.session.userId;
    const today = new Date().toISOString().split('T')[0];

    const todaySalesData = await queryAll('sales', {
      select: 'final_amount',
      gte: { sale_date: today + 'T00:00:00.000Z' },
      lte: { sale_date: today + 'T23:59:59.999Z' }
    }, uid);
    const todaySales = {
      count: todaySalesData.length,
      revenue: todaySalesData.reduce((sum, s) => sum + (parseFloat(s.final_amount) || 0), 0)
    };

    const products = await queryAll('products', {}, uid);
    const stock = {
      uniqueProducts: products.length,
      totalStock: products.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0)
    };

    const lowStockItems = products.filter(
      (p) => p.quantity <= (p.stock_alert_threshold || 1)
    ).slice(0, 5);

    const recentSales = await queryAll('sales', {
      select: 'bill_number,sale_date,final_amount',
      order: { column: 'sale_date', ascending: false },
      limit: 7
    }, uid);

    res.json({
      todayRevenue: todaySales.revenue,
      salesToday: todaySales.count,
      uniqueProducts: stock.uniqueProducts,
      totalStock: stock.totalStock,
      lowStockCount: lowStockItems.length,
      lowStockItems,
      recentSales,
    });
  } catch (err) {
    console.error('dashboard-stats error:', err);
    res.status(500).json({ error: 'Failed to load dashboard stats' });
  }
});

router.post('/logout', async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err.message);
    }
    res.clearCookie('connect.sid');
    const isJson = (req.headers['content-type'] || '').includes('application/json');
    if (isJson) {
      return res.json({ success: true });
    }
    return res.redirect('/login');
  });
});

module.exports = router;
