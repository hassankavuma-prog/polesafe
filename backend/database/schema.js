// PoleSafe — Database Schema Definition (MongoDB/Mongoose)
// Covers: User, Child, School, Ride, Booking, Transaction, Credit, Broadcast

const mongoose = require('mongoose');

// ============================================================
// USER — Parent, Driver, or School Admin
// ============================================================
const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    match: /^\+?256\d{9}$/,  // Ugandan phone format
  },
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ['parent', 'driver', 'school_admin', 'polesafe_admin'],
    required: true,
  },
  pin: { type: String },              // Simple PIN for SMS login
  hasSmartphone: { type: Boolean, default: true },
  preferredLanguage: { type: String, enum: ['en', 'luganda', 'swahili'], default: 'en' },

  // Notification preferences
  preferredChannel: {
    type: String,
    enum: ['whatsapp', 'sms', 'email', 'app_push'],
    default: 'whatsapp',  // WhatsApp is king in Uganda
  },
  email: { type: String },  // For email receipts
  whatsappOptIn: { type: Boolean, default: true },
  smsOptIn: { type: Boolean, default: true },

  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] },  // [lng, lat]
  },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date },
});

// ============================================================
// CHILD — Kid profile linked to a parent
// ============================================================
const childSchema = new mongoose.Schema({
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  photo: { type: String },               // URL to photo
  class: { type: String },               // e.g., "P.3", "S.1"
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  finishTime: { type: String },          // e.g., "3:30 PM" — class finish time

  // Medical (opt-in, driver sees only safety-relevant info)
  medical: {
    hasCondition: { type: Boolean, default: false },
    condition: { type: String },
    emergencyInstruction: { type: String },
    emergencyContact: { type: String },
  },

  // Age-based safety
  age: { type: Number },
  requiresCarSeat: { type: Boolean, default: false },
  requiresSpecialNeedsDriver: { type: Boolean, default: false },

  // Siblings in same school (for staggered pickup)
  siblingIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Child' }],

  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

// ============================================================
// SCHOOL
// ============================================================
const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  headTeacherName: { type: String },
  headTeacherPhone: { type: String },
  address: { type: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] },
  },
  termSchedule: {
    currentTerm: {
      startDate: { type: Date },
      endDate: { type: Date },
      pickupTime: { type: String },   // e.g., "7:00 AM"
      dropoffTime: { type: String },  // e.g., "4:30 PM"
    },
    nextTerm: {
      startDate: { type: Date },
      endDate: { type: Date },
    },
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
  commissionRate: { type: Number, default: 0.05 },  // 5% for school
  hasAffiliate: { type: Boolean, default: false },    // School earns commission
  adminIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],  // At least 2 admins
  hasWaitingZone: { type: Boolean, default: false },   // For staggered class times
  createdAt: { type: Date, default: Date.now },
});

// ============================================================
// VEHICLE — Driver's vehicle
// ============================================================
const vehicleSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['car', 'boda', 'tuk-tuk'], required: true },
  registrationNumber: { type: String },
  capacity: { type: Number, default: 4 },
  hasCarSeat: { type: Boolean, default: false },
  isWheelchairAccessible: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
});

