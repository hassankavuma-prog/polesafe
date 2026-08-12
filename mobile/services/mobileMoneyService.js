// PoleSafe Mobile Money Service v1
// Mock payment handler with PENDING / SUCCESS / FAILED states
// Ready for future production API routing (Flutterwave, etc.)
// From Home to School. And Beyond. 🚸

import { RIDE_EVENTS, emitRideEvent } from './rideSocketService';

// ─── Event Types (extends rideSocketService) ─────────
export const PAYMENT_EVENTS = {
  RIDE_PAYMENT_INITIATED: 'RIDE_PAYMENT_INITIATED',
  RIDE_PAYMENT_SUCCESS: 'RIDE_PAYMENT_SUCCESS',
  RIDE_PAYMENT_FAILED: 'RIDE_PAYMENT_FAILED',
};

// ─── Uganda MSISDN Validator ─────────────────────────
const UG_PREFIXES = ['077', '078', '070', '075', '076', '079', '071', '072', '074'];

export function validateUgPhone(phone) {
  if (!phone || typeof phone !== 'string') return { valid: false, reason: 'No phone number provided' };

  // Strip spaces, dashes, and leading +
  const cleaned = phone.replace(/[\s\-\(\)]/g, '').replace(/^\+256/, '0').replace(/^256/, '0');

  if (!/^\d{10}$/.test(cleaned)) {
    return { valid: false, reason: 'Must be 10 digits (e.g., 0771234567)' };
  }

  const prefix = cleaned.substring(0, 3);
  if (!UG_PREFIXES.includes(prefix)) {
    return { valid: false, reason: `Invalid Uganda prefix "${prefix}". Use 077, 078, 070, 075` };
  }

  const network = ['077', '076', '079'].includes(prefix) ? 'mtn' : ['078', '075'].includes(prefix) ? 'airtel' : ['070', '074', '071', '072'].includes(prefix) ? 'other' : 'unknown';

  return { valid: true, cleaned, network, formatted: `+256${cleaned.substring(1)}` };
}

export function formatUgPhone(phone) {
  const result = validateUgPhone(phone);
  if (!result.valid) return phone;
  return result.formatted;
}

// ─── Mock Payment State ──────────────────────────────
const paymentStore = new Map();

function generateTransactionRef() {
  return `PS-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
}

// Simulates network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ─── Mock: Request MTN MoMo Payment ──────────────────
export async function requestMtnPayment(phone, amountUGX, reference) {
  const validation = validateUgPhone(phone);
  if (!validation.valid) {
    return { success: false, error: validation.reason };
  }

  const txRef = reference || generateTransactionRef();

  emitRideEvent(PAYMENT_EVENTS.RIDE_PAYMENT_INITIATED, {
    provider: 'mtn',
    phone: validation.formatted,
    amountUGX,
    reference: txRef,
    timestamp: new Date().toISOString(),
  });

  // Simulate network delay
  await delay(1500);

  // Simulate momo prompt response (80% success rate for testing)
  const success = Math.random() > 0.15;

  if (success) {
    const result = {
      success: true,
      transactionId: txRef,
      provider: 'mtn',
      amountUGX,
      phone: validation.formatted,
      status: 'SUCCESS',
      message: `Payment of UGX ${amountUGX.toLocaleString()} via MTN MoMo successful`,
      timestamp: new Date().toISOString(),
    };

    paymentStore.set(txRef, { ...result, status: 'SUCCESS' });

    emitRideEvent(PAYMENT_EVENTS.RIDE_PAYMENT_SUCCESS, result);
    return result;
  } else {
    const result = {
      success: false,
      transactionId: txRef,
      provider: 'mtn',
      amountUGX,
      phone: validation.formatted,
      status: 'FAILED',
      error: 'Transaction declined. Insufficient balance or PIN timeout.',
      timestamp: new Date().toISOString(),
    };

    paymentStore.set(txRef, { ...result, status: 'FAILED' });

    emitRideEvent(PAYMENT_EVENTS.RIDE_PAYMENT_FAILED, result);
    return result;
  }
}

// ─── Mock: Request Airtel Money Payment ──────────────
export async function requestAirtelPayment(phone, amountUGX, reference) {
  const validation = validateUgPhone(phone);
  if (!validation.valid) {
    return { success: false, error: validation.reason };
  }

  const txRef = reference || generateTransactionRef();

  emitRideEvent(PAYMENT_EVENTS.RIDE_PAYMENT_INITIATED, {
    provider: 'airtel',
    phone: validation.formatted,
    amountUGX,
    reference: txRef,
    timestamp: new Date().toISOString(),
  });

  await delay(1500);

  const success = Math.random() > 0.15;

  if (success) {
    const result = {
      success: true,
      transactionId: txRef,
      provider: 'airtel',
      amountUGX,
      phone: validation.formatted,
      status: 'SUCCESS',
      message: `Payment of UGX ${amountUGX.toLocaleString()} via Airtel Money successful`,
      timestamp: new Date().toISOString(),
    };

    paymentStore.set(txRef, { ...result, status: 'SUCCESS' });

    emitRideEvent(PAYMENT_EVENTS.RIDE_PAYMENT_SUCCESS, result);
    return result;
  } else {
    const result = {
      success: false,
      transactionId: txRef,
      provider: 'airtel',
      amountUGX,
      phone: validation.formatted,
      status: 'FAILED',
      error: 'Transaction declined. Please try again.',
      timestamp: new Date().toISOString(),
    };

    paymentStore.set(txRef, { ...result, status: 'FAILED' });

    emitRideEvent(PAYMENT_EVENTS.RIDE_PAYMENT_FAILED, result);
    return result;
  }
}

// ─── Cash (no-op, just records) ──────────────────────
export async function requestCashPayment(amountUGX) {
  return {
    success: true,
    transactionId: `cash-${Date.now()}`,
    provider: 'cash',
    amountUGX,
    status: 'PENDING',
    message: `Cash payment of UGX ${amountUGX.toLocaleString()} due at drop-off`,
    timestamp: new Date().toISOString(),
  };
}

// ─── Check Payment Status ────────────────────────────
export async function checkPaymentStatus(transactionId) {
  await delay(500);

  if (paymentStore.has(transactionId)) {
    return paymentStore.get(transactionId);
  }

  return {
    transactionId,
    status: 'UNKNOWN',
    error: 'Transaction not found',
  };
}

export default {
  PAYMENT_EVENTS,
  validateUgPhone,
  formatUgPhone,
  requestMtnPayment,
  requestAirtelPayment,
  requestCashPayment,
  checkPaymentStatus,
};
