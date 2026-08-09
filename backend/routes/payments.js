// PoleSafe — Payment Routes (Demo Mode)
// All payments are FAKE — for testing only

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const demoPaymentService = require('../services/demoPaymentService');
const { Transaction, User } = require('../database/schema');

router.use(authMiddleware);
router.use(requireRole('parent'));

// POST /api/payments/pay — Process a fake payment
router.post('/pay', async (req, res) => {
  try {
    const { amount, method, provider, bookingId, rideId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    const result = await demoPaymentService.processPayment({
      parentId: req.userId,
      amount,
      method: method || 'mobile_money',
      provider: provider || 'mtn',
      bookingId,
      rideId,
    });

    if (result.success) {
      // Send fake receipt
      const user = await User.findById(req.userId);
      await demoPaymentService.sendFakeReceipt(user, result.transaction);

      res.json({
        success: true,
        message: '✅ [DEMO] Payment processed successfully — NO real money moved',
        transaction: {
          id: result.transaction._id,
          amount: result.transaction.amount,
          method: result.transaction.method,
          reference: result.receiptNo,
          status: result.transaction.status,
        },
        receipt: result.receipt,
        demoMode: true,
      });
    } else {
      res.status(402).json({
        success: false,
        error: result.error,
        demoMode: true,
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payments/transactions — View all transactions
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find({ parentId: req.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const total = transactions.reduce((s, t) => s + t.amount, 0);

    res.json({
      transactions,
      summary: {
        totalSpent: total,
        count: transactions.length,
      },
      demoMode: true,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payments/statement — Get statement
router.get('/statement', async (req, res) => {
  try {
    const transactions = await Transaction.find({ parentId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const statement = demoPaymentService.generateStatement(req.userId, transactions);
    res.json(statement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payments/demo-balance — Check fake float balance (admin curiosity)
router.get('/demo-balance', async (req, res) => {
  res.json(demoPaymentService.getDemoBalances());
});

module.exports = router;
