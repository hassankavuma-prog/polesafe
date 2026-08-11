const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Parent = require('../models/Parent');
const Driver = require('../models/Driver');
const School = require('../models/School');

// ============================================================
// SOS/Emergency Alert System
// ============================================================

// POST /api/safety/sos — Trigger an SOS alert
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
      status: 'active', // active → acknowledged → resolved
      notified: [], // users notified
    };

    // Store in a simple in-memory array (use DB in production)
    if (!global.sosAlerts) global.sosAlerts = [];
    global.sosAlerts.push(sosAlert);

    console.log(`🚨 SOS ALERT from ${userRole} ${userId}: ${message}`);

    // Find relevant contacts based on role
    let contacts = [];

    if (userRole === 'parent' && kidId) {
      // Notify drivers assigned to this kid's route
      const kid = await (require('../models/Kid')).findById(kidId);
      if (kid) {
        const rides = await (require('../models/Ride')).find({ 
          kidId, 
          status: { $in: ['pending', 'confirmed', 'in_progress'] } 
        }).populate('driverId');
        rides.forEach(ride => {
          if (ride.driverId) {
            contacts.push({
              userId: ride.driverId._id,
              role: 'driver',
              phone: ride.driverId.phone,
            });
          }
        });
      }
    }

    if (userRole === 'driver' && rideId) {
      // Notify parent of the kid on this ride
      const ride = await (require('../models/Ride')).findById(rideId).populate('kidId');
      if (ride && ride.kidId) {
        const parent = await Parent.findById(ride.kidId.parentId);
        if (parent) {
          contacts.push({
            userId: parent._id,
            role: 'parent',
            phone: parent.phone,
          });
        }
      }
    }

    if (userRole === 'school') {
      // Notify all parents with kids at this school
      const kids = await (require('../models/Kid')).find({ school: kidId || null });
      for (const kid of kids) {
        const parent = await Parent.findById(kid.parentId);
        if (parent && !contacts.find(c => c.userId === parent._id.toString())) {
          contacts.push({
            userId: parent._id,
            role: 'parent',
            phone: parent.phone,
          });
        }
      }
      // Also notify drivers with routes to this school
      const schoolRides = await (require('../models/Ride')).find({
        school: kidId || null,
        status: { $in: ['pending', 'confirmed', 'in_progress'] },
      }).populate('driverId');
      schoolRides.forEach(ride => {
        if (ride.driverId && !contacts.find(c => c.userId === ride.driverId._id.toString())) {
          contacts.push({
            userId: ride.driverId._id,
            role: 'driver',
            phone: ride.driverId.phone,
          });
        }
      });
    }

    sosAlert.contacts = contacts;
    
    // In production: send push notifications + SMS to all contacts
    // await sendPushNotification(contacts, sosAlert);
    // await sendSMSAlert(contacts, sosAlert);

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

// GET /api/safety/sos/active — Get active SOS alerts
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

// POST /api/safety/sos/acknowledge — Acknowledge an SOS alert
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

// POST /api/safety/sos/resolve — Mark SOS as resolved
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

// POST /api/safety/driver/verify — Admin approves a driver
router.post('/driver/verify', async (req, res) => {
  try {
    const { driverId, approved, adminNotes } = req.body;
    
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    driver.verified = approved;
    driver.verificationNotes = adminNotes || '';
    driver.verifiedAt = new Date();
    driver.verifiedBy = req.body.adminId || 'system';
    await driver.save();

    res.json({
      success: true,
      driver: {
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        verified: driver.verified,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify driver' });
  }
});

// GET /api/safety/driver/pending — List unverified drivers
router.get('/driver/pending', async (req, res) => {
  try {
    const drivers = await Driver.find({ verified: false })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending drivers' });
  }
});

// ============================================================
// School Verification
// ============================================================

// POST /api/safety/school/verify — Admin approves a school
router.post('/school/verify', async (req, res) => {
  try {
    const { schoolId, approved, adminNotes } = req.body;
    
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    school.verified = approved;
    school.verificationNotes = adminNotes || '';
    school.verifiedAt = new Date();
    await school.save();

    res.json({
      success: true,
      school: {
        id: school._id,
        name: school.schoolName,
        phone: school.phone,
        verified: school.verified,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify school' });
  }
});

// GET /api/safety/school/pending — List unverified schools
router.get('/school/pending', async (req, res) => {
  try {
    const schools = await School.find({ verified: false })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(schools);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending schools' });
  }
});

// ============================================================
// Safe Zones (Geo-fencing)
// ============================================================

// POST /api/safety/zone — Create a safe zone
router.post('/zone', async (req, res) => {
  try {
    const { name, type, coordinates, radius, schoolId } = req.body;
    // Safe zones: school premises, home areas, no-go zones
    // Stored in DB in production, in-memory for now
    if (!global.safeZones) global.safeZones = [];
    
    const zone = {
      id: global.safeZones.length,
      name,
      type: type || 'school', // school, home, restricted
      coordinates,
      radius: radius || 100, // meters
      schoolId: schoolId || null,
      createdAt: new Date(),
    };
    global.safeZones.push(zone);
    
    res.json({ success: true, zone });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create zone' });
  }
});

module.exports = router;
