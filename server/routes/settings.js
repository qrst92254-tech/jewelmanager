const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabase');

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('shop_settings')
      .select('key, value');

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
  const { value } = req.body;
  try {
    const { error } = await supabase
      .from('shop_settings')
      .upsert({ 
        key: req.params.key, 
        value,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'key' 
      });

    if (error) throw error;
    res.json({ message: 'Setting saved' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/batch', async (req, res) => {
  const { settings } = req.body;
  try {
    const settingsToUpsert = Object.entries(settings || {}).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('shop_settings')
      .upsert(settingsToUpsert, { 
        onConflict: 'key' 
      });

    if (error) throw error;
    res.json({ message: 'Settings saved' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
