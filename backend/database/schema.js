// PoleSafe — Database Schema Definition (MongoDB/Mongoose)
// Covers: User, Child, School, Ride, Booking, Transaction, Credit, Broadcast, Withdrawal

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
  polesafeAdminRole: { type: String, enum: ['owner', 'support'] },  // Only for polesafe_admin role
  pin: { type: String },              // Simple PIN for SMS login
  pinResetCode: { type: String },        // SMS reset code for forgot PIN
  pinResetExpires: { type: Date },       // Reset code expiry
  hasSmartphone: { type: Boolean, default: true },
  preferredLanguage: { type: String, enum: ['en', 'luganda', 'swahili'], default: 'en' },

  // Earnings wallet
  earningsBalance: { type: Number, default: 0 },       // Available for withdrawal
  lifetimeEarnings: { type: Number, default: 0 },       // All-time total earned
  mobileMoneyNumber: { type: String },                  // Default mobile money number

  // Payout settings (Uber-style)
  payoutMethod: { type: String, enum: ['mobile_money', 'bank'], default: 'mobile_money' },
  bankAccountName: { type: String },
  bankName: { type: String },
  bankAccountNumber: { type: String },
  bankBranch: { type: String },
  lastPayoutDate: { type: Date },          // Last Friday auto-payout date

  // Push notification tokens
  deviceToken: { type: String },                     // FCM/Expo push token
  devicePlatform: { type: String, enum: ['ios', 'android', 'web'] }, // Device type

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

  // Driver-specific fields
  driverIdNumber: { type: String },  // PoleSafe driver ID like "PS-DRV-001"
  driverPhotoUrl: { type: String },  // photo URL for the ID badge
  isDriverIdVerified: { type: Boolean, default: false },  // PoleSafe verified this driver's identity

  // 📸 Selfie verification (triggered, not per-ride)
  lastSelfieAt: { type: Date },  // When driver last took a verification selfie
  forceSelfieVerification: { type: Boolean, default: false },  // Admin can force next ride to require selfie
  completedRidesCount: { type: Number, default: 0 },  // Total completed rides (for new-driver check)

  // Driver Reliability System (see docs/driver-reliability-system.md)
  driverReliability: {
    // Per-booking strike tracking
    bookingStrikes: [{
      bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
      strikes: { type: Number, default: 0 },
      cleanStreak: { type: Number, default: 0 },
      lastMissAt: { type: Date },
      suspendedAt: { type: Date },
      reinstatedAt: { type: Date },
      suspended: { type: Boolean, default: false },
    }],
    // Global stats
    totalMisses: { type: Number, default: 0 },
    totalExcusedMisses: { type: Number, default: 0 },
    totalSuspensions: { type: Number, default: 0 },
    currentGlobalStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    sickDaysUsed: { type: Number, default: 0 },
    lastSickDayAt: { type: Date },
    // Rating
    rating: { type: Number, default: 4.5, min: 1, max: 5 },
    ratingHistory: [{
      rating: Number,
      byParent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      comment: String,
      date: { type: Date, default: Date.now },
    }],
  },
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
  status: { type: String, enum: ['pending', 'active', 'rejected'], default: 'pending' },
  registeredBy: { type: String, enum: ['parent', 'school'], default: 'parent' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },

  // Safety: Safe Word (kid asks driver for it — kid challenges, driver answers)
  safeWord: { type: String },  // e.g., "Sunflower" — word kid recognizes, set once
  safeWordPhoto: { type: String },  // Optional photo for very young kids (driver shows screen)
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
    enum: ['pending', 'verified', 'rejected', 'suspended'],
    default: 'pending',
  },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // Who verified this school
  verifiedAt: { type: Date },
  rejectionReason: { type: String },
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
  type: { type: String, enum: ['car', 'boda', 'taxi', 'bus'], required: true },
  registrationNumber: { type: String },
  capacity: { type: Number, default: 4 },
  hasCarSeat: { type: Boolean, default: false },
  isWheelchairAccessible: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: false },
  lastOnlineAt: { type: Date },

  // Fleet ownership
  owner: { type: mongoose.Schema.Types.ObjectId, refPath: 'ownerModel' },
  ownerModel: { type: String, enum: ['User', 'School'] },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  busLabel: { type: String },  // "Bus #3" — admin names their fleet vehicles
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

  // Safety: Safe Word (kid asks, driver says the word)
  safeWord: { type: String },  // Child's safe word — revealed to driver at pickup
  safeWordRevealedAt: { type: Date },  // When driver tapped to reveal
  safeWordVerified: { type: Boolean, default: false },  // Kid confirmed word matches
  classroomPickupStatus: { 
    type: String, 
    enum: ['pending', 'verified_by_teacher', 'completed'], 
    default: 'pending' 
  },  // Layer 2: Teacher verification status
  driverVerifiedAt: { type: Date },  // When driver was verified by teacher

  // 📸 Photo verification — driver selfie + kid pickup photos
  photos: {
    driverSelfie: { type: String },  // URL to driver selfie upon accepting ride
    selfieTakenAt: { type: Date },
    kidPickups: [{
      childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child' },
      photoUrl: { type: String },
      timestamp: { type: Date, default: Date.now },
    }],
  },

  // Selfie verification flag (set by admin or trigger system)
  selfieVerificationRequired: { type: Boolean, default: false },

  // Seat belt safety
  seatBeltReminderPlayed: { type: Boolean, default: false },  // Ride mode: 10s voice played
  seatBeltCheckpointShown: { type: Boolean, default: false },  // School mode: checkpoint displayed
  seatBeltVerified: { type: Boolean, default: false },  // School mode: driver confirmed buckled
  seatBeltVerifiedAt: { type: Date },  // When driver confirmed

  // Notification delivery tracking (set by scheduler)
  notificationsSent: {
    t60: { type: Boolean, default: false },
    t30: { type: Boolean, default: false },
    reassignment: { type: Boolean, default: false },
  },

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
    enum: ['half_day', 'school_closed', 'emergency', 'reminder', 'custom', 'meeting', 'event'],
    required: true,
  },

  message: { type: String, required: true },
  newPickupTime: { type: String },  // e.g., "12:00 PM" — auto-adjusts driver routes

  // Delivery targets
  sentToParents: { type: Boolean, default: true },
  sentToDrivers: { type: Boolean, default: true },
  sentToTeachers: { type: Boolean, default: false },
  sentViaSMS: { type: Boolean, default: true },  // For basic phone parents
  sentViaApp: { type: Boolean, default: true },

  // Stats
  parentCount: { type: Number },
  driverCount: { type: Number },
  teacherCount: { type: Number },
  smsCount: { type: Number },

  createdAt: { type: Date, default: Date.now },
});

