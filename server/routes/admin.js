const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { supabaseAdmin } = require('../services/supabase');
const { requireApiAuth, requireAdminApi } = require('../middleware/auth');

router.post('/create-user', requireApiAuth, requireAdminApi, async (req, res) => {
  const { email, password, fullName, full_name, shopName, shop_name, phone, city } = req.body;
  const name = fullName || full_name;
  const shop = shopName || shop_name || '';

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Email, password, and full name are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email address format' });
  }
  if (!phone || !/^[0-9]{10}$/.test(phone)) {
    return res.status(400).json({ message: 'Phone number must be 10 digits' });
  }
  if (!city) {
    return res.status(400).json({ message: 'City is required' });
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    const { error: profileError } = await supabaseAdmin.from('users').insert({
      id: userId,
      email,
      password_hash,
      full_name: name,
      phone,
      city,
      role: 'shopowner',
      created_at: new Date().toISOString(),
    });

    if (profileError) {
      const msg = profileError.message || 'Failed to create user';
      if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('already')) {
        return res.status(400).json({ message: 'A user with this email already exists' });
      }
      console.error('Profile insert error:', profileError);
      return res.status(400).json({ message: msg });
    }

    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin.from('subscriptions').insert({
      id: crypto.randomUUID(),
      user_id: userId,
      plan: 'trial',
      status: 'active',
      razorpay_subscription_id: null,
      razorpay_payment_id: null,
      trial_started_at: new Date().toISOString(),
      current_period_end: trialEnd,
      created_at: new Date().toISOString(),
    });

    return res.status(201).json({
      message: 'User created successfully',
      user: { id: userId, email, fullName: name, shopName: shop },
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ message: 'Failed to create user' });
  }
});

router.get('/users', requireApiAuth, requireAdminApi, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, created_at, subscriptions(plan, status, current_period_end)')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ message: error.message });

    const users = (data || []).map((u) => {
      const sub = u.subscriptions?.[0] || null;
      return {
        id: u.id,
        email: u.email,
        fullName: u.full_name,
        createdAt: u.created_at,
        plan: sub?.plan || 'none',
        subscriptionStatus: sub?.status || 'none',
        trialExpiresAt: sub?.current_period_end || null,
      };
    });

    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.delete('/users/:userId', requireApiAuth, requireAdminApi, async (req, res) => {
  const { userId } = req.params;
  try {
    await supabaseAdmin.from('active_sessions').delete().eq('user_id', userId);
    await supabaseAdmin.from('subscriptions').delete().eq('user_id', userId);
    await supabaseAdmin.from('users').delete().eq('id', userId);
    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete user' });
  }
});

module.exports = router;
