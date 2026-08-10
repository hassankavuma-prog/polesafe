// PoleSafe — Driver Routes
// Route view, earnings, toggle modes, status updates

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { Ride, Vehicle, Booking, User, WithdrawalRequest } = require('../database/schema');
const routeService = require('../services/routeService');
const schoolPremiumService = require('../services/schoolPremium');

router.use(authMiddleware);
router.use(requireRole('driver'));

// ============================================================
// GET /api/drivers/route — Get today's route
// ============================================================
router.get('/route', async (req, res) => {
  try {
    const { schoolId, date } = req.query;
    const today = date || new Date().toISOString().split('T')[0];

    // Get school rides for today
    const morningRides = await Ride.find({
      driverId: req.userId,
      type: 'school_morning',
      scheduledPickupTime: {
        $gte: new Date(`${today}T00:00:00Z`),
        $lt: new Date(`${today}T23:59:59Z`),
      },
      status: { $ne: 'cancelled' },
    }).populate('childId', 'name photo').sort({ scheduledPickupTime: 1 }).lean();

    const afternoonRides = await Ride.find({
      driverId: req.userId,
      type: 'school_afternoon',
      scheduledPickupTime: {
        $gte: new Date(`${today}T00:00:00Z`),
        $lt: new Date(`${today}T23:59:59Z`),
      },
      status: { $ne: 'cancelled' },
    }).populate('childId', 'name photo').sort({ scheduledPickupTime: 1 }).lean();

    // Calculate gaps for Ride mode
    const allStops = [...morningRides, ...afternoonRides];
    const gaps = [];
    for (let i = 1; i < allStops.length; i++) {
      const gapMin = (new Date(allStops[i].scheduledPickupTime) - new Date(allStops[i - 1].scheduledPickupTime)) / 60000;
      if (gapMin >= 30) {
        gaps.push({ from: allStops[i - 1].scheduledPickupTime, to: allStops[i].scheduledPickupTime, minutes: gapMin });
      }
    }

    // Get today's ride-hailing rides
    const rideHailingRides = await Ride.find({
      driverId: req.userId,
      isRideHailing: true,
      createdAt: { $gte: new Date(`${today}T00:00:00Z`) },
    }).sort({ createdAt: -1 }).lean();

    res.json({
      date: today,
      morningStops: morningRides,
      afternoonStops: afternoonRides,
      gaps,
      rideModeAvailable: gaps.length > 0,
      rideHailingRides: rideHailingRides.length,
      totalTrips: morningRides.length + afternoonRides.length + rideHailingRides.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/drivers/ride/:id/status — Update ride status
// ============================================================
router.post('/ride/:id/status', async (req, res) => {
  try {
    const { status, coordinates } = req.body;
    const validStatuses = ['en_route', 'picked_up', 'dropped_off', 'gate_confirmed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be: ${validStatuses.join(', ')}` });
    }

    const ride = await Ride.findOne({ _id: req.params.id, driverId: req.userId });
    if (!ride) return res.status(404).json({ error: 'Ride not found' });

    ride.status = status;
    ride.updatedAt = new Date();

    if (status === 'picked_up') ride.actualPickupTime = new Date();
    if (status === 'dropped_off') ride.actualDropoffTime = new Date();

    // Increment driver's completed rides count when trip is delivered
    if (status === 'dropped_off') {
      await User.findByIdAndUpdate(req.userId, { $inc: { completedRidesCount: 1 } });
    }
    if (status === 'en_route' && coordinates) {
      ride.pickupLocation = { type: 'Point', coordinates };
    }

    // Track GPS log
    if (coordinates) {
      ride.trackingLog.push({
        timestamp: new Date(),
        coordinates,
      });
    }

    await ride.save();

    res.json({ ride, message: `✅ Status updated to: ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/drivers/update-location — Update GPS location
// ============================================================
router.post('/update-location', async (req, res) => {
  try {
    const { coordinates } = req.body;
    req.user.location = { type: 'Point', coordinates };
    await req.user.save();
    res.json({ message: 'Location updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/drivers/earnings — Get earnings breakdown
// ============================================================
router.get('/earnings', async (req, res) => {
  try {
    const { from, to } = req.query;
    const startDate = from ? new Date(from) : new Date(new Date().setDate(1)); // Start of month
    const endDate = to ? new Date(to) : new Date();

    const completedRides = await Ride.find({
      driverId: req.userId,
      status: 'completed',
      actualDropoffTime: { $gte: startDate, $lte: endDate },
    }).lean();

    const schoolRides = completedRides.filter(r => !r.isRideHailing);
    const rideHailingRides = completedRides.filter(r => r.isRideHailing);

    const schoolEarnings = schoolRides.reduce((sum, r) => sum + (r.driverPayout || 0), 0);
    const rideEarnings = rideHailingRides.reduce((sum, r) => sum + (r.driverPayout || 0), 0);

    // Get wallet info
    const user = await User.findById(req.userId).select('earningsBalance lifetimeEarnings mobileMoneyNumber');
    const pendingWithdrawals = await WithdrawalRequest.find({ driverId: req.userId, status: { $in: ['pending', 'processing'] } })
      .select('amount').lean();
    const pendingAmount = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);

    res.json({
      period: { from: startDate, to: endDate },
      summary: {
        totalTrips: completedRides.length,
        schoolTrips: schoolRides.length,
        rideHailingTrips: rideHailingRides.length,
        schoolEarnings,
        rideHailingEarnings: rideEarnings,
        totalEarnings: schoolEarnings + rideEarnings,
      },
      wallet: {
        availableBalance: (user?.earningsBalance || 0) - pendingAmount,
        pendingWithdrawals: pendingAmount,
        totalBalance: user?.earningsBalance || 0,
        lifetimeEarnings: user?.lifetimeEarnings || 0,
        hasMobileMoney: !!user?.mobileMoneyNumber,
      },
      breakdown: {
        school: schoolRides.map(r => ({
          date: r.actualDropoffTime,
          childName: r.childId,
          type: r.type,
          payout: r.driverPayout,
        })),
        rides: rideHailingRides.map(r => ({
          date: r.actualDropoffTime,
          passengerName: r.passengerName,
          payout: r.driverPayout,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/drivers/vehicle — Register or update vehicle
// ============================================================
router.post('/vehicle', async (req, res) => {
  try {
    const { type, registrationNumber, capacity, hasCarSeat, isWheelchairAccessible } = req.body;

    let vehicle = await Vehicle.findOne({ driverId: req.userId });
    if (vehicle) {
      Object.assign(vehicle, { type, registrationNumber, capacity, hasCarSeat, isWheelchairAccessible });
    } else {
      vehicle = await Vehicle.create({ driverId: req.userId, type, registrationNumber, capacity, hasCarSeat, isWheelchairAccessible });
    }

    await vehicle.save();
    res.json({ vehicle });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/drivers/availability — Toggle online/offline
// ============================================================
router.post('/availability', async (req, res) => {
  try {
    const { isAvailable } = req.body;
    await Vehicle.findOneAndUpdate(
      { driverId: req.userId },
      { isAvailable },
      { upsert: true }
    );
    res.json({ isAvailable, message: isAvailable ? 'You are now available for ride requests' : 'You are now offline' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/drivers/availability — Get current availability
// ============================================================
router.get('/availability', async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ driverId: req.userId });
    res.json({ isAvailable: vehicle?.isAvailable || false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/drivers/wallet — Get wallet + next payout info (Uber-style)
// ============================================================
router.get('/wallet', async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      'earningsBalance lifetimeEarnings payoutMethod mobileMoneyNumber ' +
      'bankName bankAccountNumber bankAccountName bankBranch name phone lastPayoutDate'
    );
    
    const pendingWithdrawals = await WithdrawalRequest.find({
      driverId: req.userId,
      status: { $in: ['scheduled', 'pending', 'processing'] }
    }).select('amount withdrawalType status scheduledPayoutDate').lean();
    
    const pendingEarlyAmount = pendingWithdrawals
      .filter(w => w.withdrawalType === 'early' && w.status !== 'cancelled')
      .reduce((sum, w) => sum + w.amount, 0);
    const scheduledAmount = pendingWithdrawals
      .filter(w => w.withdrawalType === 'scheduled')
      .reduce((sum, w) => sum + w.amount, 0);

    // Calculate next Friday
    const today = new Date();
    const daysUntilFriday = (5 - today.getDay() + 7) % 7;
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));
    nextFriday.setHours(18, 0, 0, 0); // 6PM Friday

    res.json({
      availableBalance: (user.earningsBalance || 0) - pendingEarlyAmount - scheduledAmount,
      pendingEarlyWithdrawals: pendingEarlyAmount,
      scheduledForFriday: scheduledAmount,
      lifetimeEarnings: user.lifetimeEarnings || 0,
      totalBalance: user.earningsBalance || 0,
      
      // Payout info
      nextPayoutDate: nextFriday.toISOString(),
      nextPayoutLabel: `Friday, ${nextFriday.toLocaleDateString('en-UG', { month: 'short', day: 'numeric' })}`,
      daysUntilPayout: daysUntilFriday === 0 ? 7 : daysUntilFriday,
      
      // Payout method
      payoutMethod: user.payoutMethod || 'mobile_money',
      mobileMoneyNumber: user.mobileMoneyNumber || '',
      bankDetails: {
        bankName: user.bankName || '',
        accountName: user.bankAccountName || '',
        accountNumber: user.bankAccountNumber || '',
        branch: user.bankBranch || '',
      },
      hasMobileMoney: !!user.mobileMoneyNumber,
      hasBankDetails: !!(user.bankName && user.bankAccountNumber),
      
      driverName: user.name,
      driverPhone: user.phone,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/drivers/withdraw — Request withdrawal (Uber-style)
// Two modes:
//   1. Scheduled (early: false) → Queued for Friday auto-payout, NO fee
//   2. Early cash-out (early: true) → Instant, 1,000 UGX inconvenience fee
// ============================================================
router.post('/withdraw', async (req, res) => {
  try {
    const { amount, early, payoutMethod, mobileMoneyNumber, mobileMoneyNetwork,
            bankName, bankAccountName, bankAccountNumber, bankBranch } = req.body;

    if (!amount || amount < 1000) {
      return res.status(400).json({ error: 'Minimum withdrawal is 1,000 UGX' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Driver not found' });

    // Calculate next Friday
    const today = new Date();
    const daysUntilFriday = (5 - today.getDay() + 7) % 7;
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));
    nextFriday.setHours(18, 0, 0, 0);

    // Check pending withdrawals
    const pendingTotal = await WithdrawalRequest.aggregate([
      { $match: { driverId: user._id, status: { $in: ['scheduled', 'pending', 'processing'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const pendingAmount = pendingTotal.length > 0 ? pendingTotal[0].total : 0;
    const available = (user.earningsBalance || 0) - pendingAmount;

    if (amount > available) {
      return res.status(400).json({
        error: `Insufficient balance. Available: ${available.toLocaleString('en-UG')} UGX`,
        availableBalance: available,
      });
    }

    const isEarlyWithdrawal = early === true || early === 'true';
    
    // Fee: 0 for scheduled (Friday), 1,000 UGX for early cash-out
    const fee = isEarlyWithdrawal ? 1000 : 0;
    const netAmount = amount - fee;
    
    // Validate payout method
    const method = payoutMethod || user.payoutMethod || 'mobile_money';
    if (method === 'mobile_money' && !mobileMoneyNumber && !user.mobileMoneyNumber) {
      return res.status(400).json({ error: 'Please set your mobile money number first' });
    }
    if (method === 'bank' && !bankAccountNumber && !user.bankAccountNumber) {
      return res.status(400).json({ error: 'Please set your bank account details first' });
    }

    const withdrawal = await WithdrawalRequest.create({
      driverId: user._id,
      amount,
      withdrawalType: isEarlyWithdrawal ? 'early' : 'scheduled',
      isEarlyWithdrawal,
      payoutMethod: method,
      mobileMoneyNumber: mobileMoneyNumber || user.mobileMoneyNumber,
      mobileMoneyNetwork: mobileMoneyNetwork || 'mtn',
      bankName: bankName || user.bankName,
      bankAccountName: bankAccountName || user.bankAccountName,
      bankAccountNumber: bankAccountNumber || user.bankAccountNumber,
      bankBranch: bankBranch || user.bankBranch,
      status: isEarlyWithdrawal ? 'pending' : 'scheduled',
      fee,
      netAmount: Math.max(netAmount, 0),
      scheduledPayoutDate: isEarlyWithdrawal ? null : nextFriday,
      requestedAt: new Date(),
    });

    // For early cash-out, deduct balance immediately
    if (isEarlyWithdrawal) {
      user.earningsBalance -= amount;
      await user.save();
    }

    const msg = isEarlyWithdrawal
      ? `Cash-out of ${amount.toLocaleString('en-UG')} UGX requested. Fee: 1,000 UGX. Net: ${netAmount.toLocaleString('en-UG')} UGX.`
      : `Scheduled for Friday payout: ${amount.toLocaleString('en-UG')} UGX. No fee.`;

    res.status(201).json({ withdrawal, message: `✅ ${msg}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/drivers/withdrawals — List withdrawal history
// ============================================================
router.get('/withdrawals', async (req, res) => {
  try {
    const withdrawals = await WithdrawalRequest.find({ driverId: req.userId })
      .sort({ requestedAt: -1 })
      .limit(50)
      .lean();
    res.json({ withdrawals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/drivers/wallet/payout-method — Set payout method
// ============================================================
router.post('/wallet/payout-method', async (req, res) => {
  try {
    const { payoutMethod } = req.body;
    if (!['mobile_money', 'bank'].includes(payoutMethod)) {
      return res.status(400).json({ error: 'Invalid payout method' });
    }
    await User.findByIdAndUpdate(req.userId, { payoutMethod });
    res.json({ message: `✅ Payout method set to ${payoutMethod === 'mobile_money' ? 'Mobile Money' : 'Bank Account'}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/drivers/wallet/phone — Update mobile money number
// ============================================================
router.post('/wallet/phone', async (req, res) => {
  try {
    const { mobileMoneyNumber, mobileMoneyNetwork } = req.body;
    if (!mobileMoneyNumber) return res.status(400).json({ error: 'Mobile money number required' });
    
    const update = { mobileMoneyNumber };
    if (mobileMoneyNetwork) update.mobileMoneyNetwork = mobileMoneyNetwork;
    
    await User.findByIdAndUpdate(req.userId, update);
    res.json({ message: '✅ Mobile money number updated', mobileMoneyNumber });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/drivers/wallet/bank — Update bank details
// ============================================================
router.post('/wallet/bank', async (req, res) => {
  try {
    const { bankName, bankAccountName, bankAccountNumber, bankBranch } = req.body;
    if (!bankName || !bankAccountName || !bankAccountNumber) {
      return res.status(400).json({ error: 'Bank name, account name, and account number are required' });
    }
    
    await User.findByIdAndUpdate(req.userId, {
      bankName, bankAccountName, bankAccountNumber, bankBranch: bankBranch || '',
      payoutMethod: 'bank',
    });
    
    res.json({
      message: `✅ Bank account updated: ${bankName} - ${bankAccountName} (${bankAccountNumber})`,
      bankDetails: { bankName, bankAccountName, bankAccountNumber, bankBranch },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
