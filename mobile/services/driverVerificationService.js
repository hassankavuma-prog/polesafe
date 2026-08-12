// PoleSafe — Driver Onboarding & Verification Service v1
// Handles local auth state, document storage, and status tracking
// From Home to School. And Beyond. 🚸

import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE from '../config';

// ─── Storage Keys ──────────────────────────────────────
const ONBOARDING_KEY = '@polesafe_onboarding_progress';
const VERIFICATION_STATUS_KEY = '@polesafe_driver_verification';

// ─── Steps Enum ────────────────────────────────────────
export const ONBOARDING_STEPS = {
  1: 'Personal Details & NIN',
  2: 'Live Selfie & Phone',
  3: 'Vehicle & Plate Number',
};

export const VERIFICATION_STATUS = {
  NOT_SUBMITTED: 'not_submitted',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// ─── Save In-Progress Onboarding ───────────────────────
export async function saveOnboardingProgress(data) {
  try {
    const existing = await getOnboardingProgress();
    const merged = { ...existing, ...data, lastSavedAt: new Date().toISOString() };
    await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(merged));
    return merged;
  } catch (err) {
    console.warn('[DriverVerification] Failed to save progress:', err);
    return null;
  }
}

// ─── Get Saved Onboarding Progress ─────────────────────
export async function getOnboardingProgress() {
  try {
    const raw = await AsyncStorage.getItem(ONBOARDING_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[DriverVerification] Failed to load progress:', err);
    return {};
  }
}

// ─── Clear Onboarding Progress ─────────────────────────
export async function clearOnboardingProgress() {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
  } catch (err) {
    console.warn('[DriverVerification] Failed to clear progress:', err);
  }
}

// ─── Submit Documents for Admin Review ─────────────────
export async function submitForReview(driverId, docs) {
  try {
    const token = await AsyncStorage.getItem('polesafe_token');

    // In dev/demo mode, simulate submission
    if (__DEV__ && !token) {
      const status = {
        status: VERIFICATION_STATUS.PENDING,
        submittedAt: new Date().toISOString(),
        docs,
      };
      await AsyncStorage.setItem(VERIFICATION_STATUS_KEY, JSON.stringify(status));
      await clearOnboardingProgress();
      return status;
    }

    const res = await fetch(`${API_BASE}/api/driver/submit-documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ driverId, docs }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Submission failed');
    }

    const data = await res.json();
    await clearOnboardingProgress();

    // Save verification status locally
    await AsyncStorage.setItem(VERIFICATION_STATUS_KEY, JSON.stringify({
      status: VERIFICATION_STATUS.PENDING,
      submittedAt: new Date().toISOString(),
    }));

    return data;
  } catch (err) {
    console.warn('[DriverVerification] Submit failed:', err);
    throw err;
  }
}

// ─── Check if Driver is Approved ───────────────────────
export async function isApproved() {
  try {
    const status = await getVerificationStatus();
    return status?.status === VERIFICATION_STATUS.APPROVED;
  } catch {
    return false;
  }
}

// ─── Get Current Verification Status ───────────────────
export async function getVerificationStatus() {
  try {
    const token = await AsyncStorage.getItem('polesafe_token');

    // Dev/demo mode — read locally
    if (__DEV__ && !token) {
      const raw = await AsyncStorage.getItem(VERIFICATION_STATUS_KEY);
      return raw ? JSON.parse(raw) : { status: VERIFICATION_STATUS.NOT_SUBMITTED };
    }

    const res = await fetch(`${API_BASE}/api/driver/verification-status`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return { status: VERIFICATION_STATUS.NOT_SUBMITTED };

    const data = await res.json();
    // Sync local cache
    await AsyncStorage.setItem(VERIFICATION_STATUS_KEY, JSON.stringify(data));
    return data;
  } catch (err) {
    console.warn('[DriverVerification] Status check failed:', err);
    // Fallback to local cache
    try {
      const raw = await AsyncStorage.getItem(VERIFICATION_STATUS_KEY);
      return raw ? JSON.parse(raw) : { status: VERIFICATION_STATUS.NOT_SUBMITTED };
    } catch {
      return { status: VERIFICATION_STATUS.NOT_SUBMITTED };
    }
  }
}

// ─── Fetch Verification Status for Check ───────────────
export const driverVerificationStatus = async () => {
  return await getVerificationStatus();
};

export default {
  ONBOARDING_STEPS,
  VERIFICATION_STATUS,
  saveOnboardingProgress,
  getOnboardingProgress,
  clearOnboardingProgress,
  submitForReview,
  isApproved,
  getVerificationStatus,
};
