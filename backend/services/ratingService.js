// PoleSafe — Rating & Review Service
// Parents rate drivers, drivers rate kids/parents
// Builds trust in the system

const { Ride, User } = require('../database/schema');
const { z } = require('zod');
const notificationService = require('./notificationService');
const { validateTenantScopedQuery } = require('../../lib/engine/hamnah-core.ts');

class RatingService {

  /**
   * Parent rates a driver after a ride
   * 
   * @param {object} params
   * @param {string} params.rideId
   * @param {string} params.parentId
   * @param {number} params.rating - 1-5 stars
   * @param {string} params.comment - Optional review text
   * @returns {object} Updated ride with rating
   */
  async rateDriver({ rideId, parentId, rating, comment }) {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const rideSchema = z.object({ rideId: z.string().min(1), parentId: z.string().min(1) }).strict();
    const rideScope = validateTenantScopedQuery(rideSchema, { rideId, parentId }, parentId, ['rating:driver']);
    const ride = await Ride.findOne({ _id: rideScope.tenantScopedQuery.rideId, parentId: rideScope.tenantScopedQuery.parentId }).populate('driverId');
    if (!ride) throw new Error('Ride not found');

    if (ride.parentRating) {
      throw new Error('You have already rated this ride');
    }

    ride.parentRating = rating;
    ride.parentComment = comment || '';
    ride.updatedAt = new Date();
    await ride.save();

    // Update driver's average rating
    const allDriverRides = await Ride.find({
      driverId: ride.driverId._id,
      parentRating: { $exists: true },
    });

    const avgRating = allDriverRides.reduce((s, r) => s + (r.parentRating || 0), 0) / allDriverRides.length;
    const roundedAvg = Math.round(avgRating * 10) / 10;

    // Notify driver
    await notificationService.send({
      userId: ride.driverId._id,
      phone: ride.driverId.phone,
      preferredChannel: 'sms',
      template: 'default',
      data: {
        message: `⭐ New rating: ${rating}/5\n\n${comment ? `"${comment}"` : ''}\nYour average: ${roundedAvg}/5\n\nKeep up the great work! -PoleSafe`,
      },
      type: 'alert',
    });

    return {
      rideId,
      rating,
      comment,
      driverAverage: roundedAvg,
      totalRatings: allDriverRides.length,
    };
  }

  /**
   * Driver rates a kid/parent after a ride
   */
  async rateKid({ rideId, driverId, kidBehavior, comment }) {
    const rideSchema = z.object({ rideId: z.string().min(1), driverId: z.string().min(1) }).strict();
    const rideScope = validateTenantScopedQuery(rideSchema, { rideId, driverId }, driverId, ['rating:kid']);
    const ride = await Ride.findOne({ _id: rideScope.tenantScopedQuery.rideId, driverId: rideScope.tenantScopedQuery.driverId }).populate('childId');
    if (!ride) throw new Error('Ride not found');

    ride.driverKidRating = kidBehavior; // 'good' | 'okay' | 'difficult'
    ride.driverComment = comment || '';
    ride.updatedAt = new Date();
    await ride.save();

    return {
      rideId,
      kidName: ride.childId?.name || 'Unknown',
      kidBehavior,
      rated: true,
    };
  }

  /**
   * Get a driver's rating summary
   */
  async getDriverRating(driverId) {
    const rides = await Ride.find({
      driverId,
      parentRating: { $exists: true },
    }).lean();

    if (rides.length === 0) {
      return { driverId, average: null, total: 0 };
    }

    const average = rides.reduce((s, r) => s + r.parentRating, 0) / rides.length;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    rides.forEach(r => { if (distribution[r.parentRating] !== undefined) distribution[r.parentRating]++; });

    return {
      driverId,
      average: Math.round(average * 10) / 10,
      total: rides.length,
      distribution,
      recentComments: rides.filter(r => r.parentComment).slice(-5).map(r => ({
        rating: r.parentRating,
        comment: r.parentComment,
        date: r.updatedAt,
      })),
    };
  }

  /**
   * Get recent reviews for a driver (shown to parents before booking)
   */
  async getDriverReviews(driverId) {
    const rides = await Ride.find({
      driverId,
      parentRating: { $exists: true },
      parentComment: { $exists: true, $ne: '' },
    })
      .populate('childId', 'name')
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    return rides.map(r => ({
      rating: r.parentRating,
      comment: r.parentComment,
      kidName: r.childId?.name || 'A parent',
      date: r.updatedAt,
    }));
  }

  /**
   * Flag a ride for review (dispute)
   */
  async flagRide({ rideId, userId, reason }) {
    const rideSchema = z.object({ rideId: z.string().min(1) }).strict();
    const rideScope = validateTenantScopedQuery(rideSchema, { rideId }, userId, ['rating:flag']);
    const ride = await Ride.findById(rideScope.tenantScopedQuery.rideId);
    if (!ride) throw new Error('Ride not found');

    ride.flagged = true;
    ride.flagReason = reason;
    ride.flaggedBy = userId;
    ride.updatedAt = new Date();
    await ride.save();

    return {
      flagged: true,
      rideId,
      reason,
      message: 'Report submitted. PoleSafe will review within 24 hours.',
    };
  }

  // ============================================================
  // Phase 12: Safety Checks
  // ============================================================

