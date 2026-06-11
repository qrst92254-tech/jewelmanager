const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../services/supabase');
const { tenantId } = require('../db/tenant');

router.get('/', async (req, res) => {
  try {
    const uid = tenantId(req);
    const { data, error } = await supabase
      .from('shop_settings')
      .select('key, value')
      .eq('user_id', uid);

    if (error) {
      console.error('Error fetching settings:', error.message);
      return res.status(500).json({ error: error.message });
    }

    const settings = {};
    (data || []).forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:key', async (req, res) => {
  try {
    const uid = tenantId(req);
    const { value } = req.body;
    const { error } = await supabase
      .from('shop_settings')
      .upsert({
        key: req.params.key,
        value,
        user_id: uid,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,key'
      });

    if (error) throw error;
    res.json({ message: 'Setting saved' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/batch', async (req, res) => {
  try {
    const uid = tenantId(req);
    const { settings } = req.body;

    // Validate GST fields if present
    const gstFields = ['gst_on_making', 'gst_on_metal', 'gst_on_purchase', 'cgst_rate', 'sgst_rate'];
    for (const key of gstFields) {
      if (settings && settings[key] !== undefined) {
        const num = parseFloat(settings[key]);
        if (isNaN(num) || num < 0 || num > 30) {
          return res.status(400).json({
            message: `Invalid value for ${key}. Must be a number between 0 and 30.`
          });
        }
      }
    }

    const settingsToUpsert = Object.entries(settings || {}).map(([key, value]) => ({
      key,
      value,
      user_id: uid,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('shop_settings')
      .upsert(settingsToUpsert, {
        onConflict: 'user_id,key'
      });

    if (error) throw error;
    res.json({ message: 'Settings saved' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const uid = tenantId(req);

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Both fields required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters' });
  }

  try {
    // Get the user email from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', uid)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password against Supabase Auth
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: currentPassword,
    });

    if (signInError) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password in Supabase Auth using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      uid,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Supabase auth password update error:', updateError);
      return res.status(500).json({ message: 'Failed to update password' });
    }

    // Also update password_hash in users table for backwards compatibility
    const bcrypt = require('bcryptjs');
    const newHash = await bcrypt.hash(newPassword, 10);
    await supabase.from('users').update({ password_hash: newHash }).eq('id', uid);

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password update error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
