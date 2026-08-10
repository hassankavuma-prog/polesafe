// PoleSafe — Auth Routes
// Registration, login, SMS PIN verification for basic phone users

const express = require('express');
const router = express.Router();
const { User } = require('../database/schema');
const { authMiddleware, generateToken, generatePinToken } = require('../middleware/auth');
const smsService = require('../services/smsService');

// ============================================================
// POST /api/auth/register — Create new account
// ============================================================
router.post('/register', async (req, res) => {
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
router.post('/login', async (req, res) => {
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

module.exports = router;