  /**
   * Submit safety checks for a completed ride
   */
  async submitSafetyChecks({ rideId, parentId, checks }) {
    const rideSchema = z.object({ rideId: z.string().min(1), parentId: z.string().min(1) }).strict();
    const rideScope = validateTenantScopedQuery(rideSchema, { rideId, parentId }, parentId, ['rating:safety']);
    const ride = await Ride.findOne({ _id: rideScope.tenantScopedQuery.rideId, parentId: rideScope.tenantScopedQuery.parentId });
    if (!ride) throw new Error('Ride not found');

    ride.safetyChecks = {
      helmetProvided: checks.helmetProvided ?? null,
      pinVerified: checks.pinVerified ?? null,
      safeSpeed: checks.safeSpeed ?? null,
      politeRide: checks.politeRide ?? null,
      onTimePickup: checks.onTimePickup ?? null,
    };
    ride.safetyReviewSubmitted = true;
    ride.safetyReviewSubmittedAt = new Date();
    ride.updatedAt = new Date();
    await ride.save();

    return {
      rideId,
      safetyChecks: ride.safetyChecks,
      submitted: true,
    };
  }

  // ============================================================
  // Phase 12: Tip Processing
  // ============================================================

  /**
   * Process a tip for a driver after a ride
   */
  async processTip({ rideId, parentId, amount, method }) {
    if (amount < 0) throw new Error('Tip amount cannot be negative');
    if (amount <= 0) {
      return { rideId, tipped: false, amount: 0, message: 'No tip selected' };
    }

    const rideSchema = z.object({ rideId: z.string().min(1), parentId: z.string().min(1) }).strict();
    const rideScope = validateTenantScopedQuery(rideSchema, { rideId, parentId }, parentId, ['rating:tip']);
    const ride = await Ride.findOne({ _id: rideScope.tenantScopedQuery.rideId, parentId: rideScope.tenantScopedQuery.parentId }).populate('driverId');
    if (!ride) throw new Error('Ride not found');

    ride.tipAmount = amount;
    ride.tipCurrency = 'UGX';
    ride.tipMethod = method || 'mobile_money';
    ride.tipProcessed = true;
    ride.tipProcessedAt = new Date();
    ride.updatedAt = new Date();
    await ride.save();

    // Add tip to driver's earnings
    if (ride.driverId) {
      const driver = await User.findById(ride.driverId._id);
      if (driver) {
        driver.earningsBalance = (driver.earningsBalance || 0) + amount;
        driver.lifetimeEarnings = (driver.lifetimeEarnings || 0) + amount;
        await driver.save();
      }
    }

    // Notify driver about tip
    await notificationService.send({
      userId: ride.driverId._id,
      phone: ride.driverId.phone,
      preferredChannel: 'whatsapp',
      template: 'default',
      data: {
        message: `💝 You received a tip of UGX ${amount.toLocaleString()}!\n\nGreat service appreciated! -PoleSafe`,
      },
      type: 'alert',
    });

    return {
      rideId,
      tipped: true,
      amount,
      method: ride.tipMethod,
      message: `Tip of UGX ${amount.toLocaleString()} sent to driver.`,
    };
  }

  // ============================================================
  // Phase 12: Favorite Drivers
  // ============================================================

  /**
   * Toggle a driver as favorite for a parent
   */
  async toggleFavoriteDriver({ parentId, driverId }) {
    const { FavoriteDriver } = require('../database/schema');
    const existing = await FavoriteDriver.findOne({ parentId, driverId });

    if (existing) {
      await existing.deleteOne();
      return { parentId, driverId, favorited: false };
    }

    await FavoriteDriver.create({ parentId, driverId });
    return { parentId, driverId, favorited: true };
  }

  /**
   * Get all favorite drivers for a parent
   */
  async getFavoriteDrivers(parentId) {
    const { FavoriteDriver } = require('../database/schema');
    const favorites = await FavoriteDriver.find({ parentId })
      .populate('driverId', 'name phone driverIdNumber driverPhotoUrl rating');
    return favorites.map(f => ({
      driverId: f.driverId._id,
      name: f.driverId.name,
      phone: f.driverId.phone,
      driverIdNumber: f.driverId.driverIdNumber,
      photoUrl: f.driverId.driverPhotoUrl,
      addedAt: f.createdAt,
    }));
  }

  /**
   * Check if a driver is a favorite for a parent
   */
  async isFavoriteDriver(parentId, driverId) {
    const { FavoriteDriver } = require('../database/schema');
    const existing = await FavoriteDriver.findOne({ parentId, driverId });
    return !!existing;
  }

  // ============================================================
  // Phase 12: Auto-flag low ratings
  // ============================================================

  /**
   * Auto-flag rides with 1-2 star ratings for safety team review
   * Called automatically after rateDriver if rating <= 2
   */
  async autoFlagLowRating(rideId, rating) {
    if (rating > 2) return null;

    const ride = await Ride.findById(rideId).populate('driverId childId');
    if (!ride) return null;

    ride.flagged = true;
    ride.flagReason = rating === 1
      ? `Auto-flagged: Parent reported unsafe experience (1 star). Safety team review required.`
      : `Auto-flagged: Parent reported issues (2 stars). Safety team review recommended.`;
    ride.flaggedBy = ride.parentId;
    ride.updatedAt = new Date();
    await ride.save();

    return {
      flagged: true,
      rideId,
      rating,
      reason: ride.flagReason,
      message: 'Ride flagged for safety team review. We will investigate within 24 hours.',
    };
  }
}

module.exports = new RatingService();
