// PoleSafe — Flutterwave Webhook & Payment Verification
// Receives payment status callbacks from Flutterwave
// Mounted at: POST /api/payments/webhook

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { Transaction, User, WithdrawalRequest } = require('../database/schema');
const config = require('../config');
const { authMiddleware } = require('../middleware/auth');

// ============================================================
// POST /api/payments/webhook — Flutterwave transaction callback
// Flutterwave sends payment status updates here after a charge attempt
// ============================================================
router.post('/webhook', async (req, res) => {
  try {
    // Verify Flutterwave signature
    const secretHash = crypto.createHash('sha256')
      .update(process.env.FLUTTERWAVE_SECRET_KEY || config.FLUTTERWAVE?.SECRET_KEY || '')
      .digest('hex');
    
    const signature = req.headers['verif-hash'];
    
    if (!signature || signature !== secretHash) {
      console.warn('[Webhook] Invalid signature — rejecting');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    console.log(`[Webhook] Event: ${event.event} — ${event.event?.type || 'unknown'}`);

    // Handle charge.completed events (payment success/failure)
    if (event.event === 'charge.completed') {
      const data = event.data;
      const txRef = data.tx_ref;
      const status = data.status; // 'successful' or 'failed'
      const flwId = data.id;
      const amount = data.amount;
      const currency = data.currency;

      // Find the transaction by reference
      const transaction = await Transaction.findOne({ reference: txRef });
      
      if (!transaction) {
        console.warn(`[Webhook] Unknown transaction: ${txRef}`);
        return res.status(200).json({ status: 'unknown_transaction' }); // Always 200 to Flutterwave
      }

      if (status === 'successful') {
        transaction.status = 'completed';
        transaction.flwId = flwId;
        await transaction.save();

        console.log(`[Webhook] ✅ Payment completed: ${txRef} — ${amount} ${currency}`);

        // Reload user credits if applicable
        if (transaction.type === 'booking_payment' || transaction.type === 'ride_payment') {
          await User.findByIdAndUpdate(transaction.parentId, {
            $inc: { creditsBalance: amount * 0.05 } // 5% cashback
          });
        }
      } else {
        transaction.status = 'failed';
        transaction.flwId = flwId;
        transaction.metadata = { failureReason: data.processor_response };
        await transaction.save();

        console.log(`[Webhook] ❌ Payment failed: ${txRef} — ${data.processor_response}`);
      }
    }

    // Handle transfer.completed (payout to driver)
    if (event.event === 'transfer.completed') {
      const data = event.data;
      const reference = data.reference;

      // Find withdrawal request by reference
      const withdrawal = await WithdrawalRequest.findOne({ transactionId: reference });
      if (withdrawal) {
        if (data.status === 'SUCCESSFUL') {
          withdrawal.status = 'completed';
          withdrawal.processedAt = new Date();
          console.log(`[Webhook] ✅ Driver payout completed: ${reference}`);
        } else {
          withdrawal.status = 'failed';
          withdrawal.adminNote = `Flutterwave: ${data.complete_message || 'Transfer failed'}`;
          console.log(`[Webhook] ❌ Driver payout failed: ${reference}`);
        }
        await withdrawal.save();
      }
    }

    // Always respond 200 to acknowledge receipt
    res.status(200).json({ status: 'received' });
  } catch (err) {
    console.error('[Webhook] Error:', err.message);
    res.status(200).json({ status: 'error', message: err.message });
  }
});

// ============================================================
// GET /api/payments/verify/:reference — Check payment status
// Used by mobile app after a charge attempt
// ============================================================
router.get('/verify/:reference', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ reference: req.params.reference });
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Ownership check: must own the transaction
    const ownsTx = (
      transaction.parentId?.toString() === req.user._id?.toString() ||
      transaction.driverId?.toString() === req.user._id?.toString() ||
      transaction.userId?.toString() === req.user._id?.toString() ||
      req.user.role === 'polesafe_admin'
    );
    if (!ownsTx) {
      return res.status(403).json({ error: 'Access denied. This is not your transaction.' });
    }

    res.json({
      status: transaction.status,
      amount: transaction.amount,
      method: transaction.method,
      reference: transaction.reference,
      createdAt: transaction.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
