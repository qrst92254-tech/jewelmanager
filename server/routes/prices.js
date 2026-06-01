const express = require('express');
const router = express.Router();
const { getLivePrices, FALLBACK_PRICES } = require('../services/priceService');

router.get('/live', async (req, res) => {
  try {
    const prices = await getLivePrices();
    
    // Send back in the format the frontend expects
    res.json({
      success: true,
      data: prices,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Price route error:', error);
    
    // Even on error, send fallback — NEVER send a 500 error to the price page
    res.json({
      success: true,
      data: { ...FALLBACK_PRICES, is_fallback: true },
      timestamp: new Date().toISOString(),
      warning: 'Using fallback prices - API unavailable'
    });
  }
});

module.exports = router;