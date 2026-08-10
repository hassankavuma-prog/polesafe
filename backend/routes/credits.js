// PoleSafe — Credits Routes
// Dedicated credit management endpoints

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { Credit } = require('../database/schema');
const creditService = require('../services/creditService');

router.use(authMiddleware);

// GET /api/credits — Get credit balance and history
router.get('/', async (req, res) => {
  try {
    const balance = await creditService.getBalance(req.userId);
    const history = await creditService.getCreditHistory(req.userId);

    // Group by reason
    const breakdown = {
      sick_day: history.filter(c => c.reason === 'sick_day').reduce((s, c) => s + c.amount, 0),
      school_closure: history.filter(c => c.reason === 'school_closure').reduce((s, c) => s + c.amount, 0),
      early_pickup: history.filter(c => c.reason === 'early_pickup').reduce((s, c) => s + c.amount, 0),
      driver_cancelled: history.filter(c => c.reason === 'driver_cancelled').reduce((s, c) => s + c.amount, 0),
    };

    res.json({
      balance,
      breakdown,
      history,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/credits/redeem — Redeem credits
router.post('/redeem', async (req, res) => {
  try {
    const { amount, redemptionType } = req.body;
    // Accept both `purpose` and `redemptionType` for compatibility
    const purpose = req.body.purpose || redemptionType;

    const validPurposes = ['next_term', 'pole_ride', 'cashback'];
    if (!validPurposes.includes(purpose)) {
      return res.status(400).json({ error: `Purpose must be: ${validPurposes.join(', ')}` });
    }

    const result = await creditService.redeemCredits(req.userId, amount, purpose);

    if (!result.success) {
      return res.status(400).json({ error: result.error, balance: result.balance });
    }

    res.json({
      message: `✅ ${result.redeemedAmount} UGX redeemed for ${purpose}`,
      remainingBalance: result.remainingBalance,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
