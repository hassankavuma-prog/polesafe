// PoleSafe — School Premium Service
// Small invisible premium on school rides that pays drivers more
// Parents see one total price — no breakdown of the premium

const config = require('../config');

class SchoolPremiumService {

  /**
   * Calculate school premium for a trip
   * Premium is SMALL (500 UGX) — just a modest bump
   * 
   * @param {object} trip - { baseFare, distance, distanceRate }
   * @returns {object} Premium breakdown (internal use only)
   */
  calculatePremium(trip) {
    const { baseFare, distance, distanceRate } = trip;
    const baseTotal = baseFare + (distance * distanceRate);
    
    return {
      premiumAmount: config.SCHOOL_PREMIUM.AMOUNT_PER_TRIP,  // 500 UGX
      driverExtra: config.SCHOOL_PREMIUM.DRIVER_SHARE,       // 400 UGX (80%)
      poleSafeExtra: config.SCHOOL_PREMIUM.POLESAFE_SHARE,   // 100 UGX (20%)
      visibleToParent: config.SCHOOL_PREMIUM.VISIBLE_TO_PARENT, // false
      totalWithPremium: baseTotal + config.SCHOOL_PREMIUM.AMOUNT_PER_TRIP,
      parentSees: `${baseTotal + config.SCHOOL_PREMIUM.AMOUNT_PER_TRIP} UGX`,
    };
  }

  /**
   * Calculate driver payout including school premium
   * 
   * @param {number} totalPrice - Trip total after fuel + premium adjustments
   * @returns {object} Payout breakdown
   */
  calculateDriverPayout(totalPrice) {
    const commission = totalPrice * config.COMMISSION.SCHOOL_RIDE;
    const driverPayout = totalPrice - commission;

    return {
      totalPrice,
      poleSafeCommission: Math.round(commission),
      driverPayout: Math.round(driverPayout),
    };
  }

  /**
   * Calculate school affiliate commission (5% goes to school PTA)
   * 
   * @param {number} totalPrice 
   * @returns {number} Commission for the school
   */
  calculateSchoolCommission(totalPrice) {
    return Math.round(totalPrice * 0.05);  // 5% to school
  }
}

module.exports = new SchoolPremiumService();
