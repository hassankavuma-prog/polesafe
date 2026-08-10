// PoleSafe Phone Masking Service
// Masks phone numbers between parents and drivers for safety
// Uses a relay-style approach: generates temporary masked IDs
// that resolve to real numbers only within a trip context

const crypto = require('crypto');

// In-memory store for active masking sessions
// In production, this would use Redis with TTL
const activeSessions = new Map();

const PhoneMaskingService = {
  /**
   * Generate a masked contact session for a trip
   * Both parties get a temporary masked ID they can use
   * to reach each other through the relay system
   * 
   * @param {Object} params
   * @param {string} params.tripId - SchoolTrip ID
   * @param {string} params.parentPhone - Parent's real phone number
   * @param {string} params.driverPhone - Driver's real phone number
   * @param {number} params.ttlMinutes - How long the mask is valid (default: 24h)
   * @returns {Object} { parentMaskedId, driverMaskedId, expiresAt }
   */
  createSession({ tripId, parentPhone, driverPhone, ttlMinutes = 1440 }) {
    const sessionId = crypto.randomBytes(8).toString('hex');
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    const session = {
      sessionId,
      tripId,
      parentPhone,
      driverPhone,
      parentMaskedId: `ps-${tripId.slice(-6)}-${crypto.randomBytes(3).toString('hex')}`,
      driverMaskedId: `ps-${tripId.slice(-6)}-${crypto.randomBytes(3).toString('hex')}`,
      expiresAt,
      active: true,
    };

    activeSessions.set(session.maskedId, session);

    // Auto-expire
    setTimeout(() => {
      session.active = false;
      activeSessions.delete(session.parentMaskedId);
      activeSessions.delete(session.driverMaskedId);
    }, ttlMinutes * 60 * 1000);

    return {
      parentMaskedId: session.parentMaskedId,
      driverMaskedId: session.driverMaskedId,
      expiresAt,
    };
  },

  /**
   * Resolve a masked ID to the real phone number
   * Only works for active sessions
   * 
   * @param {string} maskedId
   * @returns {Object|null} { realPhone, tripId, role } or null if invalid/expired
   */
  resolve(maskedId) {
    for (const [key, session] of activeSessions) {
      if (!session.active) continue;

      if (session.parentMaskedId === maskedId) {
        return { realPhone: session.driverPhone, tripId: session.tripId, role: 'driver' };
      }
      if (session.driverMaskedId === maskedId) {
        return { realPhone: session.parentPhone, tripId: session.tripId, role: 'parent' };
      }
    }
    return null;
  },

  /**
   * Get masked contact info for a specific participant
   * 
   * @param {string} tripId
   * @param {string} userId - The person requesting the contact info
   * @returns {Object|null} { maskedId, role, expiresAt } or null if no session
   */
  getContactForTrip(tripId, userId) {
    for (const [key, session] of activeSessions) {
      if (session.tripId === tripId && session.active) {
        if (session.parentPhone === userId || session.driverPhone === userId) {
          return {
            maskedId: session.parentPhone === userId ? session.driverMaskedId : session.parentMaskedId,
            role: session.parentPhone === userId ? 'driver' : 'parent',
            expiresAt: session.expiresAt,
          };
        }
      }
    }
    return null;
  },

  /**
   * End a masking session (when trip completes or is cancelled)
   * 
   * @param {string} tripId
   */
  endSession(tripId) {
    const toDelete = [];
    for (const [key, session] of activeSessions) {
      if (session.tripId === tripId) {
        session.active = false;
        toDelete.push(session.parentMaskedId);
        toDelete.push(session.driverMaskedId);
      }
    }
    toDelete.forEach(id => activeSessions.delete(id));
  },
};

module.exports = PhoneMaskingService;