// ============================================================
// ATTENDANCE — Manual attendance records for ALL kids
// Supports both PoleSafe-tracked kids and non-PoleSafe kids
// ============================================================
const attendanceSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  date: { type: Date, required: true },
  
  // Attendance status
  status: { 
    type: String, 
    enum: ['present', 'absent', 'late', 'sick', 'excused', 'no_ride'],
    required: true 
  },
  
  // How this was recorded
  source: { 
    type: String, 
    enum: ['auto_ride', 'manual_school', 'sms_parent', 'sms_school'],
    default: 'manual_school'
  },
  
  // Who recorded it (for manual entries)
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Notes (e.g., reason for absence)
  notes: { type: String },
  
  // Track times
  arrivalTime: { type: Date },
  departureTime: { type: Date },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Compound index to prevent duplicate attendance per child per day
attendanceSchema.index({ childId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ schoolId: 1, date: 1 });

// ============================================================
// SCHOOL TRIP — Tours, field trips, sports days
// Admin creates trip → assigns kids → driver confirms → tracking
// ============================================================
const schoolTripSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Trip details
  tripName: { type: String, required: true },
  description: { type: String },
  destination: { type: String, required: true },
  departureDate: { type: Date, required: true },
  returnDate: { type: Date },
  departureTime: { type: String },
  returnTime: { type: String },

  // Vehicle & driver
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vehicleSource: { type: String, enum: ['fleet', 'external'], default: 'external' },

  // Capacity enforcement
  maxSeats: { type: Number, required: true },
  assignedKids: [{
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child' },
    childName: { type: String },
    className: { type: String },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    parentPhone: { type: String },
    assignedAt: { type: Date, default: Date.now },

    // Per-kid payment tracking
    paymentStatus: { type: String, enum: ['unpaid', 'paid', 'waived'], default: 'unpaid' },
    paidAt: { type: Date },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  }],
  seatsFilled: { type: Number, default: 0 },

  // Bus label (admin names it: "Bus #3")
  busLabel: { type: String },

  // 💰 Pricing — set via driver quote negotiation
  // Admin creates trip without pricing
  // Drivers quote prices, admin accepts one
  pricingModel: {
    type: String,
    enum: ['per_head', 'flat_rate', 'free'],
    default: 'per_head',
  },
  pricePerHead: { type: Number, default: 0 },  // Final agreed cost per kid in UGX
  flatRate: { type: Number, default: 0 },       // Final agreed flat bus cost
  totalTripCost: { type: Number, default: 0 },  // Auto-calculated from accepted quote

  // 📋 Driver quotes — negotiation system
  quotes: [{
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    pricingModel: { type: String, enum: ['per_head', 'flat_rate'], required: true },
    pricePerHead: { type: Number, default: 0 },
    flatRate: { type: Number, default: 0 },
    message: { type: String },  // Driver's note to admin
    quotedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'countered'],
      default: 'pending',
    },
    adminCounter: { type: Number },  // Admin's counter-offer per head
    respondedAt: { type: Date },
    driverResponse: { type: String, enum: ['accepted', 'declined'] },  // Driver's response to counter
    driverRespondedAt: { type: Date },
  }],

  // Payment collection method
  paymentMethod: {
    type: String,
    enum: ['parent_pay', 'school_pays'],
    default: 'parent_pay',  // Parents pay individually, or school pays lump sum
  },

  // Driver payout
  driverPayout: { type: Number, default: 0 },
  poleSafeCommission: { type: Number, default: 0 },
  commissionRate: { type: Number, default: 0.05 },  // 5% default

  // Payment status
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partially_paid', 'paid'],
    default: 'unpaid',
  },
  paidAt: { type: Date },

  // Status flow
  status: {
    type: String,
    enum: ['draft', 'open', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'draft',
  },
  driverConfirmedAt: { type: Date },
  startedAt: { type: Date },
  completedAt: { type: Date },

  // Tracking
  trackingId: { type: mongoose.Schema.Types.ObjectId },

  // Privacy: kid names hidden until driver arrives at school
  kidsRevealed: { type: Boolean, default: false },
  arrivedAtSchool: { type: Date },

  // 📸 Photo verification — driver selfie + kid boarding photos
  photos: {
    driverSelfie: { type: String },
    selfieTakenAt: { type: Date },
    kidBoarding: [{
      childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child' },
      photoUrl: { type: String },
      timestamp: { type: Date, default: Date.now },
    }],
  },

  // Notifications sent flags
  notificationsSent: {
    teachers: { type: Boolean, default: false },
    parents: { type: Boolean, default: false },
  },
}, { timestamps: true });

