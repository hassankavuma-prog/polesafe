// PoleSafe — Gate Geofence Service
// Detects when a driver enters a 200m radius around a registered school gate
// Auto-emits DRIVER_NEAR_GATE events and manages gate arrival queues

const WebSocket = require('ws');
const mongoose = require('mongoose');
const School = mongoose.model('School');
const Ride = mongoose.model('Ride');
const FCMService = require('./fcmService');
const { z } = require('zod');
const { validateTenantScopedQuery } = require('../../lib/engine/hamnah-core.ts');

// ─── Constants ───────────────────────────────────────
const ENTERED_GATE = 'entered_gate'; // Driver was outside, now inside geofence
const STILL_INSIDE = 'still_inside'; // Driver was already inside (suppress duplicate)
const OUTSIDE = 'outside';           // Driver outside geofence

// ─── In-memory state ──────────────────────────────────
// Tracks which drivers are currently "inside" which gate
// Map<driverId, Map<gateId, { enteredAt, lat, lng }>>
const driverGateState = new Map();

// Gate arrival queues: Map<schoolId_gateId, Array<{ driverId, rideId, vehicle, arrivedAt }>>
const gateQueues = new Map();

class GateGeofenceService {
  constructor() {
    console.log('🚧 Gate Geofence Service ready');
  }

  /**
   * Check a driver's GPS position against all gates for a school
   * Returns geofence status per gate
   * 
   * @param {string} driverId - Driver's user ID
   * @param {string} schoolId - School's ObjectId
   * @param {number} lat - Driver's current latitude
   * @param {number} lng - Driver's current longitude
   * @param {string} rideId - Current ride ID
   * @param {string} vehiclePlate - Driver's vehicle registration (for queue display)
   * @returns {Promise<Array>} Gate proximity results
   */
  async checkDriverPosition({ driverId, schoolId, lat, lng, rideId, vehiclePlate }) {
    if (!schoolId) return [];

    try {
      const schoolSchema = z.object({ schoolId: z.string().min(1) }).strict();
      const schoolScope = validateTenantScopedQuery(schoolSchema, { schoolId }, schoolId, ['gate:geofence']);
      const school = await School.findById(schoolScope.tenantScopedQuery.schoolId).select('gates name');
      if (!school || !school.gates || school.gates.length === 0) return [];

      const results = [];

      for (const gate of school.gates) {
        if (!gate.isActive) continue;

        const distance = this._haversineMeters(lat, lng, gate.lat, gate.lng);
        const insideGeofence = distance <= (gate.radius || 200);

        const previousState = this._getGateState(driverId, gate._id.toString());
        const newState = insideGeofence ? ENTERED_GATE : OUTSIDE;

        if (newState === ENTERED_GATE && previousState !== ENTERED_GATE) {
          // Driver just entered geofence — fire event
          this._setGateState(driverId, gate._id.toString(), { enteredAt: new Date(), lat, lng });
          this._addToQueue(school, gate, driverId, rideId, vehiclePlate);

          results.push({
            gateId: gate._id,
            gateName: gate.name,
            distance: Math.round(distance),
            radius: gate.radius || 200,
            status: 'entered',
            entered: true,
          });

        } else if (newState === OUTSIDE && previousState === ENTERED_GATE) {
          // Driver left geofence
          this._clearGateState(driverId, gate._id.toString());
          this._removeFromQueue(school._id.toString(), gate._id.toString(), driverId);
        }
      }

      return results;
    } catch (err) {
      console.error('[Geofence] Check position error:', err.message);
      return [];
    }
  }

  /**
   * Get the current queue for a specific gate
   */
  getGateQueue(schoolId, gateId) {
    const key = `${schoolId}_${gateId}`;
    return gateQueues.get(key) || [];
  }

  /**
   * Get all gate queues for a school
   */
  getAllGateQueues(schoolId) {
    const result = {};
    for (const [key, queue] of gateQueues.entries()) {
      if (key.startsWith(schoolId + '_')) {
        const gateId = key.replace(schoolId + '_', '');
        result[gateId] = queue;
      }
    }
    return result;
  }

  /**
   * Confirm a student handover at a gate (removes from queue)
   */
  confirmHandover(schoolId, gateId, driverId) {
    this._removeFromQueue(schoolId, gateId, driverId);
    this._clearGateState(driverId, gateId);
  }

  /**
   * Get the driver's nearest gate info
   */
  getDriverGateInfo(driverId, schoolId) {
    if (!schoolId) return null;
    const queues = this.getAllGateQueues(schoolId);
    
    for (const [gateId, queue] of Object.entries(queues)) {
      const entry = queue.find(q => q.driverId === driverId);
      if (entry) {
        return { gateId, queuePosition: entry.position, gateName: entry.gateName };
      }
    }
    return null;
  }

  // ============================================================
  // INTERNAL — Haversine distance in meters
  // ============================================================
  _haversineMeters(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth radius in meters
    const dLat = this._toRad(lat2 - lat1);
    const dLng = this._toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(this._toRad(lat1)) * Math.cos(this._toRad(lat2))
      * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  _toRad(deg) {
    return deg * (Math.PI / 180);
  }

  // ============================================================
  // INTERNAL — Gate state helpers
  // ============================================================
  _getGateState(driverId, gateId) {
    const driverState = driverGateState.get(driverId);
    if (!driverState) return null;
    const gateState = driverState.get(gateId);
    return gateState ? ENTERED_GATE : null;
  }

  _setGateState(driverId, gateId, state) {
    if (!driverGateState.has(driverId)) {
      driverGateState.set(driverId, new Map());
    }
    driverGateState.get(driverId).set(gateId, state);
  }

  _clearGateState(driverId, gateId) {
    const driverState = driverGateState.get(driverId);
    if (driverState) {
      driverState.delete(gateId);
      if (driverState.size === 0) driverGateState.delete(driverId);
    }
  }

  _addToQueue(school, gate, driverId, rideId, vehiclePlate) {
    const key = `${school._id.toString()}_${gate._id.toString()}`;
    if (!gateQueues.has(key)) {
      gateQueues.set(key, []);
    }
    const queue = gateQueues.get(key);

    // Don't add duplicates
    if (queue.some(e => e.driverId === driverId)) return;

    queue.push({
      driverId,
      rideId,
      vehicle: vehiclePlate || 'Unknown',
      gateName: gate.name,
      arrivedAt: new Date(),
    });

    // Update positions
    queue.forEach((entry, i) => {
      entry.position = i + 1;
    });
  }

  _removeFromQueue(schoolId, gateId, driverId) {
    const key = `${schoolId}_${gateId}`;
    const queue = gateQueues.get(key);
    if (!queue) return;

    const idx = queue.findIndex(e => e.driverId === driverId);
    if (idx !== -1) {
      queue.splice(idx, 1);
      // Re-number positions
      queue.forEach((entry, i) => {
        entry.position = i + 1;
      });
    }
    if (queue.length === 0) gateQueues.delete(key);
  }

  /**
   * Clean up stale entries (drivers who disconnected or timed out)
   */
  cleanupDriver(driverId) {
    driverGateState.delete(driverId);
    // Remove from all queues
    for (const [key, queue] of gateQueues.entries()) {
      const idx = queue.findIndex(e => e.driverId === driverId);
      if (idx !== -1) queue.splice(idx, 1);
      if (queue.length === 0) gateQueues.delete(key);
    }
  }
}

module.exports = new GateGeofenceService();
