// PoleSafe — Structured Error Handling Middleware
// Provides consistent error responses, logging, and sanitization

const config = require('../config');

/**
 * Custom AppError class — thrown by route handlers
 * Usage: throw new AppError('Not found', 404, 'NOT_FOUND');
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // Distinguishes from programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 — Route not found
 */
function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404, 'NOT_FOUND'));
}

/**
 * Global error handler — catches everything
 */
function errorHandler(err, req, res, next) {
  // Log to console (replace with Winston/Pino in production)
  console.error(`❌ [${err.code || 'ERROR'}] ${err.message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Default to 500
  const statusCode = err.statusCode || err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';

  // Sanitize: don't leak internal details in production
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'Something went wrong. We\'re on it.'
    : err.message;

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const fields = Object.keys(err.errors).map(f => ({
      field: f,
      message: err.errors[f].message,
    }));
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      fields,
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      error: `${field} already exists`,
      code: 'DUPLICATE_KEY',
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: `Invalid ${err.path}: ${err.value}`,
      code: 'INVALID_ID',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired. Please login again.', code: 'TOKEN_EXPIRED' });
  }

  // Rate limit exceeded
  if (err.name === 'RateLimitError') {
    return res.status(429).json({ error: 'Too many requests. Please slow down.', code: 'RATE_LIMITED' });
  }

  res.status(statusCode).json({ error: message, code });
}

/**
 * Async wrapper — catches errors in async route handlers
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }));
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { AppError, notFound, errorHandler, asyncHandler };
