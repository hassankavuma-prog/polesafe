// PoleSafe — Safety & Pickup Word System
// Permanent pickup word like "Mango" — kid remembers it all term
// + Driver badge + Teacher classroom verification

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = mongoose.model('User');
const Child = mongoose.model('Child');
const Ride = mongoose.model('Ride');
const School = mongoose.model('School');

// ============================================================
// 50 EASY WORDS FOR KIDS — set once, never change
// All are 3-8 letters, easy for a P.1 kid to remember
// ============================================================
const PICKUP_WORDS = [
  'Mango', 'Sunflower', 'Giraffe', 'Rocket', 'Dolphin',
  'Panda', 'Star', 'Elephant', 'Castle', 'Rainbow',
  'Tiger', 'Butterfly', 'Moon', 'Dragon', 'Bubble',
  'Penguin', 'Lion', 'Robot', 'Candy', 'Puzzle',
  'Kangaroo', 'Pirate', 'Mermaid', 'Honey', 'Ocean',
  'Pancake', 'Parrot', 'Jungle', 'Magic', 'Noodle',
  'Piano', 'Banana', 'Koala', 'Ladybug', 'Pumpkin',
  'Snowman', 'Wizard', 'Coconut', 'Daisy', 'Falcon',
  'Jelly', 'Lollipop', 'Monster', 'Pepper', 'Racoon',
  'Sapphire', 'Tornado', 'Zebra', 'Comet', 'Feather',
];

function getRandomWord() {
  return PICKUP_WORDS[Math.floor(Math.random() * PICKUP_WORDS.length)];
}

