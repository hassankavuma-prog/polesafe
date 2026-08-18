const mongoose = require('mongoose');
const { Booking, Child, Vehicle, RideRequest, DispatchOffer, Assignment, Ride, User, GuardianAuthority, RecoveryHandoff } = require('../database/schema');
const sameId = (a, b) => String(a || '') === String(b || '');
const now = () => new Date();
const SAFETY_OCCURRENCE_REQUEST_PREFIX = 'pre-journey-safety-occurrence';
function getActorId(actor) { return actor?._id || actor?.id || actor?.userId; }
function assertDriver(actor) { if (!actor || actor.role !== 'driver') { const err = new Error('forbidden'); err.statusCode = 403; throw err; } }
function getRideCategory(ride) {
  const type = String(ride?.type || '').trim().toLowerCase();
  if (['school_morning', 'school_afternoon'].includes(type)) return 'school_transport';
  if (type === 'ride_hailing' || ride?.isRideHailing) return 'passenger_transport';
  return 'unknown';
}
function getPreJourneySafetyPolicy(ride) {
  const transportType = getRideCategory(ride);
  return { policyVersion: 1, transportType, reminderRequired: transportType !== 'unknown', acknowledgementRequired: transportType === 'school_transport' };
}
function getPreJourneySafety(ride) { return ride?.preJourneySafety || {}; }
function getPreJourneySafetyOccurrenceContext({ ride, assignment, driverId, vehicleId }) {
  return {
    rideId: ride?._id || null,
    assignmentId: assignment?._id || ride?.assignmentId || null,
    driverId: driverId || ride?.driverId || null,
    vehicleId: vehicleId || assignment?.vehicleId || ride?.preJourneySafety?.vehicleId || null,
  };
}
function getPreJourneySafetyOccurrenceRequestKey({ rideId, assignmentId, driverId, vehicleId }) {
  return [SAFETY_OCCURRENCE_REQUEST_PREFIX, String(rideId || ''), String(assignmentId || ''), String(driverId || ''), String(vehicleId || '')].join('|');
}
function getPreJourneySafetyOccurrenceSignature({ occurrenceContext, policyVersion }) {
  return [String(policyVersion || 0), String(occurrenceContext?.rideId || ''), String(occurrenceContext?.assignmentId || ''), String(occurrenceContext?.driverId || ''), String(occurrenceContext?.vehicleId || '')].join('|');
}
function isValidOccurrenceRecord(preJourneySafety, ride, assignment, driverId, vehicleId) {
  const context = getPreJourneySafetyOccurrenceContext({ ride, assignment, driverId, vehicleId });
  return !!preJourneySafety?.occurrenceId && preJourneySafety?.occurrenceVersion >= 1 && sameId(preJourneySafety?.occurrenceContext?.rideId, context.rideId) && sameId(preJourneySafety?.occurrenceContext?.assignmentId, context.assignmentId) && sameId(preJourneySafety?.occurrenceContext?.driverId, context.driverId) && sameId(preJourneySafety?.occurrenceContext?.vehicleId, context.vehicleId);
}
async function ensurePreJourneySafetyOccurrence({ ride, assignment, driverId, vehicleId, session } = {}) {
  const rideQuery = ride?._id ? null : Ride.findById(ride);
  if (rideQuery && session) rideQuery.session(session);
  const currentRide = ride?._id ? ride : await rideQuery;
  if (!currentRide) { const err = new Error('ride_not_found'); err.statusCode = 404; throw err; }
  const assignmentQuery = assignment?._id ? null : currentRide.assignmentId ? Assignment.findById(currentRide.assignmentId) : null;
  if (assignmentQuery && session) assignmentQuery.session(session);
  const currentAssignment = assignment?._id ? assignment : assignmentQuery ? await assignmentQuery : null;
  if (!currentAssignment) { const err = new Error('assignment_not_found'); err.statusCode = 404; throw err; }
  if (!sameId(currentAssignment.driverId, driverId || currentRide.driverId)) { const err = new Error('forbidden'); err.statusCode = 403; throw err; }
  const resolvedVehicleId = vehicleId || currentAssignment.vehicleId || currentRide.preJourneySafety?.vehicleId || null;
  const policy = getPreJourneySafetyPolicy(currentRide);
  const occurrenceContext = getPreJourneySafetyOccurrenceContext({ ride: currentRide, assignment: currentAssignment, driverId: driverId || currentRide.driverId, vehicleId: resolvedVehicleId });
  const current = getPreJourneySafety(currentRide);
  if (isValidOccurrenceRecord(current, currentRide, currentAssignment, occurrenceContext.driverId, occurrenceContext.vehicleId)) {
    const signature = getPreJourneySafetyOccurrenceSignature({ occurrenceContext: current.occurrenceContext, policyVersion: current.policyVersion });
    return { ride: currentRide, assignment: currentAssignment, occurrence: current, signature, occurrenceContext, policy };
  }
  const occurrence = {
    occurrenceId: `spo_${currentRide._id}_${currentAssignment._id}_${policy.policyVersion}_1`,
    occurrenceVersion: 1,
    occurrenceContext,
    occurrenceCreatedAt: now(),
    policyVersion: policy.policyVersion,
    transportType: policy.transportType,
    seatBeltReminderRequired: policy.reminderRequired,
    seatBeltReminderStatus: 'pending',
    seatBeltReminderAt: null,
    driverAcknowledgementRequired: policy.acknowledgementRequired,
    driverAcknowledged: false,
    driverAcknowledgedAt: null,
    driverAcknowledgedBy: null,
    assignmentId: currentAssignment._id,
    vehicleId: resolvedVehicleId,
    driverId: occurrenceContext.driverId,
  };
  currentRide.preJourneySafety = { ...(current || {}), ...occurrence };
  currentRide.updatedAt = now();
  if (session) await currentRide.save({ session }); else await currentRide.save();
  const signature = getPreJourneySafetyOccurrenceSignature({ occurrenceContext, policyVersion: policy.policyVersion });
  return { ride: currentRide, assignment: currentAssignment, occurrence: currentRide.preJourneySafety, signature, occurrenceContext, policy };
}
function isStartIdempotent(ride, assignment) { return !!ride?.journeyStartedAt && !!assignment?.journeyStartedAt; }
const ACCEPTANCE_ACTIVE_ASSIGNMENT_STATUSES = ['active', 'arrived', 'pickup_verified', 'onboard'];
const ACCEPTANCE_ACTIVE_RIDE_STATUSES = ['dispatching', 'active', 'onboard'];
const ACCEPTANCE_ELIGIBILITY_FAILURES = new Set(['driver_no_longer_eligible', 'vehicle_no_longer_eligible', 'invalid_driver_vehicle_relationship', 'insufficient_capacity', 'unsupported_service', 'active_assignment_conflict', 'active_vehicle_assignment_conflict', 'active_journey_conflict', 'active_vehicle_journey_conflict', 'manual_negotiation_required']);
function isPositiveHardEligibility(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}
function isDriverHardEligible(driver) {
  return !!driver && driver.role === 'driver' && (isPositiveHardEligibility(driver.isDriverIdVerified) || ['approved', 'verified'].includes(String(driver.verificationStatus || '')));
}

