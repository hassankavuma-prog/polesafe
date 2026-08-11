const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Parent = require('../models/Parent');
const Driver = require('../models/Driver');
const School = require('../models/School');
const OTP = require('../models/OTP');

const JWT_SECRET = process.env.JWT_SECRET || 'polesafe-dev-secret-change-in-production';
const JWT_EXPIRY = '7d';
const OTP_EXPIRY_MINUTES = 10;

// Helper: find or create user record
async function findOrCreateUser(phone, role) {
  const ModelMap = {
    parent: Parent,
    driver: Driver,
    school: School,
    rider: Parent, // riders stored as parent records with isRider flag
  };
  const Model = ModelMap[role] || Parent;
  
  let user = await Model.findOne({ phone });
  if (!user) {
    if (role === 'rider') {
      user = await Model.create({ phone, isRider: true });
    } else if (role === 'school') {
      user = await Model.create({ phone, schoolName: 'Unregistered' });
    } else if (role === 'driver') {
      user = await Model.create({ phone, name: 'Unregistered', vehicleType: 'boda' });
    } else {
      user = await Model.create({ phone });
    }
  }
  return user;
}

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { phone, role } = req.body;
    
    if (!phone || !role) {
      return res.status(400).json({ error: 'Phone and role are required' });
    }
    
    const validRoles = ['parent', 'driver', 'school', 'rider'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Rate limit: 1 OTP per 60 seconds per phone
    const recentOTP = await OTP.findOne({ phone, verified: false })
      .sort({ createdAt: -1 });
    if (recentOTP && !recentOTP.isExpired()) {
      const secondsSinceLast = (new Date() - recentOTP.createdAt) / 1000;
      if (secondsSinceLast < 60) {
        const waitSeconds = Math.ceil(60 - secondsSinceLast);
        return res.status(429).json({ 
          error: `Please wait ${waitSeconds} seconds before requesting another code`,
          waitSeconds,
        });
      }
    }

    // Generate OTP
    const code = OTP.generateCode();
    const otp = await OTP.create({
      phone,
      code,
      role,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    });

    // For dev: log OTP to console and return in response
    console.log(`[DEV] OTP for ${phone} (${role}): ${code}`);
    
    // In production, send via Africa's Talking SMS
    // await sendSMS(phone, `Your PoleSafe code is: ${code}`);

    res.json({
      message: 'OTP sent successfully',
      // DEV ONLY — remove in production
      devCode: code,
      phone: phone.replace(/\d(?=\d{4})/g, '*'), // mask: 07*****123
    });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, code, role } = req.body;
    
    if (!phone || !code || !role) {
      return res.status(400).json({ error: 'Phone, code, and role are required' });
    }

    // Find valid OTP
    const otp = await OTP.findOne({ phone, code, verified: false, role })
      .sort({ createdAt: -1 });

    if (!otp) {
      return res.status(401).json({ error: 'Invalid or expired code' });
    }

    if (otp.isExpired()) {
      await OTP.deleteOne({ _id: otp._id });
      return res.status(401).json({ error: 'Code has expired. Request a new one.' });
    }

    // Check attempts
    if (otp.attempts >= 5) {
      await OTP.deleteOne({ _id: otp._id });
      return res.status(429).json({ error: 'Too many attempts. Request a new code.' });
    }

    otp.attempts += 1;
    otp.verified = true;
    await otp.save();

    // Find or create user
    const user = await findOrCreateUser(phone, role);

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        phone: user.phone,
        role,
        modelType: role === 'rider' ? 'parent' : role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Build user profile response
    const profile = {
      token,
      user: {
        id: user._id,
        phone: user.phone,
        role,
        name: user.name || user.schoolName || '',
      },
    };

    // Add role-specific data
    if (role === 'parent' || role === 'rider') {
      profile.user.isRider = user.isRider || false;
      const kids = await (require('../models/Kid')).find({ parentId: user._id }).lean() || [];
      profile.user.kids = kids;
    }
    if (role === 'driver') {
      profile.user.vehicleType = user.vehicleType;
      profile.user.verified = user.verified || false;
    }
    if (role === 'school') {
      profile.user.schoolName = user.schoolName;
      profile.user.verified = user.verified || false;
    }

    res.json(profile);
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Refresh token
    const newToken = jwt.sign(
      {
        userId: decoded.userId,
        phone: decoded.phone,
        role: decoded.role,
        modelType: decoded.modelType,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.json({ token: newToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// GET /api/auth/dev-otps — DEV ONLY: list recent OTPs for testing
router.get('/dev-otps', async (req, res) => {
  try {
    const otps = await OTP.find({ verified: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    res.json(otps.map(o => ({
      phone: o.phone,
      code: o.code,
      role: o.role,
      expiresAt: o.expiresAt,
      attempts: o.attempts,
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch OTPs' });
  }
});

module.exports = router;
