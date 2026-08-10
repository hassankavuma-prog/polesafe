// PoleSafe Quote Requests + Photo Verification
// Generic quote negotiation for non-school taxi/bus bookings
// Photo upload endpoints for rides and school trips

const express = require('express');
const router = express.Router();
const { QuoteRequest, Vehicle, User, Ride, SchoolTrip } = require('../database/schema');
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const fs = require('fs');
const path = require('path');

// Base upload directory
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Helper: save base64 photo to disk
function saveBase64Photo(base64Data, prefix) {
  const matches = base64Data.match(/^data:(image\/(\w+));base64,(.+)$/);
  const ext = matches ? matches[2] : 'jpg';
  const buffer = matches
    ? Buffer.from(matches[3], 'base64')
    : Buffer.from(base64Data, 'base64');
  const filename = `${prefix}-${Date.now()}.${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  return `/uploads/${filename}`;
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

    const request = await QuoteRequest.findById(req.params.id);
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

    const request = await QuoteRequest.findById(req.params.id);
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
    const request = await QuoteRequest.findById(req.params.id);
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

    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    if (ride.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'This is not your ride' });
    }

    const url = saveBase64Photo(photo, `ride-selfie-${ride._id}`);
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

    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    if (ride.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'This is not your ride' });
    }

    const url = saveBase64Photo(photo, `ride-kid-${ride._id}`);
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

    const url = saveBase64Photo(photo, `trip-selfie-${trip._id}`);
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

    const url = saveBase64Photo(photo, `trip-kid-${trip._id}`);
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
