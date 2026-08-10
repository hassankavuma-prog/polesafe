// PoleSafe — WebSocket Tracking Client
// Connects to the live tracking service for real-time driver location updates
// Usage: const tracker = new TrackingClient(token);
//        tracker.connect(rideId, (location) => updateMap(location));

const RECONNECT_DELAY = 3000;
const MAX_RECONNECT = 5;

export default class TrackingClient {
  constructor(token) {
    this.token = token;
    this.ws = null;
    this.rideId = null;
    this.onLocation = null;
    this.onStatus = null;
    this.onETA = null;
    this.reconnectCount = 0;
    this.reconnectTimer = null;
    this.intentionalClose = false;
  }

  /**
   * Connect to tracking WebSocket and subscribe to a ride
   */
  connect(rideId, callbacks = {}) {
    this.rideId = rideId;
    this.onLocation = callbacks.onLocation || null;
    this.onStatus = callbacks.onStatus || null;
    this.onETA = callbacks.onETA || null;
    this.intentionalClose = false;

    // Determine WebSocket URL based on platform
    const wsUrl = this._getWsUrl();

    try {
      this.ws = new WebSocket(wsUrl);
    } catch (err) {
      console.error('[TrackingClient] WebSocket creation failed:', err.message);
      this._scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      console.log('[TrackingClient] Connected');
      this.reconnectCount = 0;

      // Authenticate
      this._send({ type: 'auth', token: this.token });

      // Subscribe to ride
      if (this.rideId) {
        setTimeout(() => {
          this._send({ type: 'subscribe_ride', rideId: this.rideId });
        }, 500);
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this._handleMessage(msg);
      } catch (err) {
        console.error('[TrackingClient] Invalid message:', err.message);
      }
    };

    this.ws.onerror = (err) => {
      console.error('[TrackingClient] Error:', err.message);
    };

    this.ws.onclose = (event) => {
      console.log(`[TrackingClient] Disconnected (${event.code})`);
      if (!this.intentionalClose && this.reconnectCount < MAX_RECONNECT) {
        this._scheduleReconnect();
      }
    };
  }

  /**
   * Disconnect from tracking
   */
  disconnect() {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.rideId = null;
  }

  /**
   * Send ping to keep connection alive
   */
  ping() {
    this._send({ type: 'ping' });
  }

  /**
   * Handle incoming messages
   */
  _handleMessage(msg) {
    switch (msg.type) {
      case 'auth_ok':
        console.log('[TrackingClient] Authenticated');
        break;

      case 'driver_location':
        if (this.onLocation && msg.rideId === this.rideId) {
          this.onLocation({
            lat: msg.lat,
            lng: msg.lng,
            speed: msg.speed || 0,
            timestamp: msg.timestamp,
          });
        }
        break;

      case 'driver_eta':
        if (this.onETA) {
          this.onETA({
            minutes: msg.minutes,
            distance: msg.distance,
          });
        }
        break;

      case 'trip_status':
        if (this.onStatus) {
          this.onStatus({
            status: msg.status,
            message: msg.message,
          });
        }
        break;

      case 'subscribed':
        console.log('[TrackingClient] Subscribed to ride:', msg.rideId);
        break;

      case 'pong':
        // Heartbeat response, ignore
        break;

      case 'error':
        console.error('[TrackingClient] Server error:', msg.message);
        break;

      default:
        console.log('[TrackingClient] Unknown message type:', msg.type);
    }
  }

  /**
   * Send a message to the server
   */
  _send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  /**
   * Schedule reconnection after delay
   */
  _scheduleReconnect() {
    this.reconnectCount++;
    const delay = RECONNECT_DELAY * this.reconnectCount;
    console.log(`[TrackingClient] Reconnecting in ${delay}ms (attempt ${this.reconnectCount}/${MAX_RECONNECT})`);

    this.reconnectTimer = setTimeout(() => {
      if (this.rideId) {
        this.connect(this.rideId, {
          onLocation: this.onLocation,
          onStatus: this.onStatus,
          onETA: this.onETA,
        });
      }
    }, delay);
  }

  /**
   * Get WebSocket URL based on environment
   */
  _getWsUrl() {
    // In production, use the actual server URL
    if (__DEV__) {
      return 'ws://localhost:3001/ws/tracking';
    }
    return 'wss://polesafe.ug/ws/tracking';
  }
}