// ============================================================
// RIDE — Individual ride record
// ============================================================
const rideSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },

  type: { type: String, enum: ['school_morning', 'school_afternoon', 'ride_hailing', 'emergency', 'excursion'] },

  // Schedule
  scheduledPickupTime: { type: Date },
  scheduledDropoffTime: { type: Date },
  actualPickupTime: { type: Date },
  actualDropoffTime: { type: Date },

  // Locations
  pickupLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] },
    address: { type: String },
  },
  dropoffLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] },
    address: { type: String },
  },

  // Status flow
  status: {
    type: String,
    enum: [
      'scheduled',     // Booked, not yet started
      'en_route',      // Driver heading to pickup
      'picked_up',     // Kid in vehicle
      'dropped_off',   // Kid dropped at destination
      'gate_confirmed',// School gate confirmed receipt (school rides only)
      'cancelled',     // Cancelled
      'missed',        // No-show
      'completed',     // Fully done
    ],
    default: 'scheduled',
  },

  // Cancellation
  cancelledBy: { type: String, enum: ['parent', 'driver', 'school', 'system'] },
  cancellationReason: { type: String },
  cancelledAt: { type: Date },

  // Pricing
  baseFare: { type: Number },
  distanceKm: { type: Number },
  fuelMultiplier: { type: Number, default: 1.0 },
  schoolPremium: { type: Number, default: 0 },
  totalPrice: { type: Number },
  driverPayout: { type: Number },
  poleSafeCommission: { type: Number },
  schoolCommission: { type: Number },  // For affiliate program

  // Ride-hailing specific
  isRideHailing: { type: Boolean, default: false },
  passengerName: { type: String },    // For ride-hailing mode (non-school)

  // Sick at school / early pickup
  isSickDay: { type: Boolean, default: false },
  isEarlyPickup: { type: Boolean, default: false },
  creditedBack: { type: Boolean, default: false },  // Was parent credited?

  // Tracking history
  trackingLog: [{
    timestamp: { type: Date },
    coordinates: { type: [Number] },
    speed: { type: Number },
  }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ============================================================
// BOOKING — Weekly/monthly/termly subscription
// ============================================================
const bookingSchema = new mongoose.Schema({
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },

  type: { type: String, enum: ['weekly', 'monthly', 'termly'], required: true },

  // Schedule pattern
  daysOfWeek: [{ type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] }],
  pickupTime: { type: String },    // e.g., "7:00 AM"
  dropoffTime: { type: String },   // e.g., "4:30 PM"

  // Vehicle preference
  vehicleType: { type: String, enum: ['car', 'boda'] },

  // For families with kids in different classes (staggered times)
  staggeredPickups: [{
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child' },
    pickupTime: { type: String },
    unifiedPickup: { type: Boolean, default: false },  // false = separate trips, true = wait until later time
  }],

  // Pricing
  totalAmount: { type: Number },
  amountPerTrip: { type: Number },
  totalTrips: { type: Number },
  completedTrips: { type: Number, default: 0 },
  missedTrips: { type: Number, default: 0 },

  // Status
  status: { type: String, enum: ['active', 'paused', 'completed', 'cancelled'], default: 'active' },
  autoPausedForHolidays: { type: Boolean, default: false },

  startDate: { type: Date },
  endDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

// ============================================================
// TRANSACTION — Payment records
// ============================================================
const transactionSchema = new mongoose.Schema({
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  rideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },

  type: { type: String, enum: ['booking_payment', 'ride_payment', 'credit_redemption', 'cashback', 'commission_payout'] },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'UGX' },

  method: { type: String, enum: ['mobile_money', 'cash', 'credit', 'batch_settlement'] },
  provider: { type: String, enum: ['mtn', 'airtel', 'flutterwave', 'polesafe_agent'] },

  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
  reference: { type: String },  // Payment provider reference

  // Batch settlement tracking
  batchId: { type: String },
  isBatched: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
});

// ============================================================
// CREDIT — Parent credit system for missed rides
// ============================================================
const creditSchema = new mongoose.Schema({
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },

  amount: { type: Number, required: true },  // UGX
  reason: {
    type: String,
    enum: ['sick_day', 'school_closure', 'early_pickup', 'driver_cancelled', 'system_error'],
    required: true,
  },

  status: { type: String, enum: ['available', 'redeemed', 'expired', 'cashback'], default: 'available' },

  // Redemption
  redeemedFor: { type: String, enum: ['next_term', 'pole_ride', 'cashback'] },
  redeemedAt: { type: Date },
  redeemedTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },

  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

// ============================================================
// BROADCAST — School announcement system
// ============================================================
const broadcastSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  sentByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  type: {
    type: String,
    enum: ['half_day', 'school_closed', 'emergency', 'reminder', 'custom'],
    required: true,
  },

  message: { type: String, required: true },
  newPickupTime: { type: String },  // e.g., "12:00 PM" — auto-adjusts driver routes

  // Delivery targets
  sentToParents: { type: Boolean, default: true },
  sentToDrivers: { type: Boolean, default: true },
  sentViaSMS: { type: Boolean, default: true },  // For basic phone parents
  sentViaApp: { type: Boolean, default: true },

  // Stats
  parentCount: { type: Number },
  driverCount: { type: Number },
  smsCount: { type: Number },

  createdAt: { type: Date, default: Date.now },
});

// ============================================================
// FUEL PRICE — Tracking for dynamic adjustment
// ============================================================
const fuelPriceSchema = new mongoose.Schema({
  pricePerLitre: { type: Number, required: true },
  source: { type: String, default: 'Energy Ministry' },
  recordedAt: { type: Date, default: Date.now },
});

// Export models
module.exports = {
  User: mongoose.model('User', userSchema),
  Child: mongoose.model('Child', childSchema),
  School: mongoose.model('School', schoolSchema),
  Vehicle: mongoose.model('Vehicle', vehicleSchema),
  Ride: mongoose.model('Ride', rideSchema),
  Booking: mongoose.model('Booking', bookingSchema),
  Transaction: mongoose.model('Transaction', transactionSchema),
  Credit: mongoose.model('Credit', creditSchema),
  Broadcast: mongoose.model('Broadcast', broadcastSchema),
  FuelPrice: mongoose.model('FuelPrice', fuelPriceSchema),
};
