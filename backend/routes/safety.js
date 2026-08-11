const express = require('express');
const router = express.Router();
const { User, Child } = require('../database/schema');

// ============================================================
// SOS/Emergency Alert System
// ============================================================

router.post('/sos', async (req, res) => {
  try {
    const { userId, userRole, kidId, rideId, location, message } = req.body;
    
    if (!userId || !userRole) {
      return res.status(400).json({ error: 'User ID and role required' });
    }

    const sosAlert = {
      userId,
      userRole,
      kidId: kidId || null,
      rideId: rideId || null,
      location: location || null,
      message: message || 'Emergency!',
      timestamp: new Date(),
      status: 'active',
      notified: [],
      contacts: [],
    };

    if (!global.sosAlerts) global.sosAlerts = [];
    global.sosAlerts.push(sosAlert);

    console.log(`🚨 SOS ALERT from ${userRole} ${userId}: ${message}`, location);

    // Find contacts based on role
    let contacts = [];

    if (userRole === 'parent' || userRole === 'rider') {
      if (kidId) {
        const kid = await Child.findById(kidId);
        if (kid) {
          const Ride = require('../database/schema').Ride;
          const rides = await Ride.find({ 
            kidId, 
            status: { $in: ['pending', 'confirmed', 'in_progress'] } 
          }).populate('driverId');
          rides.forEach(ride => {
            if (ride.driverId) {
              contacts.push({ userId: ride.driverId._id, role: 'driver' });
            }
          });
        }
      }
    }

    if (userRole === 'driver') {
      if (kidId) {
        const kid = await Child.findById(kidId).populate('parentId');
        if (kid && kid.parentId) {
          contacts.push({ userId: kid.parentId._id, role: 'parent' });
        }
      }
    }

    sosAlert.contacts = contacts;

    res.json({
      success: true,
      alert: sosAlert,
      contactsNotified: contacts.length,
    });
  } catch (err) {
    console.error('SOS error:', err);
    res.status(500).json({ error: 'Failed to process SOS alert' });
  }
});

router.get('/sos/active', async (req, res) => {
  try {
    const alerts = (global.sosAlerts || [])
      .filter(a => a.status === 'active')
      .sort((a, b) => b.timestamp - a.timestamp);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

router.post('/sos/acknowledge', async (req, res) => {
  try {
    const { alertIndex, userId } = req.body;
    if (!global.sosAlerts || !global.sosAlerts[alertIndex]) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    const alert = global.sosAlerts[alertIndex];
    if (!alert.notified.includes(userId)) {
      alert.notified.push(userId);
    }
    alert.status = 'acknowledged';
    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

router.post('/sos/resolve', async (req, res) => {
  try {
    const { alertIndex } = req.body;
    if (!global.sosAlerts || !global.sosAlerts[alertIndex]) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    global.sosAlerts[alertIndex].status = 'resolved';
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// ============================================================
// Driver Verification
// ============================================================

router.post('/driver/verify', async (req, res) => {
  try {
    const { driverId, approved, adminNotes } = req.body;
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'driver') {
      return res.status(404).json({ error: 'Driver not found' });
    }
    driver.isDriverIdVerified = approved;
    await driver.save();
    res.json({
      success: true,
      driver: { id: driver._id, name: driver.name, phone: driver.phone, verified: driver.isDriverIdVerified },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify driver' });
  }
});

router.get('/driver/pending', async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver', isDriverIdVerified: false })
      .select('name phone createdAt')
      .sort({ createdAt: -1 });
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending drivers' });
  }
});

// ============================================================
// School Verification
// ============================================================

router.post('/school/verify', async (req, res) => {
  try {
    const { schoolId, approved, adminNotes } = req.body;
    const school = await User.findById(schoolId);
    if (!school || school.role !== 'school_admin') {
      return res.status(404).json({ error: 'School not found' });
    }
    school.verifiedBy = approved ? (req.body.adminId || 'system') : undefined;
    await school.save();
    res.json({
      success: true,
      school: { id: school._id, name: school.name, phone: school.phone, verified: !!school.verifiedBy },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify school' });
  }
});

router.get('/school/pending', async (req, res) => {
  try {
    const schools = await User.find({ role: 'school_admin', verifiedBy: null })
      .select('name phone createdAt')
      .sort({ createdAt: -1 });
    res.json(schools);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending schools' });
  }
});

module.exports = router;
