// PoleSafe — Payment Routes (Live)
// Processes real payments through Flutterwave
// Supports: MTN Momo, Airtel Money, Card, Cash

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const flutterwave = require('../services/flutterwaveService');
const { Transaction, User, Credit } = require('../database/schema');

router.use(authMiddleware);

// ============================================================
// POST /api/payments/momo — Pay via Mobile Money (MTN/Airtel)
// ============================================================
router.post('/momo', requireRole('parent'), async (req, res) => {
  try {
    const { amount, provider, narration, bookingId, rideId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    if (!['mtn', 'airtel'].includes(provider)) {
      return res.status(400).json({ error: 'Provider must be mtn or airtel' });
    }

    const user = await User.findById(req.userId);
    if (!user?.phone) {
      return res.status(400).json({ error: 'No phone number on your account' });
    }

    // Charge mobile money wallet
    const result = await flutterwave.chargeMobileMoney({
      phone: user.phone,
      amount,
      provider,
      narration: narration || 'PoleSafe Payment',
      userId: req.userId,
    });

    res.json({
      success: true,
      requiresPin: true,
      flwRef: result.flwRef,
      txRef: result.txRef,
      message: 'Enter your Momo PIN when prompted on your phone',
      transaction: {
        id: result.transaction._id,
        amount: result.transaction.amount,
        provider: result.transaction.provider,
        status: result.transaction.status,
      },
    });
  } catch (err) {
    console.error('[Payments] Momo failed:', err.message);
    res.status(402).json({
      success: false,
      error: 'Payment failed. Check your mobile money balance and try again.',
    });
  }
});

// ============================================================
// POST /api/payments/verify-momo — Confirm Momo payment after PIN
// ============================================================
router.post('/verify-momo', requireRole('parent'), async (req, res) => {
  try {
    const { flwRef } = req.body;

    if (!flwRef) {
      return res.status(400).json({ error: 'flwRef is required' });
    }

    const result = await flutterwave.verifyMobileMoney(flwRef);

    if (result.success) {
      res.json({
        success: true,
        status: 'completed',
        transaction: result.transaction,
        message: '✅ Payment received! Receipt sent via WhatsApp.',
      });
    } else {
      res.status(402).json({
        success: false,
        status: result.status || 'failed',
        message: 'Payment verification failed. Please try again.',
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Verification failed. Try again.' });
  }
});

// ============================================================
// GET /api/payments/transactions — View your payment history
// ============================================================
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find({ parentId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const total = transactions
      .filter(t => t.status === 'completed')
      .reduce((s, t) => s + t.amount, 0);

    res.json({
      transactions,
      summary: {
        totalSpent: total,
        count: transactions.filter(t => t.status === 'completed').length,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/payments/statement — Full statement
// ============================================================
router.get('/statement', async (req, res) => {
  try {
    const transactions = await Transaction.find({ parentId: req.userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const completed = transactions.filter(t => t.status === 'completed');
    const totalSpent = completed.reduce((s, t) => s + t.amount, 0);
    const byMethod = {};
    completed.forEach(t => {
      byMethod[t.method] = (byMethod[t.method] || 0) + t.amount;
    });

    res.json({
      period: 'All time',
      totalSpent,
      transactionCount: completed.length,
      byMethod,
      transactions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/payments/webhook — Flutterwave webhook (no auth)
// Flutterwave sends transaction updates here automatically
// ============================================================
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Verify webhook signature
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET || '';
    const signature = req.headers['verif-hash'];
    if (secretHash && signature !== secretHash) {
      return res.status(401).send('Invalid signature');
    }

    const event = req.body;
    if (event.event === 'charge.completed' && event.data?.status === 'successful') {
      await Transaction.findOneAndUpdate(
        { reference: event.data.tx_ref },
        { status: 'completed', flutterwaveResponse: JSON.stringify(event) }
      );
    }

    if (event.event === 'charge.failed') {
      await Transaction.findOneAndUpdate(
        { reference: event.data.tx_ref },
        { status: 'failed', flutterwaveResponse: JSON.stringify(event) }
      );
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('[Webhook] Error:', err.message);
    res.status(200).send('OK');
  }
});

module.exports = router;
