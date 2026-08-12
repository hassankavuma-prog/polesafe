// PoleSafe Driver Payout Service v1
// Handles earnings calculations, commission deductions, payout processing
// From Home to School. And Beyond. 🚸

import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE from '../config';

// ─── Constants ──────────────────────────────────────
const PLATFORM_COMMISSION_RATE = 0.12; // 12%
const EARLY_CASHOUT_FEE = 1000; // UGX
const MINIMUM_PAYOUT = 1000; // UGX

// ─── Payout Calculation ────────────────────────────

/**
 * Calculate full payout breakdown from a gross fare
 * @param {number} grossFare - Total fare before deductions
 * @param {'momo'|'cash'} paymentMethod - How rider paid
 * @param {number} [tip=0] - Optional driver tip
 * @returns {object} breakdown { grossFare, commission, commissionRate, cashCollected, netPayout, tip, paymentMethod }
 */
export function calculatePayoutBreakdown(grossFare, paymentMethod, tip = 0) {
  const commission = Math.round(grossFare * PLATFORM_COMMISSION_RATE);
  const cashCollected = paymentMethod === 'cash' ? grossFare - commission : 0;
  const netPayout = grossFare - commission - cashCollected + tip;

  return {
    grossFare,
    commission,
    commissionRate: PLATFORM_COMMISSION_RATE * 100, // 12
    cashCollected,
    netPayout,
    tip,
    paymentMethod,
  };
}

/**
 * Calculate weekly summary breakdown from a list of trips
 * @param {Array} trips - Array of trip objects with { fare, paymentMethod, tip }
 * @returns {object} aggregated breakdown
 */
export function calculateWeeklyBreakdown(trips = []) {
  let grossTotal = 0;
  let totalCommission = 0;
  let totalCashCollected = 0;
  let totalNetPayout = 0;
  let totalTips = 0;

  trips.forEach(trip => {
    const breakdown = calculatePayoutBreakdown(
      trip.fare || 0,
      trip.paymentMethod || 'momo',
      trip.tip || 0,
    );
    grossTotal += breakdown.grossFare;
    totalCommission += breakdown.commission;
    totalCashCollected += breakdown.cashCollected;
    totalNetPayout += breakdown.netPayout;
    totalTips += breakdown.tip || 0;
  });

  return {
    grossTotal,
    totalCommission,
    totalCashCollected,
    totalNetPayout,
    totalTips,
    tripCount: trips.length,
  };
}

// ─── Payment Method Helpers ───────────────────────
const PAYMENT_BADGES = {
  momo_mtn: { emoji: '🟡', label: 'MTN MoMo' },
  momo_airtel: { emoji: '🔴', label: 'Airtel Money' },
  cash: { emoji: '💵', label: 'Cash' },
  momo: { emoji: '📱', label: 'Mobile Money' },
};

/**
 * Get display badge for a payment method
 * @param {string} method
 * @returns {{ emoji: string, label: string, color: string }}
 */
export function getPaymentBadge(method) {
  return PAYMENT_BADGES[method] || { emoji: '💳', label: method || 'Unknown' };
}

/**
 * Format payment badge text for display
 * @param {string} method
 * @returns {string} e.g. "[🟡 MTN MoMo]"
 */
export function formatPaymentBadge(method) {
  const badge = getPaymentBadge(method);
  return `[${badge.emoji} ${badge.label}]`;
}

// ─── API Calls ─────────────────────────────────────

/**
 * Fetch driver earnings & trip history from backend
 * @returns {Promise<object|null>} earnings data
 */
export async function fetchDriverEarnings() {
  try {
    const token = await AsyncStorage.getItem('polesafe_token');
    const headers = { Authorization: `Bearer ${token}` };
    const res = await fetch(`${API_BASE}/api/drivers/earnings`, { headers });
    if (res.ok) return await res.json();
    return null;
  } catch (err) {
    console.log('[PayoutService] Fetch earnings error:', err);
    return null;
  }
}

/**
 * Request a payout (cash-out)
 * @param {object} params
 * @param {number} params.amount
 * @param {boolean} params.early
 * @param {'mobile_money'|'bank'} params.payoutMethod
 * @param {string} [params.mobileMoneyNumber]
 * @param {string} [params.mobileMoneyNetwork]
 * @returns {Promise<{ok: boolean, data?: object, error?: string}>}
 */
export async function requestPayout(params) {
  const { amount, early, payoutMethod, mobileMoneyNumber, mobileMoneyNetwork } = params;

  if (!amount || amount < MINIMUM_PAYOUT) {
    return { ok: false, error: `Minimum payout is ${MINIMUM_PAYOUT} UGX` };
  }

  try {
    const token = await AsyncStorage.getItem('polesafe_token');
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const body = { amount, early, payoutMethod };
    if (payoutMethod === 'mobile_money') {
      body.mobileMoneyNumber = mobileMoneyNumber;
      body.mobileMoneyNetwork = mobileMoneyNetwork;
    }

    const res = await fetch(`${API_BASE}/api/drivers/withdraw`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (res.ok) return { ok: true, data };
    return { ok: false, error: data.error || 'Request failed' };
  } catch (err) {
    return { ok: false, error: 'Could not connect to server' };
  }
}

// ─── Helper: Format Currency ──────────────────────
export function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString('en-UG');
}

export default {
  calculatePayoutBreakdown,
  calculateWeeklyBreakdown,
  getPaymentBadge,
  formatPaymentBadge,
  fetchDriverEarnings,
  requestPayout,
  formatCurrency,
  PLATFORM_COMMISSION_RATE,
  EARLY_CASHOUT_FEE,
  MINIMUM_PAYOUT,
};
