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

async function seedCanonicalWorld() {
  const parent = await User.create({ phone: '+256700000001', name: 'Parent', role: 'parent' });
  const child = await Child.create({ parentId: parent._id, name: 'Kid', schoolId: new mongoose.Types.ObjectId(), isActive: true, status: 'active' });
  const driverA = await User.create({ phone: '+256700000011', name: 'Driver One', role: 'driver', isDriverIdVerified: true, verificationStatus: 'approved' });
  const driverB = await User.create({ phone: '+256700000012', name: 'Driver Two', role: 'driver', isDriverIdVerified: true, verificationStatus: 'approved' });
  const vehicleA = await Vehicle.create({ driverId: driverA._id, type: 'car', capacity: 4, isApproved: true, isAvailable: true });
  const vehicleB = await Vehicle.create({ driverId: driverB._id, type: 'car', capacity: 4, isApproved: true, isAvailable: true });
  assert.notEqual(String(driverA._id), String(driverB._id));
  const created = await runtime.createRideRequestAndBooking({ actor: parent, childId: child._id, schoolId: child.schoolId, vehicleType: 'car', pickupAddress: 'A', dropoffAddress: 'B', pickupAt: new Date('2026-08-16T20:00:00Z') });
  return { parent, child, driverA, driverB, vehicleA, vehicleB, booking: created.booking, rideRequest: created.rideRequest };
}

async function evaluateAndAssertOffers({ booking, rideRequest }) {
  const result = await runtime.evaluateMatching({ booking: await Booking.findById(booking._id).lean(), rideRequest: await RideRequest.findById(rideRequest._id).lean() });
  const offerCount = result.offers.length;
  const exclusions = result.exclusions || [];
  const offers = await DispatchOffer.find({ bookingId: booking._id }).sort({ driverId: 1 }).lean();
  return { result, offerCount, exclusions, offers };
}


