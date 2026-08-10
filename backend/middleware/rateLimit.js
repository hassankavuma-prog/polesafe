// PoleSafe — Rate Limiting Configuration
// Centralized rate limiters for all API endpoint groups

const rateLimit = require('express-rate-limit');

/**
 * Default rate limiter — applied to all routes
 * 200 requests per minute per IP
 */
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 200,
  message: { error: 'Too many requests. Please slow down.', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth limiter — stricter for login/register (prevent brute force)
 * 10 requests per minute per IP
 */
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Try again later.', code: 'AUTH_RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * SMS limiter — 5 SMS requests per hour (prevent SMS abuse)
 */
const smsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 5,
  message: { error: 'Too many SMS requests. Try again later.', code: 'SMS_RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Driver API limiter — 60 requests per minute
 */
const driverLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests. Slow down.', code: 'DRIVER_RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Parent API limiter — 60 requests per minute
 */
const parentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests. Slow down.', code: 'PARENT_RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Ride-hailing specific limiter — 30 requests per minute (higher rate of location updates)
 */
const rideLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,  // Higher for tracking updates
  message: { error: 'Too many requests.', code: 'RIDE_RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Payment limiter — 10 requests per minute (prevent payment abuse)
 */
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many payment attempts.', code: 'PAYMENT_RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  globalLimiter,
  authLimiter,
  smsLimiter,
  driverLimiter,
  parentLimiter,
  rideLimiter,
  paymentLimiter,
};
