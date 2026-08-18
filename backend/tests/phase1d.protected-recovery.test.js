const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { startMongoReplSet, stopMongoReplSet } = require('./helpers/mongoReplSet');
const { Booking, Child, Vehicle, RideRequest, DispatchOffer, Assignment, Ride, User, RecoveryHandoff } = require('../database/schema');
const { getModel } = require('mongoose');
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
    RecoveryHandoff.deleteMany({}),
    User.deleteMany({}),
  ]);
}

async function seedProtectedRecoveryWorld() {
  const parent = await User.create({ phone: '+256700100001', name: 'Parent', role: 'parent' });
  const child = await Child.create({ parentId: parent._id, name: 'Kid', schoolId: new mongoose.Types.ObjectId(), isActive: true, status: 'active' });
  const driverA = await User.create({ phone: '+256700100011', name: 'Driver A', role: 'driver', isDriverIdVerified: true, verificationStatus: 'approved' });
  const driverB = await User.create({ phone: '+256700100012', name: 'Driver B', role: 'driver', isDriverIdVerified: true, verificationStatus: 'approved' });
  const vehicleA = await Vehicle.create({ driverId: driverA._id, type: 'car', capacity: 4, isApproved: true, isAvailable: true });
  const vehicleB = await Vehicle.create({ driverId: driverB._id, type: 'car', capacity: 4, isApproved: true, isAvailable: true });
  const booking = await Booking.create({ parentId: parent._id, childId: child._id, schoolId: child.schoolId, type: 'weekly', daysOfWeek: ['Mon'], pickupTime: '7:00 AM', dropoffTime: '4:30 PM', vehicleType: 'car', status: 'active', dispatchState: 'dispatchable', dispatchVersion: 1, startDate: new Date() });
  const rideRequest = await RideRequest.create({ parentId: parent._id, childId: child._id, schoolId: child.schoolId, bookingId: booking._id, requestType: 'scheduled', requestKey: String(parent._id) + '|' + String(child._id) + '|' + String(child.schoolId) + '|car|a|b|2026-08-17T00:00:00.000Z', requestFingerprint: 'fp-' + Date.now(), vehicleType: 'car', pickupAddress: 'a', dropoffAddress: 'b', pickupAt: new Date('2026-08-17T00:00:00.000Z'), requestStatus: 'submitted', source: 'parent', dispatchVersion: 1, dispatchState: 'dispatchable' });
  booking.journeyRequestId = rideRequest._id;
  booking.sourceRideRequestId = rideRequest._id;
  await booking.save();
  const offerA = await DispatchOffer.create({ bookingId: booking._id, rideRequestId: rideRequest._id, driverId: driverA._id, vehicleId: vehicleA._id, dispatchVersion: 1, status: 'active', expiresAt: new Date(Date.now() + 600000), ranking: 0, eligibilitySnapshot: {}, offerVersion: 0 });
  await DispatchOffer.create({ bookingId: booking._id, rideRequestId: rideRequest._id, driverId: driverB._id, vehicleId: vehicleB._id, dispatchVersion: 1, status: 'active', expiresAt: new Date(Date.now() + 600000), ranking: 1, eligibilitySnapshot: {}, offerVersion: 0 });
  const accepted = await runtime.acceptOffer({ actor: driverA, driverId: driverA._id, offerId: offerA._id });
  const assignment = await Assignment.findById(accepted.assignment._id);
  const ride = await Ride.findOne({ assignmentId: assignment._id });
  return { parent, child, driverA, driverB, vehicleA, vehicleB, booking, rideRequest, assignment, ride };
}

async function createReplacementAssignment({ rideRequest, driver, vehicle, booking }) {
  let offer = await DispatchOffer.findOne({ bookingId: booking._id, dispatchVersion: 1, driverId: driver._id });
  if (!offer) offer = await DispatchOffer.create({ bookingId: booking._id, rideRequestId: rideRequest._id, driverId: driver._id, vehicleId: vehicle._id, dispatchVersion: 1, status: 'active', expiresAt: new Date(Date.now() + 600000), ranking: 9, eligibilitySnapshot: {}, offerVersion: 0 });
  const accepted = await runtime.acceptOffer({ actor: driver, driverId: driver._id, offerId: offer._id });
  return { offer, assignment: accepted.assignment };
}

