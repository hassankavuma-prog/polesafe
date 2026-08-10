// PoleSafe — WebSocket Service for Real-Time GPS Tracking
// Drivers stream their location; parents watch in real time
// Integrated into server.js

const WebSocket = require('ws');
const { Ride } = require('../database/schema');

class TrackingService {
  constructor(server) {
    this.wss = new WebSocket.Server({ server, path: '/ws/tracking' });
    this.connections = new Map(); // userId → { ws, role, rideId }
    this.rideSubscribers = new Map(); // rideId → Set<userId>

    this.wss.on('connection', (ws, req) => {
      this._handleConnection(ws, req);
    });

    console.log('📍 WebSocket tracking server ready');
    this._startCleanupInterval();
  }

  /**
   * Handle a new WebSocket connection
   * Client must send auth within 5 seconds
   */
  _handleConnection(ws, req) {
    let authenticated = false;
    let userId = null;
    const authTimer = setTimeout(() => {
      if (!authenticated) {
        ws.close(4001, 'Authentication timeout');
      }
    }, 5000);

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        switch (msg.type) {
          // ============================================================
          // AUTH — Driver or Parent authenticates
          // ============================================================
          case 'auth': {
            const jwt = require('jsonwebtoken');
            const config = require('../config');
            try {
              const decoded = jwt.verify(msg.token, config.JWT_SECRET);
              userId = decoded.id;
              this.connections.set(userId, { ws, role: decoded.role, rideId: null });
              authenticated = true;
              clearTimeout(authTimer);
              ws.send(JSON.stringify({ type: 'auth_ok', userId }));
            } catch (e) {
              ws.send(JSON.stringify({ type: 'error', message: 'Invalid token' }));
            }
            break;
          }

          // ============================================================
          // LOCATION_UPDATE — Driver streams GPS position
          // ============================================================
          case 'location_update': {
            if (!userId) return ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            const { rideId, lat, lng, speed } = msg;

            // Update driver's position in the ride tracking log
            try {
              await Ride.findByIdAndUpdate(rideId, {
                $push: {
                  trackingLog: {
                    timestamp: new Date(),
                    coordinates: [lng, lat],
                    speed: speed || 0,
                  },
                },
              });

              // Broadcast to subscribers of this ride
              const subscribers = this.rideSubscribers.get(rideId);
              if (subscribers) {
                const payload = JSON.stringify({
                  type: 'driver_location',
                  rideId,
                  lat,
                  lng,
                  speed: speed || 0,
                  timestamp: new Date().toISOString(),
                });
                for (const subId of subscribers) {
                  const sub = this.connections.get(subId);
                  if (sub && sub.ws.readyState === WebSocket.OPEN) {
                    sub.ws.send(payload);
                  }
                }
              }
            } catch (err) {
              console.error('[WebSocket] Location update error:', err.message);
            }
            break;
          }

          // ============================================================
          // SUBSCRIBE_RIDE — Parent starts watching a ride
          // ============================================================
          case 'subscribe_ride': {
            if (!userId) return;
            const { rideId } = msg;
            if (!this.rideSubscribers.has(rideId)) {
              this.rideSubscribers.set(rideId, new Set());
            }
            this.rideSubscribers.get(rideId).add(userId);
            const conn = this.connections.get(userId);
            if (conn) conn.rideId = rideId;

            ws.send(JSON.stringify({ type: 'subscribed', rideId }));
            console.log(`👤 User ${userId} subscribed to ride ${rideId}`);
            break;
          }

          // ============================================================
          // UNSUBSCRIBE_RIDE — Stop watching
          // ============================================================
          case 'unsubscribe_ride': {
            const { rideId } = msg;
            const subs = this.rideSubscribers.get(rideId);
            if (subs) {
              subs.delete(userId);
              if (subs.size === 0) this.rideSubscribers.delete(rideId);
            }
            break;
          }

          // ============================================================
          // PING — Keep alive
          // ============================================================
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
        }
      } catch (err) {
        console.error('[WebSocket] Message error:', err.message);
      }
    });

    ws.on('close', () => {
      if (userId) {
        // Remove from all ride subscriptions
        for (const [rideId, subs] of this.rideSubscribers.entries()) {
          subs.delete(userId);
          if (subs.size === 0) this.rideSubscribers.delete(rideId);
        }
        this.connections.delete(userId);
      }
    });

    ws.on('error', (err) => {
      console.error('[WebSocket] Connection error:', err.message);
    });
  }

  /**
   * Periodic cleanup of stale connections
   */
  _startCleanupInterval() {
    setInterval(() => {
      for (const [id, conn] of this.connections.entries()) {
        if (conn.ws.readyState === WebSocket.CLOSED || conn.ws.readyState === WebSocket.CLOSING) {
          this.connections.delete(id);
        }
      }
    }, 60000); // Every minute
  }

  /**
   * Get number of active connections
   */
  getStats() {
    return {
      activeConnections: this.connections.size,
      activeRides: this.rideSubscribers.size,
    };
  }
}

module.exports = TrackingService;
