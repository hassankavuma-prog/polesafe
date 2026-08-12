// PoleSafe — Mobile Recurring Ride Service
// Client-side: fetch schedules, dispatch checks, auto-billing status

import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE from '../config';

const API_URL = API_BASE;

export async function fetchSchedules() {
  try {
    const token = await AsyncStorage.getItem('polesafe_token');
    const res = await fetch(`${API_URL}/api/parents/schedules`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.schedules || [];
  } catch (err) {
    console.log('Fetch schedules error:', err);
    return [];
  }
}

export async function fetchScheduleStatus(bookingId) {
  try {
    const token = await AsyncStorage.getItem('polesafe_token');
    const res = await fetch(`${API_URL}/api/parents/schedules/${bookingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch (err) {
    console.log('Fetch schedule status error:', err);
    return null;
  }
}

export async function pauseSchedule(bookingId) {
  try {
    const token = await AsyncStorage.getItem('polesafe_token');
    const res = await fetch(`${API_URL}/api/parents/schedules/${bookingId}/pause`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch (err) {
    console.log('Pause schedule error:', err);
    return { error: err.message };
  }
}

export async function resumeSchedule(bookingId) {
  try {
    const token = await AsyncStorage.getItem('polesafe_token');
    const res = await fetch(`${API_URL}/api/parents/schedules/${bookingId}/resume`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch (err) {
    console.log('Resume schedule error:', err);
    return { error: err.message };
  }
}

export async function cancelSchedule(bookingId) {
  try {
    const token = await AsyncStorage.getItem('polesafe_token');
    const res = await fetch(`${API_URL}/api/parents/schedules/${bookingId}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch (err) {
    console.log('Cancel schedule error:', err);
    return { error: err.message };
  }
}

export async function createSchedule(bookingData) {
  try {
    const token = await AsyncStorage.getItem('polesafe_token');
    const res = await fetch(`${API_URL}/api/parents/book`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });
    return await res.json();
  } catch (err) {
    console.log('Create schedule error:', err);
    return { error: err.message };
  }
}

export function estimateFare(baseFare, planType) {
  const discounts = { weekly: 0.10, monthly: 0.15, termly: 0.20 };
  const discount = discounts[planType] || 0;
  return Math.round(baseFare * (1 - discount));
}
