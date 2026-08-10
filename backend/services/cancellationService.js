// PoleSafe — Cancellation Policy Service (Parent-Friendly)
// Modeled on Uber's approach: small flat fees, long free windows, grace period
// "We don't want to lose customers" — Hassan

const config = require('../config');
const { CANCELLATION } = config;

class CancellationService {

  /**
   * Evaluate cancellation cost — parent-friendly pricing
   *
   * Uber rules:
   * - Free cancellation with reasonable notice (>30 min for school, >5 min for ride)
   * - Small flat fees (NOT percentages) for abrupt cancels
   * - First-time grace period: first abrupt cancel per term is FREE
   * - No-show: driver's time is compensated but not full trip price
   *
   * @param {object} opts
   * @param {Date}   opts.scheduledPickupTime
   * @param {number} opts.totalPrice          - trip price (used for info, not for fee calc)
   * @param {string} opts.reason              - sick_day | parent_early_pickup | user_cancelled
   * @param {number} opts.abruptCountThisTerm - how many abrupt cancels parent has had this term
   * @returns {{ free: boolean, feeAmount: number, tier: string, explanation: string }}
   */
  evaluate({ scheduledPickupTime, totalPrice, reason, abruptCountThisTerm = 0 }) {
    // Sick days → always free
    if (reason === 'sick_day') {
      return {
        free: true,
        feeAmount: 0,
        tier: 'free_sick_day',
        explanation: '✅ Sick days are free. No charge.',
      };
    }

    // Early pickup (parent fetching kid) → always free
    if (reason === 'parent_early_pickup') {
      return {
        free: true,
        feeAmount: 0,
        tier: 'free_early_pickup',
        explanation: '✅ You\'re picking up yourself. No charge.',
      };
    }

    const now = new Date();
    const pickup = new Date(scheduledPickupTime);
    const minutesUntilPickup = (pickup.getTime() - now.getTime()) / (1000 * 60);

    // ============================================================
    // FREE ZONES
    // ============================================================

    // More than 1 hour before → free (Uber: free any time before driver arrives)
    if (minutesUntilPickup >= 60) {
      return {
        free: true,
        feeAmount: 0,
        tier: 'free_advance',
        explanation: '✅ Plenty of notice — free cancellation.',
        minutesUntilPickup: Math.round(minutesUntilPickup),
      };
    }

    // 15-60 min before → free (first-time grace per term)
    if (minutesUntilPickup >= 15 && abruptCountThisTerm === 0) {
      return {
        free: true,
        feeAmount: 0,
        tier: 'free_first_time',
        explanation: '✅ First abrupt cancellation this term — free. Next time a small fee may apply.',
        minutesUntilPickup: Math.round(minutesUntilPickup),
      };
    }

    // ============================================================
    // FEE ZONES — small flat fees, NOT percentages
    // ============================================================

    // 15-60 min before (after first grace)
    if (minutesUntilPickup >= 15) {
      return {
        free: false,
        feeAmount: CANCELLATION.FLAT_LATE_CANCEL,
        tier: 'late_cancel',
        explanation: `⚠️ Short-notice cancellation. Small fee of ${CANCELLATION.FLAT_LATE_CANCEL.toLocaleString()} UGX to cover the driver's time (like Uber).`,
        minutesUntilPickup: Math.round(minutesUntilPickup),
      };
    }

    // Less than 15 min before pickup — driver is likely en route or waiting
    if (minutesUntilPickup >= 0) {
      return {
        free: false,
        feeAmount: CANCELLATION.FLAT_LAST_MINUTE,
        tier: 'last_minute',
        explanation: `⚠️ Last-minute cancellation. Fee of ${CANCELLATION.FLAT_LAST_MINUTE.toLocaleString()} UGX (driver was already on the way).`,
        minutesUntilPickup: Math.round(minutesUntilPickup),
      };
    }

    // Past pickup time → no-show (driver waited)
    const waitMinutes = Math.abs(Math.round(minutesUntilPickup));
    const maxWait = 5;       // Driver waits 5 min like Uber
    const isNoShow = waitMinutes >= maxWait;

    if (isNoShow) {
      return {
        free: false,
        feeAmount: CANCELLATION.FLAT_NO_SHOW,
        tier: 'no_show',
        explanation: `⚠️ Driver waited ${waitMinutes} min — no-show fee of ${CANCELLATION.FLAT_NO_SHOW.toLocaleString()} UGX. Next time, cancel at least 30 min before if plans change.`,
        minutesSincePickup: waitMinutes,
      };
    }

    // Driver is waiting but still within grace period
    return {
      free: true,
      feeAmount: 0,
      tier: 'free_grace',
      explanation: `✅ Driver is waiting but you're still within the grace period. No charge.`,
      minutesSincePickup: waitMinutes,
    };
  }

  /**
   * Apply fee and record penalty
   *
   * @param {object} opts
   * @param {object} opts.ride
   * @param {string} opts.parentId
   * @param {string} opts.reason
   * @param {number} opts.abruptCountThisTerm
   * @returns {{ applied: boolean, feeAmount: number, evaluation, message }}
   */
  async applyFee({ ride, parentId, reason, abruptCountThisTerm = 0 }) {
    const evaluation = this.evaluate({
      scheduledPickupTime: ride.scheduledPickupTime,
      totalPrice: ride.totalPrice || 5000,
      reason,
      abruptCountThisTerm,
    });

    if (evaluation.free) {
      return { applied: false, feeAmount: 0, evaluation, message: evaluation.explanation };
    }

    // Record the penalty as a negative credit
    const { Credit } = require('../database/schema');
    const penaltyExpiry = new Date();
    penaltyExpiry.setFullYear(penaltyExpiry.getFullYear() + 1);

    await Credit.create({
      parentId,
      rideId: ride._id,
      amount: -evaluation.feeAmount,
      reason: `cancel_fee_${evaluation.tier}`,
      status: 'penalty',
      expiresAt: penaltyExpiry,
    });

    console.log(
      `💸 Cancel fee: ${evaluation.feeAmount} UGX (${evaluation.tier}) ride ${ride._id}`
    );

    return {
      applied: true,
      feeAmount: evaluation.feeAmount,
      evaluation,
      message: evaluation.explanation,
    };
  }

  /**
   * Preview: show what it would cost BEFORE confirming
   * This is the "Uber popup" — "If you cancel now, X UGX fee"
   */
  preview({ scheduledPickupTime, totalPrice, reason, abruptCountThisTerm = 0 }) {
    const ev = this.evaluate({ scheduledPickupTime, totalPrice, reason, abruptCountThisTerm });

    if (ev.free) {
      return {
        willCharge: false,
        fee: 0,
        message: ev.explanation,
        confirmLabel: 'Cancel ride — Free',
      };
    }

    return {
      willCharge: true,
      fee: ev.feeAmount,
      message: ev.explanation,
      confirmLabel: `Cancel & pay ${ev.feeAmount.toLocaleString()} UGX fee`,
      note: 'Small fee covers the driver. Free if cancelled more than 1h before pickup.',
    };
  }

  /**
   * Quick fee breakdown for display
   */
  getPolicySummary() {
    return {
      freeUpToMinutes: 60,
      lateCancelFee: CANCELLATION.FLAT_LATE_CANCEL,
      lastMinuteFee: CANCELLATION.FLAT_LAST_MINUTE,
      noShowFee: CANCELLATION.FLAT_NO_SHOW,
      firstCancelFree: true,
      note: 'Free cancellations up to 1 hour before pickup. Flat fees (not percentages). First abrupt cancel per term is free.',
    };
  }
}

module.exports = new CancellationService();
