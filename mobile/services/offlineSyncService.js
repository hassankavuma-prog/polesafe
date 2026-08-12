// PoleSafe Offline Queue & Safety Fallback Service v1
// Queues critical actions when offline, flushes when reconnected
// Stores child PINs locally on driver device for offline verification
// From Home to School. And Beyond. 🚸

import AsyncStorage from '@react-native-async-storage/async-storage';
import { RIDE_EVENTS, emitRideEvent } from './rideSocketService';

// ─── Queue Keys ──────────────────────────────────────
const QUEUE_KEY = '@polesafe_action_queue';
const OFFLINE_PIN_KEY = '@polesafe_offline_pins';
const QUEUE_VERSION = 'v1';

// ─── Queue Helpers ───────────────────────────────────
async function getQueue() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

// ─── Enqueue Action ──────────────────────────────────
export async function enqueueAction(type, payload) {
  const action = {
    id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    type,
    payload,
    queuedAt: new Date().toISOString(),
    retries: 0,
  };

  const queue = await getQueue();
  queue.push(action);
  await saveQueue(queue);

  console.log(`[OfflineSync] Enqueued: ${type}`, payload);
  return action;
}

// ─── Flush Queue ─────────────────────────────────────
export async function flushQueue() {
  const queue = await getQueue();
  if (queue.length === 0) return { flushed: 0, failed: 0 };

  let flushed = 0;
  let failed = 0;
  const remaining = [];

  for (const action of queue) {
    try {
      const success = await processAction(action);
      if (success) {
        flushed++;
      } else {
        action.retries++;
        if (action.retries < 3) {
          remaining.push(action);
        } else {
          failed++;
          emitRideEvent('QUEUE_FAILED', { type: action.type, id: action.id });
        }
      }
    } catch {
      action.retries++;
      if (action.retries < 3) {
        remaining.push(action);
      } else {
        failed++;
      }
    }
  }

  await saveQueue(remaining);

  if (flushed > 0) {
    emitRideEvent('QUEUE_FLUSHED', { flushed, failed, remaining: remaining.length });
  }

  return { flushed, failed, remaining: remaining.length };
}

// ─── Process Individual Action ───────────────────────
async function processAction(action) {
  // For now, emit back through event bus
  // Future: send to actual backend API
  emitRideEvent(action.type, { ...action.payload, _fromQueue: true, _queueId: action.id });
  return true;
}

// ─── Offline PIN Storage ─────────────────────────────
export async function storeOfflinePins(tripId, children) {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_PIN_KEY);
    const pins = raw ? JSON.parse(raw) : {};

    // Store PINs keyed by trip + child
    const tripKey = `trip_${tripId}`;
    pins[tripKey] = {
      storedAt: new Date().toISOString(),
      children: children.map(c => ({
        childId: c.childId || c.id,
        name: c.name,
        pickupPin: c.pickupPin,  // The safety word/PIN
        pickupWord: c.pickupWord || c.pickupPin,
      })),
    };

    await AsyncStorage.setItem(OFFLINE_PIN_KEY, JSON.stringify(pins));
    console.log(`[OfflineSync] Stored ${children.length} PIN(s) for trip ${tripId}`);
    return true;
  } catch (err) {
    console.error('[OfflineSync] PIN storage error:', err);
    return false;
  }
}

// ─── Retrieve Offline PINs ───────────────────────────
export async function getOfflinePins(tripId) {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_PIN_KEY);
    if (!raw) return null;
    const pins = JSON.parse(raw);
    const tripKey = `trip_${tripId}`;
    return pins[tripKey] || null;
  } catch {
    return null;
  }
}

// ─── Verify PIN Offline ──────────────────────────────
export async function verifyPinOffline(tripId, childId, enteredPin) {
  const tripPins = await getOfflinePins(tripId);
  if (!tripPins) {
    return { verified: false, error: 'No offline PINs found for this trip' };
  }

  const child = tripPins.children.find(c => c.childId === childId);
  if (!child) {
    return { verified: false, error: 'Child not found in offline PIN store' };
  }

  const match = enteredPin === child.pickupPin || enteredPin === child.pickupWord;
  if (match) {
    // Queue the verification for sync when online
    await enqueueAction('PIN_VERIFIED', {
      tripId,
      childId,
      childName: child.name,
      verifiedAt: new Date().toISOString(),
      method: 'offline',
    });
    return { verified: true, childName: child.name };
  }

  return { verified: false, error: 'Incorrect PIN' };
}

// ─── Get Queue Status ────────────────────────────────
export async function getQueueStatus() {
  const queue = await getQueue();
  return {
    pending: queue.length,
    actions: queue.map(a => ({ type: a.type, queuedAt: a.queuedAt, retries: a.retries })),
  };
}

// ─── Clear Queue ─────────────────────────────────────
export async function clearQueue() {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

export default {
  enqueueAction,
  flushQueue,
  storeOfflinePins,
  getOfflinePins,
  verifyPinOffline,
  getQueueStatus,
  clearQueue,
};
