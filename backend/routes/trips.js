// PoleSafe Trips API — School Tour/Trip Booking System
// Covers: create trip, assign kids, driver confirm, tracking, fleet management

const express = require('express');
const router = express.Router();
const { SchoolTrip, Vehicle, User, Child, School, Ride } = require('../database/schema');
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const PhoneMaskingService = require('../services/phoneMaskingService');

// ============================================================
// 🏫 TRIP MANAGEMENT — School Admin
// ============================================================

/**
 * POST /api/trips — Create a new school trip
 * School admin fills in trip details and selects a vehicle
 */
router.post('/', authMiddleware, requireRole('school_admin'), async (req, res) => {
  try {
    const { schoolId } = req.user;
    const {
      tripName, description, destination,
      departureDate, returnDate, departureTime, returnTime,
      vehicleId, busLabel,
      pricePerHead, pricingModel, flatRate, paymentMethod, commissionRate,
    } = req.body;

    if (!tripName || !destination || !departureDate) {
      return res.status(400).json({ error: 'tripName, destination, and departureDate are required' });
    }

    // If a vehicle is specified, use its capacity
    let maxSeats = 0;
    let driverId = null;
    let vehicleSource = 'external';

    if (vehicleId) {
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      maxSeats = vehicle.capacity || 0;
      vehicleSource = vehicle.ownerModel === 'School' ? 'fleet' : 'external';
      driverId = vehicle.driverId;
    }

    // Calculate pricing
    const model = pricingModel || (vehicleSource === 'fleet' ? 'free' : 'per_head');
    const perHead = pricePerHead || 0;
    const flat = flatRate || 0;
    const commRate = commissionRate || 0.05;

    let total = 0;
    let payout = 0;
    let commission = 0;

    if (model === 'per_head') {
      // Total = pricePerHead × seats (calculated fully when kids assigned)
      total = 0; // Will recalculate on assign
    } else if (model === 'flat_rate') {
      total = flat;
    }
    // free = 0

    const trip = new SchoolTrip({
      schoolId,
      createdBy: req.user._id,
      tripName,
      description,
      destination,
      departureDate,
      returnDate,
      departureTime,
      returnTime,
      vehicleId,
      driverId,
      vehicleSource,
      maxSeats,
      busLabel,
      // Pricing
      pricingModel: model,
      pricePerHead: perHead,
      flatRate: flat,
      totalTripCost: total,
      paymentMethod: paymentMethod || 'parent_pay',
      commissionRate: commRate,
      // Status
      status: vehicleId ? 'open' : 'draft',
    });

    await trip.save();
    res.status(201).json(trip);
  } catch (err) {
    console.error('❌ Create trip error:', err);
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

/**
 * GET /api/trips — List trips for a school
 * Supports filtering by status, date range
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { schoolId, role } = req.user;
    const { status, fromDate, toDate, driverId } = req.query;

    const filter = {};

    // Scope based on role
    if (role === 'school_admin') {
      filter.schoolId = schoolId;
    } else if (role === 'driver') {
      filter.driverId = req.user._id;
    } else if (role === 'parent') {
      // Parents see trips their kids are on
      const children = await Child.find({ parentId: req.user._id });
      const childIds = children.map(c => c._id);
      filter['assignedKids.childId'] = { $in: childIds };
    } else if (role === 'polesafe_admin') {
      // Admin can see all (optional schoolId filter)
      if (schoolId) filter.schoolId = schoolId;
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (status) filter.status = status;
    if (fromDate) filter.departureDate = { $gte: new Date(fromDate) };
    if (toDate) {
      filter.departureDate = filter.departureDate || {};
      filter.departureDate.$lte = new Date(toDate);
    }
    if (driverId) filter.driverId = driverId;

    const trips = await SchoolTrip.find(filter)
      .sort({ departureDate: 1 })
      .populate('vehicleId', 'type registrationNumber capacity busLabel')
      .populate('driverId', 'name phone')
      .lean();

    // For drivers: hide kid names until they've arrived at school
    if (role === 'driver') {
      trips.forEach(trip => {
        if (!trip.kidsRevealed) {
          // Return count and class info, but no names
          trip.assignedKids = trip.assignedKids.map(kid => ({
            ...kid,
            childName: kid.kidsRevealed ? kid.childName : `Child #${kid.childId?.toString().slice(-4)}`,
            parentPhone: '*** MASKED ***',
          }));
        } else {
          // Names revealed — but still mask phone numbers
          trip.assignedKids = trip.assignedKids.map(kid => ({
            ...kid,
            parentPhone: '*** MASKED ***',
          }));
        }
      });
    }

    // For parents: show their kid only, mask driver phone
    if (role === 'parent') {
      trips.forEach(trip => {
        trip.assignedKids = trip.assignedKids.filter(
          kid => kid.parentId?.toString() === req.user._id.toString()
        );
      });
    }

    res.json(trips);
  } catch (err) {
    console.error('❌ List trips error:', err);
    res.status(500).json({ error: 'Failed to list trips' });
  }
});

/**
 * GET /api/trips/:id — Get single trip with full details
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const trip = await SchoolTrip.findById(req.params.id)
      .populate('vehicleId', 'type registrationNumber capacity busLabel')
      .populate('driverId', 'name phone')
      .populate('createdBy', 'name');

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Role-based data filtering
    const { role } = req.user;

    // Convert to plain object
    const tripObj = trip.toObject();

    if (role === 'driver') {
      if (!trip.kidsRevealed) {
        tripObj.assignedKids = trip.assignedKids.map(kid => ({
          childId: kid.childId,
          className: kid.className,
          childName: `Child #${kid.childId?.toString().slice(-4)}`,
          parentPhone: '*** MASKED ***',
          assignedAt: kid.assignedAt,
        }));
      } else {
        tripObj.assignedKids = trip.assignedKids.map(kid => ({
          ...kid,
          parentPhone: '*** MASKED ***',
        }));
      }

      // Generate masked contact if trip is active
      if (['confirmed', 'in_progress'].includes(trip.status)) {
        const driverPhone = req.user.phone;
        // Find first parent to generate a contact session
        const firstKid = tripObj.assignedKids[0];
        if (firstKid?.parentId) {
          const parent = await User.findById(firstKid.parentId);
          if (parent) {
            const session = PhoneMaskingService.createSession({
              tripId: trip._id.toString(),
              parentPhone: parent.phone,
              driverPhone,
            });
            tripObj.contact = {
              maskedId: session.driverMaskedId,
              expiresAt: session.expiresAt,
            };
          }
        }
      }
    }

    if (role === 'parent') {
      tripObj.assignedKids = trip.assignedKids.filter(
        kid => kid.parentId?.toString() === req.user._id.toString()
      );

      // Generate masked contact for parent
      if (['confirmed', 'in_progress'].includes(trip.status)) {
        const driver = await User.findById(trip.driverId);
        if (driver) {
          const session = PhoneMaskingService.createSession({
            tripId: trip._id.toString(),
            parentPhone: req.user.phone,
            driverPhone: driver.phone,
          });
          tripObj.contact = {
            maskedId: session.parentMaskedId,
            expiresAt: session.expiresAt,
          };
        }
      }
    }

    res.json(tripObj);
  } catch (err) {
    console.error('❌ Get trip error:', err);
    res.status(500).json({ error: 'Failed to get trip' });
  }
});

/**
 * PATCH /api/trips/:id — Update trip details
 */
router.patch('/:id', authMiddleware, requireRole('school_admin'), async (req, res) => {
  try {
    const trip = await SchoolTrip.findOne({
      _id: req.params.id,
      schoolId: req.user.schoolId,
      status: { $in: ['draft', 'open'] },
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or cannot be edited' });
    }

    const allowed = [
      'tripName', 'description', 'destination',
      'departureDate', 'returnDate', 'departureTime', 'returnTime',
      'busLabel',
    ];

    allowed.forEach(field => {
      if (req.body[field] !== undefined) {
        trip[field] = req.body[field];
      }
    });

    await trip.save();
    res.json(trip);
  } catch (err) {
    console.error('❌ Update trip error:', err);
    res.status(500).json({ error: 'Failed to update trip' });
  }
});

/**
 * DELETE /api/trips/:id — Cancel/delete a trip
 */
router.delete('/:id', authMiddleware, requireRole('school_admin'), async (req, res) => {
  try {
    const trip = await SchoolTrip.findOneAndUpdate(
      {
        _id: req.params.id,
        schoolId: req.user.schoolId,
        status: { $in: ['draft', 'open', 'confirmed'] },
      },
      { status: 'cancelled' },
      { new: true }
    );

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or cannot be cancelled' });
    }

    // End any active phone masking sessions
    PhoneMaskingService.endSession(trip._id.toString());

    res.json({ message: 'Trip cancelled', trip });
  } catch (err) {
    console.error('❌ Delete trip error:', err);
    res.status(500).json({ error: 'Failed to cancel trip' });
  }
});

// ============================================================
// 👦 KID ASSIGNMENT
// ============================================================

/**
 * POST /api/trips/:id/assign — Assign kids to a trip
 * Enforces capacity limits
 */
router.post('/:id/assign', authMiddleware, requireRole('school_admin'), async (req, res) => {
  try {
    const { childIds } = req.body;

    if (!childIds || !Array.isArray(childIds) || childIds.length === 0) {
      return res.status(400).json({ error: 'childIds array is required' });
    }

    const trip = await SchoolTrip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (trip.status !== 'draft' && trip.status !== 'open') {
      return res.status(400).json({ error: 'Can only assign kids to draft or open trips' });
    }

    // Get the children
    const children = await Child.find({ _id: { $in: childIds } });
    if (children.length === 0) {
      return res.status(404).json({ error: 'No children found' });
    }

    // Check capacity
    const newSeatsNeeded = children.length;
    if (trip.seatsFilled + newSeatsNeeded > trip.maxSeats) {
      return res.status(400).json({
        error: `Capacity exceeded. ${trip.seatsFilled}/${trip.maxSeats} seats filled. ${newSeatsNeeded} more would exceed limit.`,
        seatsFilled: trip.seatsFilled,
        maxSeats: trip.maxSeats,
        attemptedAdd: newSeatsNeeded,
      });
    }

    // Check for duplicates
    const existingChildIds = new Set(trip.assignedKids.map(k => k.childId.toString()));
    const newKids = [];

    for (const child of children) {
      if (existingChildIds.has(child._id.toString())) {
        continue; // Skip duplicates
      }

      newKids.push({
        childId: child._id,
        childName: child.name,
        className: child.class,
        parentId: child.parentId,
        parentPhone: null, // Filled below
      });

      existingChildIds.add(child._id.toString());
    }

    // Fill parent phone numbers
    const parentIds = [...new Set(newKids.map(k => k.parentId))];
    const parents = await User.find({ _id: { $in: parentIds } }).select('phone');
    const parentPhoneMap = {};
    parents.forEach(p => { parentPhoneMap[p._id.toString()] = p.phone; });

    newKids.forEach(kid => {
      kid.parentPhone = parentPhoneMap[kid.parentId.toString()] || null;
    });

    // Add to trip
    trip.assignedKids.push(...newKids);
    trip.seatsFilled = trip.assignedKids.length;

    // Auto-calculate total cost for per_head pricing
    if (trip.pricingModel === 'per_head') {
      trip.totalTripCost = trip.pricePerHead * trip.seatsFilled;
      trip.driverPayout = Math.round(trip.totalTripCost * (1 - trip.commissionRate));
      trip.poleSafeCommission = trip.totalTripCost - trip.driverPayout;
    }

    await trip.save();

    res.json({
      message: `${newKids.length} kids assigned`,
      seatsFilled: trip.seatsFilled,
      maxSeats: trip.maxSeats,
      assignedKids: trip.assignedKids.length,
      totalTripCost: trip.totalTripCost,
      pricePerHead: trip.pricePerHead,
      driverPayout: trip.driverPayout,
    });
  } catch (err) {
    console.error('❌ Assign kids error:', err);
    res.status(500).json({ error: 'Failed to assign kids' });
  }
});

/**
 * POST /api/trips/:id/remove-child — Remove a child from the trip
 */
router.post('/:id/remove-child', authMiddleware, requireRole('school_admin'), async (req, res) => {
  try {
    const { childId } = req.body;
    if (!childId) {
      return res.status(400).json({ error: 'childId is required' });
    }

    const trip = await SchoolTrip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (trip.status !== 'draft' && trip.status !== 'open') {
      return res.status(400).json({ error: 'Can only modify draft or open trips' });
    }

    trip.assignedKids = trip.assignedKids.filter(
      k => k.childId.toString() !== childId
    );
    trip.seatsFilled = trip.assignedKids.length;
    await trip.save();

    res.json({
      message: 'Child removed',
      seatsFilled: trip.seatsFilled,
      maxSeats: trip.maxSeats,
    });
  } catch (err) {
    console.error('❌ Remove child error:', err);
    res.status(500).json({ error: 'Failed to remove child' });
  }
});

/**
 * POST /api/trips/:id/assign-vehicle — Assign or change vehicle
 */
router.post('/:id/assign-vehicle', authMiddleware, requireRole('school_admin'), async (req, res) => {
  try {
    const { vehicleId } = req.body;
    if (!vehicleId) {
      return res.status(400).json({ error: 'vehicleId is required' });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    if (!['taxi', 'bus'].includes(vehicle.type)) {
      return res.status(400).json({ error: 'Only taxi and bus vehicles can be used for trips' });
    }

    // Check school fleet access
    if (vehicle.ownerModel === 'School') {
      const trip = await SchoolTrip.findById(req.params.id);
      if (!trip) return res.status(404).json({ error: 'Trip not found' });
      if (vehicle.schoolId?.toString() !== trip.schoolId.toString()) {
        return res.status(403).json({ error: 'This vehicle belongs to another school' });
      }
    }

    const trip = await SchoolTrip.findByIdAndUpdate(
      req.params.id,
      {
        vehicleId: vehicle._id,
        driverId: vehicle.driverId,
        maxSeats: vehicle.capacity || 0,
        vehicleSource: vehicle.ownerModel === 'School' ? 'fleet' : 'external',
        busLabel: vehicle.busLabel || trip.busLabel,
        status: 'open',
      },
      { new: true }
    );

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json({ message: 'Vehicle assigned', trip });
  } catch (err) {
    console.error('❌ Assign vehicle error:', err);
    res.status(500).json({ error: 'Failed to assign vehicle' });
  }
});

// ============================================================
// 🚗 DRIVER ACTIONS
// ============================================================

/**
 * GET /api/trips/driver — Get trips assigned to current driver
 */
router.get('/driver', authMiddleware, requireRole('driver'), async (req, res) => {
  try {
    const trips = await SchoolTrip.find({
      driverId: req.user._id,
      status: { $in: ['open', 'confirmed', 'in_progress'] },
    })
      .sort({ departureDate: 1 })
      .populate('vehicleId', 'type registrationNumber capacity busLabel')
      .lean();

    // Hide kid names unless driver has arrived at school
    trips.forEach(trip => {
      if (!trip.kidsRevealed) {
        trip.assignedKids = trip.assignedKids.map(kid => ({
          ...kid,
          childName: `Child #${kid.childId?.toString().slice(-4)}`,
          parentPhone: '*** MASKED ***',
        }));
      } else {
        trip.assignedKids = trip.assignedKids.map(kid => ({
          ...kid,
          parentPhone: '*** MASKED ***',
        }));
      }

      // Generate masked contact for active trips
      if (['confirmed', 'in_progress'].includes(trip.status) && trip.kidsRevealed) {
        // Contact info generated on individual GET
      }
    });

    res.json(trips);
  } catch (err) {
    console.error('❌ Driver trips error:', err);
    res.status(500).json({ error: 'Failed to get driver trips' });
  }
});

/**
 * POST /api/trips/:id/confirm — Driver confirms the trip
 */
router.post('/:id/confirm', authMiddleware, requireRole('driver'), async (req, res) => {
  try {
    const trip = await SchoolTrip.findOneAndUpdate(
      {
        _id: req.params.id,
        driverId: req.user._id,
        status: 'open',
      },
      {
        status: 'confirmed',
        driverConfirmedAt: new Date(),
      },
      { new: true }
    );

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or already confirmed' });
    }

    res.json({ message: 'Trip confirmed', trip });
  } catch (err) {
    console.error('❌ Confirm trip error:', err);
    res.status(500).json({ error: 'Failed to confirm trip' });
  }
});

/**
 * POST /api/trips/:id/decline — Driver declines the trip
 */
router.post('/:id/decline', authMiddleware, requireRole('driver'), async (req, res) => {
  try {
    const trip = await SchoolTrip.findOneAndUpdate(
      {
        _id: req.params.id,
        driverId: req.user._id,
        status: 'open',
      },
      {
        status: 'draft',
        driverId: null,
        vehicleId: null,
        driverConfirmedAt: null,
      },
      { new: true }
    );

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or not assignable' });
    }

    res.json({ message: 'Trip declined', trip });
  } catch (err) {
    console.error('❌ Decline trip error:', err);
    res.status(500).json({ error: 'Failed to decline trip' });
  }
});

/**
 * POST /api/trips/:id/arrive — Driver signals arrival at school
 * This reveals kid names to the driver
 */
router.post('/:id/arrive', authMiddleware, requireRole('driver'), async (req, res) => {
  try {
    const trip = await SchoolTrip.findOneAndUpdate(
      {
        _id: req.params.id,
        driverId: req.user._id,
        status: 'confirmed',
      },
      {
        kidsRevealed: true,
        arrivedAtSchool: new Date(),
      },
      { new: true }
    );

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or not in confirmed status' });
    }

    // Return with names now visible
    const tripObj = trip.toObject();
    tripObj.assignedKids = tripObj.assignedKids.map(kid => ({
      ...kid,
      parentPhone: '*** MASKED ***',
    }));

    res.json({
      message: 'Arrived at school — kid names revealed',
      trip: tripObj,
    });
  } catch (err) {
    console.error('❌ Arrive at school error:', err);
    res.status(500).json({ error: 'Failed to record arrival' });
  }
});

/**
 * POST /api/trips/:id/start — Driver starts the trip
 */
router.post('/:id/start', authMiddleware, requireRole('driver'), async (req, res) => {
  try {
    const trip = await SchoolTrip.findOneAndUpdate(
      {
        _id: req.params.id,
        driverId: req.user._id,
        status: 'confirmed',
      },
      {
        status: 'in_progress',
        startedAt: new Date(),
        kidsRevealed: true,
      },
      { new: true }
    );

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or not confirmed' });
    }

    // TODO: Create tracking session
    // TODO: Notify parents and teachers

    res.json({ message: 'Trip started', trip });
  } catch (err) {
    console.error('❌ Start trip error:', err);
    res.status(500).json({ error: 'Failed to start trip' });
  }
});