async function preparePickup(ctx) {
  await runtime.markArrival({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id });
  await runtime.verifyPickup({ actor: ctx.driver, driverId: ctx.driver._id, assignmentId: ctx.assignment._id, method: 'driver_confirmed' });
}

test('Phase 1D protected recovery contract', async (t) => {
  const ctx = await startMongoReplSet();
  t.after(async () => { await resetCollections(); await stopMongoReplSet(ctx); });

  await t.test('request creates protected recovery handoff state', async () => {
    await resetCollections();
    const { assignment, ride } = await seedProtectedRecoveryWorld();
    await preparePickup({ driver: { _id: assignment.driverId, role: 'driver' }, assignment });
    const result = await runtime.requestProtectedJourneyRecovery({ actor: { _id: assignment.driverId, role: 'driver' }, driverId: assignment.driverId, assignmentId: assignment._id, rideId: ride._id, journeyId: String(ride._id), triggerType: 'custody_break' });
    assert.equal(result.alreadyRequested, false);
    assert.ok(result.recovery.recoveryId);
    assert.equal(typeof result.recovery.recoveryId, 'string');
    assert.equal(String(result.recovery.assignmentId), String(assignment._id));
    assert.equal(result.recovery.status, 'pending');
    assert.equal(result.recovery.handoffPending, true);
    assert.equal(result.recovery.custodyContinuityRequired, true);
    assert.equal(result.recovery.unauthorizedReceiverProtected, true);
  });

  await t.test('planning establishes handoff_pending receiver custody state', async () => {
    await resetCollections();
    const { assignment, ride, rideRequest, driverB, vehicleB } = await seedProtectedRecoveryWorld();
    await preparePickup({ driver: { _id: assignment.driverId, role: 'driver' }, assignment });
    const requested = await runtime.requestProtectedJourneyRecovery({ actor: { _id: assignment.driverId, role: 'driver' }, driverId: assignment.driverId, assignmentId: assignment._id, rideId: ride._id, journeyId: String(ride._id), triggerType: 'custody_break' });
    const replacement = await createReplacementAssignment({ rideRequest, driver: driverB, vehicle: vehicleB, booking: await Booking.findById(assignment.bookingId) });
    const planned = await runtime.planProtectedRecovery({ actor: { _id: assignment.driverId, role: 'driver' }, driverId: assignment.driverId, assignmentId: assignment._id, recoveryId: requested.recovery.recoveryId, replacementAssignmentId: replacement.assignment._id });
    assert.equal(planned.alreadyPlanned, false);
    assert.equal(planned.recovery.status, 'handoff_pending');
    assert.equal(planned.recovery.handoffPending, true);
    assert.equal(String(planned.recovery.receiverAssignmentId), String(replacement.assignment._id));
    assert.equal(String(planned.recovery.receiverDriverId), String(driverB._id));
    assert.equal(String(planned.recovery.receiverVehicleId), String(vehicleB._id));
  });

  await t.test('completion rebinds SAME Ride to receiver assignment/driver', async () => {
    await resetCollections();
    const { assignment, ride, rideRequest, driverB, vehicleB } = await seedProtectedRecoveryWorld();
    await preparePickup({ driver: { _id: assignment.driverId, role: 'driver' }, assignment });
    const requested = await runtime.requestProtectedJourneyRecovery({ actor: { _id: assignment.driverId, role: 'driver' }, driverId: assignment.driverId, assignmentId: assignment._id, rideId: ride._id, journeyId: String(ride._id), triggerType: 'custody_break' });
    const replacement = await createReplacementAssignment({ rideRequest, driver: driverB, vehicle: vehicleB, booking: await Booking.findById(assignment.bookingId) });
    await runtime.planProtectedRecovery({ actor: { _id: assignment.driverId, role: 'driver' }, driverId: assignment.driverId, assignmentId: assignment._id, recoveryId: requested.recovery.recoveryId, replacementAssignmentId: replacement.assignment._id });
    const completed = await runtime.completeRecoveryHandoff({ actor: { _id: assignment.driverId, role: 'driver' }, driverId: assignment.driverId, assignmentId: assignment._id, recoveryId: requested.recovery.recoveryId });
    assert.equal(completed.alreadyCompleted, false);
    assert.equal(String(completed.ride._id), String(ride._id));
    assert.equal(String(completed.ride.assignmentId), String(replacement.assignment._id));
    assert.equal(String(completed.ride.driverId), String(driverB._id));
    assert.equal(completed.ride.vehicleId, undefined);
    const persistedRecovery = await RecoveryHandoff.findOne({ recoveryId: String(requested.recovery.recoveryId) }).lean();
    const persistedReplacementAssignment = await Assignment.findById(replacement.assignment._id).lean();
    assert.ok(persistedRecovery);
    assert.equal(String(persistedRecovery.receiverVehicleId), String(vehicleB._id));
    assert.equal(String(persistedReplacementAssignment.vehicleId), String(vehicleB._id));
  });

  await t.test('unauthorized/malformed completion attempts blocked', async () => {
    await resetCollections();
    const { assignment, ride, rideRequest, driverB, vehicleB } = await seedProtectedRecoveryWorld();
    await preparePickup({ driver: { _id: assignment.driverId, role: 'driver' }, assignment });
    const requested = await runtime.requestProtectedJourneyRecovery({ actor: { _id: assignment.driverId, role: 'driver' }, driverId: assignment.driverId, assignmentId: assignment._id, rideId: ride._id, journeyId: String(ride._id), triggerType: 'custody_break' });
    const replacement = await createReplacementAssignment({ rideRequest, driver: driverB, vehicle: vehicleB, booking: await Booking.findById(assignment.bookingId) });
    await runtime.planProtectedRecovery({ actor: { _id: assignment.driverId, role: 'driver' }, driverId: assignment.driverId, assignmentId: assignment._id, recoveryId: requested.recovery.recoveryId, replacementAssignmentId: replacement.assignment._id });
    await assert.rejects(() => runtime.completeRecoveryHandoff({ actor: { _id: driverB._id, role: 'driver' }, driverId: driverB._id, assignmentId: assignment._id, recoveryId: requested.recovery.recoveryId }), /forbidden/);
    await assert.rejects(() => runtime.completeRecoveryHandoff({ actor: { _id: assignment.driverId, role: 'driver' }, driverId: assignment.driverId, assignmentId: replacement.assignment._id, recoveryId: requested.recovery.recoveryId }), /recovery_assignment_mismatch/);
    await assert.rejects(() => runtime.completeRecoveryHandoff({ actor: { _id: assignment.driverId, role: 'driver' }, driverId: assignment.driverId, assignmentId: assignment._id, recoveryId: 'missing-recovery-id' }), /recovery_not_found/);
  });

  await t.test('completion idempotent', async () => {
    await resetCollections();
    const { assignment, ride, rideRequest, driverB, vehicleB } = await seedProtectedRecoveryWorld();
    await preparePickup({ driver: { _id: assignment.driverId, role: 'driver' }, assignment });
    const requested = await runtime.requestProtectedJourneyRecovery({ actor: { _id: assignment.driverId, role: 'driver' }, driverId: assignment.driverId, assignmentId: assignment._id, rideId: ride._id, journeyId: String(ride._id), triggerType: 'custody_break' });
    const replacement = await createReplacementAssignment({ rideRequest, driver: driverB, vehicle: vehicleB, booking: await Booking.findById(assignment.bookingId) });
    await runtime.planProtectedRecovery({ actor: { _id: assignment.driverId, role: 'driver' }, driverId: assignment.driverId, assignmentId: assignment._id, recoveryId: requested.recovery.recoveryId, replacementAssignmentId: replacement.assignment._id });
    const first = await runtime.completeRecoveryHandoff({ actor: { _id: assignment.driverId, role: 'driver' }, driverId: assignment.driverId, assignmentId: assignment._id, recoveryId: requested.recovery.recoveryId });
    const second = await runtime.completeRecoveryHandoff({ actor: { _id: assignment.driverId, role: 'driver' }, driverId: assignment.driverId, assignmentId: assignment._id, recoveryId: requested.recovery.recoveryId });
    assert.equal(second.alreadyCompleted, true);
    assert.equal(String(first.recovery.recoveryId), String(second.recovery.recoveryId));
  });
});
