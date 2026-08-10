// PoleSafe — Input Validation & Sanitization Middleware
// Centralized validation rules for all critical endpoints
// Uses express-validator for validation + sanitization chains

const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware: check validation results and return first error
 * Use after a validation chain in route definitions
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    return res.status(400).json({
      error: `${first.msg} (${first.path})`,
      code: 'VALIDATION_ERROR',
    });
  }
  next();
}

// ============================================================
// AUTH VALIDATION
// ============================================================

const validateRegister = [
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^\+?256\d{9}$/).withMessage('Must be a valid Ugandan phone number (+256XXXXXXXXX)'),
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .escape(),  // Strip HTML/script
  body('role')
    .optional()
    .isIn(['parent', 'driver', 'school_admin']).withMessage('Invalid role'),
  body('hasSmartphone')
    .optional()
    .isBoolean().withMessage('hasSmartphone must be a boolean'),
  handleValidationErrors,
];

const validateLogin = [
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^\+?256\d{9}$/).withMessage('Must be a valid Ugandan phone number'),
  body('pin')
    .trim()
    .notEmpty().withMessage('PIN is required')
    .isLength({ min: 4, max: 6 }).withMessage('PIN must be 4-6 digits')
    .isNumeric().withMessage('PIN must be numeric'),
  handleValidationErrors,
];

// ============================================================
// PARENT VALIDATION
// ============================================================

const validateAddKid = [
  body('name')
    .trim()
    .notEmpty().withMessage('Child name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Child name must be 2-100 characters')
    .escape(),
  body('schoolId')
    .trim()
    .notEmpty().withMessage('School is required')
    .isMongoId().withMessage('Invalid school ID'),
  body('class')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Class must be under 50 characters')
    .escape(),
  handleValidationErrors,
];

const validateBooking = [
  body('childId')
    .trim()
    .notEmpty().withMessage('Child ID is required')
    .isMongoId().withMessage('Invalid child ID'),
  body('schoolId')
    .trim()
    .notEmpty().withMessage('School ID is required')
    .isMongoId().withMessage('Invalid school ID'),
  body('type')
    .trim()
    .notEmpty().withMessage('Booking type is required')
    .isIn(['morning_pickup', 'afternoon_dropoff', 'both']).withMessage('Invalid booking type'),
  body('pickupTime')
    .optional()
    .trim(),
  body('dropoffTime')
    .optional()
    .trim(),
  handleValidationErrors,
];

// ============================================================
// DRIVER VALIDATION
// ============================================================

const validateVehicle = [
  body('type')
    .trim()
    .notEmpty().withMessage('Vehicle type is required')
    .isIn(['car', 'boda', 'taxi', 'bus']).withMessage('Vehicle type must be car, boda, taxi, or bus'),
  body('registrationNumber')
    .trim()
    .notEmpty().withMessage('Registration number is required')
    .isLength({ max: 20 }).withMessage('Registration number too long')
    .escape(),
  body('capacity')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Capacity must be 1-100'),
  handleValidationErrors,
];

const validateWithdrawal = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isInt({ min: 1000, max: 5000000 }).withMessage('Amount must be between 1,000 and 5,000,000 UGX'),
  body('early')
    .optional()
    .isBoolean().withMessage('early must be a boolean'),
  body('payoutMethod')
    .optional()
    .trim()
    .isIn(['mobile_money', 'bank']).withMessage('Payout method must be mobile_money or bank'),
  body('mobileMoneyNumber')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^\+?256\d{9}$/).withMessage('Must be a valid Ugandan phone number'),
  body('network')
    .optional({ values: 'falsy' })
    .trim()
    .isIn(['MTN', 'Airtel', 'Other']).withMessage('Network must be MTN, Airtel, or Other'),
  handleValidationErrors,
];

const validateBankDetails = [
  body('bankName')
    .trim()
    .notEmpty().withMessage('Bank name is required')
    .isLength({ max: 100 }).withMessage('Bank name too long')
    .escape(),
  body('bankAccountName')
    .trim()
    .notEmpty().withMessage('Account name is required')
    .isLength({ max: 200 }).withMessage('Account name too long')
    .escape(),
  body('bankAccountNumber')
    .trim()
    .notEmpty().withMessage('Account number is required')
    .isLength({ max: 50 }).withMessage('Account number too long')
    .escape(),
  body('bankBranch')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Branch name too long')
    .escape(),
  handleValidationErrors,
];

// ============================================================
// TRIP / SCHOOL TRIP VALIDATION
// ============================================================

