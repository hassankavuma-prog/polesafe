// PoleSafe — Dynamic Fuel Adjustment Engine
// Automatically adjusts trip prices when fuel prices change
// Capped at ±15% to protect parents and drivers

const config = require('../config');
const { FuelPrice } = require('../database/schema');

class FuelAdjustmentService {

  /**
   * Calculate the current fuel multiplier based on latest fuel price
   * multiplier = currentPrice / referencePrice, capped at ±15%
   */
  async getCurrentMultiplier() {
    try {
      // Get the most recent fuel price record
      const latestPrice = await FuelPrice.findOne()
        .sort({ recordedAt: -1 })
        .lean();

      const currentPrice = latestPrice ? latestPrice.pricePerLitre : config.FUEL.REFERENCE_PRICE;
      return this.calculateMultiplier(currentPrice);
    } catch (err) {
      // If DB lookup fails, use reference (no adjustment)
      console.warn('Fuel price lookup failed, using reference:', err.message);
      return 1.0;
    }
  }

  /**
   * Calculate multiplier from a given fuel price
   * Clamped between 0.85 and 1.15 (max ±15%)
   */
  calculateMultiplier(currentPrice) {
    const rawRatio = currentPrice / config.FUEL.REFERENCE_PRICE;
    const min = 1 - (config.FUEL.CAP_PERCENT / 100);  // 0.85
    const max = 1 + (config.FUEL.CAP_PERCENT / 100);  // 1.15
    return Math.min(Math.max(rawRatio, min), max);
  }

  /**
   * Calculate the adjusted price for a trip
   * 
   * @param {number} baseFare - Base fare in UGX
   * @param {number} distance - Distance in km
   * @param {number} distanceRate - UGX per km rate
   * @param {number} [multiplier] - Optional pre-calculated multiplier
   * @returns {object} Pricing breakdown
   */
  async calculateTripPrice(baseFare, distance, distanceRate, multiplier) {
    if (!multiplier) {
      multiplier = await this.getCurrentMultiplier();
    }

    const baseTotal = baseFare + (distance * distanceRate);
    const adjustedTotal = Math.round(baseTotal * multiplier);
    const adjustmentPercent = Math.round((multiplier - 1) * 100);

    return {
      baseTotal,
      fuelMultiplier: multiplier,
      adjustmentPercent,      // e.g., 10 for +10%, -5 for -5%
      adjustedTotal,
      parentSees: `${adjustedTotal} UGX`,  // Parent just sees the total
      breakdown: {             // Internal only — not shown to parent
        baseFare,
        distanceCharge: distance * distanceRate,
        fuelAdjustment: adjustedTotal - baseTotal,
      }
    };
  }

  /**
   * Record a new fuel price from Energy Ministry data
   */
  async recordFuelPrice(pricePerLitre, source = 'Energy Ministry') {
    const record = await FuelPrice.create({
      pricePerLitre,
      source,
    });

    console.log(`⛽ Fuel price updated: ${pricePerLitre} UGX/L (multiplier: ${this.calculateMultiplier(pricePerLitre)})`);
    return record;
  }
}

module.exports = new FuelAdjustmentService();
