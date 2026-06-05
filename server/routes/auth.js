const express = require('express');
const { supabase, supabaseAdmin } = require('../services/supabase');
const { requireFormOrJson, requireApiAuth, isAdminEmail } = require('../middleware/auth');
const { queryAll } = require('../db/database');
const { tenantId } = require('../db/tenant');

const router = express.Router();

async function registerActiveSession(userId, sessionToken, req) {
  await supabaseAdmin.from('active_sessions').delete().eq('user_id', userId);
  const { error } = await supabaseAdmin.from('active_sessions').insert({
    user_id: userId,
    session_token: sessionToken,
    device_info: req.headers['user-agent'] || 'unknown',
    created_at: new Date().toISOString(),
    last_active: new Date().toISOString(),
  });
  if (error) {
    console.error('active_sessions insert failed:', error.message);
    throw error;
  }
}

router.get('/signup', (req, res) => {
  return res.render('signup', { error: 'Public signup is disabled. Contact the administrator to get an account.' });
});

router.get('/login', (req, res) => {
  return res.render('login', { error: null });
});

router.post('/signup', requireFormOrJson, (req, res) => {
  const isJson = (req.headers['content-type'] || '').includes('application/json');
  const payload = {
    message: 'Public signup is disabled. Contact the administrator to get an account.',
  };
  if (isJson) {
    return res.status(403).json(payload);
  }
  return res.status(403).render('signup', { error: payload.message });
});

router.post('/login', requireFormOrJson, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).render('login', { error: 'Email and password are required.' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Supabase login error:', error);
      if (error.code === 'email_not_confirmed') {
        return res.status(400).json({
          message: 'Your email is not confirmed. Please check your inbox or contact admin.',
        });
      }
      if (error.code === 'invalid_credentials') {
        return res.status(401).json({
          message: 'Incorrect email or password. Please try again.',
        });
      }
      return res.status(401).json({ error: error.message });
    }

    const userId = data.user.id;
    const sessionToken = data.session?.access_token;
    if (!sessionToken) {
      return res.status(500).json({ message: 'Login succeeded but no session token was returned.' });
    }

    try {
      await registerActiveSession(userId, sessionToken, req);
    } catch (sessionErr) {
      console.error('Session registration failed:', sessionErr);
      return res.status(500).json({
        message: 'Login failed: active_sessions table may be missing. Run server/migrations/002_active_sessions.sql in Supabase.',
      });
    }

    res.cookie('sb-access-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const isJson = (req.headers['content-type'] || '').includes('application/json');
    if (isJson) {
      return res.json({
        success: true,
        token: sessionToken,
        email: data.user.email,
        isAdmin: isAdminEmail(data.user.email),
        user: { id: userId, email: data.user.email },
      });
    }
    return res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).render('login', { error: 'Unable to sign in right now. Please try again later.' });
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
  try {
    const uid = tenantId(req);
    const today = new Date().toISOString().split('T')[0];

    // Get today's sales count and revenue
    const todaySalesData = await queryAll('sales', {
      select: 'final_amount',
      gte: { sale_date: today + 'T00:00:00.000Z' },
      lte: { sale_date: today + 'T23:59:59.999Z' }
    }, uid);
    const todaySales = {
      count: todaySalesData.length,
      revenue: todaySalesData.reduce((sum, s) => sum + (parseFloat(s.final_amount) || 0), 0)
    };

    // Get stock info
    const products = await queryAll('products', {}, uid);
    const stock = {
      uniqueProducts: products.length,
      totalStock: products.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0)
    };

    // Get low stock items
    const lowStockItems = products.filter(
      (p) => p.quantity <= (p.stock_alert_threshold || 1)
    ).slice(0, 5);

    // Get recent sales
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

router.post('/logout', requireFormOrJson, async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.['sb-access-token'];
  if (token) {
    try {
      const { data } = await supabase.auth.getUser(token);
      if (data?.user?.id) {
        await supabaseAdmin.from('active_sessions').delete().eq('user_id', data.user.id);
      }
    } catch (err) {
      console.error('Logout session cleanup failed:', err.message);
    }
  }
  res.clearCookie('sb-access-token');
  return res.json({ success: true });
});

router.post('/session', requireFormOrJson, async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) {
    return res.status(400).json({ error: 'Missing access_token' });
  }

  try {
    const { data, error } = await supabase.auth.getUser(access_token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    await registerActiveSession(data.user.id, access_token, req);

    res.cookie('sb-access-token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.json({ success: true });
  } catch (err) {
    console.error('Session set failed:', err);
    return res.status(500).json({ error: 'Unable to set session' });
  }
});

module.exports = router;
