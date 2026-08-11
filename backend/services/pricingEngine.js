// PoleSafe — Smart Pricing Engine
// Designed to beat competitors through aggressive pricing + school subsidy model
// 
// PoleSafe Ride (ride-hailing):
//   Boda: 2,500 UGX min, 1,000 UGX/km, 80 UGX/min
//   Car:  3,500 UGX min, 1,500 UGX/km, 120 UGX/min
//
// PoleSafe School (kids):
//   Fixed weekly subscription (subsidizes ride-hailing prices)
//
// Time-of-day adjustments (predictable, capped):
//   Morning rush (6-9 AM):       +15%
//   Evening rush (5-8 PM):       +15%
//   Late night (10 PM-5 AM):     +20%
//   All other times:             Standard
//
// Weather adjustments (capped, honest):
//   Light rain:  +10%
//   Heavy rain:  +20% max

const config = require('../config');
const fuelAdjustment = require('./fuelAdjustment');

// ============================================================
// BASE RATES — Aggressive, designed to undercut all competitors
// ============================================================
const BASE_RATES = {
  boda: {
    minFare: 2500,        // 2,500 UGX (vs SafeBoda 3,000)
    perKm: 1000,          // 1,000 UGX/km
    perMin: 80,           // 80 UGX/min waiting
    commission: 0.10,     // 10% (vs Uber 23-28%, Bolt 15-20%)
  },
  car: {
    minFare: 3500,        // 3,500 UGX (vs Uber 4,000, SafeCar 10,000)
    perKm: 1500,          // 1,500 UGX/km (vs Uber ~1,800)
    perMin: 120,          // 120 UGX/min waiting
    commission: 0.12,     // 12% (vs Uber 23-28%)
  },
};

// ============================================================
// TIME-OF-DAY ADJUSTMENTS — Predictable, set in advance
// ============================================================
const TIME_ADJUSTMENTS = [
  { start: 6, end: 9,     label: 'morning_rush',   multiplier: 1.15 },
  { start: 17, end: 20,   label: 'evening_rush',   multiplier: 1.15 },
  { start: 22, end: 5,    label: 'late_night',     multiplier: 1.20 },
];

// ============================================================
// WEATHER ADJUSTMENTS — Capped, honest labeling
// ============================================================
const WEATHER_ADJUSTMENTS = {
  light_rain:  { multiplier: 1.10, label: 'Light rain adjustment' },
  heavy_rain:  { multiplier: 1.20, label: 'Heavy rain adjustment' },
};

class PricingEngine {
  /**
   * Get the current time-of-day multiplier
   */
  getTimeMultiplier() {
    const hour = new Date().getHours();
    for (const adj of TIME_ADJUSTMENTS) {
      if (adj.start <= adj.end) {
        // Normal range (e.g., 6-9)
        if (hour >= adj.start && hour < adj.end) return adj;
      } else {
        // Wraparound range (e.g., 22-5)
        if (hour >= adj.start || hour < adj.end) return adj;
      }
    }
    return { multiplier: 1.0, label: 'standard' };
  }

  /**
   * Get the weather multiplier
   * @param {string} weather - 'light_rain', 'heavy_rain', or null
   */
  getWeatherMultiplier(weather) {
    if (!weather || !WEATHER_ADJUSTMENTS[weather]) return null;
    return WEATHER_ADJUSTMENTS[weather];
  }

  /**
   * Round fare to nearest 500 UGX
   * Ugandans don't deal with small change
   */
  roundToNearest500(amount) {
    return Math.round(amount / 500) * 500;
  }

