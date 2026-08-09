// PoleSafe — Admin Dashboard (Server-side)
// Endpoints for PoleSafe internal management
// Used in demo mode to see everything happening

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { User, Child, School, Ride, Booking, Transaction, Credit, Vehicle, Broadcast } = require('../database/schema');
const demoPaymentService = require('../services/demoPaymentService');
const driverVettingService = require('../services/driverVettingService');

router.use(authMiddleware);
router.use(requireRole('polesafe_admin'));

// ============================================================
// GET /api/admin/dashboard — Overall system stats
// ============================================================
router.get('/dashboard', async (req, res) => {
  try {
    const [totalUsers, totalSchools, totalDrivers, totalParents, totalRides, totalTransactions, pendingDrivers] = await Promise.all([
      User.countDocuments(),
      School.countDocuments(),
      User.countDocuments({ role: 'driver' }),
      User.countDocuments({ role: 'parent' }),
      Ride.countDocuments(),
      Transaction.countDocuments(),
      Vehicle.countDocuments({ isApproved: false }),
    ]);

    const today = new Date().toISOString().split('T')[0];
    const todayRides = await Ride.countDocuments({
      scheduledPickupTime: {
        $gte: new Date(`${today}T00:00:00Z`),
        $lte: new Date(`${today}T23:59:59Z`),
      },
    });

    const revenue = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      demoMode: true,
      stats: {
        totalUsers,
        totalSchools,
        totalDrivers,
        totalParents,
        totalRides,
        todayRides,
        totalTransactions,
        pendingDrivers,
        totalRevenue: revenue[0]?.total || 0,
      },
      demoBalances: demoPaymentService.getDemoBalances(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/admin/users — List all users
// ============================================================
router.get('/users', async (req, res) => {
  try {
    const { role, limit } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) || 50)
      .lean();

    res.json({ users, total: users.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/admin/schools — List all schools
// ============================================================
router.get('/schools', async (req, res) => {
  try {
    const schools = await School.find().sort({ createdAt: -1 }).lean();
    const schoolsWithCounts = await Promise.all(schools.map(async (school) => {
      const kids = await Child.countDocuments({ schoolId: school._id });
      const rides = await Ride.countDocuments({ schoolId: school._id });
      return { ...school, kidCount: kids, rideCount: rides };
    }));

    res.json({ schools: schoolsWithCounts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/admin/drivers/pending — Pending driver approvals
// ============================================================
router.get('/drivers/pending', async (req, res) => {
  try {
    const pending = await driverVettingService.getPendingApplications();
    res.json({ pending, count: pending.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/admin/drivers/:id/approve — Approve driver
// ============================================================
router.post('/drivers/:id/approve', async (req, res) => {
  try {
    const result = await driverVettingService.approveDriver(req.params.id, req.userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/admin/drivers/:id/reject — Reject driver
// ============================================================
router.post('/drivers/:id/reject', async (req, res) => {
  try {
    const result = await driverVettingService.rejectDriver(req.params.id, req.userId, req.body.reason);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/admin/fuel-price — Update fuel price
// ============================================================
router.post('/fuel-price', async (req, res) => {
  try {
    const { price } = req.body;
    const fuelAdjustmentService = require('../services/fuelAdjustment');
    const record = await fuelAdjustmentService.recordFuelPrice(price);
    res.json({
      message: `Fuel price updated to ${price} UGX/L`,
      multiplier: fuelAdjustmentService.calculateMultiplier(price),
      record,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/admin/transactions — All transactions (demo)
// ============================================================
router.get('/transactions', async (req, res) => {
  try {
    const { limit } = req.query;
    const transactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) || 20)
      .lean();

    const total = transactions.reduce((s, t) => s + t.amount, 0);

    res.json({
      transactions,
      summary: {
        count: transactions.length,
        totalAmount: total,
        averagePerTx: transactions.length > 0 ? Math.round(total / transactions.length) : 0,
      },
      demoMode: true,
      watermark: '🔴 DEMO — Not real financial data',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/admin/seed/demo — Load demo data with fake transactions
// ============================================================
router.post('/seed/demo', async (req, res) => {
  try {
    const { User, Child, School, Vehicle, Ride, Booking, Transaction, Credit } = require('../database/schema');

    // Clean existing demo data
    await Promise.all([
      User.deleteMany({ role: { $ne: 'polesafe_admin' } }),
      Child.deleteMany({}),
      School.deleteMany({}),
      Vehicle.deleteMany({}),
      Ride.deleteMany({}),
      Booking.deleteMany({}),
      Transaction.deleteMany({}),
      Credit.deleteMany({}),
      Broadcast.deleteMany({}),
    ]);

    // Create demo school
    const school = await School.create({
      name: 'St Mary\'s Primary School',
      headTeacherName: 'Sr. Grace Nakato',
      headTeacherPhone: '+256701000001',
      address: 'Bukoto, Kampala',
      location: { type: 'Point', coordinates: [32.605, 0.334] },
      verificationStatus: 'verified',
      adminIds: [],
      hasAffiliate: true,
      commissionRate: 0.05,
    });

    // Create 3 demo drivers
    const driverData = [
      { name: 'Paul Ssempijja', phone: '+256701000010', vehicle: { type: 'boda', plate: 'UBA 001A' } },
      { name: 'Sarah Nambooze', phone: '+256701000011', vehicle: { type: 'car', plate: 'UBA 002A', hasCarSeat: true } },
      { name: 'Ibrahim Wasswa', phone: '+256701000012', vehicle: { type: 'tuk-tuk', plate: 'UBA 003A' } },
    ];

    const drivers = [];
    for (const d of driverData) {
      const user = await User.create({
        phone: d.phone,
        name: d.name,
        role: 'driver',
        hasSmartphone: true,
        isVerified: true,
        location: { type: 'Point', coordinates: [32.605, 0.334] },
      });
      await Vehicle.create({
        driverId: user._id,
        type: d.vehicle.type,
        registrationNumber: d.vehicle.plate,
        capacity: d.vehicle.type === 'boda' ? 2 : 4,
        hasCarSeat: d.vehicle.hasCarSeat || false,
        isApproved: true,
      });
      drivers.push(user);
    }

    // Create 2 demo parents with kids
    const parentData = [
      {
        name: 'Hassan', phone: '+256701000020',
        kids: [{ name: 'Faith Nakato', class: 'P.3', age: 8, finishTime: '3:30 PM' }],
      },
      {
        name: 'Susan Akol', phone: '+256701000021',
        kids: [
          { name: 'Akol Ochen', class: 'P.5', age: 10, finishTime: '4:30 PM' },
          { name: 'Amina Akol', class: 'P.1', age: 5, finishTime: '3:30 PM', requiresCarSeat: true },
        ],
      },
    ];

    const parents = [];
    for (const p of parentData) {
      const user = await User.create({
        phone: p.phone,
        name: p.name,
        role: 'parent',
        hasSmartphone: true,
        preferredChannel: 'whatsapp',
      });

      for (const kid of p.kids) {
        await Child.create({
          parentId: user._id,
          schoolId: school._id,
          name: kid.name,
          class: kid.class,
          age: kid.age,
          finishTime: kid.finishTime,
          requiresCarSeat: kid.requiresCarSeat || false,
        });
      }
      parents.push(user);
    }

    // Create demo bookings and fake transactions
    for (const parent of parents) {
      const kids = await Child.find({ parentId: parent._id });
      for (const kid of kids) {
        const booking = await Booking.create({
          parentId: parent._id,
          childId: kid._id,
          driverId: drivers[0]._id,
          schoolId: school._id,
          type: 'monthly',
          daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          pickupTime: '7:00 AM',
          dropoffTime: '4:30 PM',
          totalAmount: 40000,
          amountPerTrip: 2000,
          totalTrips: 20,
          completedTrips: 15,
          missedTrips: 2,
          status: 'active',
        });

        // Create fake completed rides and transactions
        const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        for (const day of weekDays) {
          await Ride.create({
            bookingId: booking._id,
            childId: kid._id,
            driverId: drivers[Math.floor(Math.random() * drivers.length)]._id,
            parentId: parent._id,
            schoolId: school._id,
            type: 'school_morning',
            status: 'completed',
            scheduledPickupTime: new Date(),
            actualPickupTime: new Date(),
            actualDropoffTime: new Date(),
            baseFare: 2000,
            fuelMultiplier: 1.0,
            schoolPremium: 500,
            totalPrice: 2500,
            driverPayout: 2125,
            poleSafeCommission: 375,
          });

          await Transaction.create({
            parentId: parent._id,
            bookingId: booking._id,
            type: 'booking_payment',
            amount: 2500,
            currency: 'UGX',
            method: 'mobile_money',
            provider: 'mtn',
            status: 'completed',
            reference: `DEMO-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          });
        }
      }
    }

    const stats = {
      users: await User.countDocuments(),
      schools: await School.countDocuments(),
      drivers: await User.countDocuments({ role: 'driver' }),
      parents: await User.countDocuments({ role: 'parent' }),
      kids: await Child.countDocuments(),
      rides: await Ride.countDocuments(),
      bookings: await Booking.countDocuments(),
      transactions: await Transaction.countDocuments(),
    };

    res.json({
      message: '✅ Demo data loaded! Fake transactions ready for testing.',
      stats,
      demoMode: true,
      note: '🔴 ALL transactions are FAKE. No real money used.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
