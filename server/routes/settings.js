const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabase');
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

module.exports = router;
