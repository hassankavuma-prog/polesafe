const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const phase1 = require('../services/phase1Runtime');
const { Booking, RideRequest, DispatchOffer, Assignment, Ride, Child } = require('../database/schema');

router.use(authMiddleware);

router.post('/phase1/book', requireRole('parent'), async (req, res) => {
  try {
    const result = await phase1.createRideRequestAndBooking({ actor: req.user, childId: req.body.childId, schoolId: req.body.schoolId, vehicleType: req.body.vehicleType, pickupAddress: req.body.pickupAddress, dropoffAddress: req.body.dropoffAddress, pickupAt: req.body.pickupAt, requestKey: req.body.requestKey });
    res.status(201).json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

router.post('/phase1/matching/:bookingId', requireRole('polesafe_admin', 'school_admin', 'parent'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).lean();
    if (!booking) return res.status(404).json({ error: 'booking_not_found' });
    if (!['polesafe_admin', 'school_admin'].includes(req.user.role) && !sameId(req.user._id, booking.parentId)) return res.status(403).json({ error: 'forbidden' });
    const rideRequest = await RideRequest.findById(booking.journeyRequestId).lean();
    const result = await phase1.evaluateMatching({ booking, rideRequest });
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

router.get('/phase1/offers', requireRole('driver'), async (req, res) => {
  try {
    const offers = await phase1.listDriverOffers(req.user._id);
    res.json({ offers });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

router.post('/phase1/offers/:offerId/accept', requireRole('driver'), async (req, res) => {
  try {
    const result = await phase1.acceptOffer({ actor: req.user, driverId: req.user._id, offerId: req.params.offerId });
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

router.post('/phase1/assignments/:assignmentId/arrival', requireRole('driver'), async (req, res) => {
  try {
    const result = await phase1.markArrival({ actor: req.user, driverId: req.user._id, assignmentId: req.params.assignmentId });
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

router.post('/phase1/assignments/:assignmentId/pickup-verify', requireRole('driver'), async (req, res) => {
  try {
    const result = await phase1.verifyPickup({ actor: req.user, driverId: req.user._id, assignmentId: req.params.assignmentId, method: req.body.method });
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

router.post('/phase1/assignments/:assignmentId/start', requireRole('driver'), async (req, res) => {
  try {
    const result = await phase1.startJourney({ actor: req.user, driverId: req.user._id, assignmentId: req.params.assignmentId });
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

function sameId(a, b) { return String(a || '') === String(b || ''); }

module.exports = router;
