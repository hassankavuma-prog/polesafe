const { Booking, Ride, Transaction } = require('../database/schema');
const fuelAdjustmentService = require('./fuelAdjustment');
const schoolPremiumService = require('./schoolPremium');
const config = require('../config');

const DISCOUNTS = { weekly: 0.10, monthly: 0.15, termly: 0.20 };

async function dispatchFromBooking(booking, date) {
  const fuelCalc = await fuelAdjustmentService.getCurrentMultiplier();
  const baseFare = config.RIDE_HAILING?.BASE_FARE || 5000;
  const distance = 5;
  const premiumCalc = schoolPremiumService.calculatePremium({
    baseFare,
    distance,
    distanceRate: config.RIDE_HAILING?.PER_KM_RATE || 1000,
  });
  const totalPrice = premiumCalc.totalWithPremium;
  const payoutCalc = schoolPremiumService.calculateDriverPayout(totalPrice);
  const discount = DISCOUNTS[booking.type] || 0;

  const createRide = async (type, timeStr) => {
    const rideTime = new Date(date);
    const [h, m] = (timeStr || (type === 'school_morning' ? '07:00' : '16:30')).split(':').map(Number);
    rideTime.setHours(h || (type === 'school_morning' ? 7 : 16), m || (type === 'school_morning' ? 0 : 30), 0, 0);
    return Ride.create({
      bookingId: booking._id,
      childId: booking.childId,
      driverId: booking.driverId || undefined,
      parentId: booking.parentId,
      schoolId: booking.schoolId,
      type,
      scheduledPickupTime: rideTime,
      baseFare,
      distanceKm: distance,
      fuelMultiplier: fuelCalc,
      schoolPremium: premiumCalc.premiumAmount,
      totalPrice: Math.round(totalPrice * (1 - discount)),
      driverPayout: payoutCalc.driverPayout,
      schoolCommission: premiumCalc.premiumAmount,
      status: 'scheduled',
    });
  };

  const morning = await createRide('school_morning', booking.pickupTime);
  if (booking.dropoffTime) await createRide('school_afternoon', booking.dropoffTime);
  booking.completedTrips = (booking.completedTrips || 0) + 1;
  await booking.save();
  return { morning: morning._id };
}

async function processAutoBilling(booking) {
  let chargeAmount = 0;
  switch (booking.type) {
    case 'weekly': chargeAmount = (booking.amountPerTrip || 5000) * 10; break;
    case 'monthly': chargeAmount = (booking.amountPerTrip || 5000) * 40; break;
    case 'termly': chargeAmount = (booking.amountPerTrip || 5000) * 120; break;
    default: return;
  }
  chargeAmount = Math.round(chargeAmount * (1 - (DISCOUNTS[booking.type] || 0)));
  await Transaction.create({
    parentId: booking.parentId,
    bookingId: booking._id,
    type: 'booking_payment',
    amount: chargeAmount,
    method: 'auto_billing',
    status: 'pending',
    reference: `auto_${booking.type}_${Date.now()}`,
    description: `Auto-billing: ${booking.type} subscription (${chargeAmount.toLocaleString()} UGX)`,
  });
  return { success: true, amount: chargeAmount };
}

function isSchoolDay(daysOfWeek) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return (daysOfWeek || []).includes(dayNames[new Date().getDay()]);
}

async function runScheduleCron() {
  const now = new Date();
  const bookings = await Booking.find({ status: 'active', autoPausedForHolidays: false }).populate('childId', 'name').lean();
  for (const booking of bookings) {
    if (!isSchoolDay(booking.daysOfWeek || ['Mon','Tue','Wed','Thu','Fri'])) continue;
    const [h,m] = (booking.pickupTime || '07:00').split(':').map(Number);
    const pickupDate = new Date(now); pickupDate.setHours(h || 7, m || 0, 0, 0);
    const diffMin = (pickupDate.getTime() - now.getTime()) / 60000;
    if (diffMin >= 25 && diffMin <= 35) {
      const existing = await Ride.countDocuments({ bookingId: booking._id, scheduledPickupTime: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()), $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) } });
      if (existing === 0) await dispatchFromBooking(booking, now);
    }
  }
  return { checked: bookings.length };
}

async function runBillingCron() { return { checked: 0 }; }
async function pauseBooking(bookingId) { const b = await Booking.findById(bookingId); if (!b) throw new Error('Booking not found'); b.status='paused'; await b.save(); await Ride.updateMany({ bookingId, status:'scheduled' }, { status:'cancelled', cancellationReason:'schedule_paused' }); return { message:'Schedule paused. Upcoming rides cancelled. You can resume anytime.' }; }
async function resumeBooking(bookingId) { const b = await Booking.findById(bookingId); if (!b) throw new Error('Booking not found'); b.status='active'; await b.save(); return { message:'Schedule resumed. New rides will be dispatched.' }; }
async function cancelBooking(bookingId) { const b = await Booking.findById(bookingId); if (!b) throw new Error('Booking not found'); b.status='cancelled'; await b.save(); await Ride.updateMany({ bookingId, status:'scheduled' }, { status:'cancelled', cancellationReason:'schedule_cancelled' }); return { message:'Subscription cancelled. All future rides cancelled.' }; }
async function getScheduleStatus(bookingId) { const booking = await Booking.findById(bookingId).populate('childId', 'name').populate('driverId', 'name phone').lean(); if (!booking) throw new Error('Booking not found'); const upcomingRides = await Ride.find({ bookingId, scheduledPickupTime: { $gte: new Date() }, status: { $in: ['scheduled', 'en_route'] } }).sort({ scheduledPickupTime: 1 }).limit(10).lean(); return { booking, upcomingRides }; }
async function getParentSchedules(parentId) { return Booking.find({ parentId }).populate('childId', 'name class').populate('driverId', 'name phone').sort({ createdAt: -1 }).lean(); }
module.exports = { DISCOUNTS, dispatchFromBooking, processAutoBilling, runScheduleCron, runBillingCron, pauseBooking, resumeBooking, cancelBooking, getScheduleStatus, getParentSchedules };
