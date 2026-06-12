const express = require('express');
const router = express.Router();
const { getUserRates, saveUserRates } = require('../services/priceService');
const { tenantId } = require('../db/tenant');

// GET /api/prices/live — get current user's saved rates
router.get('/live', async (req, res) => {
  try {
    const userId = tenantId(req);
    const rates = await getUserRates(userId);
    return res.json({ success: true, data: rates });
  } catch (err) {
    if (err.message === 'Tenant context missing') {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    console.error('[Prices] GET /live error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/prices/live — save/update current user's rates
router.put('/live', async (req, res) => {
  try {
    const userId = tenantId(req);
    const { gold_24k, gold_22k, gold_18k, silver } = req.body;

    if (!gold_22k && !gold_24k && !gold_18k && !silver) {
      return res.status(400).json({ success: false, message: 'At least one rate is required' });
    }

    const result = await saveUserRates(userId, { gold_24k, gold_22k, gold_18k, silver });

    if (!result.success) {
      return res.status(500).json({ success: false, message: result.message });
    }

    const saved = await getUserRates(userId);
    return res.json({ success: true, data: saved });
  } catch (err) {
    if (err.message === 'Tenant context missing') {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    console.error('[Prices] PUT /live error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
