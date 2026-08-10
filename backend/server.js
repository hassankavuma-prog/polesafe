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
const { globalLimiter, authLimiter, smsLimiter, driverLimiter, parentLimiter, rideLimiter, paymentLimiter } = require('./middleware/rateLimit');

app.use(globalLimiter);

// 🛡️ NoSQL injection protection — strip $ operators from all inputs
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize());

// Even stricter for SMS PIN requests

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
app.use('/api/parents', parentLimiter, require('./routes/parents'));
app.use('/api/drivers', driverLimiter, require('./routes/drivers'));
app.use('/api/schools', require('./routes/schools'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/payments', require('./routes/payments'));

// Flutterwave webhook (no auth — Flutterwave signs its own requests)
app.use('/api/payments', require('./routes/paymentsWebhook'));
app.use('/api/broadcasts', require('./routes/broadcasts'));
app.use('/api/credits', require('./routes/credits'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/quote-requests', require('./routes/quoteRequests'));
app.use('/api/devices', require('./routes/devices'));
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
const { notFound, errorHandler } = require('./middleware/errorHandler');
app.use(notFound);
app.use(errorHandler);
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

  // Start background scheduler (auto-payouts, reminders, cleanup)
  const schedulerService = require('./services/schedulerService');
  schedulerService.start();
  console.log('⏰ Background scheduler running');

  server.listen(config.PORT, () => {
    console.log(`🚸 PoleSafe API running on port ${config.PORT}`);
    console.log(`📢 Slogan: From Home to School. And Beyond.`);
    console.log(`📊 WebSocket: ws://localhost:${config.PORT}/ws/tracking`);
  });
}).catch(err => {
  console.error('❌ MongoDB connection failed:', err);
  process.exit(1);
});

// Export scheduler for admin triggers
app.locals.schedulerService = require('./services/schedulerService');

module.exports = app;
