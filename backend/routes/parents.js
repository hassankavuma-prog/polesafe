// PoleSafe — Parent Routes
// Booking, tracking, sick days, early pickups, credits

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { Child, Booking, Ride, Credit, School } = require('../database/schema');
const creditService = require('../services/creditService');
const fuelAdjustmentService = require('../services/fuelAdjustment');
const schoolPremiumService = require('../services/schoolPremium');

// All parent routes require auth + parent role
router.use(authMiddleware);
router.use(requireRole('parent'));

// ============================================================
// GET /api/parents/kids — List all kids for this parent
// ============================================================
router.get('/kids', async (req, res) => {
  try {
    const kids = await Child.find({ parentId: req.userId, isActive: true })
      .populate('schoolId', 'name')
      .lean();
    res.json({ kids });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/parents/kids — Add a child
// ============================================================
router.post('/kids', async (req, res) => {
  try {
    const { name, class: className, schoolId, age, finishTime, medical } = req.body;

    const child = await Child.create({
      parentId: req.userId,
      name,
      class: className,
      schoolId,
      age,
      finishTime,
      medical: medical || {},
      requiresCarSeat: age && age < 6,
    });

    res.status(201).json({ child });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/parents/book — Create a weekly/monthly/termly booking
// ============================================================
router.post('/book', async (req, res) => {
  try {
    const {
      childId, driverId, schoolId,
      type, daysOfWeek, pickupTime, dropoffTime,
      vehicleType, staggeredPickups, amountPerTrip, totalTrips,
    } = req.body;

    // Calculate total amount
    const totalAmount = amountPerTrip * totalTrips;

    // Apply fuel adjustment (hidden in total price)
    const fuelAdj = await fuelAdjustmentService.getCurrentMultiplier();

    // Apply school premium (hidden in total price)
    const premiumCalc = schoolPremiumService.calculatePremium({
      baseFare: amountPerTrip,
      distance: 5,  // Default distance — would be calculated from actual route
      distanceRate: 1000,
    });

    const finalAmount = Math.round(totalAmount * fuelAdj) + (premiumCalc.premiumAmount * totalTrips);

    const booking = await Booking.create({
      parentId: req.userId,
      childId,
      driverId,
      schoolId,
      type: type || 'weekly',
      daysOfWeek: daysOfWeek || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      pickupTime: pickupTime || '7:00 AM',
      dropoffTime: dropoffTime || '4:30 PM',
      vehicleType: vehicleType || 'car',
      staggeredPickups: staggeredPickups || [],
      amountPerTrip: finalAmount / totalTrips,
      totalTrips,
      totalAmount: finalAmount,
      completedTrips: 0,
      missedTrips: 0,
      startDate: new Date(),
      status: 'active',
    });

    res.status(201).json({
      booking,
      message: 'Booking confirmed! Check your rides for the schedule.',
      priceBreakdown: {
        total: finalAmount,
        trips: totalTrips,
        perTrip: Math.round(finalAmount / totalTrips),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/parents/rides — Get upcoming/past rides
// ============================================================
router.get('/rides', async (req, res) => {
  try {
    const { status, limit } = req.query;
    const filter = { parentId: req.userId };
    if (status) filter.status = status;

    const rides = await Ride.find(filter)
      .populate('childId', 'name photo schoolId')
      .populate('driverId', 'name phone')
      .sort({ scheduledPickupTime: -1 })
      .limit(parseInt(limit) || 20)
      .lean();

    res.json({ rides });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/parents/sick-day — Report kid sick and cancel ride
// ============================================================
router.post('/sick-day', async (req, res) => {
  try {
    const { childId, daysOff } = req.body;

    const child = await Child.findById(childId);
    if (!child || child.parentId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Not your child' });
    }

    // Find today's and upcoming rides for this child
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + (daysOff || 1));

    const affectedRides = await Ride.find({
      childId,
      scheduledPickupTime: { $gte: today, $lt: endDate },
      status: 'scheduled',
    });

    // Cancel rides and issue credits
    const credits = [];
    for (const ride of affectedRides) {
      ride.status = 'cancelled';
      ride.cancelledBy = 'parent';
      ride.cancellationReason = 'sick_day';
      ride.isSickDay = true;
      await ride.save();

      // Issue credit for this ride
      const credit = await creditService.issueCredit({
        parentId: req.userId,
        rideId: ride._id,
        amount: ride.totalPrice || 2000,
        reason: 'sick_day',
      });
      credits.push(credit);
    }

    // Update booking missed trips counter
    const booking = await Booking.findOne({
      parentId: req.userId,
      childId,
      status: 'active',
    });
    if (booking) {
      booking.missedTrips += affectedRides.length;
      await booking.save();
    }

    res.json({
      cancelledRides: affectedRides.length,
      creditsIssued: credits.reduce((sum, c) => sum + c.amount, 0),
      creditBalance: await creditService.getBalance(req.userId),
      message: `✅ ${child.name}'s rides cancelled. No charge. Sick days credited.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/parents/early-pickup — Parent picks up kid themselves
// ============================================================
router.post('/early-pickup', async (req, res) => {
  try {
    const { childId } = req.body;

    // Find today's afternoon ride
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const afternoonRide = await Ride.findOne({
      childId,
      type: 'school_afternoon',
      status: 'scheduled',
      scheduledPickupTime: { $gte: today, $lt: tomorrow },
    });

    if (!afternoonRide) {
      return res.status(404).json({ error: 'No afternoon ride found for today' });
    }

    // Cancel the ride
    afternoonRide.status = 'cancelled';
    afternoonRide.cancelledBy = 'parent';
    afternoonRide.cancellationReason = 'parent_early_pickup';
    afternoonRide.isEarlyPickup = true;
    await afternoonRide.save();

    // Issue credit
    const credit = await creditService.issueCredit({
      parentId: req.userId,
      rideId: afternoonRide._id,
      amount: afternoonRide.totalPrice || 2000,
      reason: 'early_pickup',
    });

    res.json({
      message: `✅ Afternoon ride cancelled. You're picking up yourself. Credit issued.`,
      creditAmount: credit.amount,
      creditBalance: await creditService.getBalance(req.userId),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/parents/credits — Get credit balance & history
// ============================================================
router.get('/credits', async (req, res) => {
  try {
    const balance = await creditService.getBalance(req.userId);
    const history = await creditService.getCreditHistory(req.userId);

    res.json({
      balance,
      history,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/parents/credits/redeem — Redeem credits
// ============================================================
router.post('/credits/redeem', async (req, res) => {
  try {
    const { amount, purpose } = req.body;

    const result = await creditService.redeemCredits(req.userId, amount, purpose);

    if (!result.success) {
      return res.status(400).json({ error: result.error, balance: result.balance });
    }

    res.json({
      message: `✅ ${result.redeemedAmount} UGX redeemed for ${purpose}`,
      remainingBalance: result.remainingBalance,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