function isVehicleHardEligible(vehicle) {
  return !!vehicle && isPositiveHardEligibility(vehicle.isApproved) && isPositiveHardEligibility(vehicle.isAvailable) && Number.isFinite(Number(vehicle.capacity));
}

function getOfferEligibilityVehicleType(booking, rideRequest) {
  return String(booking?.vehicleType || rideRequest?.vehicleType || '').trim().toLowerCase();
}
async function revalidateAcceptanceEligibility({ session, booking, rideRequest, offer, driverId }) {
  const driver = await User.findById(driverId).session(session);
  if (!isDriverHardEligible(driver)) { const err = new Error('driver_no_longer_eligible'); err.statusCode = 409; throw err; }
  if (!offer?.vehicleId) { const err = new Error('vehicle_no_longer_eligible'); err.statusCode = 409; throw err; }
  const vehicle = await Vehicle.findById(offer.vehicleId).session(session);
  if (!vehicle) { const err = new Error('vehicle_no_longer_eligible'); err.statusCode = 409; throw err; }
  if (!sameId(vehicle.driverId, driverId)) { const err = new Error('invalid_driver_vehicle_relationship'); err.statusCode = 409; throw err; }
  if (!isVehicleHardEligible(vehicle)) { const err = new Error('vehicle_no_longer_eligible'); err.statusCode = 409; throw err; }
  const requiredSeats = Number(booking?.requiredSeats || rideRequest?.requiredSeats || booking?.seatsRequired || rideRequest?.seatsRequired || 1);
  if (requiredSeats >= 14) { const err = new Error('manual_negotiation_required'); err.statusCode = 409; throw err; }
  if (Number.isFinite(requiredSeats) && Number(vehicle.capacity) < requiredSeats) { const err = new Error('insufficient_capacity'); err.statusCode = 409; throw err; }
  const requiredVehicleType = getOfferEligibilityVehicleType(booking, rideRequest);
  if (requiredVehicleType && String(vehicle.type || '').toLowerCase() !== requiredVehicleType) { const err = new Error('unsupported_service'); err.statusCode = 409; throw err; }
  const activeDriverAssignment = await Assignment.findOne({ driverId, status: { $in: ACCEPTANCE_ACTIVE_ASSIGNMENT_STATUSES } }).session(session);
  if (activeDriverAssignment) { const err = new Error('active_assignment_conflict'); err.statusCode = 409; throw err; }
  const activeVehicleAssignment = await Assignment.findOne({ vehicleId: vehicle._id, status: { $in: ACCEPTANCE_ACTIVE_ASSIGNMENT_STATUSES } }).session(session);
  if (activeVehicleAssignment) { const err = new Error('active_vehicle_assignment_conflict'); err.statusCode = 409; throw err; }
  const activeDriverRide = await Ride.findOne({ driverId, journeyLifecycleStatus: { $in: ACCEPTANCE_ACTIVE_RIDE_STATUSES } }).session(session);
  if (activeDriverRide) { const err = new Error('active_journey_conflict'); err.statusCode = 409; throw err; }
  const activeVehicleRide = await Ride.findOne({ vehicleId: vehicle._id, journeyLifecycleStatus: { $in: ACCEPTANCE_ACTIVE_RIDE_STATUSES } }).session(session);
  if (activeVehicleRide) { const err = new Error('active_vehicle_journey_conflict'); err.statusCode = 409; throw err; }
  return vehicle;
}

const normalizeText = (v) => (v == null ? '' : String(v).trim().replace(/\s+/g, ' ').toLowerCase());
const normalizePickupAt = (v) => (v ? new Date(v).toISOString() : '');
function assertActor(actor, role) { if (!actor || actor.role !== role) { const err = new Error('forbidden'); err.statusCode = 403; throw err; } }
function assertDriver(actor) { assertActor(actor, 'driver'); }
function computeRequestKey({ actorId, childId, schoolId, vehicleType, pickupAddress, dropoffAddress, pickupAt }) { return [String(actorId).trim(), String(childId).trim(), String(schoolId || '').trim(), normalizeText(vehicleType), normalizeText(pickupAddress), normalizeText(dropoffAddress), normalizePickupAt(pickupAt)].join('|'); }
function getDispatchVersion(booking) { return Number(booking?.dispatchVersion || 1); }
function getAssignmentSlotKey(booking, rideRequest) { return [String(booking?._id || ''), String(rideRequest?._id || '')].join(':'); }
function isDispatchableBooking(booking) { return !!booking && booking.status === 'active' && booking.dispatchState !== 'not_dispatchable'; }

async function canBookTransportForChild({ actorId, child }) {
  const guardianRecords = await GuardianAuthority.find({ childId: child._id }).lean();
  if (guardianRecords.length > 0) {
    const relationship = guardianRecords.find((record) => sameId(record.guardianAccountId, actorId));
    if (!relationship) return false;
    if (relationship.status !== 'active') return false;
    if (relationship.verificationStatus !== 'verified') return false;
    const scopes = Array.isArray(relationship.scopes) ? relationship.scopes : [];
    return scopes.includes('book_for_child');
  }
  return sameId(child.parentId, actorId);
}

