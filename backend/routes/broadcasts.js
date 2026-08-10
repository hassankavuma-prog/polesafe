// PoleSafe — Broadcast Routes
// Dedicated broadcast endpoints for school announcements
// Parents can read broadcasts from their school; school_admins can create/manage

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { Broadcast, User } = require('../database/schema');

router.use(authMiddleware);

// GET /api/broadcasts — Get broadcasts (parent sees their school's)
router.get('/', async (req, res) => {
  try {
    const { schoolId, limit } = req.query;
    const filter = {};

    if (schoolId) {
      filter.schoolId = schoolId;
    } else if (req.userRole === 'parent') {
      // Find schools from the parent's kids
      const user = await User.findById(req.userId).populate('kids');
      if (user && user.kids?.length > 0) {
        const schoolIds = [...new Set(user.kids.map(k => k.schoolId?.toString()).filter(Boolean))];
        if (schoolIds.length) filter.schoolId = { $in: schoolIds };
      }
    } else if (req.userRole === 'school_admin') {
      filter.schoolId = req.user.schoolId;
    }

    const broadcasts = await Broadcast.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) || 20)
      .lean();

    res.json({ broadcasts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/broadcasts — Create broadcast (school_admin only)
router.post('/', requireRole('school_admin', 'polesafe_admin'), async (req, res) => {
  try {
    const { schoolId, title, message, type, priority } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    const broadcast = await Broadcast.create({
      schoolId: schoolId || req.user.schoolId,
      title,
      message,
      type: type || 'general',
      priority: priority || 'normal',
      createdBy: req.userId,
    });

    res.status(201).json({ broadcast });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
