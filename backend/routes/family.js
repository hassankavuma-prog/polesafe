// PoleSafe — Family Sharing Routes
// Generate join codes, link accounts, manage co-parents

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { FamilyLink } = require('../models/Family');
const { Child, User } = require('../database/schema');
const { authMiddleware } = require('../middleware/auth');

// Generate a 6-character join code
function generateCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

// ============================================================
// POST /api/family/create — Primary parent creates a family link
// ============================================================
router.post('/create', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'parent') {
      return res.status(403).json({ error: 'Only parents can create family links' });
    }

    // Check existing active link
    const existing = await FamilyLink.findOne({
      primaryParentId: req.userId,
      status: { $in: ['pending', 'active'] },
    });
    if (existing) {
      return res.json({
        message: 'You already have a family link',
        joinCode: existing.joinCode,
        status: existing.status,
        coParentId: existing.coParentId,
      });
    }

    let code = generateCode();
    // Ensure uniqueness
    while (await FamilyLink.findOne({ joinCode: code })) {
      code = generateCode();
    }

    const link = await FamilyLink.create({
      primaryParentId: req.userId,
      joinCode: code,
    });

    res.status(201).json({
      message: 'Family link created! Share this code with your partner.',
      joinCode: code,
      linkId: link._id,
    });
  } catch (err) {
    console.error('Create family link error:', err);
    res.status(500).json({ error: 'Failed to create family link' });
  }
});

// ============================================================
// POST /api/family/join — Co-parent joins via code
// ============================================================
router.post('/join', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Join code required' });

    const link = await FamilyLink.findOne({ joinCode: code.toUpperCase(), status: 'pending' });
    if (!link) {
      return res.status(404).json({ error: 'Invalid or expired join code' });
    }

    link.coParentId = req.userId;
    link.status = 'active';
    link.activatedAt = new Date();
    await link.save();

    // Get primary parent info
    const primary = await User.findById(link.primaryParentId).select('name phone');

    res.json({
      message: 'Family linked! You can now see and book rides for your kids.',
      linkId: link._id,
      primaryParent: primary,
    });
  } catch (err) {
    console.error('Join family link error:', err);
    res.status(500).json({ error: 'Failed to join family' });
  }
});

// ============================================================
// GET /api/family/my-family — Get current user's family info
// ============================================================
router.get('/my-family', authMiddleware, async (req, res) => {
  try {
    // Check if primary parent
    let links = await FamilyLink.find({
      primaryParentId: req.userId,
      status: { $in: ['pending', 'active'] },
    }).populate('coParentId', 'name phone');

    // Check if co-parent
    if (links.length === 0) {
      links = await FamilyLink.find({
        coParentId: req.userId,
        status: 'active',
      }).populate('primaryParentId', 'name phone');
    }

    res.json({
      links: links.map(l => ({
        _id: l._id,
        joinCode: l.status === 'pending' ? l.joinCode : undefined,
        status: l.status,
        partner: l.primaryParentId?._id?.equals(req.userId)
          ? l.coParentId
          : l.primaryParentId,
        permissions: {
          coParentCanBook: l.coParentCanBook,
          coParentCanCancel: l.coParentCanCancel,
        },
        createdAt: l.createdAt,
      })),
    });
  } catch (err) {
    console.error('Get family error:', err);
    res.status(500).json({ error: 'Failed to get family info' });
  }
});

// ============================================================
// DELETE /api/family/:id — Remove a family link
// ============================================================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const link = await FamilyLink.findById(req.params.id);
    if (!link) return res.status(404).json({ error: 'Family link not found' });

    const isPrimary = link.primaryParentId.toString() === req.userId;
    const isCoParent = link.coParentId?.toString() === req.userId;
    if (!isPrimary && !isCoParent) {
      return res.status(403).json({ error: 'Not your family link' });
    }

    link.status = 'removed';
    link.removedAt = new Date();
    await link.save();

    res.json({ message: 'Family link removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove link' });
  }
});

// ============================================================
// GET /api/family/shared-kids — Get kids shared with linked parents
// ============================================================
router.get('/shared-kids', authMiddleware, async (req, res) => {
  try {
    // Find active family links for this user
    const asPrimary = await FamilyLink.findOne({
      primaryParentId: req.userId,
      status: 'active',
    });
    const asCoParent = await FamilyLink.findOne({
      coParentId: req.userId,
      status: 'active',
    });

    const link = asPrimary || asCoParent;
    if (!link) return res.json({ kids: [] });

    // Get the primary parent's kids
    const parentId = asPrimary
      ? (asPrimary.coParentId || null) // co-parent wants to see primary's kids
      : link.primaryParentId;          // co-parent viewing primary's kids

    // If user is primary, return their own kids (they already have them)
    if (asPrimary) {
      const kids = await Child.find({ parentId: req.userId, status: 'approved' });
      return res.json({ kids, linked: false });
    }

    // If user is co-parent, return primary parent's kids
    const kids = await Child.find({ parentId: link.primaryParentId, status: 'approved' });
    res.json({ kids, linked: true, primaryParentId: link.primaryParentId });
  } catch (err) {
    console.error('Shared kids error:', err);
    res.status(500).json({ error: 'Failed to get shared kids' });
  }
});

module.exports = router;
