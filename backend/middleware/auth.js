// PoleSafe — JWT Auth Middleware
// Validates tokens, handles SMS-based auth for basic phone users

const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../database/schema');

/**
 * Verify JWT token from Authorization header
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // Verify user still exists
    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Generate a JWT token for a user
 */
function generateToken(user) {
  return jwt.sign(
    { userId: user._id, role: user.role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
}

/**
 * Generate a simple PIN-based token for SMS auth
 */
function generatePinToken(phone) {
  // 6-digit PIN for SMS login
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = { authMiddleware, generateToken, generatePinToken };
