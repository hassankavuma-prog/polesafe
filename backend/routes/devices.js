// PoleSafe — Device Token Registration
// Mobile apps call this to register their push notification token
// Supports FCM (Android/Web) and Expo push tokens

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const User = require('mongoose').model('User');

// ============================================================
// POST /api/devices/register — Register or update push token
// ============================================================
router.post('/register', authMiddleware, async (req, res) => {
  try {
    const { token, platform } = req.body;

    if (!token || typeof token !== 'string' || token.length < 10) {
      return res.status(400).json({ error: 'Valid push token is required' });
    }

    if (platform && !['ios', 'android', 'web'].includes(platform)) {
      return res.status(400).json({ error: 'Platform must be ios, android, or web' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        deviceToken: token,
        devicePlatform: platform || 'android',
        lastActive: new Date(),
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`📱 Device registered: User ${req.userId} — ${platform || 'android'}`);
    res.json({ success: true, message: 'Push token registered' });
  } catch (err) {
    console.error('[Device] Register error:', err.message);
    res.status(500).json({ error: 'Failed to register device' });
  }
});

// ============================================================
// DELETE /api/devices/unregister — Remove push token
// ============================================================
router.delete('/unregister', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      $unset: { deviceToken: '', devicePlatform: '' },
    });

    console.log(`📱 Device unregistered: User ${req.userId}`);
    res.json({ success: true, message: 'Push token removed' });
  } catch (err) {
    console.error('[Device] Unregister error:', err.message);
    res.status(500).json({ error: 'Failed to unregister device' });
  }
});

module.exports = router;
