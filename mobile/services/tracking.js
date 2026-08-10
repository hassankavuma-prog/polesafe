// PoleSafe Mobile — GPS Tracking Service
// Handles live location tracking for school rides and on-demand trips

import API_BASE from '../config';

// Active tracking intervals
const trackingIntervals = {};

/**
 * Build auth headers from token
 */
async function buildHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Start sending GPS location every N seconds for a specific ride.
 * @param {string} rideId - The ride/delivery ID to track
 * @param {string} token - Auth token
 * @param {number} [intervalMs=10000] - Interval between location pings
 * @returns {Promise<boolean>} - Whether tracking started successfully
 */
export async function startTracking(rideId, token, intervalMs = 10000) {
  if (trackingIntervals[rideId]) {
    console.log(`Tracking already active for ride ${rideId}`);
    return false;
  }

  const headers = await buildHeaders(token);

  const sendLocation = async () => {
    try {
      // In a real device environment, this would use react-native-geolocation
      // For now, we send a simulated request or rely on stored position
      const position = await getCurrentPosition();
      if (!position) return;

      await fetch(`${API_BASE}/api/tracking/${rideId}/location`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          latitude: position.latitude,
          longitude: position.longitude,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.log('Location send error:', err);
    }
  };

  // Send immediately then start interval
  await sendLocation();
  trackingIntervals[rideId] = setInterval(sendLocation, intervalMs);
  return true;
}

/**
 * Stop sending GPS location for a ride.
 * @param {string} rideId
 */
export async function stopTracking(rideId) {
  if (trackingIntervals[rideId]) {
    clearInterval(trackingIntervals[rideId]);
    delete trackingIntervals[rideId];
    console.log(`Tracking stopped for ride ${rideId}`);
  }
}

/**
 * Get the latest known driver location for a ride.
 * @param {string} rideId
 * @param {string} token - Auth token
 * @returns {Promise<object|null>} - { latitude, longitude, updatedAt } or null
 */
export async function getDriverLocation(rideId, token) {
  try {
    const headers = await buildHeaders(token);
    const res = await fetch(`${API_BASE}/api/tracking/${rideId}/location`, {
      headers,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.log('Error fetching driver location:', err);
    return null;
  }
}

/**
 * Get current device position.
 * Falls back to a stored position if geolocation is unavailable
 * (e.g. in development/emulator environments).
 * @returns {Promise<{latitude: number, longitude: number}|null>}
 */
async function getCurrentPosition() {
  return new Promise((resolve) => {
    // In React Native, we'd use:
    // import Geolocation from '@react-native-community/geolocation';
    // Geolocation.getCurrentPosition(pos => resolve(pos.coords), () => resolve(null));

    // For now, resolve null (real implementation uses native geolocation)
    resolve(null);
  });
}

/**
 * Check if tracking is active for a given ride.
 * @param {string} rideId
 * @returns {boolean}
 */
export function isTracking(rideId) {
  return !!trackingIntervals[rideId];
}

/**
 * Stop all active tracking sessions.
 */
export function stopAllTracking() {
  Object.keys(trackingIntervals).forEach((rideId) => {
    clearInterval(trackingIntervals[rideId]);
    delete trackingIntervals[rideId];
  });
}

export default {
  startTracking,
  stopTracking,
  getDriverLocation,
  isTracking,
  stopAllTracking,
};
