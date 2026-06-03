const express = require('express');
const { supabaseAdmin } = require('../services/supabase');
const { requireAuth, requireCreator, requireFormOrJson } = require('../middleware/auth');

const router = express.Router();

router.get('/creator', requireAuth, requireCreator, async (req, res) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, phone, city, role, created_at, subscriptions(id, plan, status, current_period_end, trial_started_at)');

    if (error) {
      console.error('Creator dashboard failed:', error);
      return res.status(500).render('creator', { error: 'Unable to load creator dashboard.', users: [], counts: {} });
    }

    const formattedUsers = (users || []).map((user) => {
      const sub = user.subscriptions?.[0] || {};
      return {
        id: user.id,
        name: user.full_name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        plan: sub.plan || 'trial',
        status: sub.status || 'active',
        joinedAt: user.created_at,
        renewalDate: sub.current_period_end || sub.trial_started_at || '',
      };
    });

    const counts = {
      total: formattedUsers.length,
      trial: formattedUsers.filter((item) => item.plan === 'trial').length,
      monthly: formattedUsers.filter((item) => item.plan === 'monthly').length,
      lifetime: formattedUsers.filter((item) => item.plan === 'lifetime').length,
    };

    return res.render('creator', {
      users: formattedUsers,
      counts,
      error: null,
      creatorEmail: process.env.CREATOR_EMAIL,
    });
  } catch (error) {
    console.error('Creator panel error:', error);
    return res.status(500).render('creator', { error: 'Unable to load creator dashboard.', users: [], counts: {} });
  }
});

router.post('/creator/delete-user', requireFormOrJson, requireAuth, requireCreator, async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'Missing user ID.' });
  }

  try {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    await supabaseAdmin.from('subscriptions').delete().eq('user_id', userId);
    await supabaseAdmin.from('users').delete().eq('id', userId);
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete user failed:', error);
    return res.status(500).json({ error: 'Unable to delete user.' });
  }
});

router.get('/creator/export', requireAuth, requireCreator, async (req, res) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, phone, city, role, created_at, subscriptions(id, plan, status, current_period_end, trial_started_at)');

    if (error) {
      console.error('Export failed:', error);
      return res.status(500).send('Unable to export CSV at this time.');
    }

    const rows = (users || []).map((user) => {
      const sub = user.subscriptions?.[0] || {};
      return {
        Name: user.full_name,
        Email: user.email,
        Phone: user.phone,
        City: user.city,
        Plan: sub.plan || 'trial',
        Status: sub.status || 'active',
        JoinedDate: user.created_at,
        RenewalDate: sub.current_period_end || sub.trial_started_at || '',
      };
    });

    const header = ['Name', 'Email', 'Phone', 'City', 'Plan', 'Status', 'JoinedDate', 'RenewalDate'];
    const csv = [header.join(',')].concat(rows.map((row) => header.map((key) => `"${(row[key] || '').toString().replace(/"/g, '""')}"`).join(','))).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="jewelmanager-users.csv"');
    return res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    return res.status(500).send('Unable to export CSV.');
  }
});

module.exports = router;
