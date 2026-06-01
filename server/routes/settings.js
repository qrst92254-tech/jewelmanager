const express = require('express');
const router = express.Router();
const { getDatabase, saveDatabase } = require('../db/database');

const toObjects = (res) => {
  if (!res || res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => { const obj = {}; cols.forEach((c, i) => (obj[c] = row[i])); return obj; });
};

// GET all settings
router.get('/', (req, res) => {
  const db = getDatabase();
  try {
    const rows = toObjects(db.exec('SELECT key, value FROM shop_settings'));
    const settings = {};
    rows.forEach(r => settings[r.key] = r.value);
    res.json(settings);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT update a setting
router.put('/:key', (req, res) => {
  const db = getDatabase();
  const { value } = req.body;
  try {
    db.run("INSERT OR REPLACE INTO shop_settings (key,value,updated_at) VALUES (?,?,CURRENT_TIMESTAMP)",
      [req.params.key, value]);
    saveDatabase();
    res.json({ message: 'Setting saved' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST batch update settings
router.post('/batch', (req, res) => {
  const db = getDatabase();
  const { settings } = req.body; // { key: value, ... }
  try {
    for (const [key, value] of Object.entries(settings || {})) {
      db.run("INSERT OR REPLACE INTO shop_settings (key,value,updated_at) VALUES (?,?,CURRENT_TIMESTAMP)", [key, value]);
    }
    saveDatabase();
    res.json({ message: 'Settings saved' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
