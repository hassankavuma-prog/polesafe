const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { User, Child } = require('../database/schema');
const OTP = require('../models/OTP');
const { validateTenantScopedQuery } = require('../../lib/engine/hamnah-core');

const JWT_SECRET = process.env.JWT_SECRET || 'polesafe-dev-secret-change-in-production';
const JWT_EXPIRY = '7d';
const OTP_EXPIRY_MINUTES = 10;

// Helper: find or create user record
const authLookupSchema = z.object({ phone: z.string().min(7) }).strict();

async function findOrCreateUser(phone, role) {
  const query = validateTenantScopedQuery(authLookupSchema, { phone }, phone, ['auth:lookup']);
  let user = await User.findOne(query.tenantScopedQuery);
  if (!user) {
    user = await User.create({
      phone,
      role: role === 'rider' ? 'parent' : role,
      name: role === 'school' ? 'Unregistered School' : 'New User',
      hasSmartphone: true,
      preferredLanguage: 'en',
      isRider: role === 'rider' || false,
    });
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
    await OTP.create({
      phone,
      code,
      role,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    });

    console.log(`[DEV] OTP for ${phone} (${role}): ${code}`);

    res.json({
      message: 'OTP sent successfully',
      devCode: code,
      phone: phone.replace(/\d(?=\d{4})/g, '*'),
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

    const otp = await OTP.findOne({ phone, code, verified: false, role })
      .sort({ createdAt: -1 });

    if (!otp) {
      return res.status(401).json({ error: 'Invalid or expired code' });
    }

    if (otp.isExpired()) {
      await OTP.deleteOne({ _id: otp._id });
      return res.status(401).json({ error: 'Code has expired. Request a new one.' });
    }

    if (otp.attempts >= 5) {
      await OTP.deleteOne({ _id: otp._id });
      return res.status(429).json({ error: 'Too many attempts. Request a new code.' });
    }

    otp.attempts += 1;
    otp.verified = true;
    await otp.save();

    const user = await findOrCreateUser(phone, role);

    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        phone: user.phone,
        role: role === 'rider' ? 'rider' : user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    const profile = {
      token,
      user: {
        id: user._id,
        phone: user.phone,
        role: role === 'rider' ? 'rider' : user.role,
        name: user.name || '',
        isRider: role === 'rider' || false,
      },
    };

    // Get kids for parent/rider
    if (role === 'parent' || role === 'rider') {
      const kids = await Child.find({ parentId: user._id }).lean();
      profile.user.kids = kids || [];
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
    const newToken = jwt.sign(
      {
        userId: decoded.userId,
        phone: decoded.phone,
        role: decoded.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.json({ token: newToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// GET /api/auth/dev-otps — DEV ONLY
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
