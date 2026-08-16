const mongoose = require('mongoose');
const { Booking, Child, Vehicle, RideRequest, DispatchOffer, Assignment, Ride, User } = require('../database/schema');
const sameId = (a, b) => String(a || '') === String(b || '');
const now = () => new Date();
const normalizeText = (v) => (v == null ? '' : String(v).trim().replace(/\s+/g, ' ').toLowerCase());
const normalizePickupAt = (v) => (v ? new Date(v).toISOString() : '');
function assertActor(actor, role) { if (!actor || actor.role !== role) { const err = new Error('forbidden'); err.statusCode = 403; throw err; } }
function assertDriver(actor) { assertActor(actor, 'driver'); }
function getActorId(actor) { return actor?._id || actor?.id || actor?.userId; }
function computeRequestKey({ actorId, childId, schoolId, vehicleType, pickupAddress, dropoffAddress, pickupAt }) { return [String(actorId).trim(), String(childId).trim(), String(schoolId || '').trim(), normalizeText(vehicleType), normalizeText(pickupAddress), normalizeText(dropoffAddress), normalizePickupAt(pickupAt)].join('|'); }
function getDispatchVersion(booking) { return Number(booking?.dispatchVersion || 1); }
function getAssignmentSlotKey(booking, rideRequest) { return [String(booking?._id || ''), String(rideRequest?._id || '')].join(':'); }
function isDispatchableBooking(booking) { return !!booking && booking.status === 'active' && booking.dispatchState !== 'not_dispatchable'; }
async function beginDispatchRound({ bookingId, reason = 'manual' } = {}) { const session = await mongoose.startSession(); try { session.startTransaction(); const currentBooking = await Booking.findById(bookingId).session(session); if (!currentBooking) { const err = new Error('booking_not_found'); err.statusCode = 404; throw err; } const expectedVersion = Number(currentBooking.dispatchVersion || 1); const nextVersion = expectedVersion + 1; const booking = await Booking.findOneAndUpdate({ _id: bookingId, dispatchVersion: expectedVersion, status: 'active', dispatchState: { $ne: 'not_dispatchable' } }, { $inc: { dispatchVersion: 1 }, $set: { updatedAt: now() } }, { new: true, session }); if (!booking) { const err = new Error('concurrency_lost'); err.statusCode = 409; throw err; } const supersedeResult = await DispatchOffer.updateMany({ bookingId: booking._id, status: 'active', dispatchVersion: { $lt: nextVersion } }, { $set: { status: 'superseded', revokedAt: now(), updatedAt: now() } }, { session }); if (supersedeResult == null) { const err = new Error('dispatch_supercession_failed'); err.statusCode = 500; throw err; } await session.commitTransaction(); session.endSession(); return { booking: booking.toObject ? booking.toObject() : booking, dispatchVersion: nextVersion, reason }; } catch (err) { await session.abortTransaction().catch(() => {}); session.endSession(); throw err; } }
async function createRideRequestAndBooking({ actor, childId, schoolId, vehicleType = 'car', pickupAddress = '', dropoffAddress = '', pickupAt = null, requestKey }) {
  if (!actor) { const err = new Error('unauthorized'); err.statusCode = 401; throw err; }
  const actorId = getActorId(actor);
  if (!actorId) { const err = new Error('unauthorized'); err.statusCode = 401; throw err; }
  const child = await Child.findById(childId).lean();
  if (!child) { const err = new Error('child_not_found'); err.statusCode = 404; throw err; }
  if (!sameId(child.parentId, actorId)) { const err = new Error('unauthorized_booking_context'); err.statusCode = 403; throw err; }
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
  const offerIds = [];
  const drivers = await User.find({ role: 'driver' }).lean();
  const vehicles = await Vehicle.find({ driverId: { $in: drivers.map(d => d._id) }, isApproved: true, isAvailable: true, type: requestDoc.vehicleType || 'car' }).lean();
  const vehicleByDriver = new Map(vehicles.map(v => [String(v.driverId), v]));
  const ranking = [];
  for (const driver of drivers) {
    const vehicle = vehicleByDriver.get(String(driver._id));
    if (!vehicle) continue;
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
  ranking.sort((a, b) => String(a.driver._id).localeCompare(String(b.driver._id)));
  const created = [];
  for (const row of ranking) {
    const found = await DispatchOffer.findOne({ bookingId: bookingDoc._id, dispatchVersion: nextVersion, driverId: row.driver._id });
    if (found) { created.push(found); continue; }
    created.push(await DispatchOffer.create([row.offer]).then(d => d[0]));
  }
  await RideRequest.updateOne({ _id: requestDoc._id }, { $set: { dispatchVersion: nextVersion, dispatchState: 'dispatchable', updatedAt: now() } });
  return { booking: bookingDoc, rideRequest: requestDoc, offers: created.map(o => o.toObject ? o.toObject() : o) };
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
      const err = new Error('already_taken'); err.statusCode = 409; throw err;
    }
    offer.status = 'accepted';
    offer.acceptedAt = now();
    offer.updatedAt = now();
    await offer.save({ session });
    const assignment = await Assignment.create([{ bookingId: booking._id, rideRequestId: offer.rideRequestId || null, dispatchScopeId: null, dispatchOfferId: offer._id, assignmentSlotKey, assignmentVersion: Number(offer.dispatchVersion || 1), driverId, vehicleId: offer.vehicleId || null, status: 'active', acceptedAt: now(), arrivalAt: null, pickupVerifiedAt: null, journeyStartedAt: null }], { session }).then(d => d[0]);
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
  assignment.status = 'pickup_verified';
  assignment.pickupVerifiedAt = now();
  assignment.updatedAt = now();
  await assignment.save();
  await Ride.updateOne({ assignmentId: assignment._id }, { $set: { pickupVerifiedAt: assignment.pickupVerifiedAt, runtimePhase: 'pickup_verified', pickupVerificationStatus: 'verified', runtimeFlags: { pickupVerificationMethod: method || 'driver_confirmed', pickupVerificationSource: 'driver', activePassengerState: 'secured' }, updatedAt: now() } });
  return { assignment: assignment.toObject ? assignment.toObject() : assignment };
}

async function startJourney({ actor, driverId, assignmentId }) {
  assertDriver(actor);
  if (!sameId(getActorId(actor), driverId)) { const err = new Error('forbidden'); err.statusCode = 403; throw err; }
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) { const err = new Error('assignment_not_found'); err.statusCode = 404; throw err; }
  if (!sameId(assignment.driverId, driverId)) { const err = new Error('forbidden'); err.statusCode = 403; throw err; }
  if (!assignment.pickupVerifiedAt) { const err = new Error('pickup_verification_required'); err.statusCode = 409; throw err; }
  assignment.status = 'onboard';
  assignment.journeyStartedAt = now();
  assignment.updatedAt = now();
  await assignment.save();
  await Ride.updateOne({ assignmentId: assignment._id }, { $set: { journeyStartedAt: assignment.journeyStartedAt, activeJourneyStartedAt: assignment.journeyStartedAt, runtimePhase: 'onboard', journeyLifecycleStatus: 'onboard', status: 'onboard', runtimeSource: 'driver', updatedAt: now() } });
  return { assignment: assignment.toObject ? assignment.toObject() : assignment };
}

module.exports = { computeRequestKey, beginDispatchRound, createRideRequestAndBooking, evaluateMatching, listDriverOffers, acceptOffer, markArrival, verifyPickup, startJourney };
