// PoleSafe — Route Service
// Driver route optimization and scheduling
// Handles staggered pickup times, multi-stop routes, and auto-scheduling

const { Ride, Child } = require('../database/schema');

class RouteService {

  /**
   * Build an optimized afternoon route for a driver
   * Takes into account staggered class finish times
   * 
   * @param {string} driverId
   * @param {string} schoolId
   * @param {string} date - "2026-08-09"
   * @returns {object} Optimized route
   */
  async buildAfternoonRoute(driverId, schoolId, date) {
    const startOfDay = new Date(`${date}T00:00:00Z`);
    const endOfDay = new Date(`${date}T23:59:59Z`);

    const rides = await Ride.find({
      driverId,
      schoolId,
      type: 'school_afternoon',
      status: 'scheduled',
      scheduledPickupTime: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).populate('childId').sort({ scheduledPickupTime: 1 });

    // Group by time slot
    const timeSlots = {};
    for (const ride of rides) {
      const timeKey = ride.scheduledPickupTime.toISOString();
      if (!timeSlots[timeKey]) timeSlots[timeKey] = [];
      timeSlots[timeKey].push(ride);
    }

    // Build route stops
    const stops = Object.entries(timeSlots).map(([time, ridesAtTime]) => {
      const kids = ridesAtTime.map(r => ({
        rideId: r._id,
        childName: r.childId?.name || 'Unknown',
        parentPhone: r.parentId,
        status: r.status,
      }));

      return {
        time: new Date(time),
        timeFormatted: new Date(time).toLocaleTimeString('en-UG', {
          hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
        }),
        kids,
        stopNumber: 0, // Will be assigned below
      };
    });

    // Assign stop numbers
    stops.forEach((stop, i) => { stop.stopNumber = i + 1; });

    // Calculate gaps for Ride mode
    const gaps = [];
    for (let i = 1; i < stops.length; i++) {
      const gapMinutes = (stops[i].time - stops[i - 1].time) / 60000;
      if (gapMinutes >= 15) {
        gaps.push({
          from: stops[i - 1].timeFormatted,
          to: stops[i].timeFormatted,
          durationMinutes: gapMinutes,
          canDoRides: gapMinutes >= 30, // Enough time for a short ride
        });
      }
    }

    return {
      driverId,
      schoolId,
      date,
      totalStops: stops.length,
      totalKids: rides.length,
      stops,
      gaps,
      rideModeAvailable: gaps.filter(g => g.canDoRides).length > 0,
    };
  }

  /**
   * Handle a staggered pickup for a family with kids in different classes
   * e.g., Faith (P.1 finishes 3:30) and Akol (P.5 finishes 4:30)
   * 
   * @param {string} bookingId
   * @returns {object} Updated schedule
   */
  async handleStaggeredPickup(bookingId) {
    const Booking = require('mongoose').model('Booking');
    const booking = await Booking.findById(bookingId)
      .populate('staggeredPickups.childId')
      .lean();

    if (!booking || !booking.staggeredPickups?.length) {
      return { message: 'No staggered pickups configured' };
    }

    const unified = booking.staggeredPickups.every(s => s.unifiedPickup);

    if (unified) {
      // All kids at the same time (youngest waits at school waiting zone)
      const latestTime = booking.staggeredPickups
        .map(s => s.pickupTime)
        .sort()
        .pop(); // Latest pickup time

      return {
        strategy: 'unified',
        pickupTime: latestTime,
        note: `All kids picked up at ${latestTime}. Younger kids wait at school waiting zone.`,
      };
    }

    // Separate trips for each kid at their respective times
    const trips = booking.staggeredPickups.map(s => ({
      childId: s.childId?._id,
      childName: s.childId?.name,
      pickupTime: s.pickupTime,
      order: s.childId?.name,
    }));

    return {
      strategy: 'separate_trips',
      trips,
      note: 'Driver does separate trips for each kid at their respective finish times.',
    };
  }

  /**
   * Auto-adjust route when school announces half day
   */
  adjustRouteForHalfDay(existingRoute, newPickupTime) {
    return {
      ...existingRoute,
      stops: existingRoute.stops.map(stop => ({
        ...stop,
        time: newPickupTime,
        timeFormatted: newPickupTime,
        adjusted: true,
      })),
      originalPickupTime: existingRoute.stops[0]?.timeFormatted,
      newPickupTime,
      note: `Route adjusted for half day. All pickups moved to ${newPickupTime}.`,
    };
  }
}

module.exports = new RouteService();
