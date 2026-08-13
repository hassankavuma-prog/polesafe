// PoleSafe — Credit Service
// Handles credit accrual and redemption for missed rides
// When: sick day, early pickup, school closure
// Rule: not parent's fault → credit. Parent's fault → no credit.

const config = require('../config');
const { z } = require('zod');
const { Credit, Transaction, Ride } = require('../database/schema');
const { validateTenantScopedQuery } = require('../../lib/engine/hamnah-core.ts');

class CreditService {

  /**
   * Issue a credit to a parent for a missed ride
   * 
   * @param {object} params
   * @param {string} params.parentId
   * @param {string} params.rideId
   * @param {number} params.amount - UGX amount to credit
   * @param {string} params.reason - sick_day | school_closure | early_pickup | driver_cancelled
   * @returns {object} Created credit record
   */
  async issueCredit({ parentId, rideId, amount, reason }) {
    // Calculate expiry (1 year from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.CREDIT_SYSTEM.CREDIT_EXPIRY_DAYS);

    const creditQuerySchema = z.object({ parentId: z.string().min(1), rideId: z.string().min(1) }).strict();
    validateTenantScopedQuery(creditQuerySchema, { parentId, rideId }, parentId, ['credit:issue']);
    const credit = await Credit.create({
      parentId,
      rideId,
      amount,
      reason,
      status: 'available',
      expiresAt,
    });

    // Mark the ride as credited back
    await Ride.findByIdAndUpdate(rideId, { creditedBack: true });

    console.log(`💰 Credit issued: ${amount} UGX to parent ${parentId} for ${reason}`);
    return credit;
  }

  /**
   * Get a parent's total available credit balance
   * 
   * @param {string} parentId
   * @returns {number} Available credit in UGX
   */
  async getBalance(parentId) {
    const credits = await Credit.find({
      parentId,
      status: 'available',
      expiresAt: { $gt: new Date() },
    });

    return credits.reduce((sum, c) => sum + c.amount, 0);
  }

  /**
   * Get a parent's credit transactions history
   */
  async getCreditHistory(parentId) {
    return Credit.find({ parentId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  }

  /**
   * Redeem credits for a purpose
   * 
   * @param {string} parentId
   * @param {number} amount - Amount to redeem
   * @param {string} purpose - next_term | pole_ride | cashback
   * @returns {object} Redemption result
   */
  async redeemCredits(parentId, amount, purpose) {
    const balance = await this.getBalance(parentId);

    if (balance < amount) {
      return { success: false, error: 'Insufficient credits', balance };
    }

    // Use FIFO: redeem oldest credits first
    const availableCredits = await Credit.find({
      parentId,
      status: 'available',
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: 1 });

    let remaining = amount;
    const redeemedIds = [];

    for (const credit of availableCredits) {
      if (remaining <= 0) break;

      const toRedeem = Math.min(credit.amount, remaining);
      remaining -= toRedeem;

      credit.status = 'redeemed';
      credit.redeemedFor = purpose;
      credit.redeemedAt = new Date();
      await credit.save();

      redeemedIds.push(credit._id);
    }

    // Create transaction record
    const transaction = await Transaction.create({
      parentId,
      type: 'credit_redemption',
      amount: -amount,
      method: 'credit',
      status: 'completed',
      reference: `CREDIT-${Date.now()}`,
    });

    return {
      success: true,
      redeemedAmount: amount - remaining,
      remainingBalance: await this.getBalance(parentId),
      purpose,
    };
  }

  /**
   * Handle a sick day — issue credit automatically
   * Called when parent picks up kid from school (sick)
   */
  async handleSickDayEarlyPickup(parentId, rideId, tripAmount) {
    return this.issueCredit({
      parentId,
      rideId,
      amount: tripAmount,  // Full trip value credited
      reason: 'early_pickup',
    });
  }

  /**
   * Handle school closure — issue credit to all affected parents
   */
  async handleSchoolClosure(schoolId, affectedRides) {
    const credits = [];
    for (const ride of affectedRides) {
      const credit = await this.issueCredit({
        parentId: ride.parentId,
        rideId: ride._id,
        amount: ride.totalPrice,
        reason: 'school_closure',
      });
      credits.push(credit);
    }
    return credits;
  }

  /**
   * Clean up expired credits
   */
  async expireOldCredits() {
    const result = await Credit.updateMany(
      { status: 'available', expiresAt: { $lt: new Date() } },
      { status: 'expired' }
    );
    console.log(`🧹 Expired ${result.modifiedCount} old credits`);
    return result;
  }
}

module.exports = new CreditService();
