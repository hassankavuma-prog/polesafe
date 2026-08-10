// PoleSafe — Auth Routes
// Registration, login, SMS PIN verification for basic phone users

const express = require('express');
const router = express.Router();
const { User } = require('../database/schema');
const { authMiddleware, generateToken, generatePinToken } = require('../middleware/auth');
const {
  validateRegister,
  validateLogin,
} = require('../middleware/validation');
const smsService = require('../services/smsService');

// ============================================================
// POST /api/auth/register — Create new account
// ============================================================
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { phone, name, role, hasSmartphone } = req.body;

    // Validate phone number
    if (!phone || !phone.match(/^\+?256\d{9}$/)) {
      return res.status(400).json({ error: 'Valid Ugandan phone number required (+256...)' });
    }

    // Check if already registered
    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(409).json({ error: 'Phone number already registered. Please login.' });
    }

    // Create user
    const user = await User.create({
      phone,
      name,
      role,
      hasSmartphone: hasSmartphone !== false,
      isVerified: false,
    });

    // If basic phone user, set PIN for SMS login
    if (!user.hasSmartphone) {
      const pin = generatePinToken();
      user.pin = pin;
      await user.save();

      // Send PIN via SMS
      await smsService.send({
        to: phone,
        message: `Welcome to PoleSafe! 🚸 Your PIN is: ${pin}. Keep it safe. Reply HELP for how to book rides. -PoleSafe`,
      });

      return res.status(201).json({
        message: 'Account created! Check SMS for your PIN.',
        phone,
        smsSent: true,
      });
    }

    // Smartphone user — return JWT
    const token = generateToken(user);
    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/auth/login — Login via phone + PIN or password
// ============================================================
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { phone, pin } = req.body;
    const bcrypt = require('bcryptjs');

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ error: 'No account with this phone number' });
    }

    // If PIN provided, verify it (for admin users and basic phone users)
    if (pin) {
      // Check if PIN is hashed (bcrypt) or plain text (legacy)
      let validPin = false;
      
      if (user.pin && user.pin.startsWith('$2')) {
        // Hashed PIN (bcrypt)
        validPin = await bcrypt.compare(pin, user.pin);
      } else {
        // Plain text PIN (legacy)
        validPin = user.pin === pin;
      }

      if (!validPin) {
        return res.status(401).json({ error: 'Invalid PIN. Try again.' });
      }

      const token = generateToken(user);
      return res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          polesafeAdminRole: user.polesafeAdminRole,
        },
      });
    }

    // For smartphone users without PIN — send PIN via SMS
    const newPin = generatePinToken();
    user.pin = newPin;
    await user.save();

    await smsService.send({
      to: phone,
      message: `PoleSafe login code: ${newPin}. Valid for 5 minutes. -PoleSafe`,
    });

    res.json({ message: 'PIN sent via SMS', requiresPin: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/auth/verify — Verify PIN (alias for login with PIN)
// Called by mobile app after receiving SMS with PIN
// ============================================================
router.post('/verify', async (req, res) => {
  // Forward to login handler logic
  try {
    const { phone, pin } = req.body;
    const bcrypt = require('bcryptjs');

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ error: 'No account with this phone number' });
    }

    let validPin = false;
    if (user.pin && user.pin.startsWith('$2')) {
      validPin = await bcrypt.compare(pin, user.pin);
    } else {
      validPin = user.pin === pin;
    }

    if (!validPin) {
      return res.status(401).json({ error: 'Invalid PIN. Try again.' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/auth/me — Get current user profile
// ============================================================
router.get('/me', authMiddleware, async (req, res) => {
  res.json({
    user: req.user,
  });
});

// ============================================================
// POST /api/auth/sms-login — SMS command authentication
// Called by SMS gateway when a basic phone user sends a command
// ============================================================
router.post('/sms-login', async (req, res) => {
  try {
    const { from, text } = req.body;

    const parsed = smsService.parseCommand(from, text);
    const user = await User.findOne({ phone: from });

    if (!user) {
      // Unknown user — send registration prompt
      const reply = `Welcome to PoleSafe! To register, send: REGISTER <your name> <parent/driver/school>. Example: REGISTER Hassan parent. -PoleSafe`;
      return res.json({ reply });
    }

    // Process the command
    let reply;
    switch (parsed.command) {
      case 'BOOK':
        reply = smsService.generateReply({ command: 'BOOK', args: parsed.args, user });
        break;
      case 'CANCEL':
        reply = smsService.generateReply({ command: 'CANCEL', args: parsed.args, user });
        break;
      case 'WHERE':
        reply = smsService.generateReply({ command: 'WHERE', args: parsed.args, user });
        break;
      case 'SICK':
        reply = smsService.generateReply({ command: 'SICK', args: parsed.args, user });
        break;
      case 'HELP':
        reply = smsService.generateReply({ command: 'HELP', user });
        break;
      case 'REGISTER':
        // Handle registration via SMS
        const name = parsed.args.join(' ');
        user.name = name;
        const pin = generatePinToken();
        user.pin = pin;
        await user.save();
        reply = `✅ Registered ${name}! Your PIN: ${pin}. Book a ride: BOOK <name> <class> <school> <time>. -PoleSafe`;
        break;
      default:
        reply = `PoleSafe: Unknown command. Send HELP for options. -PoleSafe`;
    }

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/change-pin — Change PIN (authenticated)
router.post('/change-pin', authMiddleware, async (req, res) => {
  try {
    const { newPin } = req.body;
    if (!newPin || newPin.length < 4) {
      return res.status(400).json({ error: 'PIN must be at least 4 characters' });
    }
    
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.pin = newPin;
    await user.save();
    
    res.json({ message: 'PIN changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/auth/forgot-pin — Send SMS reset code
// ============================================================
router.post('/forgot-pin', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !phone.match(/^\+?256\d{9}$/)) {
      return res.status(400).json({ error: 'Valid Ugandan phone number required (+256...)' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ error: 'No account with this phone number' });
    }

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.pinResetCode = resetCode;
    user.pinResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
    await user.save();

    // Send reset code via SMS
    await smsService.send({
      to: phone,
      message: `PoleSafe PIN reset code: ${resetCode}. Valid for 10 minutes. If you didn't request this, ignore. -PoleSafe`,
    });

    res.json({ message: 'Reset code sent via SMS', phone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/auth/reset-pin — Verify reset code + set new PIN
// ============================================================
router.post('/reset-pin', async (req, res) => {
  try {
    const { phone, code, newPin } = req.body;

    if (!phone || !code || !newPin) {
      return res.status(400).json({ error: 'Phone, code, and new PIN are required' });
    }
    if (newPin.length < 4) {
      return res.status(400).json({ error: 'PIN must be at least 4 characters' });
    }

    const user = await User.findOne({
      phone,
      pinResetCode: code,
      pinResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset code. Request a new one.' });
    }

    // Set new PIN and clear reset fields
    user.pin = newPin;
    user.pinResetCode = undefined;
    user.pinResetExpires = undefined;
    await user.save();

    // Generate token so user is logged in after reset
    const token = generateToken(user);

    res.json({
      message: 'PIN reset successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