  /**
   * Calculate final fare for a ride
   * 
   * @param {string} vehicleType - 'boda' or 'car'
   * @param {number} distanceKm - Distance in kilometers
   * @param {number} durationMin - Estimated duration in minutes
   * @param {object} options
   * @param {string} options.weather - Optional weather condition
   * @param {boolean} options.schoolSubsidized - Is this subsidized by school revenue?
   * @returns {object} Full pricing breakdown
   */
  async calculateFare(vehicleType, distanceKm, durationMin, options = {}) {
    const rates = BASE_RATES[vehicleType];
    if (!rates) throw new Error(`Unknown vehicle type: ${vehicleType}`);

    // 1. Base fare (min fare or distance-based, whichever is higher)
    const distanceCharge = distanceKm * rates.perKm;
    const timeCharge = (durationMin || 0) * rates.perMin;
    const baseTotal = Math.max(rates.minFare, distanceCharge + timeCharge);

    // 2. Time-of-day adjustment
    const timeAdj = this.getTimeMultiplier();
    const withTimeAdjustment = Math.round(baseTotal * timeAdj.multiplier);

    // 3. Fuel adjustment (from existing engine, capped ±15%)
    let fuelMultiplier = 1.0;
    try {
      fuelMultiplier = await fuelAdjustment.getCurrentMultiplier();
    } catch {
      // Fallback to 1.0 if fuel lookup fails
    }
    const withFuelAdjustment = Math.round(withTimeAdjustment * fuelMultiplier);

    // 4. Weather adjustment (optional, capped)
    let weatherAdj = null;
    let withWeather = withFuelAdjustment;
    if (options.weather && WEATHER_ADJUSTMENTS[options.weather]) {
      weatherAdj = WEATHER_ADJUSTMENTS[options.weather];
      withWeather = Math.round(withWeather * weatherAdj.multiplier);
    }

    // 5. School subsidy discount (if applicable)
    let schoolDiscount = 0;
    let finalFare = withWeather;
    if (options.schoolSubsidized) {
      schoolDiscount = Math.round(withWeather * 0.10); // 10% discount funded by school revenue
      finalFare = withWeather - schoolDiscount;
    }

    // 6. Round to nearest 500 UGX
    finalFare = this.roundToNearest500(finalFare);

    // 7. Calculate commission
    const commissionAmount = Math.round(finalFare * rates.commission);
    const driverPayout = finalFare - commissionAmount;

    return {
      vehicleType,
      distanceKm,
      durationMin,
      
      // Final price the rider pays
      totalFare: finalFare,
      totalFareFormatted: `${finalFare.toLocaleString()} UGX`,
      
      // Breakdown
      breakdown: {
        baseFare: rates.minFare,
        distanceCharge: Math.round(distanceCharge),
        timeCharge: Math.round(timeCharge),
        timeAdjustment: {
          label: timeAdj.label,
          multiplier: timeAdj.multiplier,
          applied: withTimeAdjustment - baseTotal,
        },
        fuelAdjustment: {
          multiplier: fuelMultiplier,
          applied: withFuelAdjustment - withTimeAdjustment,
        },
        weatherAdjustment: weatherAdj ? {
          label: weatherAdj.label,
          multiplier: weatherAdj.multiplier,
          applied: withWeather - withFuelAdjustment,
        } : null,
        schoolDiscount: options.schoolSubsidized ? {
          label: 'PoleSafe School discount',
          percent: '10%',
          applied: schoolDiscount,
        } : null,
      },
      
      // Driver earnings
      driver: {
        commission: rates.commission,
        commissionAmount: Math.round(commissionAmount),
        payout: Math.round(driverPayout),
        payoutFormatted: `${Math.round(driverPayout).toLocaleString()} UGX`,
      },
      
      // Metadata
      pricingStrategy: options.schoolSubsidized ? 'subsidized' : 'standard',
    };
  }

  /**
   * Calculate school subscription price (weekly per kid)
   * School rides subsidize ride-hailing — they're higher margin
   * 
   * @param {number} distanceKm - One-way distance from home to school
   * @param {number} tripsPerDay - Usually 2 (to school + back)
   * @param {number} daysPerWeek - School days (usually 5)
   * @returns {object} Subscription pricing
   */
  calculateSchoolSubscription(distanceKm, tripsPerDay = 2, daysPerWeek = 5) {
    // School rate per km (lower than ride-hailing because it's predictable volume)
    const schoolPerKm = 1200; // 1,200 UGX/km (vs ride-hailing 1,500 UGX/km)
    const weeklyDistance = distanceKm * tripsPerDay * daysPerWeek;
    const weeklyBase = weeklyDistance * schoolPerKm;
    
    // Safety premium (safe word, seat belts, tracking, phone masking)
    const safetyPremium = Math.round(weeklyBase * 0.15); // 15% safety premium
    const weeklyTotal = weeklyBase + safetyPremium;
    
    // Monthly estimate (4 weeks)
    const monthlyTotal = weeklyTotal * 4;

    return {
      perTrip: Math.round(distanceKm * schoolPerKm),
      perTripFormatted: `${Math.round(distanceKm * schoolPerKm).toLocaleString()} UGX`,
      weeklyTotal: this.roundToNearest500(weeklyTotal),
      weeklyFormatted: `${this.roundToNearest500(weeklyTotal).toLocaleString()} UGX`,
      monthlyTotal: this.roundToNearest500(monthlyTotal),
      monthlyFormatted: `${this.roundToNearest500(monthlyTotal).toLocaleString()} UGX`,
      breakdown: {
        weeklyDistance,
        distanceRate: schoolPerKm,
        safetyPremium,
        safetyPremiumPercent: 15,
      },
    };
  }

  /**
   * Get competitor comparison for marketing
   */
  getCompetitorComparison() {
    // Average 5km trip comparison
    const polesafeBoda = this.roundToNearest500(BASE_RATES.boda.minFare + (5 * BASE_RATES.boda.perKm));
    const polesafeCar = this.roundToNearest500(BASE_RATES.car.minFare + (5 * BASE_RATES.car.perKm));

    return {
      average5kmTrip: {
        polesafeBoda: `${polesafeBoda.toLocaleString()} UGX`,
        polesafeCar: `${polesafeCar.toLocaleString()} UGX`,
        competitors: {
          safeBoda: '~7,500 UGX',
          safeCar: '~14,000 UGX',
          uber: '~8,000 UGX',
          bolt: '~7,500 UGX',
          faras: '~8,000 UGX',
        },
        savings: {
          vsSafeBoda: `${Math.round((1 - polesafeBoda / 7500) * 100)}%`,
          vsUber: `${Math.round((1 - polesafeCar / 8000) * 100)}%`,
          vsSafeCar: `${Math.round((1 - polesafeCar / 14000) * 100)}%`,
        },
      },
      commission: {
        polesafe: '10-12%',
        uber: '23-28%',
        bolt: '15-20%',
        safeBoda: '~15%',
        driverAdvantage: 'Drivers keep 88-90% of fare',
      },
      driverPayouts: {
        polesafe: 'Same-day MoMo',
        competitors: '3-7 days wait',
      },
    };
  }
}

module.exports = new PricingEngine();
