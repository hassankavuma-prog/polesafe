// PoleSafe Offline Sync Queue v2
// Buffers SOS triggers and location pings when network or Socket.io drops
// Uses AsyncStorage for lightweight queueing on low-bandwidth devices
// From Home to School. And Beyond. 🚸

import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE from '../config';
import NetInfo from '@react-native-community/netinfo';

const QUEUE_KEY = '@polesafe_offline_queue_v2';
const METADATA_KEY = '@polesafe_offline_queue_meta_v2';
const MAX_QUEUE_SIZE = 300;
const MAX_RETRIES = 5;
const INITIAL_BACKOFF_MS = 1500;
const MAX_BACKOFF_MS = 30000;
const FLUSH_BATCH_SIZE = 25;
const ACK_TIMEOUT_MS = 8000;

let flushInProgress = false;
let flushTimer = null;
let socketConnected = false;
let lastKnownOnline = true;

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix = 'evt') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function readJson(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

async function getQueue() {
  return readJson(QUEUE_KEY, []);
}

async function saveQueue(queue) {
  const trimmed = queue.slice(-MAX_QUEUE_SIZE);
  await writeJson(QUEUE_KEY, trimmed);
}

async function getMeta() {
  return readJson(METADATA_KEY, {
    lastFlushAt: null,
    lastSuccessAt: null,
    lastErrorAt: null,
    retryCount: 0,
  });
}

async function saveMeta(meta) {
  await writeJson(METADATA_KEY, meta);
}

function normalizeType(type) {
  return String(type || '').trim().toUpperCase();
}

function queueItem({ type, payload = {}, rideId = null, childId = null, source = 'mobile', priority = 'normal' }) {
  return {
    id: makeId('q'),
    dedupeKey: `${normalizeType(type)}:${rideId || 'na'}:${childId || 'na'}:${payload?.clientEventId || makeId('dedupe')}`,
    type: normalizeType(type),
    payload,
    rideId,
    childId,
    source,
    priority,
    createdAt: nowIso(),
    retryCount: 0,
    nextAttemptAt: nowIso(),
    lastError: null,
  };
}

function backoffFor(retryCount) {
  return Math.min(MAX_BACKOFF_MS, INITIAL_BACKOFF_MS * (2 ** Math.max(0, retryCount - 1)));
}

function eventKey(item) {
  return item.dedupeKey || `${item.type}:${item.rideId || 'na'}:${item.childId || 'na'}`;
}

async function isOnline() {
  try {
    const state = await NetInfo.fetch();
    lastKnownOnline = !!state.isConnected && !!state.isInternetReachable;
    return lastKnownOnline;
  } catch {
    return lastKnownOnline;
  }
}

async function recordFailure(item, errorMessage) {
  item.retryCount = (item.retryCount || 0) + 1;
  item.lastError = errorMessage || 'sync_failed';
  item.nextAttemptAt = new Date(Date.now() + backoffFor(item.retryCount)).toISOString();
  return item;
}

async function postJson(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      message = data?.message || data?.error || message;
    } catch {}
    throw new Error(message);
  }
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function sendLocationPing(payload, token) {
  return postJson('/api/tracking/location-ping', payload, token);
}

async function sendSosTrigger(payload, token) {
  return postJson('/api/safety/sos', payload, token);
}

async function processItem(item, options = {}) {
  const token = options.token || null;
  const transport = options.transport || 'http';

  if (item.type === 'SOS_TRIGGER') {
    if (transport === 'socket' && typeof options.socketEmit === 'function') {
      await options.socketEmit('sos:trigger', item.payload);
      return { ok: true, transport: 'socket' };
    }
    await sendSosTrigger(item.payload, token);
    return { ok: true, transport: 'http' };
  }

  if (item.type === 'LOCATION_PING') {
    if (transport === 'socket' && typeof options.socketEmit === 'function') {
      await options.socketEmit('tracking:location', item.payload);
      return { ok: true, transport: 'socket' };
    }
    await sendLocationPing(item.payload, token);
    return { ok: true, transport: 'http' };
  }

  if (typeof options.onUnknownItem === 'function') {
    await options.onUnknownItem(item);
    return { ok: true, transport: 'custom' };
  }

  throw new Error(`Unsupported queue type: ${item.type}`);
}

export async function enqueueOfflineEvent(type, payload = {}, options = {}) {
  const queue = await getQueue();
  const item = queueItem({
    type,
    payload,
    rideId: options.rideId || payload.rideId || null,
    childId: options.childId || payload.childId || null,
    source: options.source || 'mobile',
    priority: options.priority || 'normal',
  });

  const key = eventKey(item);
  const existingIndex = queue.findIndex((q) => eventKey(q) === key);
  if (existingIndex >= 0) {
    queue[existingIndex] = { ...queue[existingIndex], ...item, retryCount: queue[existingIndex].retryCount || 0 };
  } else {
    queue.push(item);
  }
  await saveQueue(queue);
  return item;
}