async function beginDispatchRound({ bookingId, reason = 'manual' } = {}) { const session = await mongoose.startSession(); try { session.startTransaction(); const currentBooking = await Booking.findById(bookingId).session(session); if (!currentBooking) { const err = new Error('booking_not_found'); err.statusCode = 404; throw err; } const expectedVersion = currentBooking.dispatchVersion == null ? 1 : Number(currentBooking.dispatchVersion); const nextVersion = expectedVersion + 1; const casFilter = { _id: bookingId, dispatchVersion: expectedVersion, status: 'active' }; const booking = await Booking.findOneAndUpdate(casFilter, { $inc: { dispatchVersion: 1 }, $set: { updatedAt: now() } }, { new: true, session }); if (!booking) { const err = new Error('concurrency_lost'); err.statusCode = 409; throw err; } const supersedeResult = await DispatchOffer.updateMany({ bookingId: booking._id, status: 'active', dispatchVersion: { $lt: nextVersion } }, { $set: { status: 'superseded', revokedAt: now(), updatedAt: now() } }, { session }); if (supersedeResult == null) { const err = new Error('dispatch_supercession_failed'); err.statusCode = 500; throw err; } await session.commitTransaction(); session.endSession(); return { booking: booking.toObject ? booking.toObject() : booking, dispatchVersion: nextVersion, reason }; } catch (err) { await session.abortTransaction().catch(() => {}); session.endSession(); throw err; } }
async function createRideRequestAndBooking({ actor, childId, schoolId, vehicleType = 'car', pickupAddress = '', dropoffAddress = '', pickupAt = null, requestKey }) {
  if (!actor) { const err = new Error('unauthorized'); err.statusCode = 401; throw err; }
  const actorId = getActorId(actor);
  if (!actorId) { const err = new Error('unauthorized'); err.statusCode = 401; throw err; }
  const child = await Child.findById(childId).lean();
  if (!child) { const err = new Error('child_not_found'); err.statusCode = 404; throw err; }
  const authorized = await canBookTransportForChild({ actorId, child });
  if (!authorized) { const err = new Error('unauthorized_booking_context'); err.statusCode = 403; throw err; }
  const key = computeRequestKey({ actorId, childId, schoolId: schoolId || child.schoolId || null, vehicleType, pickupAddress, dropoffAddress, pickupAt });
  const requestFingerprint = [String(actorId).trim(), String(childId).trim(), String(schoolId || child.schoolId || '').trim(), normalizeText(vehicleType), normalizeText(pickupAddress), normalizeText(dropoffAddress), normalizePickupAt(pickupAt)].join('|');
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const existing = await RideRequest.findOne({ parentId: actorId, childId, requestKey: key }).session(session);
    if (existing) { const booking = await Booking.findById(existing.bookingId).session(session); const rideRequest = await RideRequest.findById(existing._id).session(session); await session.commitTransaction(); session.endSession(); return { booking, rideRequest }; }
    const bookingDoc = await Booking.create([{ parentId: actorId, childId, schoolId: schoolId || child.schoolId || null, driverId: null, type: 'weekly', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], pickupTime: '7:00 AM', dropoffTime: '4:30 PM', vehicleType, staggeredPickups: [], amountPerTrip: 0, totalTrips: 1, totalAmount: 0, completedTrips: 0, missedTrips: 0, startDate: now(), status: 'active', dispatchState: 'dispatchable', dispatchVersion: 1 }], { session });
    const booking = bookingDoc[0];
    const rideRequestDoc = await RideRequest.create([{ parentId: actorId, childId, schoolId: schoolId || child.schoolId || null, bookingId: booking._id, requestType: 'scheduled', requestKey: key, requestFingerprint, vehicleType: normalizeText(vehicleType), pickupAddress: normalizeText(pickupAddress), dropoffAddress: normalizeText(dropoffAddress), pickupAt: pickupAt ? new Date(pickupAt) : null, requestStatus: 'submitted', source: 'parent', dispatchVersion: 1, dispatchState: 'dispatchable' }], { session });
    const rideRequest = rideRequestDoc[0];
    booking.journeyRequestId = rideRequest._id;
    booking.sourceRideRequestId = rideRequest._id;
    booking.dispatchVersion = 1;
    await booking.save({ session });
    await session.commitTransaction();
    session.endSession();
    return { booking, rideRequest };
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    if (err && err.code === 11000) {
      const existing = await RideRequest.findOne({ parentId: actorId, childId, requestKey: key }).lean();
      if (existing) return { booking: await Booking.findById(existing.bookingId).lean(), rideRequest: existing };
    }
    throw err;
  }
}