/**
 * POST /api/trips/:id/complete — Driver completes the trip
 */
router.post('/:id/complete', authMiddleware, requireRole('driver'), async (req, res) => {
  try {
    const trip = await SchoolTrip.findOneAndUpdate(
      {
        _id: req.params.id,
        driverId: req.user._id,
        status: 'in_progress',
      },
      {
        status: 'completed',
        completedAt: new Date(),
      },
      { new: true }
    );

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or not in progress' });
    }

    // End phone masking session
    PhoneMaskingService.endSession(trip._id.toString());

    res.json({ message: 'Trip completed', trip });
  } catch (err) {
    console.error('❌ Complete trip error:', err);
    res.status(500).json({ error: 'Failed to complete trip' });
  }
});

// ============================================================
// 🚌 FLEET MANAGEMENT
// ============================================================

/**
 * GET /api/schools/:id/fleet — List school's fleet vehicles
 */
router.get('/fleet/:schoolId', authMiddleware, async (req, res) => {
  try {
    const { schoolId } = req.params;

    if (req.user.role === 'school_admin' && req.user.schoolId?.toString() !== schoolId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const fleet = await Vehicle.find({
      ownerModel: 'School',
      schoolId,
    }).populate('driverId', 'name phone');

    res.json(fleet);
  } catch (err) {
    console.error('❌ List fleet error:', err);
    res.status(500).json({ error: 'Failed to list fleet' });
  }
});

/**
 * POST /api/schools/:id/fleet — Add a vehicle to school fleet
 */
router.post('/fleet/:schoolId', authMiddleware, requireRole('school_admin'), async (req, res) => {
  try {
    const { schoolId } = req.params;

    if (req.user.schoolId?.toString() !== schoolId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const {
      type, registrationNumber, capacity,
      driverId, busLabel,
    } = req.body;

    if (!type || !['taxi', 'bus'].includes(type)) {
      return res.status(400).json({ error: 'Fleet vehicles must be taxi or bus type' });
    }

    if (!capacity) {
      return res.status(400).json({ error: 'capacity is required' });
    }

    const vehicle = new Vehicle({
      driverId,
      type,
      registrationNumber,
      capacity,
      isApproved: true,
      isAvailable: true,
      owner: schoolId,
      ownerModel: 'School',
      schoolId,
      busLabel: busLabel || `Bus #${Date.now().toString().slice(-3)}`,
    });

    await vehicle.save();

    const populated = await Vehicle.findById(vehicle._id).populate('driverId', 'name phone');
    res.status(201).json(populated);
  } catch (err) {
    console.error('❌ Add fleet vehicle error:', err);
    res.status(500).json({ error: 'Failed to add fleet vehicle' });
  }
});

/**
 * DELETE /api/schools/:id/fleet/:vehicleId — Remove from fleet
 */
router.delete('/fleet/:schoolId/:vehicleId', authMiddleware, requireRole('school_admin'), async (req, res) => {
  try {
    const { schoolId, vehicleId } = req.params;

    const vehicle = await Vehicle.findOneAndDelete({
      _id: vehicleId,
      ownerModel: 'School',
      schoolId,
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ message: 'Vehicle removed from fleet' });
  } catch (err) {
    console.error('❌ Remove fleet vehicle error:', err);
    res.status(500).json({ error: 'Failed to remove fleet vehicle' });
  }
});

// ============================================================
// 📞 CONTACT — Masked phone number endpoints
// ============================================================

/**
 * POST /api/trips/:id/contact — Get masked contact info
 * Both drivers and parents can use this
 */
router.post('/:id/contact', authMiddleware, async (req, res) => {
  try {
    const trip = await SchoolTrip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (!['confirmed', 'in_progress'].includes(trip.status)) {
      return res.status(400).json({ error: 'Trip is not active' });
    }

    const { role, _id, phone } = req.user;
    let contact;

    if (role === 'driver') {
      // Driver wants to contact a parent
      const firstKid = trip.assignedKids[0];
      if (!firstKid?.parentId) {
        return res.status(404).json({ error: 'No parents available for contact' });
      }
      const parent = await User.findById(firstKid.parentId);
      if (!parent) return res.status(404).json({ error: 'Parent not found' });

      const session = PhoneMaskingService.createSession({
        tripId: trip._id.toString(),
        parentPhone: parent.phone,
        driverPhone: phone,
      });
      contact = { maskedId: session.driverMaskedId, expiresAt: session.expiresAt };
    } else if (role === 'parent') {
      // Parent wants to contact the driver
      if (!trip.driverId) return res.status(404).json({ error: 'No driver assigned' });
      const driver = await User.findById(trip.driverId);
      if (!driver) return res.status(404).json({ error: 'Driver not found' });

      const session = PhoneMaskingService.createSession({
        tripId: trip._id.toString(),
        parentPhone: phone,
        driverPhone: driver.phone,
      });
      contact = { maskedId: session.parentMaskedId, expiresAt: session.expiresAt };
    } else {
      return res.status(403).json({ error: 'Only drivers and parents can request contact' });
    }

    res.json(contact);
  } catch (err) {
    console.error('❌ Get contact error:', err);
    res.status(500).json({ error: 'Failed to get contact info' });
  }
});

/**
 * POST /api/trips/contact/resolve — Resolve a masked ID
 * Used internally or by admin to resolve a masked contact
 */
router.post('/contact/resolve', authMiddleware, requireRole('polesafe_admin'), async (req, res) => {
  try {
    const { maskedId } = req.body;
    if (!maskedId) return res.status(400).json({ error: 'maskedId is required' });

    const result = PhoneMaskingService.resolve(maskedId);
    if (!result) {
      return res.status(404).json({ error: 'Contact session not found or expired' });
    }

    res.json(result);
  } catch (err) {
    console.error('❌ Resolve contact error:', err);
    res.status(500).json({ error: 'Failed to resolve contact' });
  }
});

// ============================================================
// 📋 EXTERNAL — List available taxi/bus drivers for booking
// ============================================================

/**
 * GET /api/trips/external-drivers — List available taxi/bus drivers
 * School admin uses this to find third-party vehicles
 */
router.get('/external-drivers', authMiddleware, requireRole('school_admin'), async (req, res) => {
  try {
    const vehicles = await Vehicle.find({
      type: { $in: ['taxi', 'bus'] },
      isApproved: true,
      isAvailable: true,
      ownerModel: 'User',
    }).populate('driverId', 'name phone');

    res.json(vehicles);
  } catch (err) {
    console.error('❌ List external drivers error:', err);
    res.status(500).json({ error: 'Failed to list external drivers' });
  }
});

// ============================================================
// 💰 PAYMENT TRACKING
// ============================================================

/**
 * POST /api/trips/:id/record-payment — Record payment for a kid
 * School admin or parent marks a kid as paid
 */
router.post('/:id/record-payment', authMiddleware, async (req, res) => {
  try {
    const { childId, transactionId } = req.body;
    if (!childId) {
      return res.status(400).json({ error: 'childId is required' });
    }

    const trip = await SchoolTrip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (trip.pricingModel === 'free') {
      return res.status(400).json({ error: 'This trip is free (school fleet). No payment needed.' });
    }

    // Find the kid in assignedKids
    const kidIndex = trip.assignedKids.findIndex(
      k => k.childId.toString() === childId
    );

    if (kidIndex === -1) {
      return res.status(404).json({ error: 'Child not found on this trip' });
    }

    // Check permissions
    const { role, _id } = req.user;
    if (role === 'parent') {
      const kidParentId = trip.assignedKids[kidIndex].parentId?.toString();
      if (kidParentId !== _id.toString()) {
        return res.status(403).json({ error: 'This is not your child' });
      }
    } else if (role !== 'school_admin' && role !== 'polesafe_admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Record payment
    trip.assignedKids[kidIndex].paymentStatus = 'paid';
    trip.assignedKids[kidIndex].paidAt = new Date();
    if (transactionId) {
      trip.assignedKids[kidIndex].transactionId = transactionId;
    }

    // Check if all kids are now paid
    const unpaid = trip.assignedKids.filter(k => k.paymentStatus !== 'paid');
    if (unpaid.length === 0) {
      trip.paymentStatus = 'paid';
      trip.paidAt = new Date();
    } else {
      trip.paymentStatus = 'partially_paid';
    }

    await trip.save();

    res.json({
      message: 'Payment recorded',
      kidPaid: childId,
      paymentStatus: trip.paymentStatus,
      paidCount: trip.assignedKids.filter(k => k.paymentStatus === 'paid').length,
      totalKids: trip.assignedKids.length,
      totalTripCost: trip.totalTripCost,
    });
  } catch (err) {
    console.error('❌ Record payment error:', err);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

/**
 * GET /api/trips/:id/payment-summary — Get payment status summary
 */
router.get('/:id/payment-summary', authMiddleware, async (req, res) => {
  try {
    const trip = await SchoolTrip.findById(req.params.id)
      .select('pricingModel pricePerHead flatRate totalTripCost paymentStatus paidAt commissionRate driverPayout poleSafeCommission assignedKids');

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const paidKids = trip.assignedKids.filter(k => k.paymentStatus === 'paid');
    const unpaidKids = trip.assignedKids.filter(k => k.paymentStatus === 'unpaid');
    const waivedKids = trip.assignedKids.filter(k => k.paymentStatus === 'waived');

    res.json({
      pricingModel: trip.pricingModel,
      pricePerHead: trip.pricePerHead || trip.flatRate || 0,
      totalTripCost: trip.totalTripCost,
      paymentStatus: trip.paymentStatus,
      paidAt: trip.paidAt,

      // Breakdown by pricing model
      ...(trip.pricingModel === 'per_head' && {
        pricePerHead: trip.pricePerHead,
        totalKids: trip.assignedKids.length,
        seatsFilled: trip.seatsFilled,
        calculatedTotal: trip.pricePerHead * trip.assignedKids.length,
      }),

      // Payment counts
      paidCount: paidKids.length,
      unpaidCount: unpaidKids.length,
      waivedCount: waivedKids.length,

      // Payout details
      driverPayout: trip.driverPayout,
      poleSafeCommission: trip.poleSafeCommission,
      commissionRate: trip.commissionRate,
    });
  } catch (err) {
    console.error('❌ Payment summary error:', err);
    res.status(500).json({ error: 'Failed to get payment summary' });
  }
});

module.exports = router;
