const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const config = require('../config');
const { User, Child } = require('../database/schema');
const OTP = require('../models/OTP');
const { validateTenantScopedQuery } = require('../../lib/engine/hamnah-core.ts');

const JWT_SECRET = config.JWT_SECRET || 'polesafe-dev-secret-change-in-production';
const JWT_EXPIRY = '7d';
const OTP_EXPIRY_MINUTES = 10;

// Helper: find or create user record
const authLookupSchema = z.object({ phone: z.string().min(7) }).strict();

function normalizeAdminEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function maybeBootstrapAdmin() {
  const adminEmail = normalizeAdminEmail(config.ADMIN?.EMAIL);
  const bootstrapPassword = String(config.ADMIN?.BOOTSTRAP_PASSWORD || '').trim();
  const passwordHash = String(config.ADMIN?.PASSWORD_HASH || '').trim();
  if (!adminEmail || !bootstrapPassword || passwordHash) return null;

  const existing = await User.findOne({ email: adminEmail }).lean();
  if (existing) return null;

  const saltRounds = Number.isFinite(config.ADMIN?.BOOTSTRAP_SALT_ROUNDS) ? config.ADMIN.BOOTSTRAP_SALT_ROUNDS : 12;
  const hash = await bcrypt.hash(bootstrapPassword, saltRounds);
  return { email: adminEmail, hash };
}

async function findAdminUserByEmail(email) {
  const normalized = normalizeAdminEmail(email);
  if (!normalized || normalizeAdminEmail(config.ADMIN?.EMAIL) !== normalized) return null;
  const existing = await User.findOne({ email: normalized }).lean();
  return existing;
}

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


// POST /api/auth/admin-login
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = normalizeAdminEmail(email);
    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const configuredEmail = normalizeAdminEmail(config.ADMIN?.EMAIL);
    if (!configuredEmail || configuredEmail !== normalizedEmail) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    let adminUser = await User.findOne({ email: normalizedEmail });
    let passwordHash = String(config.ADMIN?.PASSWORD_HASH || '').trim();

    if (!passwordHash) {
      const bootstrap = await maybeBootstrapAdmin();
      if (bootstrap) {
        passwordHash = bootstrap.hash;
        if (!adminUser) {
          adminUser = await User.create({
            email: normalizedEmail,
            name: 'PoleSafe Administrator',
            phone: '',
            role: 'polesafe_admin',
            polesafeAdminRole: 'owner',
            hasSmartphone: true,
            preferredLanguage: 'en',
          });
        }
      }
    }

    if (!passwordHash) {
      return res.status(500).json({ error: 'Admin password hash is not configured' });
    }

    const matches = await bcrypt.compare(password, passwordHash);
    if (!matches) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!adminUser) {
      adminUser = await User.create({
        email: normalizedEmail,
        name: 'PoleSafe Administrator',
        phone: '',
        role: 'polesafe_admin',
        polesafeAdminRole: 'owner',
        hasSmartphone: true,
        preferredLanguage: 'en',
      });
    }

    adminUser.role = 'polesafe_admin';
    adminUser.polesafeAdminRole = adminUser.polesafeAdminRole || 'owner';
    await adminUser.save();

    const token = jwt.sign({
      userId: adminUser._id.toString(),
      phone: adminUser.phone || '',
      role: 'polesafe_admin',
      adminSubRole: adminUser.polesafeAdminRole,
      email: normalizedEmail,
    }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    return res.json({
      token,
      user: {
        id: adminUser._id,
        email: normalizedEmail,
        role: 'polesafe_admin',
        adminSubRole: adminUser.polesafeAdminRole,
        name: adminUser.name || 'PoleSafe Administrator',
      },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ error: 'Failed to login as admin' });
  }
});

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

router.post('/admin-bootstrap', async (req, res) => {
  try {
    const email = normalizeAdminEmail(config.ADMIN?.EMAIL);
    const bootstrapPassword = String(config.ADMIN?.BOOTSTRAP_PASSWORD || '').trim();
    if (!email || !bootstrapPassword) {
      return res.status(400).json({ error: 'Admin bootstrap env vars missing' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.json({ message: 'Admin already exists' });
    }
    const saltRounds = Number.isFinite(config.ADMIN?.BOOTSTRAP_SALT_ROUNDS) ? config.ADMIN.BOOTSTRAP_SALT_ROUNDS : 12;
    const hash = await bcrypt.hash(bootstrapPassword, saltRounds);
    const user = await User.create({ email, name: 'PoleSafe Administrator', phone: '', role: 'polesafe_admin', polesafeAdminRole: 'owner', hasSmartphone: true, preferredLanguage: 'en' });
    return res.json({ message: 'Admin bootstrap ready', email, passwordHash: hash, userId: user._id });
  } catch (err) {
    console.error('Admin bootstrap error:', err);
    return res.status(500).json({ error: 'Failed to bootstrap admin' });
  }
});

module.exports = router;