async function evaluateMatching({ booking, rideRequest }) {
  if (!booking) { const err = new Error('booking_not_found'); err.statusCode = 404; throw err; }
  if (!rideRequest) { const err = new Error('ride_request_not_found'); err.statusCode = 404; throw err; }
  if (!isDispatchableBooking(booking)) { const err = new Error('booking_not_dispatchable'); err.statusCode = 409; throw err; }
  const bookingDoc = await Booking.findById(booking._id).lean();
  if (!bookingDoc) { const err = new Error('booking_not_found'); err.statusCode = 404; throw err; }
  if (!isDispatchableBooking(bookingDoc)) { const err = new Error('booking_not_dispatchable'); err.statusCode = 409; throw err; }
  const requestDoc = await RideRequest.findById(rideRequest._id).lean();
  if (!requestDoc) { const err = new Error('ride_request_not_found'); err.statusCode = 404; throw err; }
  const nextVersion = getDispatchVersion(bookingDoc);
  const requestKey = requestDoc.requestKey || computeRequestKey({ actorId: requestDoc.parentId, childId: requestDoc.childId, schoolId: requestDoc.schoolId, vehicleType: requestDoc.vehicleType, pickupAddress: requestDoc.pickupAddress, dropoffAddress: requestDoc.dropoffAddress, pickupAt: requestDoc.pickupAt });
  const dispatchOffer = await DispatchOffer.findOne({ bookingId: bookingDoc._id, dispatchVersion: nextVersion, driverId: requestDoc.driverId || undefined }).lean();
  const requiredSeats = Number(bookingDoc?.requiredSeats || requestDoc?.requiredSeats || bookingDoc?.seatsRequired || requestDoc?.seatsRequired || 1);
  if (requiredSeats >= 14) {
    return { booking: bookingDoc, rideRequest: requestDoc, offers: [], manualNegotiationRequired: true, requestKey, dispatchOffer: dispatchOffer || null };
  }
  const exclusions = [];
  const addExclusion = (candidate, reason, details = {}) => {
    exclusions.push({
      candidateId: String(candidate?._id || ''),
      reason,
      ...details,
    });
  };
  const drivers = await User.find({ role: 'driver' }).lean();
  const candidateDrivers = [];
  for (const driver of drivers) {
    const driverExists = !!driver;
    const correctRole = driverExists && driver.role === 'driver';
    const driverApproved = driverExists && (driver.isDriverIdVerified === true || driver.verificationStatus === 'approved' || driver.verificationStatus === 'verified');
    if (!driverExists || !correctRole) { addExclusion(driver, 'unknown_required_eligibility'); continue; }
    if (!driverApproved) { addExclusion(driver, 'driver_not_approved'); continue; }

    const vehicles = await Vehicle.find({ driverId: driver._id }).lean();
    const vehicle = vehicles.find((v) => sameId(v.driverId, driver._id));
    if (!vehicle) { addExclusion(driver, 'unknown_required_eligibility'); continue; }

    const vehicleExists = !!vehicle;
    const vehicleApproved = vehicleExists && vehicle.isApproved === true;
    const vehicleAvailable = vehicleExists && vehicle.isAvailable === true;
    const capacity = vehicleExists ? Number(vehicle.capacity) : NaN;
    const typeMatch = !requestDoc.vehicleType || String(vehicle.type || '').toLowerCase() === String(requestDoc.vehicleType || '').toLowerCase();
    const driverVehicleMatch = sameId(vehicle.driverId, driver._id);
    if (!vehicleApproved) { addExclusion(vehicle, 'vehicle_not_approved', { driverId: String(driver._id) }); continue; }
    if (!vehicleAvailable) { addExclusion(vehicle, 'vehicle_unavailable', { driverId: String(driver._id) }); continue; }
    if (!driverVehicleMatch) { addExclusion(vehicle, 'invalid_driver_vehicle_relationship', { driverId: String(driver._id) }); continue; }
    if (!typeMatch) { addExclusion(vehicle, 'unsupported_service', { driverId: String(driver._id) }); continue; }
    if (!Number.isFinite(capacity)) { addExclusion(vehicle, 'unknown_vehicle_capacity', { driverId: String(driver._id) }); continue; }
    if (capacity < requiredSeats) { addExclusion(vehicle, 'insufficient_capacity', { driverId: String(driver._id) }); continue; }

    const activeAssignments = await Assignment.find({ driverId: driver._id, status: { $in: ['active', 'arrived', 'pickup_verified', 'onboard'] } }).lean();
    if (activeAssignments.length > 0) { addExclusion(vehicle, 'active_assignment_conflict', { driverId: String(driver._id) }); continue; }
    const activeVehicleAssignments = await Assignment.find({ vehicleId: vehicle._id, status: { $in: ['active', 'arrived', 'pickup_verified', 'onboard'] } }).lean();
    if (activeVehicleAssignments.length > 0) { addExclusion(vehicle, 'active_vehicle_assignment_conflict'); continue; }
    const activeRides = await Ride.find({ driverId: driver._id, journeyLifecycleStatus: { $in: ['dispatching', 'active', 'onboard'] } }).lean();
    if (activeRides.length > 0) { addExclusion(vehicle, 'active_journey_conflict', { driverId: String(driver._id) }); continue; }
    const activeVehicleRides = await Ride.find({ vehicleId: vehicle._id, journeyLifecycleStatus: { $in: ['dispatching', 'active', 'onboard'] } }).lean();
    if (activeVehicleRides.length > 0) { addExclusion(vehicle, 'active_vehicle_journey_conflict'); continue; }

    candidateDrivers.push({ driver, vehicle });
  }
  const ranking = [];
  for (const { driver, vehicle } of candidateDrivers) {
    const offer = {
      bookingId: bookingDoc._id,
      rideRequestId: requestDoc._id,
      assignmentId: null,
      driverId: driver._id,
      vehicleId: vehicle._id,
      dispatchVersion: nextVersion,
      status: 'active',
      ranking: 0,
      eligibilitySnapshot: { driverId: String(driver._id), vehicleId: String(vehicle._id) },
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      acceptedAt: null,
      revokedAt: null,
      offerVersion: 0,
    };
    ranking.push({ driver, vehicle, score: 0, offer });
  }
  ranking.sort((a, b) => String(a.driver._id).localeCompare(String(b.driver._id)) || String(a.vehicle._id).localeCompare(String(b.vehicle._id)));
  const created = [];
  for (const row of ranking) {
    const found = await DispatchOffer.findOne({ bookingId: bookingDoc._id, dispatchVersion: nextVersion, driverId: row.driver._id });
    if (found) { created.push(found); continue; }
    created.push(await DispatchOffer.create([row.offer]).then(d => d[0]));
  }
  await RideRequest.updateOne({ _id: requestDoc._id }, { $set: { dispatchVersion: nextVersion, dispatchState: 'dispatchable', updatedAt: now() } });
  return { booking: bookingDoc, rideRequest: requestDoc, offers: created.map(o => o.toObject ? o.toObject() : o), exclusions };
}

async function listDriverOffers(driverId) {
  return DispatchOffer.find({ driverId, status: 'active' }).sort({ createdAt: -1 }).lean();
}

