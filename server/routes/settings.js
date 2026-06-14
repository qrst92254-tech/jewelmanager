const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../services/supabase');
const { tenantId } = require('../db/tenant');

// Get all settings
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

// Batch update settings
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

// Password update route (must be before wildcard key route)
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
    const bcrypt = require('bcryptjs');
    // Get current password hash from users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('password_hash')
      .eq('id', uid)
      .single();
    if (userError || !userData) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Verify current password against stored bcrypt hash
    const isMatch = await bcrypt.compare(currentPassword, userData.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    // Hash new password and update in users table
    const newHash = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password_hash: newHash })
      .eq('id', uid);
    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({ message: 'Failed to update password' });
    }
    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password update error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Wildcard key route (must be after password route)
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

module.exports = router;
