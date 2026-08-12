// PoleSafe Ride Event Bus v1
// Client-side event emitter/consumer for ride lifecycle
// Enables real-time flow simulation without WebSocket backend
// From Home to School. And Beyond. 🚸

// ─── Event Types ─────────────────────────────────────
export const RIDE_EVENTS = {
  RIDE_REQUESTED: 'RIDE_REQUESTED',
  RIDE_ACCEPTED: 'RIDE_ACCEPTED',
  LOCATION_UPDATE: 'LOCATION_UPDATE',
  PIN_VERIFIED: 'PIN_VERIFIED',
  RIDE_COMPLETED: 'RIDE_COMPLETED',
};

// ─── Listeners Registry ──────────────────────────────
const listeners = {};

// ─── Subscribe to an event ───────────────────────────
export function onRideEvent(event, callback) {
  if (!RIDE_EVENTS[event]) {
    console.warn(`[RideSocket] Unknown event: ${event}`);
    return () => {};
  }
  if (!listeners[event]) {
    listeners[event] = [];
  }
  listeners[event].push(callback);

  // Return unsubscribe function
  return () => {
    listeners[event] = listeners[event].filter(cb => cb !== callback);
  };
}

// ─── Emit an event ───────────────────────────────────
export function emitRideEvent(event, data) {
  if (!RIDE_EVENTS[event]) {
    console.warn(`[RideSocket] Unknown event: ${event}`);
    return;
  }
  console.log(`[RideSocket] Emitting ${event}`, data);
  const cbs = listeners[event] || [];
  cbs.forEach(cb => {
    try {
      cb(data);
    } catch (err) {
      console.error(`[RideSocket] Error in ${event} listener:`, err);
    }
  });
}

// ─── Remove all listeners for an event ───────────────
export function clearRideEvent(event) {
  if (event) {
    delete listeners[event];
  } else {
    Object.keys(listeners).forEach(k => delete listeners[k]);
  }
}

// ─── Get active event count (for debugging) ──────────
export function getActiveListeners() {
  const counts = {};
  Object.keys(listeners).forEach(k => {
    if (listeners[k].length > 0) counts[k] = listeners[k].length;
  });
  return counts;
}

// ─── Kampala Mock Data ───────────────────────────────
const KAMPALA_LANDMARKS = {
  pickup: ['Shell Kalerwe', 'Quality Supermarket, Naalya', 'Opposite Rubaga Cathedral', 'Ntinda Trading Centre'],
  dropoff: ['Greenhill Academy Gate', "St. Mary's School, Ntinda", 'Acacia Mall', 'Gayaza Road - Near Shell'],
};

const MOCK_KIDS = [
  { id: 'kid1', name: 'Sarah Nakato', pin: '4821', school: "St. Mary's" },
  { id: 'kid2', name: 'James Okello', pin: '1092', school: 'Greenhill Academy' },
];

const MOCK_DRIVERS = [
  { id: 'drv1', name: 'Moses Ssali', vehicle: 'Boda - Bajaj Boxer', plate: 'UFK 234X', rating: 4.9 },
  { id: 'drv2', name: 'Peter Wasswa', vehicle: 'Toyota Hiace', plate: 'UBD 891Z', rating: 4.8 },
];

// ─── Simulated GPS Route (Kalerwe → Ntinda) ─────────
const GPS_ROUTE = [
  { lat: 0.3333, lng: 32.5678, label: 'Shell Kalerwe' },
  { lat: 0.3350, lng: 32.5700, label: 'Kalerwe Junction' },
  { lat: 0.3380, lng: 32.5750, label: 'Gayaza Road' },
  { lat: 0.3420, lng: 32.5800, label: 'Naalya Roundabout' },
  { lat: 0.3450, lng: 32.5830, label: 'Quality Supermarket' },
  { lat: 0.3480, lng: 32.5850, label: 'Ntinda Trading Centre' },
  { lat: 0.3500, lng: 32.5880, label: 'Greenhill Academy' },
];

// ─── Mock Simulators ─────────────────────────────────
let simulationInterval = null;

export function simulateParentRequest() {
  const kid = MOCK_KIDS[Math.floor(Math.random() * MOCK_KIDS.length)];
  const pickup = KAMPALA_LANDMARKS.pickup[Math.floor(Math.random() * KAMPALA_LANDMARKS.pickup.length)];
  const dropoff = KAMPALA_LANDMARKS.dropoff[Math.floor(Math.random() * KAMPALA_LANDMARKS.dropoff.length)];
  const price = Math.floor(Math.random() * 8000) + 4000;

  const rideData = {
    rideId: `sim_${Date.now()}`,
    childId: { id: kid.id, name: kid.name, pickupPin: kid.pin },
    pickupLocation: pickup,
    dropoffLocation: dropoff,
    price,
    paymentMethod: 'momo',
    type: 'school_morning',
    status: 'scheduled',
    scheduledPickupTime: new Date().toISOString(),
  };

  emitRideEvent(RIDE_EVENTS.RIDE_REQUESTED, rideData);
  return rideData;
}

export function simulateDriverAccept() {
  const driver = MOCK_DRIVERS[Math.floor(Math.random() * MOCK_DRIVERS.length)];
  const acceptData = {
    driverId: { id: driver.id, name: driver.name, vehicle: driver.vehicle, plate: driver.plate, rating: driver.rating },
    status: 'en_route',
    acceptedAt: new Date().toISOString(),
  };
  emitRideEvent(RIDE_EVENTS.RIDE_ACCEPTED, acceptData);
  return acceptData;
}

export function simulateGPSMovement(onTick) {
  let index = 0;
  if (simulationInterval) clearInterval(simulationInterval);

  simulationInterval = setInterval(() => {
    if (index >= GPS_ROUTE.length) {
      clearInterval(simulationInterval);
      simulationInterval = null;
      emitRideEvent(RIDE_EVENTS.RIDE_COMPLETED, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        finalLocation: GPS_ROUTE[GPS_ROUTE.length - 1],
      });
      return;
    }
    const point = GPS_ROUTE[index];
    emitRideEvent(RIDE_EVENTS.LOCATION_UPDATE, {
      lat: point.lat,
      lng: point.lng,
      label: point.label,
      index,
      total: GPS_ROUTE.length,
    });
    if (onTick) onTick(point, index);
    index++;
  }, 2000);

  return () => {
    if (simulationInterval) {
      clearInterval(simulationInterval);
      simulationInterval = null;
    }
  };
}

export function simulatePinVerification(pin) {
  emitRideEvent(RIDE_EVENTS.PIN_VERIFIED, {
    pin,
    verified: true,
    verifiedAt: new Date().toISOString(),
  });
  return true;
}

export function simulateTripCompletion() {
  emitRideEvent(RIDE_EVENTS.RIDE_COMPLETED, {
    status: 'completed',
    completedAt: new Date().toISOString(),
    payout: 12000,
    paymentMethod: 'momo',
    rating: 5,
  });
}

export function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
}

export default {
  RIDE_EVENTS,
  onRideEvent,
  emitRideEvent,
  clearRideEvent,
  getActiveListeners,
  simulateParentRequest,
  simulateDriverAccept,
  simulateGPSMovement,
  simulatePinVerification,
  simulateTripCompletion,
  stopSimulation,
};
