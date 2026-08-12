// PoleSafe Tracking Client with Socket.io reconnect + HTTP fallback
// Connects to realtime tracking when available and falls back cleanly on disconnect

import API_BASE from '../config';
import { onSocketConnected, onSocketDisconnected } from './rideSocketService';
import { enqueueLocationPing, flushOfflineQueue } from './offlineSyncService';

const RECONNECT_DELAY = 3000;
const MAX_RECONNECT = 5;
const HEARTBEAT_INTERVAL = 20000;

export default class TrackingClient {
  constructor(token) {
    this.token = token;
    this.socket = null;
    this.rideId = null;
    this.onLocation = null;
    this.onStatus = null;
    this.onETA = null;
    this.reconnectCount = 0;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.intentionalClose = false;
  }

  connect(rideId, callbacks = {}) {
    this.rideId = rideId;
    this.onLocation = callbacks.onLocation || null;
    this.onStatus = callbacks.onStatus || null;
    this.onETA = callbacks.onETA || null;
    this.intentionalClose = false;

    const wsUrl = this._getSocketUrl();
    try {
      this.socket = new WebSocket(wsUrl);
    } catch (err) {
      console.error('[TrackingClient] socket creation failed', err?.message || err);
      this._handleDisconnect();
      return;
    }

    this.socket.onopen = () => {
      this.reconnectCount = 0;
      onSocketConnected();
      this._send({ type: 'auth', token: this.token });
      if (this.rideId) {
        setTimeout(() => this._send({ type: 'subscribe_ride', rideId: this.rideId }), 400);
      }
      this._startHeartbeat();
      flushOfflineQueue({ socketConnected: true, token: this.token });
    };

    this.socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this._handleMessage(msg);
      } catch (err) {
        console.error('[TrackingClient] invalid message', err?.message || err);
      }
    };

    this.socket.onerror = (err) => {
      console.error('[TrackingClient] socket error', err?.message || err);
    };

    this.socket.onclose = (event) => {
      console.log(`[TrackingClient] disconnected (${event.code})`);
      this._handleDisconnect();
    };
  }

  disconnect() {
    this.intentionalClose = true;
    this._stopHeartbeat();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    if (this.socket) {
      try { this.socket.close(1000, 'Client disconnect'); } catch {}
      this.socket = null;
    }
    this.rideId = null;
    onSocketDisconnected();
  }

  ping() {
    this._send({ type: 'ping' });
  }

  async reportLocation(payload) {
    const data = {
      rideId: this.rideId,
      latitude: payload.latitude,
      longitude: payload.longitude,
      timestamp: payload.timestamp || new Date().toISOString(),
      accuracy: payload.accuracy || null,
    };

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this._send({ type: 'tracking:location', ...data });
      return { sent: true, transport: 'socket' };
    }

    await enqueueLocationPing(data, { rideId: this.rideId, source: 'tracking-client' });
    await this._sendHttpLocation(data);
    return { sent: true, transport: 'http' };
  }

  _handleMessage(msg) {
    switch (msg.type) {
      case 'auth_ok':
        break;
      case 'driver_location':
        if (this.onLocation && msg.rideId === this.rideId) {
          this.onLocation({ lat: msg.lat, lng: msg.lng, speed: msg.speed || 0, timestamp: msg.timestamp });
        }
        break;
      case 'driver_eta':
        if (this.onETA) this.onETA({ minutes: msg.minutes, distance: msg.distance });
        break;
      case 'trip_status':
        if (this.onStatus) this.onStatus({ status: msg.status, message: msg.message });
        break;
      case 'subscribed':
        break;
      case 'pong':
        break;
      case 'error':
        console.error('[TrackingClient] server error', msg.message);
        break;
      default:
        break;
    }
  }

  _send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  _startHeartbeat() {
    this._stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.ping();
    }, HEARTBEAT_INTERVAL);
  }

  _stopHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  _handleDisconnect() {
    onSocketDisconnected();
    this._stopHeartbeat();
    if (!this.intentionalClose && this.reconnectCount < MAX_RECONNECT) {
      this._scheduleReconnect();
    }
  }

  _scheduleReconnect() {
    this.reconnectCount += 1;
    const delay = RECONNECT_DELAY * this.reconnectCount;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (this.rideId) {
        this.connect(this.rideId, { onLocation: this.onLocation, onStatus: this.onStatus, onETA: this.onETA });
      }
    }, delay);
  }

  async _sendHttpLocation(data) {
    try {
      const res = await fetch(`${API_BASE}/api/tracking/${this.rideId}/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return true;
    } catch (err) {
      console.log('[TrackingClient] HTTP fallback failed', err?.message || err);
      return false;
    }
  }

  _getSocketUrl() {
    if (__DEV__) return 'ws://localhost:3001/ws/tracking';
    return 'wss://polesafe.ug/ws/tracking';
  }
}