// Index for fast school/status lookups
schoolTripSchema.index({ schoolId: 1, status: 1 });
schoolTripSchema.index({ driverId: 1, status: 1 });

// ============================================================
// QUOTE REQUEST — Generic taxi/bus quote negotiation
// For non-school bookings: parent requests taxi/bus, drivers quote
// ============================================================
const quoteRequestSchema = new mongoose.Schema({
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requesterRole: { type: String, enum: ['parent', 'school_admin'], default: 'parent' },

  // Trip details
  pickupLocation: {
    address: { type: String },
    coordinates: { type: [Number] },
  },
  dropoffLocation: {
    address: { type: String },
    coordinates: { type: [Number] },
  },
  pickupTime: { type: Date },
  passengerCount: { type: Number, default: 1 },
  vehicleType: { type: String, enum: ['taxi', 'bus'], required: true },
  notes: { type: String },

  // Status
  status: {
    type: String,
    enum: ['open', 'confirmed', 'cancelled', 'expired'],
    default: 'open',
  },
  expiresAt: { type: Date },

  // Driver quotes
  quotes: [{
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    pricingModel: { type: String, enum: ['per_head', 'flat_rate'], required: true },
    pricePerHead: { type: Number, default: 0 },
    flatRate: { type: Number, default: 0 },
    message: { type: String },
    quotedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  }],

  // Resulting ride (when quote is accepted)
  rideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },
  acceptedQuoteIndex: { type: Number },

  createdAt: { type: Date, default: Date.now },
});

