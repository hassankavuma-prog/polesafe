const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { startMongoReplSet, stopMongoReplSet } = require('./helpers/mongoReplSet');
const { Booking, Child, Vehicle, RideRequest, DispatchOffer, Assignment, Ride, User } = require('../database/schema');
const runtime = require('../services/phase1Runtime');

async function resetCollections() {
  await Promise.all([
    Booking.deleteMany({}),
    Child.deleteMany({}),
    Vehicle.deleteMany({}),
    RideRequest.deleteMany({}),
    DispatchOffer.deleteMany({}),
    Assignment.deleteMany({}),
    Ride.deleteMany({}),
    User.deleteMany({}),
  ]);
}

async function seedRide({ type, isRideHailing = false } = {}) {
  const tag = `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-8).padStart(8, '0');
  const parent = await User.create({ phone: `+2567${tag}`, name: 'Parent One', role: 'parent' });
  const driver = await User.create({ phone: `+2567${String(Number(tag) + 1000).padStart(8, '0')}`, name: 'Driver One', role: 'driver', isDriverIdVerified: true, verificationStatus: 'approved' });
  const child = await Child.create({ parentId: parent._id, name: 'Kid', schoolId: new mongoose.Types.ObjectId(), isActive: true, status: 'active' });
  const vehicle = await Vehicle.create({ driverId: driver._id, type: 'car', capacity: 4, isApproved: true, isAvailable: true });
  const booking = await Booking.create({ parentId: parent._id, childId: child._id, schoolId: child.schoolId, type: 'weekly', daysOfWeek: ['Mon'], pickupTime: '7:00 AM', dropoffTime: '4:30 PM', vehicleType: 'car', status: 'active', dispatchState: 'dispatchable', dispatchVersion: 1, startDate: new Date() });
  const rideRequest = await RideRequest.create({ parentId: parent._id, childId: child._id, schoolId: child.schoolId, bookingId: booking._id, requestType: 'scheduled', requestKey: `${parent._id}|${child._id}|${child.schoolId}|car|a|b|2026-08-17T00:00:00.000Z`, requestFingerprint: `fp-${tag}`, vehicleType: 'car', pickupAddress: 'a', dropoffAddress: 'b', pickupAt: new Date('2026-08-17T00:00:00.000Z'), requestStatus: 'submitted', source: 'parent', dispatchVersion: 1, dispatchState: 'dispatchable' });
  booking.journeyRequestId = rideRequest._id;
  booking.sourceRideRequestId = rideRequest._id;
  await booking.save();
  const offer = await DispatchOffer.create({ bookingId: booking._id, rideRequestId: rideRequest._id, driverId: driver._id, vehicleId: vehicle._id, dispatchVersion: 1, status: 'active', expiresAt: new Date(Date.now() + 600000), ranking: 0, eligibilitySnapshot: {}, offerVersion: 0 });
  const accepted = await runtime.acceptOffer({ actor: driver, driverId: driver._id, offerId: offer._id });
  const assignment = await Assignment.findById(accepted.assignment._id);
  const ride = await Ride.findOne({ assignmentId: assignment._id });
  ride.type = type;
  ride.isRideHailing = isRideHailing;
  await ride.save();
  return { parent, driver, child, vehicle, booking, rideRequest, assignment, ride };
}

async function ensureRideWithArrivalAndPickup(type, opts = {}) {
  const ctx = await seedRide({ type, isRideHailing: !!opts.isRideHailing });
  await runtime.markArrival({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id });
  if (opts.pickup !== false) {
    await runtime.verifyPickup({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id, method: 'driver_confirmed' });
  }
  return ctx;
}

test('Phase 1D pre-journey safety foundation', async (t) => {
  const ctx = await startMongoReplSet();
  t.after(async () => {
    await resetCollections();
    await stopMongoReplSet(ctx);
  });

  await t.test('policy classification is deterministic', async () => {
    const school = runtime.getPreJourneySafetyPolicy({ type: 'school_morning' });
    const school2 = runtime.getPreJourneySafetyPolicy({ type: 'school_afternoon' });
    const rideHailing = runtime.getPreJourneySafetyPolicy({ type: 'ride_hailing', isRideHailing: true });
    const unknown = runtime.getPreJourneySafetyPolicy({ type: 'excursion' });
    assert.equal(school.acknowledgementRequired, true);
    assert.equal(school2.acknowledgementRequired, true);
    assert.equal(rideHailing.acknowledgementRequired, false);
    assert.equal(unknown.transportType, 'unknown');
    assert.equal(unknown.reminderRequired, false);
  });

  await t.test('reminder cannot be recorded before arrival or pickup verification', async () => {
    await resetCollections();
    const ctx = await seedRide({ type: 'school_morning' });
    await assert.rejects(() => runtime.recordPreJourneySafetyReminder({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id }), /arrival_required/);
    await runtime.markArrival({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id });
    await assert.rejects(() => runtime.recordPreJourneySafetyReminder({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id }), /pickup_verification_required/);
  });

  await t.test('reminder is tied to correct driver and assignment and is idempotent', async () => {
    await resetCollections();
    const ctx = await ensureRideWithArrivalAndPickup('school_morning');
    const otherDriver = await User.create({ phone: '+256702000010', name: 'Other Driver', role: 'driver', isDriverIdVerified: true, verificationStatus: 'approved' });
    await assert.rejects(() => runtime.recordPreJourneySafetyReminder({ actor: otherDriver, driverId: otherDriver._id, assignmentId: ctx.assignment._id }), /forbidden/);
    const first = await runtime.recordPreJourneySafetyReminder({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id });
    assert.equal(first.ride.preJourneySafety.seatBeltReminderStatus, 'recorded');
    assert.equal(first.ride.preJourneySafety.assignmentId.toString(), ctx.assignment._id.toString());
    assert.equal(first.ride.preJourneySafety.vehicleId.toString(), ctx.vehicle._id.toString());
    const reminderAt = first.ride.preJourneySafety.seatBeltReminderAt.toISOString();
    const second = await runtime.recordPreJourneySafetyReminder({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id });
    assert.equal(second.alreadyRecorded, true);
    assert.equal(second.ride.preJourneySafety.seatBeltReminderAt.toISOString(), reminderAt);
  });

  await t.test('acknowledgement cannot occur before pickup or reminder, and only driver can acknowledge', async () => {
    await resetCollections();
    const ctx = await seedRide({ type: 'school_morning' });
    await assert.rejects(() => runtime.acknowledgePreJourneySafety({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id }), /arrival_required/);
    await runtime.markArrival({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id });
    await assert.rejects(() => runtime.acknowledgePreJourneySafety({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id }), /pickup_verification_required|pre_journey_reminder_required/);
    await runtime.verifyPickup({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id, method: 'driver_confirmed' });
    await assert.rejects(() => runtime.acknowledgePreJourneySafety({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id }), /pre_journey_reminder_required/);
    await runtime.recordPreJourneySafetyReminder({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id });
    await assert.rejects(() => runtime.acknowledgePreJourneySafety({ actor: ctx.parent, driverId: ctx.parent._id, assignmentId: ctx.assignment._id }), /forbidden/);
    const intruder = await User.create({ phone: '+256703000010', name: 'Intruder', role: 'driver', isDriverIdVerified: true, verificationStatus: 'approved' });
    await assert.rejects(() => runtime.acknowledgePreJourneySafety({ actor: intruder, driverId: intruder._id, assignmentId: ctx.assignment._id }), /forbidden/);
    const ack = await runtime.acknowledgePreJourneySafety({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id });
    assert.equal(ack.ride.preJourneySafety.driverAcknowledged, true);
    assert.equal(ack.ride.preJourneySafety.driverAcknowledgedBy.toString(), ctx.driver._id.toString());
    const ackAt = ack.ride.preJourneySafety.driverAcknowledgedAt.toISOString();
    const retry = await runtime.acknowledgePreJourneySafety({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id });
    assert.equal(retry.alreadyAcknowledged, true);
    assert.equal(retry.ride.preJourneySafety.driverAcknowledgedAt.toISOString(), ackAt);
  });

  await t.test('acknowledgement cannot be reused across another ride/assignment', async () => {
    await resetCollections();

    const ctxA = await ensureRideWithArrivalAndPickup('school_morning');
    await runtime.recordPreJourneySafetyReminder({ actor: ctxA.driver, driverId: ctxA.driver._id, assignmentId: ctxA.assignment._id });
    await runtime.acknowledgePreJourneySafety({ actor: ctxA.driver, driverId: ctxA.driver._id, assignmentId: ctxA.assignment._id });

    const ctxB = await ensureRideWithArrivalAndPickup('school_morning');
    await runtime.recordPreJourneySafetyReminder({ actor: ctxB.driver, driverId: ctxB.driver._id, assignmentId: ctxB.assignment._id });

    await assert.rejects(
      () => runtime.startJourney({ actor: ctxB.driver, driverId: ctxB.driver._id, assignmentId: ctxB.assignment._id }),
      /driver_acknowledgement_required|pre_journey_acknowledgement_required/,
    );
    const persistedB = await Ride.findOne({ assignmentId: ctxB.assignment._id });
    assert.equal(Boolean(persistedB.preJourneySafety?.driverAcknowledged), false);
    assert.equal(persistedB.preJourneySafety?.driverAcknowledgedBy ?? null, null);

    await runtime.acknowledgePreJourneySafety({ actor: ctxB.driver, driverId: ctxB.driver._id, assignmentId: ctxB.assignment._id });
    const startedB = await runtime.startJourney({ actor: ctxB.driver, driverId: ctxB.driver._id, assignmentId: ctxB.assignment._id });
    assert.equal(startedB.ride.runtimePhase, 'onboard');
  });

  await t.test('child/school journey start requires reminder and acknowledgement and is idempotent', async () => {
    await resetCollections();
    const ctx = await seedRide({ type: 'school_morning' });
    await runtime.markArrival({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id });
    await assert.rejects(() => runtime.startJourney({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id }), /pickup_verification_required/);
    await runtime.verifyPickup({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id, method: 'driver_confirmed' });
    await assert.rejects(() => runtime.startJourney({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id }), /pre_journey_reminder_required/);
    await runtime.recordPreJourneySafetyReminder({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id });
    await assert.rejects(() => runtime.startJourney({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id }), /driver_acknowledgement_required|pre_journey_acknowledgement_required/);
    await runtime.acknowledgePreJourneySafety({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id });
    const started = await runtime.startJourney({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id });
    const journeyStartedAt = started.ride.journeyStartedAt.toISOString();
    const retry = await runtime.startJourney({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id });
    assert.equal(retry.alreadyStarted, true);
    assert.equal(retry.ride.journeyStartedAt.toISOString(), journeyStartedAt);
  });

  await t.test('ordinary ride requires reminder but not acknowledgement', async () => {
    await resetCollections();
    const ctx = await seedRide({ type: 'ride_hailing', isRideHailing: true });
    await runtime.markArrival({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id });
    await runtime.verifyPickup({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id, method: 'driver_confirmed' });
    await assert.rejects(() => runtime.startJourney({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id }), /pre_journey_reminder_required/);
    await runtime.recordPreJourneySafetyReminder({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id });
    const started = await runtime.startJourney({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id });
    assert.equal(started.assignment.status, 'onboard');
    assert.equal(started.assignment.journeyStartedAt != null, true);
    assert.equal(started.ride?.preJourneySafety?.driverAcknowledged === undefined || started.ride?.preJourneySafety?.driverAcknowledged === false, true);
  });

  await t.test('fresh school occurrence rejects stale reminder and acknowledgement after protected recovery', async () => {
    await resetCollections();
    const ctx = await ensureRideWithArrivalAndPickup('school_morning');
    const oldReminder = await runtime.recordPreJourneySafetyReminder({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id });
    const oldAcknowledgement = await runtime.acknowledgePreJourneySafety({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id });
    const oldOccurrenceId = String(oldAcknowledgement.ride.preJourneySafety.occurrenceId);
    const oldOccurrenceVersion = Number(oldAcknowledgement.ride.preJourneySafety.occurrenceVersion);
    assert.equal(String(oldReminder.ride.preJourneySafety.occurrenceId), oldOccurrenceId);
    const driverB = await User.create({ phone: '+256704000010', name: 'Receiver Driver', role: 'driver', isDriverIdVerified: true, verificationStatus: 'approved' });
    const vehicleB = await Vehicle.create({ driverId: driverB._id, type: 'car', capacity: 4, isApproved: true, isAvailable: true });
    const replacementAssignment = await Assignment.create({ bookingId: ctx.booking._id, rideRequestId: ctx.rideRequest._id, assignmentSlotKey: String(ctx.booking._id) + ':' + String(ctx.rideRequest._id), driverId: driverB._id, vehicleId: vehicleB._id, status: 'active' });
    const recovery = await runtime.requestProtectedJourneyRecovery({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id, rideId: ctx.ride._id, journeyId: String(ctx.ride._id), triggerType: 'custody_break' });
    await runtime.planProtectedRecovery({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id, recoveryId: recovery.recovery.recoveryId, replacementAssignmentId: replacementAssignment._id });
    const completed = await runtime.completeRecoveryHandoff({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id, recoveryId: recovery.recovery.recoveryId });
    const freshOccurrenceId = String(completed.ride.preJourneySafety.occurrenceId);
    assert.notEqual(freshOccurrenceId, oldOccurrenceId);
    assert.equal(Number(completed.ride.preJourneySafety.occurrenceVersion) > oldOccurrenceVersion, true);
    await runtime.markArrival({ actor: driverB, driverId: driverB._id, assignmentId: replacementAssignment._id });
    const arrivedReplacement = await Assignment.findById(replacementAssignment._id).lean();
    assert.ok(arrivedReplacement.arrivalAt);
    await runtime.verifyPickup({ actor: driverB, driverId: driverB._id, assignmentId: replacementAssignment._id, method: 'driver_confirmed' });
    const verifiedReplacement = await Assignment.findById(replacementAssignment._id).lean();
    assert.ok(verifiedReplacement.pickupVerifiedAt);
    await assert.rejects(() => runtime.startJourney({ actor: driverB, driverId: driverB._id, assignmentId: replacementAssignment._id }), /pre_journey_reminder_required/);
    await runtime.recordPreJourneySafetyReminder({ actor: driverB, driverId: driverB._id, assignmentId: replacementAssignment._id });
    await assert.rejects(() => runtime.startJourney({ actor: driverB, driverId: driverB._id, assignmentId: replacementAssignment._id }), /driver_acknowledgement_required|pre_journey_acknowledgement_required/);
    await runtime.acknowledgePreJourneySafety({ actor: driverB, driverId: driverB._id, assignmentId: replacementAssignment._id });
    const started = await runtime.startJourney({ actor: driverB, driverId: driverB._id, assignmentId: replacementAssignment._id });
    assert.equal(String(started.ride.preJourneySafety.occurrenceId), freshOccurrenceId);
  });

  await t.test('ordinary passenger recovery requires fresh reminder but not acknowledgement', async () => {
    await resetCollections();
    const ctx = await ensureRideWithArrivalAndPickup('ride_hailing', { isRideHailing: true });
    const oldReminder = await runtime.recordPreJourneySafetyReminder({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id });
    const oldOccurrenceId = String(oldReminder.ride.preJourneySafety.occurrenceId);
    const oldOccurrenceVersion = Number(oldReminder.ride.preJourneySafety.occurrenceVersion);
    const driverB = await User.create({ phone: '+256705000010', name: 'Receiver Ordinary Driver', role: 'driver', isDriverIdVerified: true, verificationStatus: 'approved' });
    const vehicleB = await Vehicle.create({ driverId: driverB._id, type: 'car', capacity: 4, isApproved: true, isAvailable: true });
    const replacementAssignment = await Assignment.create({ bookingId: ctx.booking._id, rideRequestId: ctx.rideRequest._id, assignmentSlotKey: String(ctx.booking._id) + ':' + String(ctx.rideRequest._id), driverId: driverB._id, vehicleId: vehicleB._id, status: 'active' });
    const recovery = await runtime.requestProtectedJourneyRecovery({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id, rideId: ctx.ride._id, journeyId: String(ctx.ride._id), triggerType: 'custody_break' });
    await runtime.planProtectedRecovery({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id, recoveryId: recovery.recovery.recoveryId, replacementAssignmentId: replacementAssignment._id });
    const completed = await runtime.completeRecoveryHandoff({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id, recoveryId: recovery.recovery.recoveryId });
    assert.notEqual(String(completed.ride.preJourneySafety.occurrenceId), oldOccurrenceId);
    assert.equal(Number(completed.ride.preJourneySafety.occurrenceVersion) > oldOccurrenceVersion, true);
    assert.equal(String(completed.ride._id), String(ctx.ride._id));
    const completedRetry = await runtime.completeRecoveryHandoff({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id, recoveryId: recovery.recovery.recoveryId });
    assert.equal(completedRetry.alreadyCompleted, true);
    assert.equal(String(completedRetry.ride.preJourneySafety.occurrenceId), String(completed.ride.preJourneySafety.occurrenceId));
    await runtime.markArrival({ actor: driverB, driverId: driverB._id, assignmentId: replacementAssignment._id });
    await runtime.verifyPickup({ actor: driverB, driverId: driverB._id, assignmentId: replacementAssignment._id, method: 'driver_confirmed' });
    const arrivedReplacement = await Assignment.findById(replacementAssignment._id).lean();
    assert.ok(arrivedReplacement.arrivalAt);
    assert.ok(arrivedReplacement.pickupVerifiedAt);
    await assert.rejects(() => runtime.startJourney({ actor: driverB, driverId: driverB._id, assignmentId: replacementAssignment._id }), /pre_journey_reminder_required/);
    const freshReminder = await runtime.recordPreJourneySafetyReminder({ actor: driverB, driverId: driverB._id, assignmentId: replacementAssignment._id });
    assert.equal(String(freshReminder.ride.preJourneySafety.occurrenceId), String(completed.ride.preJourneySafety.occurrenceId));
    const started = await runtime.startJourney({ actor: driverB, driverId: driverB._id, assignmentId: replacementAssignment._id });
    assert.equal(started.ride.journeyLifecycleStatus, 'onboard');
    assert.equal(started.ride.runtimePhase, 'onboard');
    assert.equal(started.ride._id.toString(), ctx.ride._id.toString());
    assert.equal(started.ride?.preJourneySafety?.driverAcknowledged === undefined || started.ride?.preJourneySafety?.driverAcknowledged === false, true);
  });

  await t.test('unknown ride type does not silently inherit child or ordinary policy', async () => {
    const policy = runtime.getPreJourneySafetyPolicy({ type: 'excursion' });
    assert.equal(policy.transportType, 'unknown');
    assert.equal(policy.reminderRequired, false);
    assert.equal(policy.acknowledgementRequired, false);
  });
});
