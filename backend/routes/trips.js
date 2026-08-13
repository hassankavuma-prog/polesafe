// PoleSafe Trips API — School Tour/Trip Booking System
// Covers: create trip, assign kids, driver confirm, tracking, fleet management

const express = require('express');
const router = express.Router();
const { SchoolTrip, Vehicle, User, Child, School, Ride } = require('../database/schema');
const { z } = require('zod');
const { validateTenantScopedQuery } = require('../../lib/engine/hamnah-core.ts');
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const PhoneMaskingService = require('../services/phoneMaskingService');

// ============================================================
// 🏫 TRIP MANAGEMENT — School Admin
// ============================================================

/**
 * POST /api/trips — Create a new school trip
 * School admin fills in trip details
 * Pricing is set via driver quotes — not at creation
 * For fleet vehicles, admin assigns vehicle directly (free)
 */
router.post('/', authMiddleware, requireRole('school_admin'), async (req, res) => {
  try {
    const { schoolId } = req.user;
    const {
      tripName, description, destination,
      departureDate, returnDate, departureTime, returnTime,
      vehicleId, busLabel,
    } = req.body;

    if (!tripName || !destination || !departureDate) {
      return res.status(400).json({ error: 'tripName, destination, and departureDate are required' });
    }

    // If a fleet vehicle is specified, assign it (free/no negotiation needed)
    let maxSeats = 0;
    let driverId = null;
    let vehicleSource = 'external';
    let pricingModel = 'per_head';

    if (vehicleId) {
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      maxSeats = vehicle.capacity || 0;
      driverId = vehicle.driverId;

      if (vehicle.ownerModel === 'School') {
        // School fleet — free, no driver vehicleSource needed
        vehicleSource = 'fleet';
        pricingModel = 'free';
      } else {
        vehicleSource = 'external';
      }
    }

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
      pricingModel,  // fleet=free, external=per_head (price set via quotes)
      status: vehicleId ? (pricingModel === 'free' ? 'confirmed' : 'open') : 'open',
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
    const tripScope = validateTenantScopedQuery(z.object({ id: z.string().min(1) }).strict(), { id: req.params.id }, req.user._id.toString(), ['trip:view']);
    const trip = await SchoolTrip.findById(tripScope.tenantScopedQuery.id)
      .populate('vehicleId', 'type registrationNumber capacity busLabel')
      .populate('driverId', 'name phone')
      .populate('createdBy', 'name');

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Ownership/role check: verify this user has rights to this trip
    const isSchoolAdmin = req.user.role === 'school_admin' &&
      trip.schoolId && req.user.schoolId &&
      trip.schoolId.toString() === req.user.schoolId.toString();
    const isAssignedDriver = req.user.role === 'driver' &&
      (trip.driverId?._id?.toString() === req.user._id?.toString() ||
       trip.assignedKids?.some(k => k.driverId?.toString() === req.user._id?.toString()));
    const isParent = req.user.role === 'parent' &&
      trip.assignedKids?.some(k => k.parentId?.toString() === req.user._id?.toString());
    const isPoleSafeAdmin = req.user.role === 'polesafe_admin';
    const hasQuote = req.user.role === 'driver' &&
      trip.quotes?.some(q => q.driverId?.toString() === req.user._id?.toString());

    if (!isSchoolAdmin && !isAssignedDriver && !isParent && !isPoleSafeAdmin && !hasQuote) {
      return res.status(403).json({ error: 'Access denied. You do not have access to this trip.' });
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

    const tripScope = validateTenantScopedQuery(z.object({ id: z.string().min(1) }).strict(), { id: req.params.id }, req.user._id.toString(), ['trip:view']);
    const trip = await SchoolTrip.findById(tripScope.tenantScopedQuery.id);
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

    const { Ride } = require('../database/schema');
    const activeRide = await Ride.findById(rideId).populate('childId schoolId driverId parentId');
    if (activeRide) {
      activeRide.status = activeRide.status || 'scheduled';
      activeRide.trackingStatus = 'active';
      activeRide.lastTrackingStartedAt = new Date();
      await activeRide.save();
    }

    // Notify parents and teachers when tracking starts
    console.log(`📍 Tracking started for ride ${rideId}`);

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
// 📋 DRIVER QUOTE NEGOTIATION
// Admin posts trip → drivers quote prices → admin picks
// ============================================================

/**
 * GET /api/trips/open-for-quotes — Drivers see trips needing quotes
 * Shows trips without assigned vehicles that are open for bidding
 */
router.get('/open-for-quotes', authMiddleware, requireRole('driver'), async (req, res) => {
  try {
    const trips = await SchoolTrip.find({
      status: 'open',
      vehicleSource: { $ne: 'fleet' },
      departureDate: { $gte: new Date() },
    })
      .sort({ departureDate: 1 })
      .select('tripName description destination departureDate departureTime returnTime maxSeats seatsFilled busLabel')
      .lean();

    res.json(trips);
  } catch (err) {
    console.error('❌ Open for quotes error:', err);
    res.status(500).json({ error: 'Failed to list trips needing quotes' });
  }
});

/**
 * POST /api/trips/:id/quote — Driver quotes a price on a trip
 */
router.post('/:id/quote', authMiddleware, requireRole('driver'), async (req, res) => {
  try {
    const { pricingModel, pricePerHead, flatRate, message } = req.body;

    if (!pricingModel || !['per_head', 'flat_rate'].includes(pricingModel)) {
      return res.status(400).json({ error: 'pricingModel must be per_head or flat_rate' });
    }

    if (pricingModel === 'per_head' && (!pricePerHead || pricePerHead <= 0)) {
      return res.status(400).json({ error: 'pricePerHead is required and must be > 0' });
    }

    if (pricingModel === 'flat_rate' && (!flatRate || flatRate <= 0)) {
      return res.status(400).json({ error: 'flatRate is required and must be > 0' });
    }

    const trip = await SchoolTrip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (trip.status !== 'open') {
      return res.status(400).json({ error: 'Trip is not open for quotes' });
    }

    // Find driver's vehicle
    const vehicle = await Vehicle.findOne({
      driverId: req.user._id,
      type: { $in: ['taxi', 'bus'] },
      isApproved: true,
    });

    if (!vehicle) {
      return res.status(400).json({ error: 'No approved taxi/bus vehicle found for this driver' });
    }

    // Check if driver already quoted
    const existingQuote = trip.quotes.find(
      q => q.driverId.toString() === req.user._id.toString() &&
           ['pending', 'countered'].includes(q.status)
    );

    if (existingQuote) {
      // Update existing quote (driver can revise)
      existingQuote.pricingModel = pricingModel;
      existingQuote.pricePerHead = pricePerHead || 0;
      existingQuote.flatRate = flatRate || 0;
      existingQuote.message = message || existingQuote.message;
      existingQuote.quotedAt = new Date();
      existingQuote.status = 'pending';
    } else {
      // New quote
      trip.quotes.push({
        driverId: req.user._id,
        vehicleId: vehicle._id,
        pricingModel,
        pricePerHead: pricePerHead || 0,
        flatRate: flatRate || 0,
        message,
        status: 'pending',
      });
    }

    await trip.save();

    res.json({
      message: 'Quote submitted',
      tripId: trip._id,
      pricingModel,
      pricePerHead: pricePerHead || 0,
      flatRate: flatRate || 0,
    });
  } catch (err) {
    console.error('❌ Quote error:', err);
    res.status(500).json({ error: 'Failed to submit quote' });
  }
});

/**
 * GET /api/trips/:id/quotes — Admin sees all quotes for a trip
 */
router.get('/:id/quotes', authMiddleware, requireRole('school_admin'), async (req, res) => {
  try {
    const trip = await SchoolTrip.findById(req.params.id)
      .select('quotes')
      .populate('quotes.driverId', 'name phone')
      .populate('quotes.vehicleId', 'type registrationNumber capacity busLabel');

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json(trip.quotes);
  } catch (err) {
    console.error('❌ Get quotes error:', err);
    res.status(500).json({ error: 'Failed to get quotes' });
  }
});

/**
 * POST /api/trips/:id/accept-quote — Admin accepts a driver's quote
 * Sets the trip's pricing, vehicle, and driver from the accepted quote
 * Trip moves to 'confirmed' status
 */
router.post('/:id/accept-quote', authMiddleware, requireRole('school_admin'), async (req, res) => {
  try {
    const { quoteIndex } = req.body;

    if (quoteIndex === undefined || quoteIndex < 0) {
      return res.status(400).json({ error: 'quoteIndex is required' });
    }

    const trip = await SchoolTrip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (trip.status !== 'open') {
      return res.status(400).json({ error: 'Trip is not open for quotes' });
    }

    const quote = trip.quotes[quoteIndex];
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    if (quote.status !== 'pending' && quote.status !== 'countered') {
      return res.status(400).json({ error: 'Quote is not available' });
    }

    // Mark all other quotes as declined
    trip.quotes.forEach((q, i) => {
      if (i !== quoteIndex && q.status === 'pending') {
        q.status = 'declined';
        q.respondedAt = new Date();
      }
    });

    // Accept this quote
    quote.status = 'accepted';
    quote.respondedAt = new Date();

    // Set trip pricing, vehicle, and driver from accepted quote
    const vehicle = await Vehicle.findById(quote.vehicleId);
    trip.vehicleId = quote.vehicleId;
    trip.driverId = quote.driverId;
    trip.vehicleSource = vehicle?.ownerModel === 'School' ? 'fleet' : 'external';
    trip.maxSeats = vehicle?.capacity || trip.maxSeats;

    trip.pricingModel = quote.pricingModel;
    trip.pricePerHead = quote.pricePerHead || 0;
    trip.flatRate = quote.flatRate || 0;
    trip.commissionRate = 0.05;

    // Calculate initial total
    if (quote.pricingModel === 'per_head') {
      trip.totalTripCost = quote.pricePerHead * trip.seatsFilled;
    } else if (quote.pricingModel === 'flat_rate') {
      trip.totalTripCost = quote.flatRate;
    }

    trip.driverPayout = Math.round(trip.totalTripCost * (1 - trip.commissionRate));
    trip.poleSafeCommission = trip.totalTripCost - trip.driverPayout;

    // Move to confirmed
    trip.status = 'confirmed';
    trip.driverConfirmedAt = new Date();

    await trip.save();

    res.json({
      message: 'Quote accepted',
      trip: {
        _id: trip._id,
        status: trip.status,
        driverId: trip.driverId,
        vehicleId: trip.vehicleId,
        pricingModel: trip.pricingModel,
        pricePerHead: trip.pricePerHead,
        flatRate: trip.flatRate,
        totalTripCost: trip.totalTripCost,
        driverPayout: trip.driverPayout,
        poleSafeCommission: trip.poleSafeCommission,
      },
    });
  } catch (err) {
    console.error('❌ Accept quote error:', err);
    res.status(500).json({ error: 'Failed to accept quote' });
  }
});

/**
 * POST /api/trips/:id/counter-quote — Admin counters a driver's quote
 * Driver can accept or decline the counter
 */
router.post('/:id/counter-quote', authMiddleware, requireRole('school_admin'), async (req, res) => {
  try {
    const { quoteIndex, adminCounter } = req.body;

    if (quoteIndex === undefined || !adminCounter || adminCounter <= 0) {
      return res.status(400).json({ error: 'quoteIndex and adminCounter (> 0) are required' });
    }

    const trip = await SchoolTrip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const quote = trip.quotes[quoteIndex];
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    quote.status = 'countered';
    quote.adminCounter = adminCounter;
    quote.respondedAt = new Date();

    await trip.save();

    res.json({
      message: 'Counter-offer sent to driver',
      driverId: quote.driverId,
      originalPrice: quote.pricePerHead || quote.flatRate,
      adminCounter,
    });
  } catch (err) {
    console.error('❌ Counter quote error:', err);
    res.status(500).json({ error: 'Failed to counter quote' });
  }
});

/**
 * POST /api/trips/:id/respond-counter — Driver accepts/declines admin's counter
 */
router.post('/:id/respond-counter', authMiddleware, requireRole('driver'), async (req, res) => {
  try {
    const { quoteIndex, response } = req.body;

    if (quoteIndex === undefined || !['accepted', 'declined'].includes(response)) {
      return res.status(400).json({ error: 'quoteIndex and response (accepted|declined) are required' });
    }

    const trip = await SchoolTrip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const quote = trip.quotes[quoteIndex];
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    if (quote.status !== 'countered' || quote.driverId.toString() !== req.user._id.toString()) {
      return res.status(400).json({ error: 'No active counter-offer for this driver' });
    }

    quote.driverResponse = response;
    quote.driverRespondedAt = new Date();

    if (response === 'accepted') {
      // Driver accepted the counter — use adminCounter as the price
      quote.status = 'accepted';

      // Set trip pricing from counter
      const vehicle = await Vehicle.findById(quote.vehicleId);
      trip.vehicleId = quote.vehicleId;
      trip.driverId = quote.driverId;
      trip.vehicleSource = vehicle?.ownerModel === 'School' ? 'fleet' : 'external';
      trip.maxSeats = vehicle?.capacity || trip.maxSeats;

      trip.pricingModel = quote.pricingModel;
      trip.pricePerHead = quote.pricingModel === 'per_head' ? quote.adminCounter : 0;
      trip.flatRate = quote.pricingModel === 'flat_rate' ? quote.adminCounter : 0;
      trip.commissionRate = 0.05;

      trip.totalTripCost = trip.pricePerHead * trip.seatsFilled || trip.flatRate;
      trip.driverPayout = Math.round(trip.totalTripCost * (1 - trip.commissionRate));
      trip.poleSafeCommission = trip.totalTripCost - trip.driverPayout;

      trip.status = 'confirmed';
      trip.driverConfirmedAt = new Date();
    }

    await trip.save();

    res.json({
      message: response === 'accepted' ? 'Counter-offer accepted — trip confirmed' : 'Counter-offer declined',
      tripId: trip._id,
      status: response === 'accepted' ? 'confirmed' : 'open',
    });
  } catch (err) {
    console.error('❌ Respond counter error:', err);
    res.status(500).json({ error: 'Failed to respond to counter-offer' });
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
    } else if (role === 'school_admin') {
      // Verify admin owns this school
      if (!req.user.schoolId || trip.schoolId.toString() !== req.user.schoolId.toString()) {
        return res.status(403).json({ error: 'You do not manage this school' });
      }
    } else if (role !== 'polesafe_admin') {
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

    // Ownership check: verify user has rights to view payment summary
    const canView = (
      (req.user.role === 'school_admin' && req.user.schoolId && trip.schoolId.toString() === req.user.schoolId.toString()) ||
      (req.user.role === 'parent' && trip.assignedKids?.some(k => k.parentId?.toString() === req.user._id?.toString())) ||
      (req.user.role === 'driver' && trip.driverId?.toString() === req.user._id?.toString()) ||
      (req.user.role === 'polesafe_admin')
    );
    if (!canView) {
      return res.status(403).json({ error: 'Access denied. You do not have access to this trip.' });
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
