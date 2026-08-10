// PoleSafe — Ride Routes
// Handles ride-hailing, tracking, and ride management
// Covers both PoleSafe School rides and PoleSafe Ride (on-demand)

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { Ride, User, Vehicle } = require('../database/schema');
const fuelAdjustmentService = require('../services/fuelAdjustment');
const schoolPremiumService = require('../services/schoolPremium');
const mapsService = require('../services/mapsService');
const cancellationService = require('../services/cancellationService');

// ============================================================
// GET /api/rides/drivers — Find available drivers for ride-hailing
// ============================================================
router.get('/drivers', authMiddleware, async (req, res) => {
  try {
    const { vehicleType, lat, lng } = req.query;
    const filter = { isApproved: true };
    if (vehicleType) filter.type = vehicleType;

    const vehicles = await Vehicle.find(filter).populate('driverId', 'name phone rating');
    const drivers = vehicles
      .filter(v => v.driverId)
      .map(v => ({
        _id: v.driverId._id,
        name: v.driverId.name,
        phone: v.driverId.phone,
        rating: v.driverId.rating || 4.5,
        vehicleType: v.type,
        registrationNumber: v.registrationNumber,
        capacity: v.capacity,
        hasCarSeat: v.hasCarSeat,
        isWheelchairAccessible: v.isWheelchairAccessible,
        distance: Math.round((Math.random() * 3 + 0.5) * 10) / 10,
      }));

    res.json({ drivers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/rides/request — Request a ride-hailing trip
// (PoleSafe Ride mode — on-demand)
// ============================================================
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { pickupLat, pickupLng, dropoffLat, dropoffLng, vehicleType } = req.body;

    // Calculate distance — Google Maps if available, else haversine fallback
    let distance;
    let durationMin;
    let matrixResult = null;

    if (mapsService.apiKey) {
      matrixResult = await mapsService.getDistanceMatrix(
        [{ lat: pickupLat, lng: pickupLng }],
        [{ lat: dropoffLat, lng: dropoffLng }]
      );
      if (matrixResult) {
        distance = matrixResult.distanceKm;
        durationMin = matrixResult.durationMin;
      } else {
        distance = calculateDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
      }
    } else {
      distance = calculateDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
    }

    // Find nearest available driver
    const Vehicle_model = Vehicle;
    const availableVehicles = await Vehicle_model.find({
      type: vehicleType || 'boda',
      isApproved: true,
    }).populate('driverId').lean();

    // Filter drivers who are online and nearby
    const nearbyDrivers = availableVehicles.filter(v => {
      if (!v.driverId?.location?.coordinates) return false;
      const driverDist = calculateDistance(
        pickupLat, pickupLng,
        v.driverId.location.coordinates[1],
        v.driverId.location.coordinates[0]
      );
      return driverDist <= 3; // Within 3km
    });

    if (nearbyDrivers.length === 0) {
      return res.status(404).json({ error: 'No drivers available nearby. Try again in a few minutes.' });
    }

    // Pick closest driver
    nearbyDrivers.sort((a, b) => {
      const distA = calculateDistance(pickupLat, pickupLng, a.driverId.location.coordinates[1], a.driverId.location.coordinates[0]);
      const distB = calculateDistance(pickupLat, pickupLng, b.driverId.location.coordinates[1], b.driverId.location.coordinates[0]);
      return distA - distB;
    });

    const assignedDriver = nearbyDrivers[0];

    // Calculate price
    const config = require('../config');
    const isBoda = (vehicleType || 'boda') === 'boda';
    const baseFare = isBoda ? config.RIDE_HAILING.BODA_BASE_FARE : config.RIDE_HAILING.BASE_FARE;
    const perKm = isBoda ? config.RIDE_HAILING.BODA_PER_KM : config.RIDE_HAILING.PER_KM_RATE;

    const fuelCalc = await fuelAdjustmentService.calculateTripPrice(baseFare, distance, perKm);
    const commission = fuelCalc.adjustedTotal * config.COMMISSION.RIDE_HAILING;

    // Create ride
    const ride = await Ride.create({
      childId: req.body.childId || null,
      driverId: assignedDriver.driverId._id,
      parentId: req.userId,
      type: 'ride_hailing',
      isRideHailing: true,
      passengerName: req.user.name,
      pickupLocation: {
        type: 'Point',
        coordinates: [pickupLng, pickupLat],
        address: req.body.pickupAddress || '',
      },
      dropoffLocation: {
        type: 'Point',
        coordinates: [dropoffLng, dropoffLat],
        address: req.body.dropoffAddress || '',
      },
      distanceKm: Math.round(distance * 10) / 10,
      baseFare,
      fuelMultiplier: fuelCalc.fuelMultiplier,
      totalPrice: fuelCalc.adjustedTotal,
      driverPayout: Math.round(fuelCalc.adjustedTotal - commission),
      poleSafeCommission: Math.round(commission),
      status: 'scheduled',
      estimatedDurationMin: durationMin || null,
    });

    res.status(201).json({
      ride,
      driver: {
        name: assignedDriver.driverId.name,
        phone: assignedDriver.driverId.phone,
        vehicleType: assignedDriver.type,
        rating: assignedDriver.driverId.rating || 4.5,
        etaMinutes: Math.round(durationMin || calculateDistance(pickupLat, pickupLng, assignedDriver.driverId.location.coordinates[1], assignedDriver.driverId.location.coordinates[0]) * 12),
      },
      price: {
        total: fuelCalc.adjustedTotal,
        distance: `${distance.toFixed(1)} km`,
        perKm: `${perKm} UGX/km`,
        ...(matrixResult ? { duration: matrixResult.durationText } : {}),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/rides/:id/track — Get ride tracking info
// ============================================================
router.get('/:id/track', authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('driverId', 'name phone location')
      .populate('childId', 'name photo')
      .lean();

    if (!ride) return res.status(404).json({ error: 'Ride not found' });

    // Verify access
    const isParent = ride.parentId?.toString() === req.userId?.toString();
    const isDriver = ride.driverId?._id?.toString() === req.userId?.toString();
    if (!isParent && !isDriver && req.userRole !== 'polesafe_admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      ride: {
        id: ride._id,
        status: ride.status,
        type: ride.type,
        isSickDay: ride.isSickDay,
        scheduledPickupTime: ride.scheduledPickupTime,
        actualPickupTime: ride.actualPickupTime,
        actualDropoffTime: ride.actualDropoffTime,
      },
      driver: ride.driverId ? {
        name: ride.driverId.name,
        phone: ride.driverId.phone,
        location: ride.driverId.location?.coordinates,
      } : null,
      child: ride.childId ? {
        name: ride.childId.name,
        photo: ride.childId.photo,
      } : null,
      lastLocation: ride.trackingLog?.length > 0
        ? ride.trackingLog[ride.trackingLog.length - 1]
        : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/rides/:id/cancel — Cancel a ride with time-based fines
// ============================================================
router.post('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });

    // Apply cancellation policy — determines if fee applies
    const result = await cancellationService.applyFee({
      ride,
      parentId: ride.parentId,
      reason: reason || 'user_requested',
    });

    ride.status = 'cancelled';
    ride.cancelledBy = req.userRole;
    ride.cancellationReason = reason || 'user_requested';
    ride.cancelledAt = new Date();
    await ride.save();

    res.json({
      message: result.message,
      free: result.evaluation.free,
      feeAmount: result.feeAmount,
      tier: result.evaluation.tier,
      hoursUntilPickup: result.evaluation.hoursUntilPickup,
      ride,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/rides/school/create — Create school ride (from booking)
// Called when a weekly booking generates individual rides
// ============================================================
router.post('/school/create', authMiddleware, requireRole('polesafe_admin'), async (req, res) => {
  try {
    const { bookingId, childId, driverId, parentId, schoolId, type, pickupTime, dropoffTime } = req.body;

    const config = require('../config');
    const fuelCalc = await fuelAdjustmentService.getCurrentMultiplier();
    const baseFare = config.RIDE_HAILING.BASE_FARE;
    const distance = 5; // Default — would be calculated from actual route

    const premiumCalc = schoolPremiumService.calculatePremium({
      baseFare,
      distance,
      distanceRate: config.RIDE_HAILING.PER_KM_RATE,
    });

    const totalPrice = premiumCalc.totalWithPremium;
    const payoutCalc = schoolPremiumService.calculateDriverPayout(premiumCalc.totalWithPremium);
    const schoolCommission = schoolPremiumService.calculateSchoolCommission(totalPrice);

    const ride = await Ride.create({
      bookingId,
      childId,
      driverId,
      parentId,
      schoolId,
      type: type || 'school_morning',
      scheduledPickupTime: new Date(pickupTime),
      scheduledDropoffTime: dropoffTime ? new Date(dropoffTime) : null,
      baseFare,
      distanceKm: distance,
      fuelMultiplier: fuelCalc,
      schoolPremium: premiumCalc.premiumAmount,
      totalPrice,
      driverPayout: payoutCalc.driverPayout,
      poleSafeCommission: payoutCalc.poleSafeCommission,
      schoolCommission,
      status: 'scheduled',
    });

    res.status(201).json({ ride });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/rides/history — Get ride history for current user
// ============================================================
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { limit, status, type } = req.query;
    const filter = {};

    // Filter based on role
    if (req.userRole === 'parent') filter.parentId = req.userId;
    else if (req.userRole === 'driver') filter.driverId = req.userId;
    else if (req.userRole === 'school_admin') filter.schoolId = req.query.schoolId;

    if (status) filter.status = status;
    if (type) filter.type = type;

    const rides = await Ride.find(filter)
      .populate('childId', 'name')
      .populate('driverId', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) || 20)
      .lean();

    res.json({ rides });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// UTILITY: Haversine distance calculator
// ============================================================
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

// ============================================================
// GET /api/tracking/:rideId/location — Get latest location for tracking
// ============================================================
router.get('/location/:rideId', authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId).select('trackingLog status');
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    const lastLocation = ride.trackingLog?.length > 0 ? ride.trackingLog[ride.trackingLog.length - 1] : null;
    res.json({
      rideId: req.params.rideId,
      status: ride.status,
      location: lastLocation,
      timestamp: lastLocation?.timestamp,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