const validateCreateTrip = [
  body('tripName')
    .trim()
    .notEmpty().withMessage('Trip name is required')
    .isLength({ max: 200 }).withMessage('Trip name too long')
    .escape(),
  body('destination')
    .trim()
    .notEmpty().withMessage('Destination is required')
    .isLength({ max: 500 }).withMessage('Destination too long')
    .escape(),
  body('departureDate')
    .notEmpty().withMessage('Departure date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('maxSeats')
    .optional()
    .isInt({ min: 1, max: 200 }).withMessage('Max seats must be 1-200'),
  body('schoolId')
    .optional()
    .isMongoId().withMessage('Invalid school ID'),
  handleValidationErrors,
];

const validateAssignKids = [
  body('childIds')
    .isArray({ min: 1 }).withMessage('childIds must be a non-empty array'),
  body('childIds.*')
    .isMongoId().withMessage('Each child ID must be valid'),
  body('driverId')
    .optional()
    .isMongoId().withMessage('Invalid driver ID'),
  handleValidationErrors,
];

// ============================================================
// PAYMENT VALIDATION
// ============================================================

const validateMomoPayment = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isInt({ min: 500, max: 10000000 }).withMessage('Amount must be between 500 and 10,000,000 UGX'),
  body('provider')
    .trim()
    .notEmpty().withMessage('Provider is required')
    .isIn(['MTN', 'Airtel']).withMessage('Provider must be MTN or Airtel'),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone is required')
    .matches(/^\+?256\d{9}$/).withMessage('Must be a valid Ugandan phone number'),
  body('narration')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Narration too long')
    .escape(),
  handleValidationErrors,
];

// ============================================================
// SCHOOL VALIDATION
// ============================================================

const validateRegisterSchool = [
  body('name')
    .trim()
    .notEmpty().withMessage('School name is required')
    .isLength({ max: 200 }).withMessage('School name too long')
    .escape(),
  body('headTeacherName')
    .trim()
    .notEmpty().withMessage('Head teacher name is required')
    .isLength({ max: 100 }).withMessage('Name too long')
    .escape(),
  body('headTeacherPhone')
    .trim()
    .notEmpty().withMessage('Phone is required')
    .matches(/^\+?256\d{9}$/).withMessage('Must be a valid Ugandan phone number'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Address too long')
    .escape(),
  handleValidationErrors,
];

// ============================================================
// SICK DAY / EARLY PICKUP
// ============================================================

const validateSickDay = [
  body('childId')
    .trim()
    .notEmpty().withMessage('Child ID is required')
    .isMongoId().withMessage('Invalid child ID'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Reason too long')
    .escape(),
  handleValidationErrors,
];

const validateEmergencyPickup = [
  body('childId')
    .trim()
    .notEmpty().withMessage('Child ID is required')
    .isMongoId().withMessage('Invalid child ID'),
  body('pickupTime')
    .notEmpty().withMessage('Pickup time is required')
    .isISO8601().withMessage('Invalid time format'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Reason too long')
    .escape(),
  handleValidationErrors,
];

// ============================================================
// QUOTE REQUEST VALIDATION
// ============================================================

const validateQuoteRequest = [
  body('pickup')
    .trim()
    .notEmpty().withMessage('Pickup location is required')
    .isLength({ max: 500 }).withMessage('Pickup location too long')
    .escape(),
  body('dropoff')
    .trim()
    .notEmpty().withMessage('Dropoff location is required')
    .isLength({ max: 500 }).withMessage('Dropoff location too long')
    .escape(),
  body('vehicleType')
    .trim()
    .notEmpty().withMessage('Vehicle type is required')
    .isIn(['taxi', 'bus']).withMessage('Vehicle type must be taxi or bus'),
  body('passengerCount')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Passenger count must be 1-100'),
  handleValidationErrors,
];

const validateSubmitQuote = [
  body('pricePerHead')
    .optional()
    .isInt({ min: 1000 }).withMessage('Price per head must be at least 1,000 UGX'),
  body('flatRate')
    .optional()
    .isInt({ min: 5000 }).withMessage('Flat rate must be at least 5,000 UGX'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Message too long')
    .escape(),
  handleValidationErrors,
];

// ============================================================
// EXPOSED VALIDATORS
// ============================================================
module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateAddKid,
  validateBooking,
  validateVehicle,
  validateWithdrawal,
  validateBankDetails,
  validateCreateTrip,
  validateAssignKids,
  validateMomoPayment,
  validateRegisterSchool,
  validateSickDay,
  validateEmergencyPickup,
  validateQuoteRequest,
  validateSubmitQuote,
};
