// PoleSafe Mobile — GPS Tracking Service
// Handles live location tracking for school rides and on-demand trips

import API_BASE from '../config';
import { enqueueLocationPing, flushOfflineQueue } from './offlineSyncService';

const trackingIntervals = {};

async function buildHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function startTracking(rideId, token, intervalMs = 10000) {
  if (trackingIntervals[rideId]) {
    console.log(`Tracking already active for ride ${rideId}`);
    return false;
  }

  const headers = await buildHeaders(token);

  const sendLocation = async () => {
    try {
      const position = await getCurrentPosition();
      if (!position) return;

      const payload = {
        rideId,
        latitude: position.latitude,
        longitude: position.longitude,
        timestamp: new Date().toISOString(),
      };

      try {
        const res = await fetch(`${API_BASE}/api/tracking/${rideId}/location`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } catch (err) {
        await enqueueLocationPing(payload, { rideId, source: 'tracking-service' });
        await flushOfflineQueue({ socketConnected: false, token });
      }
    } catch (err) {
      console.log('Location send error:', err);
    }
  };

  await sendLocation();
  trackingIntervals[rideId] = setInterval(sendLocation, intervalMs);
  return true;
}

export async function stopTracking(rideId) {
  if (trackingIntervals[rideId]) {
    clearInterval(trackingIntervals[rideId]);
    delete trackingIntervals[rideId];
    console.log(`Tracking stopped for ride ${rideId}`);
  }
}

export async function getDriverLocation(rideId, token) {
  try {
    const headers = await buildHeaders(token);
    const res = await fetch(`${API_BASE}/api/tracking/${rideId}/location`, { headers });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.log('Error fetching driver location:', err);
    return null;
  }
}

async function getCurrentPosition() {
  return new Promise((resolve) => {
    resolve(null);
  });
}

export function isTracking(rideId) {
  return !!trackingIntervals[rideId];
}

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
