const express = require('express');
const router = express.Router();
const { getDatabase, saveDatabase } = require('../db/database');
const { tenantId } = require('../db/tenant');

const toObjects = (res) => {
  if (!res || res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map(row => { const obj = {}; cols.forEach((c, i) => (obj[c] = row[i])); return obj; });
};

router.get('/', (req, res) => {
  const uid = tenantId(req);
  const db = getDatabase();
  try {
    const rows = toObjects(db.exec('SELECT key, value FROM shop_settings WHERE user_id = ?', [uid]));
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:key', (req, res) => {
  const uid = tenantId(req);
  const db = getDatabase();
  const { value } = req.body;
  try {
    db.run(
      'INSERT OR REPLACE INTO shop_settings (user_id, key, value, updated_at) VALUES (?,?,?,CURRENT_TIMESTAMP)',
      [uid, req.params.key, value]
    );
    saveDatabase();
    res.json({ message: 'Setting saved' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/batch', (req, res) => {
  const uid = tenantId(req);
  const db = getDatabase();
  const { settings } = req.body;
  try {
    for (const [key, value] of Object.entries(settings || {})) {
      db.run(
        'INSERT OR REPLACE INTO shop_settings (user_id, key, value, updated_at) VALUES (?,?,?,CURRENT_TIMESTAMP)',
        [uid, key, value]
      );
    }
    saveDatabase();
    res.json({ message: 'Settings saved' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