// Index for fast lookups
quoteRequestSchema.index({ status: 1, vehicleType: 1 });
quoteRequestSchema.index({ requesterId: 1, status: 1 });

// ============================================================
// FUEL PRICE — Tracking for dynamic adjustment
// ============================================================
const fuelPriceSchema = new mongoose.Schema({
  pricePerLitre: { type: Number, required: true },
  source: { type: String, default: 'Energy Ministry' },
  recordedAt: { type: Date, default: Date.now },
});

// ============================================================
// WITHDRAWAL REQUEST — Driver earnings withdrawal (Uber-style)
// ============================================================
const withdrawalRequestSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  
  // Withdrawal type (Uber-style)
  withdrawalType: {
    type: String,
    enum: ['scheduled', 'early'],   // scheduled = Friday auto-payout, early = instant cash-out
    default: 'scheduled',
  },
  isEarlyWithdrawal: { type: Boolean, default: false }, // True = 1,000 UGX fee applied

  // Payout method
  payoutMethod: {
    type: String,
    enum: ['mobile_money', 'bank'],
    default: 'mobile_money',
  },

  // Mobile Money details
  mobileMoneyNumber: { type: String },
  mobileMoneyNetwork: { type: String, enum: ['mtn', 'airtel', 'other'], default: 'mtn' },

  // Bank details
  bankName: { type: String },
  bankAccountName: { type: String },
  bankAccountNumber: { type: String },
  bankBranch: { type: String },

  // Fee: 0 for scheduled (Friday auto-payout), 1,000 UGX for early cash-out
  fee: { type: Number, default: 0 },
  netAmount: { type: Number },

  // Status
  status: {
    type: String,
    enum: ['scheduled', 'pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'scheduled',
  },
  transactionId: { type: String }, // Flutterwave or MTN MoMo ref
  adminNote: { type: String },
  
  // Schedule dates
  scheduledPayoutDate: { type: Date }, // The Friday this is scheduled for
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
});

withdrawalRequestSchema.index({ driverId: 1, status: 1 });
withdrawalRequestSchema.index({ status: 1, requestedAt: 1 });

// ============================================================
// DRIVER NOTIFICATION — Notification delivery tracking
// ============================================================
const driverNotificationSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  rideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },
  type: {
    type: String,
    enum: ['reminder_t60', 'reminder_t30', 'reassignment_alert',
           'strike_warning', 'suspension', 'reinstatement',
           'clean_streak_reset', 'favorite_driver_offer',
           'favorite_declined', 'favorite_set', 'payout_friday'],
  },
  channel: { type: String, enum: ['push', 'whatsapp', 'sms', 'voice'] },
  message: String,
  delivered: { type: Boolean, default: false },
  deliveryError: String,
  sentAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  readAt: { type: Date },
});

driverNotificationSchema.index({ driverId: 1, type: 1, sentAt: -1 });
driverNotificationSchema.index({ bookingId: 1, type: 1 });

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
  SchoolTrip: mongoose.model('SchoolTrip', schoolTripSchema),
  QuoteRequest: mongoose.model('QuoteRequest', quoteRequestSchema),
  FuelPrice: mongoose.model('FuelPrice', fuelPriceSchema),
  WithdrawalRequest: mongoose.model('WithdrawalRequest', withdrawalRequestSchema),
  DriverNotification: mongoose.model('DriverNotification', driverNotificationSchema),
  Attendance: mongoose.model('Attendance', attendanceSchema),
};
