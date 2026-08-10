// PoleSafe — School Admin Routes
// Dashboard, broadcast, gate check-in, detention, excursions

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { requireRole, requireSchoolAccess } = require('../middleware/roles');
const { Child, Ride, School, Broadcast } = require('../database/schema');
const broadcastService = require('../services/broadcastService');
const creditService = require('../services/creditService');
const smsService = require('../services/smsService');
const mongoose = require('mongoose');

router.use(authMiddleware);
router.use(requireRole('school_admin', 'polesafe_admin'));

// ============================================================
// GET /api/schools — List all active schools (for mobile app)
// ============================================================
router.get('/', async (req, res) => {
  try {
    const schools = await School.find({ verificationStatus: 'verified' })
      .select('name location address phone');
    res.json({ schools });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
    const { type, message, newPickupTime, recipients } = req.body;

    const validTypes = ['half_day', 'school_closed', 'emergency', 'reminder', 'custom', 'meeting', 'event'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Type must be: ${validTypes.join(', ')}` });
    }

    // Support targeting different groups
    const targetGroups = recipients || 'all'; // 'all', 'parents', 'teachers', 'specific_class', 'morning_only', 'afternoon_only'

    const result = await broadcastService.sendBroadcast({
      schoolId: req.params.id,
      adminId: req.userId,
      type,
      message,
      newPickupTime,
      targetGroups,
    });

    res.json({
      message: '📢 Broadcast sent!',
      notifiedParents: result.notifiedParents || 0,
      notifiedDrivers: result.notifiedDrivers || 0,
      notifiedTeachers: result.notifiedTeachers || 0,
      smsSent: result.smsSent || 0,
      routesAdjusted: result.routesAdjusted || 0,
      targetGroups,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/schools/:id/send-attendance-sms — Send attendance SMS to parents
// ============================================================
router.post('/:id/send-attendance-sms', requireSchoolAccess, async (req, res) => {
  try {
    const Attendance = mongoose.model('Attendance');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all active kids in this school
    const allKids = await Child.find({ 
      schoolId: req.params.id, 
      isActive: true,
      status: 'active',
    })
      .populate('parentId', 'name phone hasSmartphone')
      .sort({ class: 1, name: 1 })
      .lean();

    // Get all rides for today
    const todayRides = await Ride.find({
      schoolId: req.params.id,
      type: 'school_morning',
      scheduledPickupTime: { $gte: today, $lt: tomorrow },
    }).lean();

    // Get manual attendance records
    const manualRecords = await Attendance.find({
      schoolId: req.params.id,
      date: { $gte: today, $lt: tomorrow },
    }).lean();

    // Group kids by parent and build SMS
    const parentMessages = {};

    for (const kid of allKids) {
      if (!kid.parentId) continue;
      
      const parentKey = kid.parentId._id.toString();
      if (!parentMessages[parentKey]) {
        parentMessages[parentKey] = {
          parentName: kid.parentId.name || 'Parent',
          phone: kid.parentId.phone,
          hasSmartphone: kid.parentId.hasSmartphone,
          kids: [],
        };
      }

      const ride = todayRides.find(r => r.childId?.toString() === kid._id.toString());
      const manualRecord = manualRecords.find(r => r.childId?.toString() === kid._id.toString());

      let status;
      if (manualRecord) {
        status = manualRecord.status === 'present' ? '✅ PRESENT' :
                 manualRecord.status === 'absent' ? '❌ ABSENT' :
                 manualRecord.status === 'late' ? '🕐 LATE' :
                 manualRecord.status === 'sick' ? '🩺 SICK' : '❓';
      } else if (ride) {
        status = ride.status === 'gate_confirmed' || ride.status === 'dropped_off' ? '✅ PRESENT' :
                 ride.isSickDay ? '🩺 SICK' :
                 ride.status === 'cancelled' ? '❌ ABSENT' : '🕐 EN ROUTE';
      } else {
        status = '❓ NO DATA';
      }

      parentMessages[parentKey].kids.push({
        name: kid.name,
        class: kid.class,
        status,
      });
    }

    // Send SMS to each parent
    const school = await School.findById(req.params.id).lean();
    const schoolName = school?.name || 'School';
    const results = { sent: 0, failed: 0, details: [] };

    for (const [parentKey, data] of Object.entries(parentMessages)) {
      const kidLines = data.kids.map(k => `${k.name} (${k.class}): ${k.status}`).join('\n');
      const message = `📋 ${schoolName} Attendance - ${new Date().toLocaleDateString('en-UG')}\n${kidLines}\n-PoleSafe`;

      if (data.hasSmartphone) {
        // App users get in-app notification (SMS is backup)
        results.details.push({ phone: data.phone, method: 'app', kids: data.kids.length });
        continue;
      }

      try {
        await smsService.send({ to: data.phone, message });
        results.sent++;
        results.details.push({ phone: data.phone, method: 'sms', kids: data.kids.length });
      } catch (err) {
        results.failed++;
        results.details.push({ phone: data.phone, method: 'sms', error: err.message });
      }
    }

    res.json({
      message: `📋 Attendance SMS sent to ${results.sent} parents (${results.failed} failed). ${Object.keys(parentMessages).length} parents notified total.`,
      stats: {
        totalParents: Object.keys(parentMessages).length,
        smsSent: results.sent,
        smsFailed: results.failed,
        appNotified: results.details.filter(d => d.method === 'app').length,
      },
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

// ============================================================
// GET /api/schools/:id/pending-children — Kids from parent registration awaiting school approval
// ============================================================
router.get('/:id/pending-children', requireSchoolAccess, async (req, res) => {
  try {
    const pending = await Child.find({ 
      schoolId: req.params.id, 
      status: 'pending',
      isActive: true,
    })
      .populate('parentId', 'name phone')
      .lean();

    res.json({ 
      total: pending.length,
      pending,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/schools/:id/approve-child/:childId — School approves/rejects a parent-registered child
// ============================================================
router.post('/:id/approve-child/:childId', requireSchoolAccess, async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    
    const child = await Child.findOne({
      _id: req.params.childId,
      schoolId: req.params.id,
      status: 'pending',
    }).populate('parentId', 'name phone');

    if (!child) {
      return res.status(404).json({ error: 'Pending child not found' });
    }

    if (action === 'approve') {
      child.status = 'active';
      child.approvedBy = req.userId;
      child.approvedAt = new Date();
      await child.save();
      
      res.json({
        message: `✅ ${child.name} approved! They now appear in school attendance.`,
        child: {
          _id: child._id,
          name: child.name,
          class: child.class,
          parentName: child.parentId?.name,
          parentPhone: child.parentId?.phone,
        },
      });
    } else if (action === 'reject') {
      child.status = 'rejected';
      await child.save();
      
      res.json({
        message: `${child.name} rejected. Parent can re-submit with correct info.`,
      });
    } else {
      res.status(400).json({ error: 'Action must be "approve" or "reject"' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/schools/:id/add-child — School adds a child (for non-PoleSafe parents too)
// ============================================================
router.post('/:id/add-child', requireSchoolAccess, async (req, res) => {
  try {
    const { name, class: className, age, parentName, parentPhone, medical } = req.body;

    let parentId = null;
    
    // Check if parent already has a PoleSafe account
    if (parentPhone) {
      const mongoose = require('mongoose');
      const existingParent = await mongoose.model('User').findOne({ phone: parentPhone });
      if (existingParent) {
        parentId = existingParent._id;
      } else {
        // Create a minimal user record for non-PoleSafe parent
        const newParent = await mongoose.model('User').create({
          phone: parentPhone,
          name: parentName || parentPhone,
          role: 'parent',
          hasSmartphone: false,
          isVerified: false,
        });
        parentId = newParent._id;
      }
    }

    const child = await Child.create({
      parentId,
      name,
      class: className,
      schoolId: req.params.id,
      age,
      medical: medical || {},
      requiresCarSeat: age && age < 6,
      status: 'active',  // School-added kids are immediately active
      registeredBy: 'school',
      isActive: true,
    });

    res.status(201).json({
      message: `✅ ${name} added to school roster.`,
      child: {
        _id: child._id,
        name: child.name,
        class: child.class,
        parentLinked: !!parentId,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/schools/:id/manual-attendance — Mark a kid present/absent (PoleSafe or not)
// ============================================================
router.post('/:id/manual-attendance', requireSchoolAccess, async (req, res) => {
  try {
    const { childId, status, notes } = req.body;

    if (!['present', 'absent', 'late', 'sick', 'excused'].includes(status)) {
      return res.status(400).json({ error: 'Invalid attendance status' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mongoose = require('mongoose');
    // Upsert — create or update today's attendance
    const attendance = await mongoose.model('Attendance').findOneAndUpdate(
      { childId, date: today },
      {
        schoolId: req.params.id,
        childId,
        date: today,
        status,
        source: 'manual_school',
        recordedBy: req.userId,
        notes: notes || '',
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({
      message: `✅ Attendance marked: ${status}`,
      attendance,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/schools/:id/attendance-report — Full attendance combining auto-ride + manual for ALL kids
// ============================================================
router.get('/:id/attendance-report', requireSchoolAccess, async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const start = startDate ? new Date(startDate) : new Date(`${targetDate}T00:00:00Z`);
    const end = endDate ? new Date(endDate) : new Date(`${targetDate}T23:59:59Z`);

    // Get ALL active children in this school (both PoleSafe and non-PoleSafe)
    const allKids = await Child.find({ 
      schoolId: req.params.id, 
      isActive: true,
      status: { $in: ['active', 'pending'] },
    })
      .populate('parentId', 'name phone')
      .sort({ class: 1, name: 1 })
      .lean();

    // Get auto-tracking data from rides (for PoleSafe-tracked kids)
    const todayRides = await Ride.find({
      schoolId: req.params.id,
      type: 'school_morning',
      scheduledPickupTime: { $gte: start, $lte: end },
    }).lean();

    const mongoose = require('mongoose');
    // Get manual attendance records
    const manualRecords = await mongoose.model('Attendance').find({
      schoolId: req.params.id,
      date: { $gte: start, $lte: end },
    }).lean();

    // Build unified attendance for each kid
    const attendanceList = allKids.map(kid => {
      const ride = todayRides.find(r => r.childId?.toString() === kid._id.toString());
      const manualRecord = manualRecords.find(r => r.childId?.toString() === kid._id.toString());

      let attendanceStatus = 'no_data';
      let source = null;
      let arrivalTime = null;

      // Auto-tracked via PoleSafe ride (highest priority)
      if (ride) {
        if (ride.status === 'gate_confirmed' || ride.status === 'dropped_off') {
          attendanceStatus = 'present';
          source = 'auto_ride';
          arrivalTime = ride.actualDropoffTime;
        } else if (ride.isSickDay) {
          attendanceStatus = 'sick';
          source = 'auto_ride';
        } else if (ride.status === 'cancelled') {
          attendanceStatus = 'absent';
          source = 'auto_ride';
        } else if (ride.status === 'en_route' || ride.status === 'picked_up') {
          attendanceStatus = 'late';
          source = 'auto_ride';
        }
      }

      // Manual school record overrides auto (teacher knows best)
      if (manualRecord) {
        attendanceStatus = manualRecord.status;
        source = 'manual_school';
        arrivalTime = manualRecord.arrivalTime || arrivalTime;
      }

      // Kids with no ride at all (non-PoleSafe) — show as 'no_data'
      return {
        childId: kid._id,
        childName: kid.name,
        class: kid.class,
        parentName: kid.parentId?.name || 'N/A',
        parentPhone: kid.parentId?.phone || 'N/A',
        parentOnPoleSafe: !!kid.parentId,
        isRegisteredByParent: kid.registeredBy === 'parent',
        status: kid.status,
        attendance: attendanceStatus,
        source,
        arrivalTime,
      };
    });

    // Stats
    const stats = {
      total: attendanceList.length,
      present: attendanceList.filter(a => a.attendance === 'present').length,
      absent: attendanceList.filter(a => a.attendance === 'absent').length,
      late: attendanceList.filter(a => a.attendance === 'late').length,
      sick: attendanceList.filter(a => a.attendance === 'sick').length,
      noData: attendanceList.filter(a => a.attendance === 'no_data').length,
      poleSafeTracked: attendanceList.filter(a => a.source === 'auto_ride').length,
      manuallyTracked: attendanceList.filter(a => a.source === 'manual_school').length,
    };

    res.json({
      date: targetDate,
      stats,
      attendance: attendanceList,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
