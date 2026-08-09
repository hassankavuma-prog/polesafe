// PoleSafe — Rating & Review Service
// Parents rate drivers, drivers rate kids/parents
// Builds trust in the system

const { Ride, User } = require('../database/schema');
const notificationService = require('./notificationService');

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

    const ride = await Ride.findOne({ _id: rideId, parentId }).populate('driverId');
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
    const ride = await Ride.findOne({ _id: rideId, driverId }).populate('childId');
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
    const ride = await Ride.findById(rideId);
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
}

module.exports = new RatingService();
