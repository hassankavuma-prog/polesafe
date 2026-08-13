// PoleSafe — Configuration
// Set ALL these via environment variables in production
// Copy .env.example to get started

module.exports = {
  PORT: process.env.PORT || 3001,

  // ============================================================
  // 🗄️ DATABASE
  // ============================================================
  // MongoDB Atlas: mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/polesafe?retryWrites=true
  // Local: mongodb://localhost:27017/polesafe
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/polesafe',

  // ============================================================
  // 🔐 AUTH
  // ============================================================
  JWT_SECRET: process.env.JWT_SECRET || 'polesafe-jwt-secret-change-in-production',
  JWT_EXPIRES_IN: '30d',


  // ============================================================
  // 👑 ADMIN AUTH (secure env-driven seed)
  // ============================================================
  // ADMIN_EMAIL is the private owner-controlled admin login email.
  // Do not assume it is a public/shared contact address, and do not
  // hardcode the owner's personal email into shared code or docs.
  ADMIN: {
    EMAIL: process.env.ADMIN_EMAIL || '',
    PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH || '',
    BOOTSTRAP_PASSWORD: process.env.ADMIN_BOOTSTRAP_PASSWORD || '',
    BOOTSTRAP_SALT_ROUNDS: parseInt(process.env.ADMIN_BOOTSTRAP_SALT_ROUNDS || '12', 10),
  },

  // ============================================================
  // 📱 AFRICA'S TALKING (SMS Gateway)
  // Sign up: https://africastalking.com
  // ============================================================
  SMS: {
    PROVIDER: process.env.SMS_PROVIDER || 'africastalking',
    API_KEY: process.env.AFRICASTALKING_API_KEY || '',
    USERNAME: process.env.AFRICASTALKING_USERNAME || '',
    SHORTCODE: process.env.SMS_SHORTCODE || '27700',
  },

  // ============================================================
  // 💬 WHATSAPP BUSINESS API
  // Option A: WATI (https://wati.io) — popular in Africa
  // Option B: Africa's Talking WhatsApp
  // Option C: Twilio WhatsApp
  // ============================================================
  WHATSAPP: {
    PROVIDER: process.env.WHATSAPP_PROVIDER || 'wati',  // wati | africastalking | twilio
    API_KEY: process.env.WHATSAPP_API_KEY || '',
    ACCOUNT_ID: process.env.WHATSAPP_ACCOUNT_ID || '',
    BUSINESS_PHONE: process.env.WHATSAPP_BUSINESS_PHONE || '+256700000000',
    TEMPLATES: {
      booking_receipt: 'booking_confirmation',
      payment_receipt: 'payment_received',
      ride_receipt: 'ride_completed',
      weekly_summary: 'weekly_ride_summary',
      kid_sick_alert: 'kid_sick_at_school',
      broadcast: 'school_announcement',
    },
  },

  // ============================================================
  // 💳 FLUTTERWAVE (Payments)
  // Sign up: https://dashboard.flutterwave.com/register
  // ============================================================
  FLUTTERWAVE: {
    SECRET_KEY: process.env.FLUTTERWAVE_SECRET_KEY || '',
    PUBLIC_KEY: process.env.FLUTTERWAVE_PUBLIC_KEY || '',
    ENCRYPTION_KEY: process.env.FLUTTERWAVE_ENCRYPTION_KEY || '',
    WEBHOOK_SECRET: process.env.FLUTTERWAVE_WEBHOOK_SECRET || '',
    LIVE: process.env.FLUTTERWAVE_LIVE === 'true',
  },

  // ============================================================
  // 🗺️ GOOGLE MAPS API
  // Sign up: https://console.cloud.google.com (enable Maps APIs)
  // ============================================================
  GOOGLE_MAPS: {
    API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
  },

  // ============================================================
  // 📧 EMAIL (Receipts + Summaries)
  // Option A: SendGrid (https://sendgrid.com) — 100 emails/day free
  // Option B: Mailgun (https://mailgun.com) — 5,000/month free
  // Option C: SMTP (your own mail server)
  // ============================================================
  EMAIL: {
    PROVIDER: process.env.EMAIL_PROVIDER || 'sendgrid',  // sendgrid | mailgun | smtp
    FROM: process.env.EMAIL_FROM || 'receipts@polesafe.ug',
    FROM_NAME: 'PoleSafe Receipts',
    API_KEY: process.env.EMAIL_API_KEY || '',
    SMTP: {
      HOST: process.env.EMAIL_SMTP_HOST || 'smtp.polesafe.ug',
      PORT: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
      USER: process.env.EMAIL_SMTP_USER || '',
      PASS: process.env.EMAIL_SMTP_PASS || '',
    },
  },

  // ============================================================
  // 🚸 POLE SAFE BUSINESS LOGIC
  // ============================================================

  // Fuel adjustment engine
  FUEL: {
    REFERENCE_PRICE: 5000,
    CAP_PERCENT: 15,
    UPDATE_INTERVAL_DAYS: 30,
  },

  // School Premium
  SCHOOL_PREMIUM: {
    AMOUNT_PER_TRIP: 500,
    DRIVER_SHARE: 400,
    POLESAFE_SHARE: 100,
    VISIBLE_TO_PARENT: false,
  },

  // Commission rates
  COMMISSION: {
    SCHOOL_RIDE: 0.15,
    RIDE_HAILING: 0.20,
  },

  // Sick day & cancellation
  SICK_DAY: {
    MAX_PER_TERM: 3,
    MAX_CONSECUTIVE: 3,
    DRIVER_COMPENSATION: 0.20,
  },
  CANCELLATION: {
    // Flat fees (like Uber — not percentages)
    FREE_MINUTES_BEFORE: 60,              // Free if cancelled >1h before pickup
    FLAT_LATE_CANCEL: 2000,               // 2,000 UGX (15-60 min before)
    FLAT_LAST_MINUTE: 3000,              // 3,000 UGX (<15 min before)
    FLAT_NO_SHOW: 5000,                  // 5,000 UGX (driver waited 5+ min)
    FIRST_ABRUPT_FREE_PER_TERM: true,    // First abrupt cancel each term = warning only
  },

  // Notification preferences
  NOTIFICATIONS: {
    DEFAULT_CHANNELS: ['whatsapp'],
    RECEIPTS: {
      booking_confirmation: { channels: ['whatsapp', 'email', 'sms'], template: 'booking_receipt' },
      payment_received: { channels: ['whatsapp', 'sms'], template: 'payment_receipt' },
      ride_completed: { channels: ['whatsapp', 'email'], template: 'ride_receipt' },
      credit_issued: { channels: ['whatsapp', 'sms'], template: 'credit_notice' },
      weekly_summary: { channels: ['email', 'whatsapp'], template: 'weekly_summary' },
    },
    ALERTS: {
      kid_sick: { channels: ['whatsapp', 'sms', 'app_push'] },
      emergency: { channels: ['whatsapp', 'sms', 'app_push'] },
      schedule_change: { channels: ['whatsapp', 'sms'] },
      driver_en_route: { channels: ['whatsapp', 'sms'] },
      broadcast: { channels: ['whatsapp', 'sms', 'app_push'] },
    },
  },

  // Payment
  PAYMENT: {
    PROVIDER: 'flutterwave',
    BATCH_SETTLEMENT: true,
    MOMO_ENABLED: true,
    CASH_ENABLED: true,
  },

  // Ride-hailing
  RIDE_HAILING: {
    BASE_FARE: 2000,
    PER_KM_RATE: 1000,
    BODA_BASE_FARE: 1500,
    BODA_PER_KM: 700,
    FREE_CANCEL_MINUTES: 5,
    DRIVER_RADIUS_KM: 3,
  },

  // Credit system
  CREDIT_SYSTEM: {
    SICK_CREDIT: true,
    EARLY_PICKUP_CREDIT: true,
    SCHOOL_CLOSURE_CREDIT: true,
    PARENT_FAULT_NO_CREDIT: true,
    CREDIT_EXPIRY_DAYS: 365,
    CREDIT_USABLE_FOR: ['next_term', 'pole_ride', 'cashback'],
  },
};
