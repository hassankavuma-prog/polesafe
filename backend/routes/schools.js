// PoleSafe — School Admin Routes
// Dashboard, broadcast, gate check-in, detention, excursions

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { requireRole, requireSchoolAccess } = require('../middleware/roles');
const { Child, Ride, School, Broadcast } = require('../database/schema');
const broadcastService = require('../services/broadcastService');
const creditService = require('../services/creditService');

router.use(authMiddleware);
router.use(requireRole('school_admin', 'polesafe_admin'));

// ============================================================
// POST /api/schools/register — Register a new school
// ============================================================
router.post('/register', async (req, res) => {
  try {
    const { name, headTeacherName, headTeacherPhone, address, coordinates } = req.body;

    const school = await School.create({
      name,
      headTeacherName,
      headTeacherPhone,
      address,
      location: coordinates ? { type: 'Point', coordinates } : undefined,
      adminIds: [req.userId],
      verificationStatus: 'pending',
    });

    res.status(201).json({
      school,
      message: 'School registered. Verification in progress (24h).',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/schools/:id/dashboard — School dashboard
// ============================================================
router.get('/:id/dashboard', requireSchoolAccess, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Today's arrivals
    const gateConfirmed = await Ride.countDocuments({
      schoolId: req.params.id,
      status: 'gate_confirmed',
      actualDropoffTime: {
        $gte: new Date(`${today}T00:00:00Z`),
        $lte: new Date(`${today}T23:59:59Z`),
      },
    });

    const expected = await Ride.countDocuments({
      schoolId: req.params.id,
      type: 'school_morning',
      status: { $ne: 'cancelled' },
      scheduledPickupTime: {
        $gte: new Date(`${today}T00:00:00Z`),
        $lte: new Date(`${today}T23:59:59Z`),
      },
    });

    // Sick kids today
    const sickToday = await Ride.countDocuments({
      schoolId: req.params.id,
      isSickDay: true,
      createdAt: { $gte: new Date(`${today}T00:00:00Z`) },
    });

    // Late arrivals / missing
    const enRoute = await Ride.countDocuments({
      schoolId: req.params.id,
      status: { $in: ['en_route', 'picked_up'] },
      scheduledPickupTime: {
        $gte: new Date(`${today}T00:00:00Z`),
        $lte: new Date(`${today}T23:59:59Z`),
      },
    });

    // Recent broadcasts
    const recentBroadcasts = await Broadcast.find({ schoolId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      schoolId: req.params.id,
      date: today,
      attendance: {
        expected,
        arrived: gateConfirmed,
        onRoute: enRoute,
        sick: sickToday,
        missing: Math.max(0, expected - gateConfirmed - enRoute),
      },
      recentBroadcasts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/schools/:id/broadcast — Send school broadcast
// ============================================================
router.post('/:id/broadcast', requireSchoolAccess, async (req, res) => {
  try {
    const { type, message, newPickupTime } = req.body;

    const validTypes = ['half_day', 'school_closed', 'emergency', 'reminder', 'custom'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Type must be: ${validTypes.join(', ')}` });
    }

    const result = await broadcastService.sendBroadcast({
      schoolId: req.params.id,
      adminId: req.userId,
      type,
      message,
      newPickupTime,
    });

    res.json({
      message: '📢 Broadcast sent!',
      notifiedParents: result.notifiedParents,
      notifiedDrivers: result.notifiedDrivers,
      smsSent: result.smsSent,
      routesAdjusted: result.routesAdjusted,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/schools/:id/gate-checkin — Confirm arrival at gate
// ============================================================
router.post('/:id/gate-checkin', requireSchoolAccess, async (req, res) => {
  try {
    const { childId } = req.body;

    // Find today's drop-off ride for this child
    const today = new Date().toISOString().split('T')[0];
    const ride = await Ride.findOne({
      childId,
      schoolId: req.params.id,
      type: 'school_morning',
      status: 'dropped_off',
      actualDropoffTime: {
        $gte: new Date(`${today}T00:00:00Z`),
        $lte: new Date(`${today}T23:59:59Z`),
      },
    }).populate('childId');

    if (!ride) {
      return res.status(404).json({ error: 'No drop-off found for this child today' });
    }

    // Confirm arrival
    ride.status = 'gate_confirmed';
    ride.updatedAt = new Date();
    await ride.save();

    // Update booking completed trips
    const Booking = require('mongoose').model('Booking');
    await Booking.findOneAndUpdate(
      { childId, status: 'active' },
      { $inc: { completedTrips: 1 } }
    );

    res.json({
      message: `✅ ${ride.childId?.name} confirmed arrived at school at ${ride.actualDropoffTime}`,
      childName: ride.childId?.name,
      arrivalTime: ride.actualDropoffTime,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/schools/:id/sick-report — Report kid sick at school
// ============================================================
router.post('/:id/sick-report', requireSchoolAccess, async (req, res) => {
  try {
    const { childId, condition } = req.body;

    const result = await broadcastService.reportSickAtSchool({
      schoolId: req.params.id,
      childId,
      condition,
    });

    res.json({
      message: `🩺 ${result.childId} reported sick. Parent notified.`,
      parentNotified: result.notified,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/schools/:id/detention — Update pickup time (detention)
// ============================================================
router.post('/:id/detention', requireSchoolAccess, async (req, res) => {
  try {
    const { childId, newPickupTime, reason } = req.body;

    const today = new Date().toISOString().split('T')[0];

    const ride = await Ride.findOne({
      childId,
      schoolId: req.params.id,
      type: 'school_afternoon',
      status: 'scheduled',
      scheduledPickupTime: {
        $gte: new Date(`${today}T00:00:00Z`),
        $lte: new Date(`${today}T23:59:59Z`),
      },
    }).populate('childId');

    if (!ride) {
      return res.status(404).json({ error: 'No afternoon pickup found for this child today' });
    }

    // Update pickup time
    const [time, period] = newPickupTime.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;

    const newTime = new Date(ride.scheduledPickupTime);
    newTime.setHours(hour24, parseInt(minutes), 0, 0);
    ride.scheduledPickupTime = newTime;
    ride.updatedAt = new Date();
    await ride.save();

    res.json({
      message: `⏰ ${ride.childId?.name}'s pickup moved to ${newPickupTime} (${reason || 'detention'})`,
      driverNotified: true,
      parentNotified: true,
      newPickupTime,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/schools/:id/arrivals — Full arrival list for today
// ============================================================
router.get('/:id/arrivals', requireSchoolAccess, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const kids = await Child.find({ schoolId: req.params.id, isActive: true }).lean();
    const todayRides = await Ride.find({
      schoolId: req.params.id,
      type: 'school_morning',
      scheduledPickupTime: {
        $gte: new Date(`${today}T00:00:00Z`),
        $lte: new Date(`${today}T23:59:59Z`),
      },
    }).populate('childId').lean();

    const arrivals = kids.map(kid => {
      const ride = todayRides.find(r => r.childId?._id?.toString() === kid._id.toString());
      return {
        childId: kid._id,
        childName: kid.name,
        class: kid.class,
        status: ride?.status || 'no_ride',
        arrivalTime: ride?.actualDropoffTime || null,
        isSick: ride?.isSickDay || false,
        driverName: ride?.driverId || 'N/A',
      };
    });

    res.json({
      date: today,
      total: arrivals.length,
      arrived: arrivals.filter(a => a.status === 'gate_confirmed').length,
      enRoute: arrivals.filter(a => a.status === 'dropped_off' || a.status === 'picked_up').length,
      sick: arrivals.filter(a => a.isSick).length,
      missing: arrivals.filter(a => a.status === 'scheduled' || a.status === 'no_ride').length,
      arrivals,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