async function acceptOffer({ actor, driverId, offerId }) {
  assertDriver(actor);
  if (!sameId(getActorId(actor), driverId)) { const err = new Error('forbidden'); err.statusCode = 403; throw err; }
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const offer = await DispatchOffer.findById(offerId).session(session);
    if (!offer) { const err = new Error('offer_not_found'); err.statusCode = 404; throw err; }
    if (!sameId(offer.driverId, driverId)) { const err = new Error('forbidden'); err.statusCode = 403; throw err; }
    const booking = await Booking.findById(offer.bookingId).session(session);
    if (!booking) { const err = new Error('booking_not_found'); err.statusCode = 404; throw err; }
    if (Number(booking.dispatchVersion || 1) !== Number(offer.dispatchVersion || 1)) { const err = new Error('stale_offer'); err.statusCode = 409; throw err; }
    if (offer.status !== 'active') { const err = new Error('offer_not_active'); err.statusCode = 409; throw err; }
    if (offer.expiresAt && offer.expiresAt.getTime() <= Date.now()) { const err = new Error('offer_expired'); err.statusCode = 409; throw err; }
    const rideRequest = offer.rideRequestId ? await RideRequest.findById(offer.rideRequestId).session(session) : null;
    const assignmentSlotKey = getAssignmentSlotKey(booking, rideRequest || offer);
    const existing = await Assignment.findOne({ bookingId: booking._id, assignmentSlotKey, status: 'active' }).session(session);
    if (existing) {
      if (sameId(existing.driverId, driverId)) { await session.commitTransaction(); session.endSession(); return { assignment: existing.toObject ? existing.toObject() : existing, offer: offer.toObject ? offer.toObject() : offer, alreadyAccepted: true }; }
      if (existing.pickupVerifiedAt) { const err = new Error('post_pickup_reassignment_requires_protected_recovery'); err.statusCode = 409; throw err; }
      const err = new Error('already_taken'); err.statusCode = 409; throw err;
    }
    let vehicle;
    try {
      vehicle = await revalidateAcceptanceEligibility({ session, booking, rideRequest, offer, driverId });
    } catch (eligibilityErr) {
      if (eligibilityErr && eligibilityErr.statusCode === 409 && ACCEPTANCE_ELIGIBILITY_FAILURES.has(eligibilityErr.message)) throw eligibilityErr;
      throw eligibilityErr;
    }
    offer.status = 'accepted';
    offer.acceptedAt = now();
    offer.updatedAt = now();
    await offer.save({ session });
    const assignment = await Assignment.create([{ bookingId: booking._id, rideRequestId: offer.rideRequestId || null, dispatchScopeId: null, dispatchOfferId: offer._id, assignmentSlotKey, assignmentVersion: Number(offer.dispatchVersion || 1), driverId, vehicleId: vehicle._id, status: 'active', acceptedAt: now(), arrivalAt: null, pickupVerifiedAt: null, journeyStartedAt: null }], { session }).then(d => d[0]);
    let ride = await Ride.findOne({ bookingId: booking._id }).session(session);
    if (!ride) ride = new Ride({ bookingId: booking._id, childId: booking.childId, driverId, parentId: booking.parentId, schoolId: booking.schoolId, assignmentId: assignment._id, dispatchOfferId: offer._id, journeyRequestId: offer.rideRequestId || booking.journeyRequestId, runtimePhase: 'assigned', journeyLifecycleStatus: 'dispatching', pickupVerificationStatus: 'pending', runtimeEventVersion: 1, runtimeSource: 'dispatch' });
    ride.assignmentId = assignment._id;
    ride.dispatchOfferId = offer._id;
    ride.journeyRequestId = offer.rideRequestId || ride.journeyRequestId || booking.journeyRequestId;
    ride.driverId = driverId;
    ride.runtimePhase = 'assigned';
    ride.journeyLifecycleStatus = 'dispatching';
    ride.pickupVerificationStatus = 'pending';
    ride.assignmentAcceptedAt = now();
    ride.updatedAt = now();
    await ride.save({ session });
    await session.commitTransaction();
    session.endSession();
    return { assignment: assignment.toObject ? assignment.toObject() : assignment, offer: offer.toObject ? offer.toObject() : offer, ride: ride.toObject ? ride.toObject() : ride };
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    if (err && err.code === 11000) {
      const offer = await DispatchOffer.findById(offerId).lean();
      const booking = offer ? await Booking.findById(offer.bookingId).lean() : null;
      const rideRequest = offer && offer.rideRequestId ? await RideRequest.findById(offer.rideRequestId).lean() : null;
      const assignmentSlotKey = booking ? getAssignmentSlotKey(booking, rideRequest || offer) : null;
      const existing = booking && assignmentSlotKey ? await Assignment.findOne({ bookingId: booking._id, assignmentSlotKey, status: 'active' }).lean() : null;
      if (existing) {
        if (sameId(existing.driverId, driverId)) return { assignment: existing, alreadyAccepted: true };
        const already = new Error('already_taken'); already.statusCode = 409; throw already;
      }
      const lost = new Error('concurrency_lost'); lost.statusCode = 409; throw lost;
    }
    throw err;
  }
}

async function markArrival({ actor, driverId, assignmentId }) {
  assertDriver(actor);
  if (!sameId(getActorId(actor), driverId)) { const err = new Error('forbidden'); err.statusCode = 403; throw err; }
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) { const err = new Error('assignment_not_found'); err.statusCode = 404; throw err; }
  if (!sameId(assignment.driverId, driverId)) { const err = new Error('forbidden'); err.statusCode = 403; throw err; }
  if (assignment.status !== 'active') { const err = new Error('assignment_not_active'); err.statusCode = 409; throw err; }
  assignment.status = 'arrived';
  assignment.arrivalAt = now();
  assignment.updatedAt = now();
  await assignment.save();
  await Ride.updateOne({ assignmentId: assignment._id }, { $set: { arrivalAt: assignment.arrivalAt, runtimePhase: 'arrived', journeyLifecycleStatus: 'dispatching', updatedAt: now() } });
  return { assignment: assignment.toObject ? assignment.toObject() : assignment };
}

async function verifyPickup({ actor, driverId, assignmentId, method }) {
  assertDriver(actor);
  if (!sameId(getActorId(actor), driverId)) { const err = new Error('forbidden'); err.statusCode = 403; throw err; }
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) { const err = new Error('assignment_not_found'); err.statusCode = 404; throw err; }
  if (!sameId(assignment.driverId, driverId)) { const err = new Error('forbidden'); err.statusCode = 403; throw err; }
  if (!assignment.arrivalAt) { const err = new Error('arrival_required'); err.statusCode = 409; throw err; }
  if (assignment.pickupVerifiedAt) {
    const ride = await Ride.findOne({ assignmentId: assignment._id });
    return { assignment: assignment.toObject ? assignment.toObject() : assignment, ride: ride?.toObject ? ride.toObject() : ride, alreadyVerified: true };
  }
  assignment.status = 'pickup_verified';
  assignment.pickupVerifiedAt = now();
  assignment.updatedAt = now();
  await assignment.save();
  const ride = await Ride.findOne({ assignmentId: assignment._id });
  if (ride) {
    ride.pickupVerifiedAt = assignment.pickupVerifiedAt;
    ride.runtimePhase = 'pickup_verified';
    ride.pickupVerificationStatus = 'verified';
    ride.runtimeFlags = { ...(ride.runtimeFlags || {}), pickupVerificationMethod: method || 'driver_confirmed', pickupVerificationSource: 'driver', activePassengerState: 'secured' };
    ride.updatedAt = now();
    await ride.save();
  }
  return { assignment: assignment.toObject ? assignment.toObject() : assignment, ride: ride?.toObject ? ride.toObject() : ride };
}