test('Phase 1C acceptance concurrency proof suite', async (t) => {
  const ctx = await startMongoReplSet();
  t.after(async () => { await resetCollections(); await stopMongoReplSet(ctx); });

  await t.test('two-driver concurrent acceptance has exactly one winner', async () => {
    await resetCollections();
    const { driverA, driverB, booking, rideRequest } = await seedCanonicalWorld();
    const { exclusions, offers, offerCount } = await evaluateAndAssertOffers({ booking, rideRequest });
    assert.equal(offerCount, 2, `unexpected exclusions: ${JSON.stringify(exclusions)}`);
    assert.equal(offers.length, 2, `unexpected exclusions: ${JSON.stringify(exclusions)}`);
    const [offerA, offerB] = offers;
    const [resultA, resultB] = await Promise.allSettled([
      runtime.acceptOffer({ actor: driverA, driverId: driverA._id, offerId: offerA._id }),
      runtime.acceptOffer({ actor: driverB, driverId: driverB._id, offerId: offerB._id }),
    ]);
    const winners = [resultA, resultB].filter((r) => r.status === 'fulfilled');
    const losers = [resultA, resultB].filter((r) => r.status === 'rejected');
    assert.equal(winners.length, 1);
    assert.equal(losers.length, 1);
    assert.ok(/already_taken|concurrency_lost|Please retry your operation or multi-document transaction/.test(losers[0].reason.message));
    const winningResult = winners[0].value;
    const winningAssignment = winningResult.assignment;
    const winningOffer = winningResult.offer;
    assert.ok(winningAssignment);
    assert.ok(winningOffer);
    assert.equal(await Assignment.countDocuments({ bookingId: booking._id, status: 'active' }), 1);
    assert.equal(await Ride.countDocuments({ bookingId: booking._id }), 1);
    assert.equal(String(winningAssignment.driverId), String(winningOffer.driverId));
    assert.equal(String(winningAssignment.vehicleId), String(winningOffer.vehicleId));
  });

  await t.test('same-driver retry is idempotent', async () => {
    await resetCollections();
    const { driverA, freshDriverA, booking, rideRequest } = await seedCanonicalWorld();
    const { exclusions, offers, offerCount } = await evaluateAndAssertOffers({ booking, rideRequest });
    assert.equal(offerCount, 2, `unexpected exclusions: ${JSON.stringify(exclusions)}`);
    const offer = offers.find((o) => String(o.driverId) === String(driverA._id));
    const first = await runtime.acceptOffer({ actor: driverA, driverId: driverA._id, offerId: offer._id });
    await DispatchOffer.updateOne({ _id: offer._id }, { $set: { status: 'active' } });
    const second = await runtime.acceptOffer({ actor: driverA, driverId: driverA._id, offerId: offer._id });
    assert.equal(String(first.assignment._id), String(second.assignment._id));
    assert.equal(await Assignment.countDocuments({ bookingId: booking._id }), 1);
    assert.equal(await Ride.countDocuments({ bookingId: booking._id }), 1);
  });

  await t.test('stale dispatch round is rejected after advancing production round', async () => {
    await resetCollections();
    const { driverA, booking, rideRequest } = await seedCanonicalWorld();
    const bookingBefore = await Booking.findById(booking._id).lean();
    assert.equal(bookingBefore.status, 'active');
    assert.equal(Number(bookingBefore.dispatchVersion || 1), 1);
    assert.notEqual(bookingBefore.dispatchState, 'not_dispatchable');
    const { exclusions, offers, offerCount } = await evaluateAndAssertOffers({ booking, rideRequest });
    assert.equal(offerCount, 2, `unexpected exclusions: ${JSON.stringify(exclusions)}`);
    const offer = offers.find((o) => String(o.driverId) === String(driverA._id));
    const round2 = await runtime.beginDispatchRound({ bookingId: booking._id });
    const bookingAfter = await Booking.findById(booking._id).lean();
    assert.equal(round2.dispatchVersion, 2);
    assert.equal(Number(bookingAfter.dispatchVersion || 0), 2);
    await assert.rejects(() => runtime.acceptOffer({ actor: driverA, driverId: driverA._id, offerId: offer._id }), /stale_offer/);
    assert.equal(await Assignment.countDocuments({ bookingId: booking._id }), 0);
  });

  await t.test('expired offer is rejected', async () => {
    await resetCollections();
    const { driverA, booking, rideRequest } = await seedCanonicalWorld();
    const { exclusions, offers, offerCount } = await evaluateAndAssertOffers({ booking, rideRequest });
    assert.equal(offerCount, 2, `unexpected exclusions: ${JSON.stringify(exclusions)}`);
    const offer = offers.find((o) => String(o.driverId) === String(driverA._id));
    await DispatchOffer.updateOne({ _id: offer._id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    await assert.rejects(() => runtime.acceptOffer({ actor: driverA, driverId: driverA._id, offerId: offer._id }), /offer_expired/);
    assert.equal(await Assignment.countDocuments({ bookingId: booking._id }), 0);
    assert.equal(await Ride.countDocuments({ bookingId: booking._id }), 0);
  });

  await t.test('acceptance-time eligibility change prevents win', async () => {
    await resetCollections();
    const { driverA, booking, rideRequest } = await seedCanonicalWorld();
    const { exclusions, offers, offerCount } = await evaluateAndAssertOffers({ booking, rideRequest });
    assert.equal(offerCount, 2, `unexpected exclusions: ${JSON.stringify(exclusions)}`);
    const offer = offers.find((o) => String(o.driverId) === String(driverA._id));
    await Vehicle.updateOne({ _id: offer.vehicleId }, { $set: { isAvailable: false } });
    await assert.rejects(() => runtime.acceptOffer({ actor: driverA, driverId: driverA._id, offerId: offer._id }), /vehicle_no_longer_eligible|unsupported_service|invalid_driver_vehicle_relationship|offer_not_active|stale_offer|concurrency_lost/);
    assert.equal(await Assignment.countDocuments({ bookingId: booking._id }), 0);
    assert.equal(await Ride.countDocuments({ bookingId: booking._id }), 0);
  });

  await t.test('assignment slot stays stable across dispatch versions', async () => {
    await resetCollections();
    const { driverA, booking, rideRequest } = await seedCanonicalWorld();
    const bookingBefore = await Booking.findById(booking._id).lean();
    assert.equal(bookingBefore.dispatchVersion, 1);
    const { exclusions, offers, offerCount } = await evaluateAndAssertOffers({ booking, rideRequest });
    assert.equal(offerCount, 2, `unexpected exclusions: ${JSON.stringify(exclusions)}`);
    const offerV1 = offers.find((o) => String(o.driverId) === String(driverA._id));
    assert.ok(offerV1);
    const offerV1Before = await DispatchOffer.findById(offerV1._id).lean();
    const slotV1 = `${offerV1Before.bookingId}:${offerV1Before.rideRequestId}`;
    const round2 = await runtime.beginDispatchRound({ bookingId: booking._id });
    assert.equal(round2.dispatchVersion, 2);
    const offerV1After = await DispatchOffer.findById(offerV1._id).lean();
    assert.equal(offerV1After.status, 'superseded');
    const bookingAfter = await Booking.findById(booking._id).lean();
    assert.equal(bookingAfter.dispatchVersion, 2);
    const round2Evaluation = await runtime.evaluateMatching({ booking: bookingAfter, rideRequest: await RideRequest.findById(rideRequest._id).lean() });
    const offerV2 = round2Evaluation.offers.find((offer) => String(offer.driverId) === String(driverA._id));
    assert.ok(offerV2);
    assert.equal(offerV2.dispatchVersion, 2);
    const slotV2 = `${offerV2.bookingId}:${offerV2.rideRequestId}`;
    assert.equal(slotV1, slotV2);
    const accepted = await runtime.acceptOffer({ actor: driverA, driverId: driverA._id, offerId: offerV2._id });
    assert.equal(accepted.assignment.assignmentSlotKey, slotV1);
    assert.equal(await Assignment.countDocuments({ bookingId: booking._id }), 1);
    assert.equal(await Assignment.countDocuments({ bookingId: booking._id, status: 'active' }), 1);
  });

  await t.test('critical active-slot unique index exists in test DB', async () => {
    const indexes = await Assignment.collection.indexes();
    const activeSlotIndex = indexes.find((index) => index.unique && index.partialFilterExpression && index.partialFilterExpression.status === 'active');
    assert.ok(activeSlotIndex);
    assert.equal(activeSlotIndex.unique, true);
  });
});
