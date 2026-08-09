// PoleSafe — Config Update: Add WhatsApp + Email channels
// Parents can choose how they want to receive receipts & notifications

module.exports = {
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/polesafe',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'polesafe-jwt-secret-change-in-production',
  JWT_EXPIRES_IN: '30d',

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
    MAX_PER_TERM: 5,
    MAX_CONSECUTIVE: 3,
    DRIVER_COMPENSATION: 0.20,
  },
  CANCELLATION: {
    FREE_IF_BEFORE_HOURS: 24,
    LOW_FEE_PERCENT: 0.20,
    MEDIUM_FEE_PERCENT: 0.50,
    HIGH_FEE_PERCENT: 1.00,
    NO_SHOW_PENALTY: 5000,
  },

  // ============================================================
  // NOTIFICATION CHANNELS
  // Parents choose: app_push | whatsapp | sms | email
  // ============================================================
  NOTIFICATIONS: {
    DEFAULT_CHANNELS: ['whatsapp'], // WhatsApp is king in Uganda

    // Receipt types & which channels they go to
    RECEIPTS: {
      booking_confirmation: { channels: ['whatsapp', 'email', 'sms'], template: 'booking_receipt' },
      payment_received: { channels: ['whatsapp', 'sms'], template: 'payment_receipt' },
      ride_completed: { channels: ['whatsapp', 'email'], template: 'ride_receipt' },
      credit_issued: { channels: ['whatsapp', 'sms'], template: 'credit_notice' },
      weekly_summary: { channels: ['email', 'whatsapp'], template: 'weekly_summary' },
    },

    // Alerts (urgent — go to ALL available channels)
    ALERTS: {
      kid_sick: { channels: ['whatsapp', 'sms', 'app_push'] },
      emergency: { channels: ['whatsapp', 'sms', 'app_push'] },
      schedule_change: { channels: ['whatsapp', 'sms'] },
      driver_en_route: { channels: ['whatsapp', 'sms'] },
      broadcast: { channels: ['whatsapp', 'sms', 'app_push'] },
    },
  },

  // WhatsApp — using WhatsApp Business API or WATI
  WHATSAPP: {
    PROVIDER: process.env.WHATSAPP_PROVIDER || 'wati',  // wati | twilio | africastalking
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

  // SMS — Africa's Talking
  SMS: {
    PROVIDER: process.env.SMS_PROVIDER || 'africastalking',
    API_KEY: process.env.SMS_API_KEY || '',
    USERNAME: process.env.SMS_USERNAME || '',
    SHORTCODE: '27700',
  },

  // Email — SMTP or transactional email service
  EMAIL: {
    PROVIDER: process.env.EMAIL_PROVIDER || 'smtp',  // smtp | sendgrid | mailgun
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
