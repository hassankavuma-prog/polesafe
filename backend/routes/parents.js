// PoleSafe — Parent Routes
// Booking, tracking, sick days, early pickups, credits

const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { Child, Booking, Ride, Credit, School } = require('../database/schema');
const { validateTenantScopedQuery } = require('../../lib/engine/hamnah-core');
const creditService = require('../services/creditService');
const fuelAdjustmentService = require('../services/fuelAdjustment');
const schoolPremiumService = require('../services/schoolPremium');
const {
  validateAddKid,
  validateBooking,
  validateSickDay,
  validateEmergencyPickup,
} = require('../middleware/validation');

// All parent routes require auth + parent role
router.use(authMiddleware);
router.use(requireRole('parent'));

// ============================================================
// GET /api/parents/kids — List all kids for this parent
// ============================================================
router.get('/kids', async (req, res) => {
  try {
    const kids = await Child.find({ parentId: req.userId || req.user?._id, isActive: true })
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
router.post('/kids', validateAddKid, async (req, res) => {
  try {
    const { name, class: className, schoolId, age, finishTime, medical, safeWordPhoto } = req.body;

    const child = await Child.create({
      parentId: req.userId,
      name,
      class: className,
      schoolId,
      age,
      finishTime,
      medical: medical || {},
      safeWordPhoto: safeWordPhoto || undefined,
      requiresCarSeat: age && age < 6,
      status: 'pending', // Needs school approval
      registeredBy: 'parent',
    });

    // Notify school admins about the new child
    const schoolSchema = z.object({ schoolId: z.string().min(1) }).strict();
    const schoolScope = validateTenantScopedQuery(schoolSchema, { schoolId }, req.userId, ['parent:child-create']);
    const school = await School.findById(schoolScope.tenantScopedQuery.schoolId);
    let schoolNotified = false;
    if (school && school.adminIds.length > 0) {
      schoolNotified = true;
      // Log for now — actual SMS/notification would go here
      console.log(`📢 NOTIFY SCHOOL: New child "${name}" registered by parent. School: ${school.name}`);
    }

    res.status(201).json({ 
      child, 
      message: `${name} has been submitted to ${school?.name || 'the school'} for approval. You'll be notified once approved.`,
      pendingApproval: true,
      schoolNotified,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/parents/book — Create a weekly/monthly/termly booking
// ============================================================
router.post('/book', validateBooking, async (req, res) => {
  try {
    const {
      childId, driverId, schoolId,
      type, daysOfWeek, days, pickupTime, dropoffTime,
      vehicleType, staggeredPickups, amountPerTrip, totalTrips,
    } = req.body;

    // Accept both `days` and `daysOfWeek` for compatibility with mobile app
    const daysOfWeekFinal = daysOfWeek || days;

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
      driverId: driverId || null,  // Optional - can be assigned later
      schoolId,
      type: type || 'weekly',
      daysOfWeek: daysOfWeekFinal || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
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
    const filter = { parentId: req.userId || req.user?._id };
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
// GET /api/parents/rides/:id — Get single ride details for tracking
// ============================================================
router.get('/rides/:id', async (req, res) => {
  try {
    const rideSchema = z.object({ id: z.string().min(1) }).strict();
    const rideScope = validateTenantScopedQuery(rideSchema, { id: req.params.id }, req.userId, ['parent:ride-view']);
    const ride = await Ride.findById(rideScope.tenantScopedQuery.id)
      .populate('childId', 'name photo schoolId')
      .populate('driverId', 'name phone location')
      .lean();

    if (!ride) return res.status(404).json({ error: 'Ride not found' });

    // Verify this parent owns this ride
    if (ride.parentId?.toString() !== String(req.userId || req.user?._id)) {
      return res.status(403).json({ error: 'Not your ride' });
    }

    res.json({ ride });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/parents/sick-day — Report kid sick and cancel ride
// ============================================================
router.post('/sick-day', validateSickDay, async (req, res) => {
  try {
    const { childId, days } = req.body;
    // Accept both `daysOff` and `days` for compatibility
    const daysOff = req.body.daysOff || days || 1;

    const child = await Child.findById(childId);
    if (!child || child.parentId.toString() !== String(req.userId || req.user?._id)) {
      return res.status(403).json({ error: 'Not your child' });
    }

    // Find this term's date range from the child's school
    const schoolSchema = z.object({ schoolId: z.string().min(1) }).strict();
    const schoolScope = validateTenantScopedQuery(schoolSchema, { schoolId: String(child.schoolId) }, req.userId, ['parent:sick-day']);
    const school = await School.findById(schoolScope.tenantScopedQuery.schoolId);
    const term = school?.termSchedule?.currentTerm;
    const termStart = term?.startDate || new Date(new Date().getFullYear(), 0, 1);
    const termEnd = term?.endDate || new Date(new Date().getFullYear(), 11, 31);

    // Count how many sick days this parent has already used this term
    const { SICK_DAY } = require('../config');
    const usedSickDays = await Ride.countDocuments({
      parentId: req.userId,
      childId,
      isSickDay: true,
      cancellationReason: 'sick_day',
      cancelledAt: { $gte: termStart, $lte: termEnd },
    });

    const requestedDays = daysOff || 1;
    if (usedSickDays + requestedDays > SICK_DAY.MAX_PER_TERM) {
      const remaining = Math.max(0, SICK_DAY.MAX_PER_TERM - usedSickDays);
      return res.status(400).json({
        error: `You've used ${usedSickDays} of ${SICK_DAY.MAX_PER_TERM} allowed sick days this term.`,
        usedSickDays,
        maxPerTerm: SICK_DAY.MAX_PER_TERM,
        remaining,
        canStillReport: remaining > 0,
      });
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
// POST /api/parents/emergency-pickup — Request emergency driver
// ============================================================
router.post('/emergency-pickup', validateEmergencyPickup, async (req, res) => {
  try {
    const { childId } = req.body;
    // In production, find nearest available driver and dispatch
    res.json({ 
      message: 'Emergency pickup requested. A driver is being dispatched.',
      status: 'pending',
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

// ============================================================
// POST /api/parents/kids/:kidId/safeword — Set safe word for a child
// ============================================================
router.post('/kids/:kidId/safeword', async (req, res) => {
  try {
    const { kidId } = req.params;
    const { safeWord } = req.body;

    if (!safeWord || safeWord.length < 2) {
      return res.status(400).json({ error: 'Safe word must be at least 2 characters' });
    }

    const Child = require('../database/schema').Child;
    const child = await Child.findOne({ _id: kidId, parentId: req.userId });
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    child.safeWord = safeWord.toLowerCase().trim();
    await child.save();

    res.json({
      message: `✅ Safe word set to "${safeWord}"`,
      child: {
        id: child._id,
        name: child.name,
        safeWord: child.safeWord,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