export async function enqueueSosTrigger(payload = {}, options = {}) {
  return enqueueOfflineEvent('SOS_TRIGGER', payload, { ...options, priority: 'high' });
}

export async function enqueueLocationPing(payload = {}, options = {}) {
  return enqueueOfflineEvent('LOCATION_PING', payload, { ...options, priority: 'normal' });
}

export async function getOfflineQueueStatus() {
  const queue = await getQueue();
  const meta = await getMeta();
  return {
    pending: queue.length,
    oldestAt: queue[0]?.createdAt || null,
    newestAt: queue[queue.length - 1]?.createdAt || null,
    socketConnected,
    ...meta,
  };
}

export async function clearOfflineQueue() {
  await AsyncStorage.removeItem(QUEUE_KEY);
  await AsyncStorage.removeItem(METADATA_KEY);
}

export function setSocketConnected(connected) {
  socketConnected = !!connected;
}

export function scheduleFlush(handler, delayMs = 2000) {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    handler?.();
  }, delayMs);
}

export async function flushOfflineQueue(options = {}) {
  if (flushInProgress) {
    return { flushed: 0, failed: 0, remaining: (await getQueue()).length, skipped: true };
  }

  flushInProgress = true;
  const meta = await getMeta();
  meta.lastFlushAt = nowIso();
  await saveMeta(meta);

  try {
    let queue = await getQueue();
    if (!queue.length) {
      meta.lastSuccessAt = nowIso();
      meta.retryCount = 0;
      await saveMeta(meta);
      return { flushed: 0, failed: 0, remaining: 0 };
    }

    const online = options.forceOnline ?? await isOnline();
    if (!online && !options.socketConnected && !socketConnected) {
      return { flushed: 0, failed: 0, remaining: queue.length, offline: true };
    }

    const ordered = [...queue].sort((a, b) => {
      if (a.priority === b.priority) return new Date(a.createdAt) - new Date(b.createdAt);
      return a.priority === 'high' ? -1 : 1;
    });

    const pending = ordered.slice(0, FLUSH_BATCH_SIZE);
    const keep = ordered.slice(FLUSH_BATCH_SIZE);
    const remaining = [...keep];
    let flushed = 0;
    let failed = 0;

    for (const item of pending) {
      const nextAttemptAt = item.nextAttemptAt ? new Date(item.nextAttemptAt).getTime() : 0;
      if (nextAttemptAt && nextAttemptAt > Date.now()) {
        remaining.push(item);
        continue;
      }
      try {
        await Promise.race([
          processItem(item, options),
          new Promise((_, reject) => setTimeout(() => reject(new Error('sync_timeout')), ACK_TIMEOUT_MS)),
        ]);
        flushed += 1;
      } catch (err) {
        const retriable = await recordFailure(item, err?.message || 'sync_failed');
        if (retriable.retryCount < MAX_RETRIES) {
          remaining.push(retriable);
        } else {
          failed += 1;
        }
      }
    }

    await saveQueue(remaining);
    meta.lastSuccessAt = flushed > 0 ? nowIso() : meta.lastSuccessAt;
    meta.retryCount = flushed > 0 ? 0 : (meta.retryCount || 0) + 1;
    meta.lastErrorAt = failed > 0 ? nowIso() : meta.lastErrorAt;
    await saveMeta(meta);

    return { flushed, failed, remaining: remaining.length, offline: false };
  } finally {
    flushInProgress = false;
  }
}

export async function hydrateOfflineQueueFromLegacy(items = []) {
  const queue = await getQueue();
  const incoming = Array.isArray(items) ? items : [];
  const merged = [...queue];
  for (const raw of incoming) {
    if (!raw) continue;
    merged.push({
      id: raw.id || makeId('legacy'),
      dedupeKey: raw.dedupeKey || raw.id || makeId('legacy_dedupe'),
      type: normalizeType(raw.type),
      payload: raw.payload || {},
      rideId: raw.rideId || null,
      childId: raw.childId || null,
      source: raw.source || 'legacy',
      priority: raw.priority || 'normal',
      createdAt: raw.createdAt || nowIso(),
      retryCount: raw.retryCount || 0,
      nextAttemptAt: raw.nextAttemptAt || nowIso(),
      lastError: raw.lastError || null,
    });
  }
  await saveQueue(merged);
  return merged.length;
}

export default {
  enqueueOfflineEvent,
  enqueueSosTrigger,
  enqueueLocationPing,
  flushOfflineQueue,
  getOfflineQueueStatus,
  clearOfflineQueue,
  setSocketConnected,
  scheduleFlush,
  hydrateOfflineQueueFromLegacy,
  isOnline,
};
