const express = require('express');
const crypto = require('crypto');
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
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      const msg = authError.message || 'Failed to create user';
      if (msg.toLowerCase().includes('already')) {
        return res.status(400).json({ message: 'A user with this email already exists' });
      }
      return res.status(400).json({ message: msg });
    }

    const userId = authData.user.id;

    const { error: profileError } = await supabaseAdmin.from('users').upsert({
      id: userId,
      email,
      full_name: name,
      phone,
      city,
      role: 'shopowner',
      created_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (profileError) {
      console.error('Profile insert error:', profileError);
    }

    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
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
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) return res.status(500).json({ message: error.message });

    const users = (data.users || []).map((u) => ({
      id: u.id,
      email: u.email,
      createdAt: u.created_at,
      lastSignIn: u.last_sign_in_at,
    }));

    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.delete('/users/:userId', requireApiAuth, requireAdminApi, async (req, res) => {
  const { userId } = req.params;
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) return res.status(400).json({ message: error.message });
    await supabaseAdmin.from('active_sessions').delete().eq('user_id', userId);
    await supabaseAdmin.from('subscriptions').delete().eq('user_id', userId);
    await supabaseAdmin.from('users').delete().eq('id', userId);
    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete user' });
  }
});

module.exports = router;
