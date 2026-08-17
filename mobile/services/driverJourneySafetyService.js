import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE from '../config';

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