// Middleware: require auth
const requireAuth = (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// ============================================================
// POST /api/safety/set-pickup-word — Parent sets/change the word
// One word, permanent — kid remembers it all term
// ============================================================
router.post('/set-pickup-word', requireAuth, async (req, res) => {
  try {
    const { childId, word } = req.body;
    
    if (!childId || !word) {
      return res.status(400).json({ error: 'childId and word are required' });
    }
    
    const clean = word.trim();
    if (clean.length < 2 || clean.length > 16) {
      return res.status(400).json({ error: 'Word must be 2-16 characters' });
    }

    // Verify this child belongs to this parent
    const child = await Child.findOne({ _id: childId, parentId: req.userId });
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    // Set word permanently (not daily) — stays until parent changes it
    child.pickupCode = clean;
    await child.save();

    res.json({
      message: `✅ Pickup word set to "${clean}"! Tell your child: the PoleSafe driver will say this word every pickup.`,
      word: clean,
      childId,
      tip: 'The word stays the same every day. If your child tells someone the word, change it anytime here.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/safety/generate-pickup-word — Generate random word
// Picks from 50 easy words like Mango, Giraffe, Star...
// ============================================================
router.post('/generate-pickup-word', requireAuth, async (req, res) => {
  try {
    const { childId } = req.body;

    const child = await Child.findOne({ _id: childId, parentId: req.userId });
    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const word = getRandomWord();
    child.pickupCode = word;
    await child.save();

    res.json({
      message: `🎲 Your child's pickup word is "${word}"!`,
      word,
      childId,
      tip: `Tell your child: "The PoleSafe driver will say ${word} at pickup. If they don't say ${word}, don't get in."`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/safety/child-word/:childId — Get word for driver
// Driver sees the word before pickup
// ============================================================
router.get('/child-word/:childId', requireAuth, async (req, res) => {
  try {
    // Find today's ride for this child with this driver
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const ride = await Ride.findOne({
      driverId: req.userId,
      childId: req.params.childId,
      scheduledPickupTime: { $gte: today, $lt: tomorrow },
    }).populate('childId', 'pickupCode name class');

    if (!ride) {
      return res.status(404).json({ error: 'No ride found for this child today' });
    }

    const word = ride.childId?.pickupCode;

    res.json({
      childName: ride.childId?.name,
      childClass: ride.childId?.class,
      hasWord: !!word,
      word: word || null,
      instruction: word
        ? `🔐 Say "${word}" to this child at pickup. The child knows: if you don't say the word, they don't get in.`
        : '⚠️ No pickup word set yet. Ask the parent to set one.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/safety/confirm-word-pickup — Driver confirms they said the word
// ============================================================
router.post('/confirm-word-pickup', requireAuth, async (req, res) => {
  try {
    const { rideId } = req.body;
    
    await Ride.findByIdAndUpdate(rideId, {
      pickupCodeUsed: true,
      status: 'picked_up',
    });

    res.json({ message: '✅ Pickup confirmed — driver said the word, child is safe' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/safety/driver-badge/:driverId — Driver's PoleSafe ID (for teachers)
// ============================================================
router.get('/driver-badge/:driverId', async (req, res) => {
  try {
    const driver = await User.findOne({
      _id: req.params.driverId,
      role: 'driver',
    }).select('name driverIdNumber driverPhotoUrl isDriverIdVerified phone').lean();

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    if (!driver.isDriverIdVerified) {
      return res.json({
        driverName: driver.name,
        driverIdNumber: driver.driverIdNumber || 'Not assigned',
        isVerified: false,
        warning: '⚠️ This driver has NOT been verified by PoleSafe. Contact PoleSafe admin.',
      });
    }

    res.json({
      driverName: driver.name,
      driverIdNumber: driver.driverIdNumber,
      photoUrl: driver.driverPhotoUrl,
      isVerified: true,
      status: '✅ Verified PoleSafe Driver',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/safety/verify-for-classroom — Teacher verifies driver + word
// Shows teacher: driver name, ID, photo + child name, class, pickup word
// ============================================================
router.get('/verify-for-classroom', async (req, res) => {
  try {
    const { schoolId, driverId, childId } = req.query;

    if (!schoolId || !driverId || !childId) {
      return res.status(400).json({ error: 'schoolId, driverId, and childId are required' });
    }

    const driver = await User.findOne({ _id: driverId, role: 'driver' }).lean();
    if (!driver) {
      return res.json({ verified: false, message: '❌ No driver found with this ID' });
    }

    const child = await Child.findOne({ _id: childId, schoolId }).lean();
    if (!child) {
      return res.json({ verified: false, message: '❌ No child found at this school with this ID' });
    }

    // Find today's ride for this driver + child
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const ride = await Ride.findOne({
      driverId,
      childId,
      schoolId,
      type: 'school_afternoon',
      scheduledPickupTime: { $gte: today, $lt: tomorrow },
    }).lean();

    if (!ride) {
      return res.json({
        verified: false,
        message: `❌ ${driver.name} is NOT assigned to pick up ${child.name} today.`,
        driverName: driver.name,
        childName: child.name,
      });
    }

    res.json({
      verified: true,
      message: `✅ ${driver.name} (${driver.driverIdNumber || 'N/A'}) is authorized for ${child.name} (${child.class}). Word: ${child.pickupCode || 'Not set'}`,
      driverName: driver.name,
      driverIdNumber: driver.driverIdNumber,
      driverPhotoUrl: driver.driverPhotoUrl,
      childName: child.name,
      childClass: child.class,
      pickupWord: child.pickupCode || null,
      driverVerified: driver.isDriverIdVerified,
      rideId: ride._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/safety/classroom-handover — Teacher releases child to driver
// ============================================================
router.post('/classroom-handover', requireAuth, async (req, res) => {
  try {
    const { rideId, teacherName } = req.body;

    const ride = await Ride.findByIdAndUpdate(rideId, {
      classroomPickupStatus: 'verified_by_teacher',
      driverVerifiedAt: new Date(),
    }, { new: true });

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    res.json({
      message: `✅ ${teacherName || 'Teacher'} released child — safe handover to PoleSafe driver!`,
      classroomPickupStatus: 'verified_by_teacher',
      rideId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/safety/teacher-pickups/:schoolId — All afternoon pickups today
// ============================================================
router.get('/teacher-pickups/:schoolId', requireAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const pickups = await Ride.find({
      schoolId: req.params.schoolId,
      type: 'school_afternoon',
      scheduledPickupTime: { $gte: today, $lt: tomorrow },
    })
      .populate('childId', 'name class pickupCode')
      .populate('driverId', 'name driverIdNumber driverPhotoUrl')
      .sort({ scheduledPickupTime: 1 })
      .lean();

    const formatted = pickups.map(p => ({
      rideId: p._id,
      childName: p.childId?.name || 'Unknown',
      childClass: p.childId?.class || 'N/A',
      driverName: p.driverId?.name || 'Unassigned',
      driverIdNumber: p.driverId?.driverIdNumber || 'N/A',
      classroomStatus: p.classroomPickupStatus || 'pending',
      scheduledTime: p.scheduledPickupTime,
      pickupWord: p.childId?.pickupCode || null,
    }));

    res.json({
      total: formatted.length,
      pickups: formatted,
      pending: formatted.filter(p => p.classroomStatus === 'pending').length,
      verified: formatted.filter(p => p.classroomStatus === 'verified_by_teacher').length,
      completed: formatted.filter(p => p.classroomStatus === 'completed').length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
