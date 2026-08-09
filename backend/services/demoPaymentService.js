// PoleSafe — Mock/Demo Payment Service
// Simulates all transactions with FAKE money for testing
// Real payments will be swapped in when going live

const config = require('../config');
const { Transaction, Credit, User } = require('../database/schema');

class DemoPaymentService {

  constructor() {
    this.isDemo = process.env.POLESAFE_DEMO === 'true' || true; // Default to demo
    this.demoBalance = {
      mtn: 100000000,   // 100M UGX fake MTN float
      airtel: 80000000, // 80M UGX fake Airtel float
      flutterwave: 0,   // Flutterwave is just pass-through
    };
    this.transactionCounter = 0;
  }

  /**
   * Process a payment (fake — no real money moves)
   * Simulates the full flow: request → pending → complete
   * 
   * @param {object} params
   * @param {string} params.parentId
   * @param {number} params.amount - UGX amount
   * @param {string} params.method - mobile_money | cash | credit
   * @param {string} params.provider - mtn | airtel | polesafe_agent
   * @param {string} params.bookingId
   * @param {string} params.rideId
   * @returns {object} Fake transaction result
   */
  async processPayment({ parentId, amount, method, provider = 'mtn', bookingId, rideId }) {
    this.transactionCounter++;

    // Simulate processing delay (200ms-800ms)
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 600));

    // Generate fake receipt
    const receiptNo = `DEMO-${Date.now().toString(36).toUpperCase()}-${this.transactionCounter}`;

    // Simulate 95% success rate (for realistic testing)
    const isSuccess = Math.random() < 0.95;

    if (!isSuccess) {
      // Create failed transaction
      const transaction = await Transaction.create({
        parentId,
        bookingId,
        rideId,
        type: 'booking_payment',
        amount,
        currency: 'UGX',
        method,
        provider,
        status: 'failed',
        reference: `FAILED-${receiptNo}`,
        isBatched: false,
      });

      return {
        success: false,
        transaction,
        error: 'Payment failed. Insufficient funds or network error.',
        fake: true,
        demoMode: true,
      };
    }

    // Deduct from demo float
    if (provider === 'mtn') this.demoBalance.mtn -= amount;
    if (provider === 'airtel') this.demoBalance.airtel -= amount;

    // Create successful transaction
    const transaction = await Transaction.create({
      parentId,
      bookingId,
      rideId,
      type: method === 'credit' ? 'credit_redemption' : 'booking_payment',
      amount,
      currency: 'UGX',
      method,
      provider,
      status: 'completed',
      reference: receiptNo,
      isBatched: config.PAYMENT.BATCH_SETTLEMENT,
      createdAt: new Date(),
    });

    return {
      success: true,
      transaction,
      receiptNo,
      receipt: {
        amount,
        method,
        provider,
        date: new Date().toISOString(),
        receiptNo,
        demoMode: true,
        note: '🔴 DEMO MODE — No real money was transferred',
      },
      demoMode: true,
      fake: true,
    };
  }

  /**
   * Process a batch settlement (weekly payout to drivers)
   * Fake money, real math
   */
  async processBatchSettlement(driverPayments) {
    const batchId = `BATCH-DEMO-${Date.now()}`;
    const results = [];

    for (const payment of driverPayments) {
      const transaction = await Transaction.create({
        parentId: null,
        type: 'commission_payout',
        amount: payment.amount,
        currency: 'UGX',
        method: 'batch_settlement',
        provider: 'polesafe_agent',
        status: 'completed',
        reference: `${batchId}-${payment.driverId}`,
        batchId,
        isBatched: true,
      });
      results.push(transaction);
    }

    return {
      batchId,
      totalPayout: driverPayments.reduce((s, p) => s + p.amount, 0),
      driversPaid: driverPayments.length,
      transactions: results,
      demoMode: true,
      note: '🔴 DEMO — No real money was transferred',
    };
  }

  /**
   * Generate a fake receipt/statement for a parent
   */
  generateStatement(parentId, transactions) {
    const totalSpent = transactions.reduce((s, t) => s + t.amount, 0);
    const creditBalance = 0; // Would be calculated from Credit model

    return {
      parentId,
      period: {
        from: transactions[0]?.createdAt || new Date(),
        to: transactions[transactions.length - 1]?.createdAt || new Date(),
      },
      summary: {
        totalTransactions: transactions.length,
        totalSpent,
        byMethod: {
          mobile_money: transactions.filter(t => t.method === 'mobile_money').reduce((s, t) => s + t.amount, 0),
          cash: transactions.filter(t => t.method === 'cash').reduce((s, t) => s + t.amount, 0),
          credit: transactions.filter(t => t.method === 'credit').reduce((s, t) => s + t.amount, 0),
        },
      },
      transactions,
      demoMode: true,
      watermark: '🔴 DEMO — Not a real statement',
    };
  }

  /**
   * Simulate sending payment receipt via parent's preferred channel
   */
  async sendFakeReceipt(parent, transaction) {
    const channel = parent.preferredChannel || 'whatsapp';
    const message = `🧪 [DEMO] PoleSafe Receipt\nAmount: ${transaction.amount} UGX\nMethod: ${transaction.method}\nReceipt: ${transaction.reference}\n\n🔴 This is a TEST — no real money used`;

    console.log(`🧪 [Demo Receipt] Via ${channel} to ${parent.phone}: ${transaction.reference}`);
    return {
      sent: true,
      channel,
      message,
      demoMode: true,
    };
  }

  /**
   * Get demo float balances
   */
  getDemoBalances() {
    return {
      ...this.demoBalance,
      totalFloat: Object.values(this.demoBalance).reduce((s, v) => s + v, 0),
      mode: 'DEMO',
    };
  }
}

module.exports = new DemoPaymentService();
