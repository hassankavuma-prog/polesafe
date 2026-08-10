// PoleSafe Mobile — API Client
// Base API configuration and all endpoints for the PoleSafe app

import API_BASE from '../config';

/**
 * Get the auth token from AsyncStorage
 */
async function getToken() {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return await AsyncStorage.getItem('polesafe_token');
  } catch {
    return null;
  }
}

/**
 * Build request headers with optional auth token
 */
async function buildHeaders(extra = {}) {
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json', ...extra };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/**
 * Handle fetch response — parse JSON or throw
 */
async function handleResponse(res) {
  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const errData = await res.json();
      errMsg = errData.message || errData.error || errMsg;
    } catch {}
    throw new Error(errMsg);
  }
  return res.json();
}

// ============================================================
// Auth
// ============================================================

/**
 * Send phone number to receive SMS with PIN
 * @param {string} phone - Ugandan phone number (e.g. +2567XXXXXXXX)
 */
export async function login(phone) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  return handleResponse(res);
}

/**
 * Verify the PIN sent via SMS
 * @param {string} phone
 * @param {string} pin - 4-6 digit code
 */
export async function verifyPin(phone, pin) {
  const res = await fetch(`${API_BASE}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, pin }),
  });
  const data = await handleResponse(res);
  // Store token and role if returned
  if (data.token) {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem('polesafe_token', data.token);
    if (data.role) await AsyncStorage.setItem('polesafe_role', data.role);
    if (data.schoolId) await AsyncStorage.setItem('polesafe_school_id', String(data.schoolId));
  }
  return data;
}

// ============================================================
// Kids
// ============================================================

/**
 * Get list of kids for the logged-in parent
 */
export async function getKids() {
  const headers = await buildHeaders();
  const res = await fetch(`${API_BASE}/api/parents/kids`, { headers });
  return handleResponse(res);
}

// ============================================================
// Rides
// ============================================================

/**
 * Get rides (optionally limited)
 * @param {number} limit - max rides to fetch
 */
export async function getRides(limit = 10) {
  const headers = await buildHeaders();
  const res = await fetch(`${API_BASE}/api/parents/rides?limit=${limit}`, { headers });
  return handleResponse(res);
}

// ============================================================
// Credits
// ============================================================

/**
 * Get parent credit balance and history
 */
export async function getCredits() {
  const headers = await buildHeaders();
  const res = await fetch(`${API_BASE}/api/credits`, { headers });
  return handleResponse(res);
}

// ============================================================
// Bookings
// ============================================================

/**
 * Book a school ride
 * @param {object} data - { childId, days[], pickupTime, dropoffTime, vehicleType }
 */
export async function bookRide(data) {
  const headers = await buildHeaders();
  const res = await fetch(`${API_BASE}/api/parents/book`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ============================================================
// Sick Days
// ============================================================

/**
 * Report a child sick for N days
 * @param {object} data - { childId, startDate, days }
 */
export async function reportSickDay(data) {
  const headers = await buildHeaders();
  const res = await fetch(`${API_BASE}/api/parents/sick-day`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ============================================================
// Ride Hailing (On-Demand)
// ============================================================

/**
 * Request an on-demand ride (PoleSafe Ride)
 * @param {object} data - { pickupLocation, dropoffLocation, vehicleType }
 */
export async function requestRide(data) {
  const headers = await buildHeaders();
  const res = await fetch(`${API_BASE}/api/ride-hailing/request`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ============================================================
// Broadcaster
// ============================================================

/**
 * Send a school broadcast announcement
 * @param {object} data - { schoolId, type, message, recipients[] }
 */
export async function sendBroadcast(data) {
  const headers = await buildHeaders();
  const res = await fetch(`${API_BASE}/api/schools/broadcast`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ============================================================
// Gate Check
// ============================================================

/**
 * Mark a kid as received at the school gate
 * @param {string} rideId
 * @param {string} status - 'received' | 'missing'
 */
export async function updateGateStatus(rideId, status) {
  const headers = await buildHeaders();
  const res = await fetch(`${API_BASE}/api/schools/gate-check`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ rideId, status }),
  });
  return handleResponse(res);
}

// ============================================================
// Detention / Late Pickup
// ============================================================

/**
 * Update pickup time for detention/sports/extra lesson
 * @param {object} data - { childId, newPickupTime, reason }
 */
export async function updatePickupTime(data) {
  const headers = await buildHeaders();
  const res = await fetch(`${API_BASE}/api/schools/update-pickup`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ============================================================
// Driver endpoints
// ============================================================

/**
 * Get the driver's daily route
 */
export async function getDriverRoute() {
  const headers = await buildHeaders();
  const res = await fetch(`${API_BASE}/api/drivers/route`, { headers });
  return handleResponse(res);
}

/**
 * Update stop status on a route
 * @param {string} stopId
 * @param {string} status - e.g. 'en_route', 'picked_up', 'dropped_off'
 */
export async function updateStopStatus(stopId, status) {
  const headers = await buildHeaders();
  const res = await fetch(`${API_BASE}/api/drivers/stop/${stopId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
}

/**
 * Get driver earnings data
 */
export async function getDriverEarnings() {
  const headers = await buildHeaders();
  const res = await fetch(`${API_BASE}/api/drivers/earnings`, { headers });
  return handleResponse(res);
}

/**
 * Toggle driver availability for ride hailing
 * @param {boolean} available
 */
export async function toggleAvailability(available) {
  const headers = await buildHeaders();
  const res = await fetch(`${API_BASE}/api/drivers/availability`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ available }),
  });
  return handleResponse(res);
}
