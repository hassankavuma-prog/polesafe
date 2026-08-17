import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE from '../config';

function createStorageUnavailableError() {
  const err = new Error('Safety state unavailable. Please retry when storage is available.');
  err.code = 'STORAGE_UNAVAILABLE';
  return err;
}

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem('polesafe_token');
  if (!token) {
    const err = new Error('Connection required. Please go online and retry.');
    err.code = 'AUTH_REQUIRED';
    throw err;
  }
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function requestJson(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const err = new Error(data?.error || data?.message || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function getPreJourneySafetyState(assignmentId) {
  const headers = await getAuthHeaders();
  return requestJson(`/api/phase1/assignments/${assignmentId}/pre-journey-safety`, { headers });
}

export async function getLastSpokenSafetyOccurrenceId(driverId) {
  try {
    return await AsyncStorage.getItem(`polesafe_last_spoken_safety_occurrence_${driverId}`);
  } catch {
    throw createStorageUnavailableError();
  }
}

export async function setLastSpokenSafetyOccurrenceId(driverId, occurrenceId) {
  try {
    if (!driverId) return;
    if (occurrenceId) await AsyncStorage.setItem(`polesafe_last_spoken_safety_occurrence_${driverId}`, String(occurrenceId));
    else await AsyncStorage.removeItem(`polesafe_last_spoken_safety_occurrence_${driverId}`);
  } catch {
    throw createStorageUnavailableError();
  }
}

export async function recordPreJourneySafetyReminder(assignmentId) {
  const headers = await getAuthHeaders();
  return requestJson(`/api/phase1/assignments/${assignmentId}/pre-journey-safety/reminder`, { method: 'POST', headers });
}

export async function acknowledgePreJourneySafety(assignmentId) {
  const headers = await getAuthHeaders();
  return requestJson(`/api/phase1/assignments/${assignmentId}/pre-journey-safety/acknowledge`, { method: 'POST', headers });
}

export async function startJourney(assignmentId) {
  const headers = await getAuthHeaders();
  return requestJson(`/api/phase1/assignments/${assignmentId}/start-journey`, { method: 'POST', headers });
}

export default { getPreJourneySafetyState, recordPreJourneySafetyReminder, acknowledgePreJourneySafety, startJourney };
