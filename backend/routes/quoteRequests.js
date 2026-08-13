// PoleSafe Quote Requests + Photo Verification
// Generic quote negotiation for non-school taxi/bus bookings
// Photo upload endpoints for rides and school trips

const express = require('express');
const router = express.Router();
const { QuoteRequest, Vehicle, User, Ride, SchoolTrip } = require('../database/schema');
const { z } = require('zod');
const { validateTenantScopedQuery } = require('../../lib/engine/hamnah-core.ts');
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const fs = require('fs');
const path = require('path');

const sharp = require('sharp');

// Base upload directory
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Helper: save base64 photo to disk with compression
// Uses sharp to keep files small (saves driver data costs)
async function saveBase64Photo(base64Data, prefix) {
  const matches = base64Data.match(/^data:(image\/(\w+));base64,(.+)$/);
  const ext = 'jpg'; // Always save as JPEG after compression
  let buffer = matches
    ? Buffer.from(matches[3], 'base64')
    : Buffer.from(base64Data, 'base64');

  try {
    // Sharp compression: resize to max 800px width, JPEG quality 60%
    // Keeps photos ~50-80KB instead of 1-3MB
    buffer = await sharp(buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .jpeg({ quality: 60 })
      .toBuffer();
  } catch (err) {
    console.error('⚠️ Sharp compression failed, saving raw:', err.message);
    // Fallback: truncate if still too large
    const maxBytes = 200 * 1024;
    if (buffer.length > maxBytes) {
      buffer = buffer.slice(0, maxBytes);
    }
  }

  const filename = `${prefix}-${Date.now()}.${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  return `/uploads/${filename}`;
}

// ============================================================
// 📸 SELFIE VERIFICATION — Trigger system
// Only fires when something unusual is detected, not every ride
// ============================================================

/**
 * Check if a driver needs to take a selfie before proceeding
 * Triggers: admin flag, new driver, 7+ days since last selfie
 */
async function isSelfieRequired(driver) {
  // 1. Admin explicitly flagged this driver
  if (driver.forceSelfieVerification) return true;

  // 2. New driver (under 10 rides) — never verified before
  if (!driver.lastSelfieAt && (driver.completedRidesCount || 0) < 10) return true;

  // 3. Periodic check — no selfie in 7+ days
  if (driver.lastSelfieAt) {
    const daysSince = (Date.now() - new Date(driver.lastSelfieAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince >= 7) return true;
  }

  // 4. Future: suspicious login, different device, location anomaly
  return false;
}

/**
 * Record a completed selfie and clear any flags
 */
async function recordSelfie(driverId) {
  const User = require('../database/schema').User;
  await User.findByIdAndUpdate(driverId, {
    lastSelfieAt: new Date(),
    forceSelfieVerification: false,
  });
}

// ============================================================
// 📋 QUOTE REQUESTS — Non-school taxi/bus bookings
// ============================================================

/**
 * POST /api/quote-requests — Create a quote request
 * Parent or school admin needs a taxi/bus, wants driver quotes
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { role, _id } = req.user;
    if (role !== 'parent' && role !== 'school_admin') {
      return res.status(403).json({ error: 'Only parents and school admins can request quotes' });
    }

    const {
      pickupAddress, pickupCoordinates,
      dropoffAddress, dropoffCoordinates,
      pickupTime, passengerCount, vehicleType, notes,
    } = req.body;

    if (!vehicleType || !['taxi', 'bus'].includes(vehicleType)) {
      return res.status(400).json({ error: 'vehicleType must be taxi or bus' });
    }

    if (!pickupAddress || !dropoffAddress) {
      return res.status(400).json({ error: 'pickupAddress and dropoffAddress are required' });
    }

    const request = new QuoteRequest({
      requesterId: _id,
      requesterRole: role,
      pickupLocation: {
        address: pickupAddress,
        coordinates: pickupCoordinates || [],
      },
      dropoffLocation: {
        address: dropoffAddress,
        coordinates: dropoffCoordinates || [],
      },
      pickupTime: pickupTime || new Date(),
      passengerCount: passengerCount || 1,
      vehicleType,
      notes,
      status: 'open',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h expiry
    });

    await request.save();
    res.status(201).json(request);
  } catch (err) {
    console.error('❌ Create quote request error:', err);
    res.status(500).json({ error: 'Failed to create quote request' });
  }
});

/**
 * GET /api/quote-requests/open — Drivers see open quote requests
 */
router.get('/open', authMiddleware, requireRole('driver'), async (req, res) => {
  try {
    const requests = await QuoteRequest.find({
      status: 'open',
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .select('-quotes') // Don't expose other driver's quotes
      .lean();

    res.json(requests);
  } catch (err) {
    console.error('❌ Open quote requests error:', err);
    res.status(500).json({ error: 'Failed to list open quote requests' });
  }
});

/**
 * GET /api/quote-requests/mine — Requester sees their requests
 */
router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const requests = await QuoteRequest.find({
      requesterId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .populate('quotes.driverId', 'name phone')
      .populate('quotes.vehicleId', 'type registrationNumber capacity busLabel');

    res.json(requests);
  } catch (err) {
    console.error('❌ My quote requests error:', err);
    res.status(500).json({ error: 'Failed to list your quote requests' });
  }
});

/**
 * POST /api/quote-requests/:id/quote — Driver quotes on a request
 */
router.post('/:id/quote', authMiddleware, requireRole('driver'), async (req, res) => {
  try {
    const { pricingModel, pricePerHead, flatRate, message } = req.body;

    if (!pricingModel || !['per_head', 'flat_rate'].includes(pricingModel)) {
      return res.status(400).json({ error: 'pricingModel must be per_head or flat_rate' });
    }

    const requestScope = validateTenantScopedQuery(z.object({ id: z.string().min(1) }).strict(), { id: req.params.id }, req.user._id.toString(), ['quote:request']);
    const request = await QuoteRequest.findById(requestScope.tenantScopedQuery.id);
    if (!request) return res.status(404).json({ error: 'Quote request not found' });
    if (request.status !== 'open') return res.status(400).json({ error: 'Request is no longer open' });

    // Find driver's taxi/bus
    const vehicle = await Vehicle.findOne({
      driverId: req.user._id,
      type: { $in: ['taxi', 'bus'] },
      isApproved: true,
    });
    if (!vehicle) {
      return res.status(400).json({ error: 'No approved taxi/bus vehicle found' });
    }

    if (pricingModel === 'per_head' && (!pricePerHead || pricePerHead <= 0)) {
      return res.status(400).json({ error: 'pricePerHead required for per_head pricing' });
    }
    if (pricingModel === 'flat_rate' && (!flatRate || flatRate <= 0)) {
      return res.status(400).json({ error: 'flatRate required for flat_rate pricing' });
    }

    // Update existing quote or add new
    const existing = request.quotes.find(
      q => q.driverId.toString() === req.user._id.toString() && q.status === 'pending'
    );

    if (existing) {
      existing.pricingModel = pricingModel;
      existing.pricePerHead = pricePerHead || 0;
      existing.flatRate = flatRate || 0;
      existing.message = message || existing.message;
      existing.quotedAt = new Date();
    } else {
      request.quotes.push({
        driverId: req.user._id,
        vehicleId: vehicle._id,
        pricingModel,
        pricePerHead: pricePerHead || 0,
        flatRate: flatRate || 0,
        message,
      });
    }

    await request.save();
    res.json({ message: 'Quote submitted' });
  } catch (err) {
    console.error('❌ Quote on request error:', err);
    res.status(500).json({ error: 'Failed to submit quote' });
  }
});

/**
 * POST /api/quote-requests/:id/accept — Requester accepts a quote
 * Creates a Ride record from the accepted quote
 */
router.post('/:id/accept', authMiddleware, async (req, res) => {
  try {
    const { quoteIndex } = req.body;
    if (quoteIndex === undefined || quoteIndex < 0) {
      return res.status(400).json({ error: 'quoteIndex is required' });
    }

    const requestScope = validateTenantScopedQuery(z.object({ id: z.string().min(1) }).strict(), { id: req.params.id }, req.user._id.toString(), ['quote:request']);
    const request = await QuoteRequest.findById(requestScope.tenantScopedQuery.id);
    if (!request) return res.status(404).json({ error: 'Quote request not found' });

    if (request.requesterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'This is not your quote request' });
    }

    if (request.status !== 'open') {
      return res.status(400).json({ error: 'Request is no longer open' });
    }

    const quote = request.quotes[quoteIndex];
    if (!quote || quote.status !== 'pending') {
      return res.status(404).json({ error: 'Quote not available' });
    }

    // Decline all other quotes
    request.quotes.forEach((q, i) => {
      if (i !== quoteIndex) q.status = 'declined';
    });

    // Accept this quote
    quote.status = 'accepted';
    request.status = 'confirmed';
    request.acceptedQuoteIndex = quoteIndex;

    // Create Ride record from accepted quote
    const price = quote.pricingModel === 'per_head'
      ? quote.pricePerHead * request.passengerCount
      : quote.flatRate;

    const commission = Math.round(price * 0.05);
    const payout = price - commission;

    const ride = new Ride({
      childId: req.user._id, // For non-school rides, the requester IS the passenger
      driverId: quote.driverId,
      parentId: req.user._id,
      type: 'ride_hailing',
      isRideHailing: true,
      passengerName: req.user.name || 'Quote Request',
      pickupLocation: {
        address: request.pickupLocation?.address,
        coordinates: request.pickupLocation?.coordinates || [],
      },
      dropoffLocation: {
        address: request.dropoffLocation?.address,
        coordinates: request.dropoffLocation?.coordinates || [],
      },
      scheduledPickupTime: request.pickupTime,
      totalPrice: price,
      driverPayout: payout,
      poleSafeCommission: commission,
      status: 'scheduled',
    });

    await ride.save();

    // Link ride to quote request
    request.rideId = ride._id;
    await request.save();

    res.json({
      message: 'Quote accepted — ride created',
      rideId: ride._id,
      price,
      driverPayout: payout,
      poleSafeCommission: commission,
    });
  } catch (err) {
    console.error('❌ Accept quote error:', err);
    res.status(500).json({ error: 'Failed to accept quote' });
  }
});

/**
 * DELETE /api/quote-requests/:id — Cancel a quote request
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const requestScope = validateTenantScopedQuery(z.object({ id: z.string().min(1) }).strict(), { id: req.params.id }, req.user._id.toString(), ['quote:request']);
    const request = await QuoteRequest.findById(requestScope.tenantScopedQuery.id);
    if (!request) return res.status(404).json({ error: 'Quote request not found' });

    if (request.requesterId.toString() !== req.user._id.toString() && req.user.role !== 'polesafe_admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    request.status = 'cancelled';
    await request.save();
    res.json({ message: 'Quote request cancelled' });
  } catch (err) {
    console.error('❌ Cancel quote request error:', err);
    res.status(500).json({ error: 'Failed to cancel quote request' });
  }
});

// ============================================================
// 📸 PHOTO VERIFICATION — Rides
// ============================================================

/**
 * POST /api/rides/:id/photo/selfie — Driver uploads selfie on ride pickup
 */
router.post('/rides/:id/photo/selfie', authMiddleware, requireRole('driver'), async (req, res) => {
  try {
    const { photo } = req.body;
    if (!photo) return res.status(400).json({ error: 'photo (base64) is required' });

    const rideScope = validateTenantScopedQuery(z.object({ id: z.string().min(1) }).strict(), { id: req.params.id }, req.user._id.toString(), ['quote:ride']);
    const ride = await Ride.findById(rideScope.tenantScopedQuery.id);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    if (ride.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'This is not your ride' });
    }

    const url = await saveBase64Photo(photo, `ride-selfie-${ride._id}`);
    ride.photos = ride.photos || {};
    ride.photos.driverSelfie = url;
    ride.photos.selfieTakenAt = new Date();
    await ride.save();

    res.json({ message: 'Selfie captured', photoUrl: url });
  } catch (err) {
    console.error('❌ Ride selfie error:', err);
    res.status(500).json({ error: 'Failed to save selfie' });
  }
});

/**
 * POST /api/rides/:id/photo/kid — Driver uploads kid pickup photo
 */
router.post('/rides/:id/photo/kid', authMiddleware, requireRole('driver'), async (req, res) => {
  try {
    const { photo, childId } = req.body;
    if (!photo) return res.status(400).json({ error: 'photo (base64) is required' });

    const rideScope = validateTenantScopedQuery(z.object({ id: z.string().min(1) }).strict(), { id: req.params.id }, req.user._id.toString(), ['quote:ride']);
    const ride = await Ride.findById(rideScope.tenantScopedQuery.id);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    if (ride.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'This is not your ride' });
    }

    const url = await saveBase64Photo(photo, `ride-kid-${ride._id}`);
    ride.photos = ride.photos || {};
    if (!ride.photos.kidPickups) ride.photos.kidPickups = [];

    ride.photos.kidPickups.push({
      childId: childId || ride.childId,
      photoUrl: url,
      timestamp: new Date(),
    });
    await ride.save();

    res.json({ message: 'Kid pickup photo captured', photoUrl: url });
  } catch (err) {
    console.error('❌ Ride kid photo error:', err);
    res.status(500).json({ error: 'Failed to save kid photo' });
  }
});

// ============================================================
// 🔍 SELFIE CHECK — Driver checks before starting a ride
// ============================================================

/**
 * GET /api/selfie/check — Driver checks if selfie is needed
 * Returns { selfieRequired: true/false, reason } so the app knows whether to prompt
 */
router.get('/selfie/check', authMiddleware, requireRole('driver'), async (req, res) => {
  try {
    const driver = await User.findById(req.user._id).select(
      'lastSelfieAt forceSelfieVerification completedRidesCount'
    );
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    const required = await isSelfieRequired(driver);
    let reason = null;
    if (required) {
      if (driver.forceSelfieVerification) reason = 'Admin verification request';
      else if (!driver.lastSelfieAt) reason = 'First-time driver verification';
      else reason = 'Periodic security check (7+ days)';
    }

    res.json({
      selfieRequired: required,
      reason,
      lastSelfieAt: driver.lastSelfieAt,
      nextCheckDue: driver.lastSelfieAt
        ? new Date(new Date(driver.lastSelfieAt).getTime() + 7 * 24 * 60 * 60 * 1000)
        : null,
    });
  } catch (err) {
    console.error('❌ Selfie check error:', err);
    res.status(500).json({ error: 'Failed to check selfie status' });
  }
});

/**
 * POST /api/selfie/verify — Driver submits a verification selfie
 * Records to profile, clears flags. Good for 7 days.
 */
router.post('/selfie/verify', authMiddleware, requireRole('driver'), async (req, res) => {
  try {
    const { photo } = req.body;
    if (!photo) return res.status(400).json({ error: 'photo (base64) is required' });

    const url = await saveBase64Photo(photo, `driver-verify-${req.user._id}`);
    await recordSelfie(req.user._id);

    // Update driver's profile photo if they don't have one
    const driver = await User.findById(req.user._id);
    if (!driver.driverPhotoUrl) {
      driver.driverPhotoUrl = url;
      await driver.save();
    }

    res.json({
      message: 'Verification selfie captured',
      photoUrl: url,
      nextCheckDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  } catch (err) {
    console.error('❌ Selfie verify error:', err);
    res.status(500).json({ error: 'Failed to verify selfie' });
  }
});

/**
 * GET /api/selfie/my-photos — Driver sees their photo history
 */
router.get('/selfie/my-photos', authMiddleware, requireRole('driver'), async (req, res) => {
  try {
    const rides = await Ride.find({
      driverId: req.user._id,
      'photos.driverSelfie': { $exists: true, $ne: null },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('photos.driverSelfie photos.selfieTakenAt createdAt')
      .lean();

    const trips = await SchoolTrip.find({
      driverId: req.user._id,
      'photos.driverSelfie': { $exists: true, $ne: null },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('photos.driverSelfie photos.selfieTakenAt createdAt')
      .lean();

    res.json({ rides, trips });
  } catch (err) {
    console.error('❌ My photos error:', err);
    res.status(500).json({ error: 'Failed to list photos' });
  }
});

// ============================================================
// 🛡️ ADMIN — Selfie verification controls
// ============================================================

/**
 * POST /api/admin/selfie/request/:driverId — Admin flags a driver for selfie check
 */
router.post('/admin/selfie/request/:driverId', authMiddleware, requireRole('polesafe_admin'), async (req, res) => {
  try {
    const driver = await User.findByIdAndUpdate(
      req.params.driverId,
      { forceSelfieVerification: true },
      { new: true }
    ).select('name phone driverIdNumber forceSelfieVerification');

    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    // Flag active rides too
    await Ride.updateMany(
      { driverId: req.params.driverId, status: { $nin: ['completed', 'cancelled'] } },
      { selfieVerificationRequired: true }
    );

    res.json({
      message: `Selfie verification flagged for ${driver.name}`,
      driver: { id: driver._id, name: driver.name, driverIdNumber: driver.driverIdNumber },
    });
  } catch (err) {
    console.error('❌ Admin selfie flag error:', err);
    res.status(500).json({ error: 'Failed to flag driver for selfie check' });
  }
});

/**
 * GET /api/admin/selfie/drivers — Admin sees all drivers' selfie status
 */
router.get('/admin/selfie/drivers', authMiddleware, requireRole('polesafe_admin'), async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver' }).select(
      'name phone driverIdNumber lastSelfieAt forceSelfieVerification completedRidesCount createdAt isDriverIdVerified'
    );

    const enriched = drivers.map(d => ({
      ...d.toObject(),
      needsSelfie: !d.lastSelfieAt || d.forceSelfieVerification,
    }));

    res.json(enriched);
  } catch (err) {
    console.error('❌ Admin drivers list error:', err);
    res.status(500).json({ error: 'Failed to list drivers' });
  }
});

/**
 * POST /api/admin/selfie/clear/:driverId — Admin clears a driver's selfie flag
 */
router.post('/admin/selfie/clear/:driverId', authMiddleware, requireRole('polesafe_admin'), async (req, res) => {
  try {
    const driver = await User.findByIdAndUpdate(
      req.params.driverId,
      { forceSelfieVerification: false, lastSelfieAt: new Date() },
      { new: true }
    ).select('name phone driverIdNumber');

    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    res.json({ message: `Selfie verification cleared for ${driver.name}` });
  } catch (err) {
    console.error('❌ Admin selfie clear error:', err);
    res.status(500).json({ error: 'Failed to clear selfie flag' });
  }
});

// ============================================================
// 📸 PHOTO VERIFICATION — School Trips
// ============================================================

/**
 * POST /api/trips/:tripId/photo/selfie — Driver uploads selfie
 */
router.post('/trips/:tripId/photo/selfie', authMiddleware, requireRole('driver'), async (req, res) => {
  try {
    const { photo } = req.body;
    if (!photo) return res.status(400).json({ error: 'photo (base64) is required' });

    const trip = await SchoolTrip.findById(req.params.tripId);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (!trip.driverId || trip.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'This is not your trip' });
    }

    const url = await saveBase64Photo(photo, `trip-selfie-${trip._id}`);
    trip.photos = trip.photos || {};
    trip.photos.driverSelfie = url;
    trip.photos.selfieTakenAt = new Date();
    await trip.save();

    res.json({ message: 'Selfie captured', photoUrl: url });
  } catch (err) {
    console.error('❌ Trip selfie error:', err);
    res.status(500).json({ error: 'Failed to save selfie' });
  }
});

/**
 * POST /api/trips/:tripId/photo/kid — Driver uploads kid boarding photo
 */
router.post('/trips/:tripId/photo/kid', authMiddleware, requireRole('driver'), async (req, res) => {
  try {
    const { photo, childId } = req.body;
    if (!photo) return res.status(400).json({ error: 'photo (base64) is required' });

    const trip = await SchoolTrip.findById(req.params.tripId);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (!trip.driverId || trip.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'This is not your trip' });
    }

    const url = await saveBase64Photo(photo, `trip-kid-${trip._id}`);
    trip.photos = trip.photos || {};
    if (!trip.photos.kidBoarding) trip.photos.kidBoarding = [];

    trip.photos.kidBoarding.push({
      childId: childId,
      photoUrl: url,
      timestamp: new Date(),
    });
    await trip.save();

    res.json({ message: 'Kid boarding photo captured', photoUrl: url });
  } catch (err) {
    console.error('❌ Trip kid photo error:', err);
    res.status(500).json({ error: 'Failed to save kid photo' });
  }
});

module.exports = router;