async function recordPreJourneySafetyReminder({ actor, driverId, assignmentId }) {
  assertDriver(actor);
  if (!sameId(getActorId(actor), driverId)) { const err = new Error('forbidden'); err.statusCode = 403; throw err; }
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) { const err = new Error('assignment_not_found'); err.statusCode = 404; throw err; }
  if (!sameId(assignment.driverId, driverId)) { const err = new Error('forbidden'); err.statusCode = 403; throw err; }
  if (!assignment.arrivalAt) { const err = new Error('arrival_required'); err.statusCode = 409; throw err; }
  if (!assignment.pickupVerifiedAt) { const err = new Error('pickup_verification_required'); err.statusCode = 409; throw err; }
  const ride = await Ride.findOne({ assignmentId: assignment._id });
  if (!ride) { const err = new Error('ride_not_found'); err.statusCode = 404; throw err; }
  const ensured = await ensurePreJourneySafetyOccurrence({ ride, assignment, driverId, vehicleId: assignment.vehicleId });
  const current = ensured.occurrence;
  if (current.seatBeltReminderStatus === 'recorded') return { ride: ensured.ride.toObject ? ensured.ride.toObject() : ensured.ride, assignment: assignment.toObject ? assignment.toObject() : assignment, alreadyRecorded: true, reminderAt: current.seatBeltReminderAt };

  ensured.ride.preJourneySafety = { ...(current || {}), seatBeltReminderStatus: 'recorded', seatBeltReminderAt: now(), driverAcknowledgementRequired: ensured.policy.acknowledgementRequired, policyVersion: ensured.policy.policyVersion, transportType: ensured.policy.transportType, assignmentId: assignment._id, vehicleId: assignment.vehicleId || ensured.ride.vehicleId || null, driverId, occurrenceContext: ensured.occurrenceContext, occurrenceId: ensured.occurrence.occurrenceId, occurrenceVersion: ensured.occurrence.occurrenceVersion, occurrenceCreatedAt: ensured.occurrence.occurrenceCreatedAt };
  ensured.ride.updatedAt = now();
  await ensured.ride.save();
  return { ride: ensured.ride.toObject ? ensured.ride.toObject() : ensured.ride, assignment: assignment.toObject ? assignment.toObject() : assignment };
}

async function acknowledgePreJourneySafety({ actor, driverId, assignmentId }) {
  assertDriver(actor);
  if (!sameId(getActorId(actor), driverId)) { const err = new Error('forbidden'); err.statusCode = 403; throw err; }
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) { const err = new Error('assignment_not_found'); err.statusCode = 404; throw err; }
  if (!sameId(assignment.driverId, driverId)) { const err = new Error('forbidden'); err.statusCode = 403; throw err; }
  if (!assignment.arrivalAt) { const err = new Error('arrival_required'); err.statusCode = 409; throw err; }
  if (!assignment.pickupVerifiedAt) { const err = new Error('pickup_verification_required'); err.statusCode = 409; throw err; }
  const ride = await Ride.findOne({ assignmentId: assignment._id });
  if (!ride) { const err = new Error('ride_not_found'); err.statusCode = 404; throw err; }
  const ensured = await ensurePreJourneySafetyOccurrence({ ride, assignment, driverId, vehicleId: assignment.vehicleId });
  const current = ensured.occurrence;
  if (!current.seatBeltReminderStatus || current.seatBeltReminderStatus !== 'recorded') { const err = new Error('pre_journey_reminder_required'); err.statusCode = 409; throw err; }
  if (!ensured.policy.acknowledgementRequired) return { ride: ensured.ride.toObject ? ensured.ride.toObject() : ensured.ride, assignment: assignment.toObject ? assignment.toObject() : assignment, acknowledgementRequired: false, alreadyAcknowledged: !!current.driverAcknowledged };
  if (current.driverAcknowledged && current.driverAcknowledgedAt) return { ride: ensured.ride.toObject ? ensured.ride.toObject() : ensured.ride, assignment: assignment.toObject ? assignment.toObject() : assignment, alreadyAcknowledged: true };
  ensured.ride.preJourneySafety = { ...(current || {}), policyVersion: ensured.policy.policyVersion, transportType: ensured.policy.transportType, seatBeltReminderRequired: true, seatBeltReminderStatus: 'recorded', seatBeltReminderAt: current.seatBeltReminderAt || now(), driverAcknowledgementRequired: true, driverAcknowledged: true, driverAcknowledgedAt: now(), driverAcknowledgedBy: driverId, assignmentId: assignment._id, vehicleId: assignment.vehicleId || ensured.ride.vehicleId || null, driverId, occurrenceContext: ensured.occurrenceContext, occurrenceId: current.occurrenceId, occurrenceVersion: current.occurrenceVersion, occurrenceCreatedAt: current.occurrenceCreatedAt };
  ensured.ride.updatedAt = now();
  await ensured.ride.save();
  return { ride: ensured.ride.toObject ? ensured.ride.toObject() : ensured.ride, assignment: assignment.toObject ? assignment.toObject() : assignment };
}

