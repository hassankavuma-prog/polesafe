// PoleSafe Backend — Server Entry Point
// From Home to School. And Beyond. 🚸🚗

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');

const app = express();

// Security & parsing
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ===== ROUTES =====
app.use('/api/auth', require('./routes/auth'));
app.use('/api/parents', require('./routes/parents'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/schools', require('./routes/schools'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/broadcasts', require('./routes/broadcasts'));
app.use('/api/credits', require('./routes/credits'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    slogan: 'From Home to School. And Beyond.',
    uptime: process.uptime()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Something broke. We\'re on it.',
    code: err.code || 'INTERNAL_ERROR'
  });
});

// ===== START =====
mongoose.connect(config.MONGODB_URI).then(() => {
  console.log('✅ Connected to MongoDB');
  app.listen(config.PORT, () => {
    console.log(`🚸 PoleSafe API running on port ${config.PORT}`);
    console.log(`📢 Slogan: From Home to School. And Beyond.`);
  });
}).catch(err => {
  console.error('❌ MongoDB connection failed:', err);
  process.exit(1);
});

module.exports = app;
