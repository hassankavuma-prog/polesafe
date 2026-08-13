// PoleSafe — Owner & Support Admin Routes
// Web dashboard API for managing PoleSafe platform

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { validateTenantScopedQuery } = require('../../lib/engine/hamnah-core.ts');

const User = mongoose.model('User');
const Child = mongoose.model('Child');
const School = mongoose.model('School');
const Ride = mongoose.model('Ride');

// Require polesafe_admin role
const requireAdmin = (req, res, next) => {
  if (!req.userId || req.userRole !== 'polesafe_admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Require owner role specifically
const requireOwner = (req, res, next) => {
  if (!req.userId || req.userRole !== 'polesafe_admin' || req.adminSubRole !== 'owner') {
    return res.status(403).json({ error: 'Owner access required' });
  }
  next();
};

// GET /api/admin/stats — Dashboard statistics
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [schoolCount, userCount, childCount, rideCount, pendingSchools] = await Promise.all([
      School.countDocuments(),
      User.countDocuments(),
      Child.countDocuments(),
      Ride.countDocuments({ status: { $in: ['scheduled', 'in_progress'] } }),
      School.countDocuments({ verificationStatus: 'pending' }),
    ]);

    res.json({
      totalSchools: schoolCount,
      totalUsers: userCount,
      totalChildren: childCount,
      activeRides: rideCount,
      pendingSchools,
      role: req.adminSubRole,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/schools — All schools
router.get('/schools', requireAdmin, async (req, res) => {
  try {
    let schools;
    if (req.adminSubRole === 'owner') {
      schools = await School.find()
        .populate('adminIds', 'name phone')
        .sort({ createdAt: -1 })
        .lean();
    } else {
      schools = await School.find({
        $or: [
          { verificationStatus: 'pending' },
          { verifiedBy: req.userId },
        ],
      })
        .populate('adminIds', 'name phone')
        .sort({ createdAt: -1 })
        .lean();
    }
    res.json({ schools });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/pending-schools — Queue for support
router.get('/pending-schools', requireAdmin, async (req, res) => {
  try {
    const schools = await School.find({ verificationStatus: 'pending' })
      .select('name headTeacherName headTeacherPhone address location createdAt')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ schools, count: schools.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/school/:id/approve — Approve a school with gate pinning
router.post('/school/:id/approve', requireAdmin, async (req, res) => {
  try {
    const { gateCoordinates, headTeacherPhone } = req.body;
    const schoolScopeSchema = z.object({ id: z.string().min(1) }).strict();
    const schoolScope = validateTenantScopedQuery(schoolScopeSchema, { id: req.params.id }, req.userId, ['admin:school-approve']);
    const school = await School.findById(schoolScope.tenantScopedQuery.id);
    if (!school) return res.status(404).json({ error: 'School not found' });
    if (school.verificationStatus !== 'pending') {
      return res.status(400).json({ error: `School is already ${school.verificationStatus}` });
    }

    school.verificationStatus = 'verified';
    school.verifiedBy = req.userId;
    school.verifiedAt = new Date();

    if (gateCoordinates) {
      school.location = { type: 'Point', coordinates: gateCoordinates };
    }

    let adminPhone = headTeacherPhone || school.headTeacherPhone;
    if (adminPhone) {
      const adminUserSchema = z.object({ phone: z.string().min(7) }).strict();
      const adminUserScope = validateTenantScopedQuery(adminUserSchema, { phone: adminPhone }, req.userId, ['admin:school-approve']);
      let adminUser = await User.findOne(adminUserScope.tenantScopedQuery);
      if (!adminUser) {
        const pin = Math.floor(1000 + Math.random() * 9000).toString();
        const hashedPin = await bcrypt.hash(pin, 10);
        adminUser = await User.create({
          phone: adminPhone,
          name: school.headTeacherName || 'School Admin',
          role: 'school_admin',
          pin: hashedPin,
          hasSmartphone: true,
        });
        school.pendingAdminPin = pin;
      } else {
        adminUser.role = 'school_admin';
        await adminUser.save();
      }
      if (!school.adminIds.includes(adminUser._id)) {
        school.adminIds.push(adminUser._id);
      }
      school.headTeacherPhone = adminPhone;
    }

    await school.save();

    try {
      const smsService = require('../services/smsService');
      const pinMsg = school.pendingAdminPin
        ? ` Your PIN is ${school.pendingAdminPin}. Download the app to manage your school.`
        : '';
      await smsService.sendSMS({
        to: adminPhone,
        message: `PoleSafe ✅ ${school.name} has been approved by PoleSafe! You are now the admin.${pinMsg} Reply HELP for assistance.`,
      });
      school.pendingAdminPin = undefined;
    } catch (smsErr) {
      console.log('SMS notification failed:', smsErr.message);
    }

    res.json({ message: `✅ ${school.name} is now active!`, school });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/school/:id/reject
router.post('/school/:id/reject', requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const schoolScopeSchema = z.object({ id: z.string().min(1) }).strict();
    const schoolScope = validateTenantScopedQuery(schoolScopeSchema, { id: req.params.id }, req.userId, ['admin:school-reject']);
    const school = await School.findByIdAndUpdate(schoolScope.tenantScopedQuery.id, {
      verificationStatus: 'rejected',
      rejectionReason: reason || 'Not approved at this time',
      verifiedBy: req.userId,
      verifiedAt: new Date(),
    }, { new: true });
    if (!school) return res.status(404).json({ error: 'School not found' });
    res.json({ message: `❌ ${school.name} has been rejected`, school });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users — All users (owner only)
router.get('/users', requireOwner, async (req, res) => {
  try {
    const users = await User.find()
      .select('name phone role polesafeAdminRole isVerified lastActive createdAt')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ users, count: users.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/user/:id/reset-pin
router.post('/user/:id/reset-pin', requireAdmin, async (req, res) => {
  try {
    const userScopeSchema = z.object({ id: z.string().min(1) }).strict();
    const userScope = validateTenantScopedQuery(userScopeSchema, { id: req.params.id }, req.userId, ['admin:user-reset-pin']);
    const user = await User.findById(userScope.tenantScopedQuery.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (req.adminSubRole !== 'owner' && user.role !== 'parent') {
      return res.status(403).json({ error: 'You can only reset PINs for parents. Contact owner for this user.' });
    }

    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedPin = await bcrypt.hash(newPin, 10);
    user.pin = hashedPin;
    await user.save();

    try {
      const smsService = require('../services/smsService');
      await smsService.sendSMS({
        to: user.phone,
        message: `PoleSafe 🔐 Your PIN has been reset. New PIN: ${newPin}. Log in and change it anytime.`,
      });
    } catch (smsErr) {
      console.log('SMS notification failed:', smsErr.message);
    }

    res.json({ message: `✅ PIN reset for ${user.name}. SMS sent to ${user.phone}.`, newPin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/school/:id/remove-admin (owner only)
router.post('/school/:id/remove-admin', requireOwner, async (req, res) => {
  try {
    const { userId } = req.body;
    const schoolScopeSchema = z.object({ id: z.string().min(1) }).strict();
    const schoolScope = validateTenantScopedQuery(schoolScopeSchema, { id: req.params.id }, req.userId, ['admin:remove-admin']);
    const school = await School.findById(schoolScope.tenantScopedQuery.id);
    if (!school) return res.status(404).json({ error: 'School not found' });

    school.adminIds = school.adminIds.filter(id => id.toString() !== userId);
    await school.save();

    res.json({ message: `✅ Admin removed from ${school.name}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/school/:id/suspend (owner only)
router.post('/school/:id/suspend', requireOwner, async (req, res) => {
  try {
    const schoolScopeSchema = z.object({ id: z.string().min(1) }).strict();
    const schoolScope = validateTenantScopedQuery(schoolScopeSchema, { id: req.params.id }, req.userId, ['admin:suspend']);
    const school = await School.findByIdAndUpdate(schoolScope.tenantScopedQuery.id, {
      verificationStatus: 'suspended',
    }, { new: true });
    if (!school) return res.status(404).json({ error: 'School not found' });
    res.json({ message: `⛔ ${school.name} has been suspended`, school });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/school/:id/unsuspend (owner only)
router.post('/school/:id/unsuspend', requireOwner, async (req, res) => {
  try {
    const schoolScopeSchema = z.object({ id: z.string().min(1) }).strict();
    const schoolScope = validateTenantScopedQuery(schoolScopeSchema, { id: req.params.id }, req.userId, ['admin:unsuspend']);
    const school = await School.findByIdAndUpdate(schoolScope.tenantScopedQuery.id, {
      verificationStatus: 'verified',
    }, { new: true });
    if (!school) return res.status(404).json({ error: 'School not found' });
    res.json({ message: `✅ ${school.name} has been reactivated`, school });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/add-support (owner only)
router.post('/add-support', requireOwner, async (req, res) => {
  try {
    const { phone, name } = req.body;
    if (!phone || !name) return res.status(400).json({ error: 'Phone and name are required' });

    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedPin = await bcrypt.hash(pin, 10);

    let user = await User.findOne({ phone });
    if (user) {
      user.role = 'polesafe_admin';
      user.polesafeAdminRole = 'support';
      user.name = name;
      user.pin = hashedPin;
      await user.save();
    } else {
      user = await User.create({
        phone, name,
        role: 'polesafe_admin',
        polesafeAdminRole: 'support',
        pin: hashedPin,
        hasSmartphone: true,
        preferredChannel: 'whatsapp',
      });
    }

    try {
      const smsService = require('../services/smsService');
      await smsService.sendSMS({
        to: phone,
        message: `PoleSafe 🛡️ You've been added as PoleSafe Support Staff. Log in at polesafe.ug/admin with phone ${phone} and PIN ${pin}.`,
      });
    } catch (smsErr) {
      console.log('SMS failed:', smsErr.message);
    }

    res.json({ message: `✅ ${name} added as support staff. PIN sent via SMS.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/support-staff (owner only)
router.get('/support-staff', requireOwner, async (req, res) => {
  try {
    const staff = await User.find({ role: 'polesafe_admin', polesafeAdminRole: 'support' })
      .select('name phone lastActive createdAt')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ staff });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/remove-support/:id (owner only)
router.post('/remove-support/:id', requireOwner, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, {
      role: 'parent',
      polesafeAdminRole: undefined,
    }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: `✅ ${user.name} removed from support staff` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════
//  PHASE 13: Driver Document Verification Review
// ═══════════════════════════════════════════════════
const driverVettingService = require('../services/driverVettingService');

// GET /api/admin/pending-drivers — List drivers awaiting document review
router.get('/pending-drivers', requireAdmin, async (req, res) => {
  try {
    const drivers = await driverVettingService.getPendingVerifications();
    res.json({ drivers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/driver-docs/:id — Get a driver's full verification docs
router.get('/driver-docs/:id', requireAdmin, async (req, res) => {
  try {
    const status = await driverVettingService.getVerificationStatus(req.params.id);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/driver/:id/approve — Approve driver verification
router.post('/driver/:id/approve', requireAdmin, async (req, res) => {
  try {
    const result = await driverVettingService.approveVerification(req.params.id, req.userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/driver/:id/reject — Reject driver verification with reason
router.post('/driver/:id/reject', requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Rejection reason is required' });
    const result = await driverVettingService.rejectVerification(req.params.id, req.userId, reason);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/verified-drivers — List all verified drivers
router.get('/verified-drivers', requireAdmin, async (req, res) => {
  try {
    const drivers = await User.find({
      role: 'driver',
      verificationStatus: 'approved',
    })
      .select('name phone email verificationDocs verificationStatus verificationReviewedAt')
      .sort({ verificationReviewedAt: -1 })
      .lean();
    res.json({ drivers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/driver-status/:id — Driver verification status
router.get('/driver-status/:id', requireAdmin, async (req, res) => {
  try {
    const status = await driverVettingService.getVerificationStatus(req.params.id);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