async function startJourney({ actor, driverId, assignmentId }) {
  assertDriver(actor);
  if (!sameId(getActorId(actor), driverId)) { const err = new Error('forbidden'); err.statusCode = 403; throw err; }
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) { const err = new Error('assignment_not_found'); err.statusCode = 404; throw err; }
  if (!sameId(assignment.driverId, driverId)) { const err = new Error('forbidden'); err.statusCode = 403; throw err; }
  if (!assignment.arrivalAt) { const err = new Error('arrival_required'); err.statusCode = 409; throw err; }
  if (!assignment.pickupVerifiedAt) { const err = new Error('pickup_verification_required'); err.statusCode = 409; throw err; }
  const ride = await Ride.findOne({ assignmentId: assignment._id });
  if (!ride) { const err = new Error('ride_not_found'); err.statusCode = 404; throw err; }
  if (ride.journeyStartedAt && assignment.journeyStartedAt) return { assignment: assignment.toObject ? assignment.toObject() : assignment, ride: ride.toObject ? ride.toObject() : ride, alreadyStarted: true };
  const ensured = await ensurePreJourneySafetyOccurrence({ ride, assignment, driverId, vehicleId: assignment.vehicleId });
  const evidence = ensured.occurrence || {};
  if (String(evidence.occurrenceId || '') !== String(ride.preJourneySafety?.occurrenceId || '')) { const err = new Error('stale_pre_journey_safety_occurrence'); err.statusCode = 409; throw err; }
  if (!evidence.seatBeltReminderStatus || evidence.seatBeltReminderStatus !== 'recorded') { const err = new Error('pre_journey_reminder_required'); err.statusCode = 409; throw err; }
  if (ensured.policy.acknowledgementRequired && (!evidence.driverAcknowledged || !evidence.driverAcknowledgedAt)) { const err = new Error('driver_acknowledgement_required'); err.statusCode = 409; throw err; }
  assignment.status = 'onboard';
  assignment.journeyStartedAt = now();
  assignment.updatedAt = now();
  await assignment.save();
  ride.journeyStartedAt = assignment.journeyStartedAt;
  ride.activeJourneyStartedAt = assignment.journeyStartedAt;
  ride.runtimePhase = 'onboard';
  ride.journeyLifecycleStatus = 'onboard';
  ride.status = 'onboard';
  ride.runtimeSource = 'driver';
  ride.updatedAt = now();
  await ride.save();
  return { assignment: assignment.toObject ? assignment.toObject() : assignment, ride: ride.toObject ? ride.toObject() : ride };
}

async function beginPreJourneySafetyOccurrence({ actor, driverId, assignmentId, requestKey } = {}) {
  assertDriver(actor);
  if (!sameId(getActorId(actor), driverId)) { const err = new Error('forbidden'); err.statusCode = 403; throw err; }
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) { const err = new Error('assignment_not_found'); err.statusCode = 404; throw err; }
  if (!sameId(assignment.driverId, driverId)) { const err = new Error('forbidden'); err.statusCode = 403; throw err; }
  if (!assignment.arrivalAt) { const err = new Error('arrival_required'); err.statusCode = 409; throw err; }
  if (!assignment.pickupVerifiedAt) { const err = new Error('pickup_verification_required'); err.statusCode = 409; throw err; }
  const ride = await Ride.findOne({ assignmentId: assignment._id });
  if (!ride) { const err = new Error('ride_not_found'); err.statusCode = 404; throw err; }
  const current = ride.preJourneySafety || {};
  const occurrenceContext = getPreJourneySafetyOccurrenceContext({ ride, assignment, driverId, vehicleId: assignment.vehicleId });
  const sameRequest = requestKey && current.rotationRequestKey === requestKey;
  if (sameRequest && isValidOccurrenceRecord(current, ride, assignment, driverId, assignment.vehicleId) && current.occurrenceVersion > 1) return { ride: ride.toObject ? ride.toObject() : ride, assignment: assignment.toObject ? assignment.toObject() : assignment, alreadyRotated: true };
  const nextVersion = Number(current.occurrenceVersion || 1) + 1;
  ride.preJourneySafety = { occurrenceId: `spo_${ride._id}_${assignment._id}_${nextVersion}`, occurrenceVersion: nextVersion, occurrenceContext, occurrenceCreatedAt: now(), policyVersion: getPreJourneySafetyPolicy(ride).policyVersion, transportType: getPreJourneySafetyPolicy(ride).transportType, seatBeltReminderRequired: getPreJourneySafetyPolicy(ride).reminderRequired, seatBeltReminderStatus: 'pending', seatBeltReminderAt: null, driverAcknowledgementRequired: getPreJourneySafetyPolicy(ride).acknowledgementRequired, driverAcknowledged: false, driverAcknowledgedAt: null, driverAcknowledgedBy: null, assignmentId: assignment._id, vehicleId: assignment.vehicleId || ride.vehicleId || null, driverId, rotationRequestKey: requestKey || null };
  ride.updatedAt = now();
  await ride.save();
  return { ride: ride.toObject ? ride.toObject() : ride, assignment: assignment.toObject ? assignment.toObject() : assignment };
}

function getPreJourneySafetyState({ ride, assignment, driverId }) {
  return ensurePreJourneySafetyOccurrence({ ride, assignment, driverId }).then(({ ride: ensuredRide, occurrence, occurrenceContext }) => ({ ride: ensuredRide.toObject ? ensuredRide.toObject() : ensuredRide, occurrenceId: occurrence.occurrenceId, occurrenceVersion: occurrence.occurrenceVersion, occurrenceContext }));
}

function getCurrentPreJourneySafetyOccurrence({ ride, assignment, driverId, vehicleId } = {}) {
  const currentRide = ride;
  const currentAssignment = assignment || (currentRide?.assignmentId ? { _id: currentRide.assignmentId, driverId: currentRide.driverId, vehicleId: vehicleId || currentRide?.preJourneySafety?.vehicleId } : null);
  const current = getPreJourneySafety(currentRide);
  const occurrenceContext = getPreJourneySafetyOccurrenceContext({ ride: currentRide, assignment: currentAssignment, driverId: driverId || currentRide?.driverId, vehicleId: vehicleId || currentAssignment?.vehicleId });
  return isValidOccurrenceRecord(current, currentRide, currentAssignment, occurrenceContext.driverId, occurrenceContext.vehicleId) ? { occurrence: current, occurrenceContext } : null;
}

module.exports = { computeRequestKey, beginDispatchRound, createRideRequestAndBooking, evaluateMatching, listDriverOffers, acceptOffer, markArrival, verifyPickup, recordPreJourneySafetyReminder, acknowledgePreJourneySafety, startJourney, getPreJourneySafetyPolicy, ensurePreJourneySafetyOccurrence, beginPreJourneySafetyOccurrence, getPreJourneySafetyState, getCurrentPreJourneySafetyOccurrence };


