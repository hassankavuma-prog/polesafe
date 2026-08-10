// PoleSafe Backend — Server Entry Point
// From Home to School. And Beyond. 🚸🚗

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const path = require('path');
const config = require('./config');

const app = express();

// ============================================================
// 🔐 Security & parsing
// ============================================================
app.use(helmet({
  contentSecurityPolicy: false,  // Allow inline scripts for admin.html
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (admin dashboard)
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// 🚦 Rate limiting — protect against abuse
// ============================================================
const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,                 // 1000 requests per 15 min per IP
  message: { error: 'Too many requests. Slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Stricter limiter for auth routes (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,                   // 20 login attempts per 15 min
  message: { error: 'Too many login attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Even stricter for SMS PIN requests
const smsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 5,                    // 5 SMS PIN requests per hour
  message: { error: 'Too many SMS requests. Please wait.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================
// 📝 Request logging
// ============================================================
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
  });
  next();
});

// ============================================================
// 🗺️ Routes
// ============================================================
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/auth/sms', smsLimiter);  // Extra SMS-rate-limited route
app.use('/api/parents', require('./routes/parents'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/schools', require('./routes/schools'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/broadcasts', require('./routes/broadcasts'));
app.use('/api/credits', require('./routes/credits'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/quote-requests', require('./routes/quoteRequests'));
const { authMiddleware } = require('./middleware/auth');
app.use('/api/admin', authMiddleware, require('./routes/admin'));
app.use('/api/safety', require('./routes/safety'));

// ============================================================
// 📱 SMS Webhook — incoming SMS from basic phone parents
// ============================================================
const smsHandler = require('./services/smsHandler');
app.post('/api/sms/incoming', express.urlencoded({ extended: true }), smsHandler.handleIncoming);
app.get('/api/sms/delivery', smsHandler.handleDeliveryReport);

// ============================================================
// ❤️ Health check
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    slogan: 'From Home to School. And Beyond.',
    uptime: process.uptime(),
  });
});

// ============================================================
// 🚨 Global error handler
// ============================================================
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Something broke. We\'re on it.',
    code: err.code || 'INTERNAL_ERROR',
  });
});

// ============================================================
// 🚀 Start
// ============================================================
mongoose.connect(config.MONGODB_URI).then(() => {
  console.log('✅ Connected to MongoDB');

  // Create HTTP server (needed for WebSocket)
  const server = http.createServer(app);

  // Start WebSocket tracking service
  const TrackingService = require('./services/trackingService');
  new TrackingService(server);
  console.log('📍 WebSocket tracking service initialized');

  server.listen(config.PORT, () => {
    console.log(`🚸 PoleSafe API running on port ${config.PORT}`);
    console.log(`📢 Slogan: From Home to School. And Beyond.`);
    console.log(`📊 WebSocket: ws://localhost:${config.PORT}/ws/tracking`);
  });
}).catch(err => {
  console.error('❌ MongoDB connection failed:', err);
  process.exit(1);
});

module.exports = app;
