// PoleSafe — Broadcast Routes
// Dedicated broadcast endpoints for school announcements

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { Broadcast } = require('../database/schema');

router.use(authMiddleware);
router.use(requireRole('school_admin', 'polesafe_admin'));

// GET /api/broadcasts — Get broadcast history for a school
router.get('/', async (req, res) => {
  try {
    const { schoolId, limit } = req.query;
    const filter = {};
    if (schoolId) filter.schoolId = schoolId;

    const broadcasts = await Broadcast.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) || 20)
      .lean();

    res.json({ broadcasts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
