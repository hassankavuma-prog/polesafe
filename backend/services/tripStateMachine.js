const { SchoolTrip, Ride, User } = require('../database/schema');

const ALLOWED_TRANSITIONS = {
  draft: ['open', 'cancelled'],
  open: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'completed', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function isBodaBodaTrip(trip) {
  const vehicleType = normalize(trip?.vehicleId?.type || trip?.vehicleType);
  return vehicleType === 'boda boda' || vehicleType === 'boda' || vehicleType === 'motorcycle';
}

function hasRequiredGear(trip) {
  const docs = trip?.driverVerification || trip?.verification || {};
  const requiredPhotos = trip?.requiredPhotos || [];
  const hasVest = Boolean(docs.vestPhoto || requiredPhotos.includes('vest'));
  const hasHelmet = Boolean(docs.helmetPhoto || requiredPhotos.includes('helmet'));
  return { hasVest, hasHelmet };
}

function hasSafeWordApproval(trip, context) {
  const tripSafeWord = normalize(trip?.safeWord || trip?.safetyCode || trip?.pickupCode);
  const contextSafeWord = normalize(context?.safeWord || context?.providedSafeWord || context?.pickupCode);
  if (!tripSafeWord) return true;
  return tripSafeWord === contextSafeWord;
}

function hasGateGeofenceApproval(context) {
  const gate = context?.gateGeofence || context?.geofence || {};
  if (gate.approved === true) return true;
  if (gate.distanceMeters == null) return false;
  return Number(gate.distanceMeters) <= 200;
}

function hasDismissalApproval(context) {
  const dismissal = context?.dismissal || {};
  if (dismissal.approved === true) return true;
  if (dismissal.allowed === false) return false;
  return dismissal.windowOpen !== false;
}

async function transitionTripStatus(tripId, nextStatus, context = {}) {
  const trip = await SchoolTrip.findById(tripId)
    .populate('vehicleId', 'type registrationNumber capacity busLabel');

  if (!trip) {
    const err = new Error('Trip not found');
    err.statusCode = 404;
    throw err;
  }

  const currentStatus = normalize(trip.status);
  const targetStatus = normalize(nextStatus);
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(targetStatus)) {
    const err = new Error(`Invalid trip transition: ${currentStatus} -> ${targetStatus}`);
    err.statusCode = 400;
    throw err;
  }

  const role = normalize(context.role || context.user?.role);
  const allowedRoles = ['school_admin', 'driver', 'polesafe_admin', 'dispatcher'];
  if (role && !allowedRoles.includes(role)) {
    const err = new Error('Unauthorized role for trip transition');
    err.statusCode = 403;
    throw err;
  }

  if (targetStatus === 'confirmed') {
    if (role !== 'driver' && role !== 'school_admin' && role !== 'polesafe_admin') {
      const err = new Error('Only authorized roles may confirm a trip');
      err.statusCode = 403;
      throw err;
    }
  }

  if (targetStatus === 'in_progress') {
    const tripGateOk = hasGateGeofenceApproval(context);
    const tripDismissalOk = hasDismissalApproval(context);
    const safeWordOk = hasSafeWordApproval(trip, context);
    const bodaBoda = isBodaBodaTrip(trip);
    const gear = hasRequiredGear(trip);

    if (!safeWordOk) {
      const err = new Error('Safe word verification failed');
      err.statusCode = 403;
      throw err;
    }

    if (!tripGateOk) {
      const err = new Error('Gate geofence check failed');
      err.statusCode = 403;
      throw err;
    }

    if (!tripDismissalOk) {
      const err = new Error('Dismissal schedule check failed');
      err.statusCode = 403;
      throw err;
    }

    if (bodaBoda && (!gear.hasVest || !gear.hasHelmet)) {
      const err = new Error('Boda boda vest/helmet verification failed');
      err.statusCode = 403;
      throw err;
    }
  }

  if (targetStatus === 'completed' && currentStatus !== 'in_progress') {
    const err = new Error('Only in-progress trips can be completed');
    err.statusCode = 400;
    throw err;
  }

  trip.status = targetStatus;
  trip.updatedAt = new Date();

  if (targetStatus === 'confirmed') {
    trip.driverConfirmedAt = trip.driverConfirmedAt || new Date();
  }

  if (targetStatus === 'in_progress') {
    trip.startedAt = trip.startedAt || new Date();
    trip.kidsRevealed = true;
  }

  if (targetStatus === 'completed') {
    trip.completedAt = trip.completedAt || new Date();
  }

  await trip.save();

  if (targetStatus === 'completed') {
    try {
      const activeRide = await Ride.findOne({ tripId: trip._id });
      if (activeRide) {
        activeRide.status = 'completed';
        activeRide.completedAt = new Date();
        await activeRide.save();
      }
    } catch (_) {
      // best effort sync only
    }
  }

  return trip;
}

module.exports = {
  transitionTripStatus,
  ALLOWED_TRANSITIONS,
};