async function requestProtectedJourneyRecovery({ actor, driverId, assignmentId, rideId, journeyId } = {}) {
  assertDriver(actor);
  if (!sameId(getActorId(actor), driverId)) { const err = new Error('forbidden'); err.statusCode = 403; throw err; }
  const ride = await Ride.findById(rideId);
  if (!ride) { const err = new Error('ride_not_found'); err.statusCode = 404; throw err; }
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) { const err = new Error('assignment_not_found'); err.statusCode = 404; throw err; }
  const recoveryId = String(journeyId || rideId || assignmentId);
  const existing = await RecoveryHandoff.findOne({ recoveryId: String(recoveryId) });
  if (existing) return { alreadyRequested: true, recovery: existing.toObject ? existing.toObject() : existing };
  const recovery = await RecoveryHandoff.create({ recoveryId: String(recoveryId), journeyId: String(journeyId || rideId || ''), rideId: ride._id, assignmentId: assignment._id, requestDriverId: driverId, status: 'pending', handoffPending: true, custodyContinuityRequired: true, unauthorizedReceiverProtected: true });
  return { alreadyRequested: false, recovery: recovery.toObject ? recovery.toObject() : recovery };
}

async function planProtectedRecovery({ actor, driverId, assignmentId, recoveryId, replacementAssignmentId } = {}) {
  assertDriver(actor);
  if (!sameId(getActorId(actor), driverId)) { const err = new Error('forbidden'); err.statusCode = 403; throw err; }
  const recovery = await RecoveryHandoff.findOne({ recoveryId: String(recoveryId) });
  if (!recovery) { const err = new Error('recovery_not_found'); err.statusCode = 404; throw err; }
  if (!sameId(recovery.assignmentId, assignmentId)) { const err = new Error('recovery_assignment_mismatch'); err.statusCode = 409; throw err; }
  const replacement = await Assignment.findById(replacementAssignmentId);
  if (!replacement) { const err = new Error('replacement_assignment_not_found'); err.statusCode = 404; throw err; }
  recovery.receiverAssignmentId = replacement._id;
  recovery.receiverDriverId = replacement.driverId;
  recovery.receiverVehicleId = replacement.vehicleId;
  recovery.status = 'handoff_pending';
  recovery.handoffPending = true;
  recovery.updatedAt = new Date();
  await recovery.save();
  return { alreadyPlanned: false, recovery: recovery.toObject ? recovery.toObject() : recovery };
}

async function completeRecoveryHandoff({ actor, driverId, assignmentId, recoveryId } = {}) {
  assertDriver(actor);
  if (!sameId(getActorId(actor), driverId)) { const err = new Error('forbidden'); err.statusCode = 403; throw err; }
  const recovery = await RecoveryHandoff.findOne({ recoveryId: String(recoveryId) });
  if (!recovery) { const err = new Error('recovery_not_found'); err.statusCode = 404; throw err; }
  if (!sameId(recovery.assignmentId, assignmentId)) { const err = new Error('recovery_assignment_mismatch'); err.statusCode = 409; throw err; }
  if (!sameId(recovery.requestDriverId, driverId)) { const err = new Error('forbidden'); err.statusCode = 403; throw err; }
  const ride = await Ride.findById(recovery.rideId);
  const receiverAssignment = await Assignment.findById(recovery.receiverAssignmentId);
  if (!ride || !receiverAssignment) { const err = new Error('recovery_not_found'); err.statusCode = 404; throw err; }
  if (recovery.status === 'completed') return { alreadyCompleted: true, recovery: recovery.toObject ? recovery.toObject() : recovery, ride: ride.toObject ? ride.toObject() : ride };
  ride.assignmentId = receiverAssignment._id;
  ride.driverId = receiverAssignment.driverId;
  ride.preJourneySafety = {
    ...(ride.preJourneySafety || {}),
    occurrenceId: `spo_${ride._id}_${receiverAssignment._id}_${Number((ride.preJourneySafety && ride.preJourneySafety.occurrenceVersion) || 1) + 1}`,
    occurrenceVersion: Number((ride.preJourneySafety && ride.preJourneySafety.occurrenceVersion) || 1) + 1,
    occurrenceContext: getPreJourneySafetyOccurrenceContext({ ride, assignment: receiverAssignment, driverId: receiverAssignment.driverId, vehicleId: receiverAssignment.vehicleId }),
    occurrenceCreatedAt: now(),
    policyVersion: getPreJourneySafetyPolicy(ride).policyVersion,
    transportType: getPreJourneySafetyPolicy(ride).transportType,
    seatBeltReminderRequired: getPreJourneySafetyPolicy(ride).reminderRequired,
    seatBeltReminderStatus: 'pending',
    seatBeltReminderAt: null,
    driverAcknowledgementRequired: getPreJourneySafetyPolicy(ride).acknowledgementRequired,
    driverAcknowledged: false,
    driverAcknowledgedAt: null,
    driverAcknowledgedBy: null,
    assignmentId: receiverAssignment._id,
    vehicleId: receiverAssignment.vehicleId || ride.vehicleId || null,
    driverId: receiverAssignment.driverId,
  };
  ride.updatedAt = new Date();
  await ride.save();
  recovery.status = 'completed';
  recovery.handoffPending = false;
  recovery.updatedAt = new Date();
  await recovery.save();
  return { alreadyCompleted: false, recovery: recovery.toObject ? recovery.toObject() : recovery, ride: ride.toObject ? ride.toObject() : ride };
}

module.exports = { computeRequestKey, beginDispatchRound, createRideRequestAndBooking, evaluateMatching, listDriverOffers, acceptOffer, markArrival, verifyPickup, recordPreJourneySafetyReminder, acknowledgePreJourneySafety, startJourney, getPreJourneySafetyPolicy, ensurePreJourneySafetyOccurrence, beginPreJourneySafetyOccurrence, getPreJourneySafetyState, getCurrentPreJourneySafetyOccurrence, requestProtectedJourneyRecovery, planProtectedRecovery, completeRecoveryHandoff };
