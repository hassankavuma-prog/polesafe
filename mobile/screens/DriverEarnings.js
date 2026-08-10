// PoleSafe Mobile — Driver Earnings Screen
// Earnings dashboard with today, weekly, monthly totals and breakdown
// Features: hide/show toggle (eye icon), withdrawal system, wallet balance

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, Modal, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_BASE from '../config';
import { COLORS, getTheme, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme';
const BLUE = COLORS.blue;

export default function DriverEarnings({ navigation }) {
  const theme = getTheme();
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Hide/Show toggle (like Uber eye icon)
  const [hideAmounts, setHideAmounts] = useState(false);

  // Withdrawal modal
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [withdrawNetwork, setWithdrawNetwork] = useState('mtn');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API_BASE}/api/drivers/earnings`, { headers });

      if (res.ok) {
        const data = await res.json();
        setEarnings(data);
        setWallet(data.wallet || null);
      } else {
        // Set demo data if API unavailable
        setEarnings({
          summary: {
            totalTrips: 98, schoolTrips: 75, rideHailingTrips: 23,
            schoolEarnings: 850000, rideHailingEarnings: 400000,
            totalEarnings: 1250000,
          },
          today: { total: 45000, trips: 4, schoolEarnings: 35000, rideEarnings: 10000 },
          weekly: { total: 285000, trips: 22 },
          monthly: { total: 1250000, trips: 98 },
          wallet: {
            availableBalance: 320000,
            pendingWithdrawals: 150000,
            totalBalance: 470000,
            lifetimeEarnings: 4120000,
            hasMobileMoney: true,
          },
          history: [
            { date: new Date().toISOString(), trips: 4, earnings: 45000, type: 'school' },
            { date: new Date(Date.now() - 86400000).toISOString(), trips: 5, earnings: 52000, type: 'school' },
            { date: new Date(Date.now() - 172800000).toISOString(), trips: 3, earnings: 38000, type: 'school' },
            { date: new Date(Date.now() - 259200000).toISOString(), trips: 6, earnings: 48000, type: 'ride' },
            { date: new Date(Date.now() - 345600000).toISOString(), trips: 4, earnings: 42000, type: 'school' },
          ],
        });
        setWallet({ availableBalance: 320000, pendingWithdrawals: 150000, totalBalance: 470000, lifetimeEarnings: 4120000, hasMobileMoney: true });
      }
    } catch (err) {
      console.log('Error loading earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEarnings();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString('en-UG');
  };

  // Hide amounts with asterisks
  const displayAmount = (amount) => {
    if (hideAmounts) return '•••• UGX';
    return `${formatCurrency(amount)} UGX`;
  };

  // ===== WITHDRAWAL FLOW =====
  const openWithdraw = async () => {
    // Fetch latest wallet info
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API_BASE}/api/drivers/wallet`, { headers });
      if (res.ok) {
        const data = await res.json();
        setWallet(data);
        setWithdrawPhone(data.mobileMoneyNumber || '');
      }
    } catch (_) {}
    setWithdrawAmount('');
    setShowWithdraw(true);
  };

  const submitWithdrawal = async () => {
    const amount = parseInt(withdrawAmount.replace(/,/g, ''), 10);
    if (!amount || amount < 1000) {
      Alert.alert('Invalid Amount', 'Minimum withdrawal is 1,000 UGX');
      return;
    }
    if (!withdrawPhone || withdrawPhone.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid mobile money number');
      return;
    }

    setWithdrawLoading(true);
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const res = await fetch(`${API_BASE}/api/drivers/withdraw`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount,
          mobileMoneyNumber: withdrawPhone,
          mobileMoneyNetwork: withdrawNetwork,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        Alert.alert(
          '✅ Withdrawal Requested',
          `${formatCurrency(amount)} UGX to ${withdrawPhone}\nFee: ${formatCurrency(data.withdrawal?.fee || 0)} UGX\nNet: ${formatCurrency(data.withdrawal?.netAmount || 0)} UGX`
        );
        setShowWithdraw(false);
        loadEarnings(); // Refresh
      } else {
        Alert.alert('Error', data.error || 'Withdrawal failed');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not process withdrawal');
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.canvas }]}>
        <ActivityIndicator size="large" color={BLUE} />
        <Text style={styles.loadingText}>Loading earnings...</Text>
      </View>
    );
  }

  const today = earnings?.today || {};
  const weekly = earnings?.weekly || {};
  const monthly = earnings?.monthly || {};
  const history = earnings?.history || [];
  const summary = earnings?.summary || {};
  const walletInfo = wallet || earnings?.wallet || {};
  const periodEarnings = summary.totalEarnings || 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.canvas }}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Wallet Balance Card (like Uber's wallet bar) */}
        {walletInfo.availableBalance !== undefined && (
          <TouchableOpacity style={styles.walletCard} onPress={openWithdraw} activeOpacity={0.8}>
            <View style={styles.walletLeft}>
              <Text style={styles.walletLabel}>💼 Available Balance</Text>
              <Text style={styles.walletAmount}>{displayAmount(walletInfo.availableBalance)}</Text>
              {walletInfo.pendingWithdrawals > 0 && (
                <Text style={styles.walletPending}>
                  {displayAmount(walletInfo.pendingWithdrawals)} pending withdrawal
                </Text>
              )}
            </View>
            <View style={styles.walletRight}>
              <Text style={styles.walletAction}>Withdraw {'>'}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Today's Earnings + Eye Toggle */}
        <View style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <Text style={styles.todayLabel}>💰 Today's Earnings</Text>
            <TouchableOpacity
              onPress={() => setHideAmounts(!hideAmounts)}
              style={styles.eyeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.eyeIcon}>{hideAmounts ? '👁️‍🗨️' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.todayAmount}>{displayAmount(today.total || 0)}</Text>
          <Text style={styles.todayTrips}>{today.trips || 0} trips today</Text>
        </View>

        {/* Weekly / Monthly Summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: COLORS.blueBg }]}>
            <Text style={styles.summaryIcon}>📅</Text>
            <Text style={styles.summaryLabel}>Weekly</Text>
            <Text style={[styles.summaryAmount, { color: BLUE }]}>
              {displayAmount(weekly.total || 0)}
            </Text>
            <Text style={styles.summaryTrips}>{weekly.trips || 0} trips</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: COLORS.greenBg }]}>
            <Text style={styles.summaryIcon}>📆</Text>
            <Text style={styles.summaryLabel}>Monthly</Text>
            <Text style={[styles.summaryAmount, { color: COLORS.green }]}>
              {displayAmount(monthly.total || 0)}
            </Text>
            <Text style={styles.summaryTrips}>{monthly.trips || 0} trips</Text>
          </View>
        </View>

        {/* Lifetime Earnings */}
        {walletInfo.lifetimeEarnings > 0 && (
          <View style={styles.lifetimeCard}>
            <Text style={styles.lifetimeLabel}>🏆 All-Time Earnings</Text>
            <Text style={styles.lifetimeAmount}>{displayAmount(walletInfo.lifetimeEarnings)}</Text>
            <Text style={styles.lifetimeTrips}>{summary.totalTrips || 0} total trips completed</Text>
          </View>
        )}

        {/* Earnings Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Today's Breakdown</Text>
          <View style={styles.breakdownRow}>
            <View style={[styles.breakdownBar, { flex: today.schoolEarnings || 1 }]}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownIcon}>🏫</Text>
                <Text style={styles.breakdownLabel}>School Routes</Text>
                <Text style={styles.breakdownAmount}>
                  {displayAmount(today.schoolEarnings || 0)}
                </Text>
              </View>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={[styles.breakdownBar, { flex: today.rideEarnings || 1 }]}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownIcon}>🚗</Text>
                <Text style={styles.breakdownLabel}>PoleSafe Ride</Text>
                <Text style={styles.breakdownAmount}>
                  {displayAmount(today.rideEarnings || 0)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Performance</Text>
          <View style={styles.perfRow}>
            <View style={styles.perfBox}>
              <Text style={styles.perfEmoji}>⭐</Text>
              <Text style={styles.perfLabel}>Rating</Text>
              <Text style={styles.perfValue}>{earnings?.rating || '4.8'}</Text>
            </View>
            <View style={styles.perfBox}>
              <Text style={styles.perfEmoji}>✅</Text>
              <Text style={styles.perfLabel}>Completion</Text>
              <Text style={styles.perfValue}>{earnings?.completionRate || '98'}%</Text>
            </View>
            <View style={styles.perfBox}>
              <Text style={styles.perfEmoji}>🎖️</Text>
              <Text style={styles.perfLabel}>Bonus</Text>
              <Text style={[styles.perfValue, { color: COLORS.green }]}>
                {displayAmount(earnings?.bonus || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Trip History */}
        <Text style={styles.sectionTitle}>📋 Trip History</Text>

        {history.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No trip history yet</Text>
          </View>
        ) : (
          <View style={styles.historyCard}>
            {history.map((trip, idx) => {
              const dateStr = trip.date
                ? new Date(trip.date).toLocaleDateString('en-UG', {
                    weekday: 'short', day: 'numeric', month: 'short',
                  })
                : '—';
              return (
                <View key={trip._id || idx} style={styles.historyRow}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyDate}>{dateStr}</Text>
                    <View style={styles.historyType}>
                      <Text style={styles.historyTypeText}>
                        {trip.type === 'ride' ? '🚗 Ride' : '🏫 School'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.historyMiddle}>
                    <Text style={styles.historyTrips}>{trip.trips} trip{trip.trips > 1 ? 's' : ''}</Text>
                  </View>
                  <Text style={styles.historyEarnings}>
                    {displayAmount(trip.earnings)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Withdraw Button */}
        <TouchableOpacity style={styles.withdrawBtn} onPress={openWithdraw}>
          <Text style={styles.withdrawBtnText}>💳 Withdraw to Mobile Money</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ===== WITHDRAWAL MODAL ===== */}
      <Modal visible={showWithdraw} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💳 Withdraw Earnings</Text>
              <TouchableOpacity onPress={() => setShowWithdraw(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Available Balance */}
            <Text style={styles.modalBalance}>
              Available: <Text style={{ fontWeight: '700', color: BLUE }}>
                {formatCurrency(walletInfo?.availableBalance || 0)} UGX
              </Text>
            </Text>

            {/* Amount Input */}
            <Text style={styles.inputLabel}>Amount (UGX)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 50000"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
            />

            {/* Quick Amounts */}
            <View style={styles.quickRow}>
              {[10000, 25000, 50000, 100000].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[styles.quickBtn, parseInt(withdrawAmount) === amt && styles.quickBtnActive]}
                  onPress={() => setWithdrawAmount(String(amt))}
                >
                  <Text style={[styles.quickBtnText, parseInt(withdrawAmount) === amt && styles.quickBtnTextActive]}>
                    {formatCurrency(amt)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Mobile Money Number */}
            <Text style={styles.inputLabel}>Mobile Money Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 0772123456"
              placeholderTextColor="#64748b"
              keyboardType="phone-pad"
              value={withdrawPhone}
              onChangeText={setWithdrawPhone}
            />

            {/* Network Selector */}
            <View style={styles.networkRow}>
              <TouchableOpacity
                style={[styles.networkBtn, withdrawNetwork === 'mtn' && styles.networkBtnActive]}
                onPress={() => setWithdrawNetwork('mtn')}
              >
                <Text style={[styles.networkBtnText, withdrawNetwork === 'mtn' && styles.networkBtnTextActive]}>
                  MTN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.networkBtn, withdrawNetwork === 'airtel' && styles.networkBtnActive]}
                onPress={() => setWithdrawNetwork('airtel')}
              >
                <Text style={[styles.networkBtnText, withdrawNetwork === 'airtel' && styles.networkBtnTextActive]}>
                  Airtel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.networkBtn, withdrawNetwork === 'other' && styles.networkBtnActive]}
                onPress={() => setWithdrawNetwork('other')}
              >
                <Text style={[styles.networkBtnText, withdrawNetwork === 'other' && styles.networkBtnTextActive]}>
                  Other
                </Text>
              </TouchableOpacity>
            </View>

            {/* Fee Info */}
            <Text style={styles.feeNote}>Fee: 1% (max 5,000 UGX) • Net will be slightly less</Text>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, withdrawLoading && { opacity: 0.6 }]}
              onPress={submitWithdrawal}
              disabled={withdrawLoading}
            >
              {withdrawLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Confirm Withdrawal</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: COLORS.textSecondary, fontSize: 14 },

  // Wallet Bar
  walletCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    marginBottom: 14, elevation: 2,
    flexDirection: 'row', alignItems: 'center',
    borderLeftWidth: 4, borderLeftColor: '#22c55e',
  },
  walletLeft: { flex: 1 },
  walletLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  walletAmount: { fontSize: 22, fontWeight: '800', color: '#22c55e', marginTop: 2 },
  walletPending: { fontSize: 11, color: '#f59e0b', marginTop: 2 },
  walletRight: { paddingLeft: 12 },
  walletAction: { fontSize: 14, fontWeight: '600', color: BLUE },

  // Today
  todayCard: {
    backgroundColor: BLUE, borderRadius: 16, padding: 24,
    marginBottom: 14, elevation: 4,
  },
  todayHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  todayLabel: { fontSize: 13, color: '#BBDEFB', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 },
  eyeBtn: { padding: 4 },
  eyeIcon: { fontSize: 20 },
  todayAmount: { fontSize: 40, fontWeight: '800', color: '#fff', marginTop: 6 },
  todayTrips: { fontSize: 14, color: '#BBDEFB', marginTop: 4 },

  // Summary
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  summaryCard: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  summaryIcon: { fontSize: 24, marginBottom: 4 },
  summaryLabel: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  summaryAmount: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  summaryTrips: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  // Lifetime
  lifetimeCard: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 16,
    marginBottom: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#f59e0b',
  },
  lifetimeLabel: { fontSize: 13, color: '#f59e0b', fontWeight: '600' },
  lifetimeAmount: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 4 },
  lifetimeTrips: { fontSize: 12, color: '#94a3b8', marginTop: 2 },

  // Section
  section: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 14, elevation: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },

  // Breakdown
  breakdownRow: { flexDirection: 'row', alignItems: 'stretch' },
  breakdownBar: { paddingVertical: 8 },
  breakdownDivider: { width: 1, backgroundColor: '#eee', marginHorizontal: 12 },
  breakdownItem: { alignItems: 'center' },
  breakdownIcon: { fontSize: 24, marginBottom: 4 },
  breakdownLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  breakdownAmount: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },

  // Performance
  perfRow: { flexDirection: 'row', justifyContent: 'space-around' },
  perfBox: { alignItems: 'center' },
  perfEmoji: { fontSize: 24, marginBottom: 4 },
  perfLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 2 },
  perfValue: { fontSize: 18, fontWeight: '700', color: BLUE },

  // History
  historyCard: { backgroundColor: COLORS.surface, borderRadius: 12, marginBottom: 14, elevation: 1 },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  historyLeft: { flex: 1 },
  historyDate: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary },
  historyType: { marginTop: 2 },
  historyTypeText: { fontSize: 11, color: COLORS.textMuted },
  historyMiddle: { marginHorizontal: 12 },
  historyTrips: { fontSize: 13, color: COLORS.textSecondary },
  historyEarnings: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },

  // Empty
  emptyCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 14, elevation: 1 },
  emptyText: { fontSize: 14, color: COLORS.textMuted },

  // Withdraw Button
  withdrawBtn: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: BLUE },
  withdrawBtnText: { color: BLUE, fontSize: 16, fontWeight: '600' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  modalClose: { fontSize: 22, color: '#94a3b8', padding: 4 },
  modalBalance: { fontSize: 15, color: '#94a3b8', marginBottom: 20 },

  inputLabel: { fontSize: 13, fontWeight: '600', color: '#cbd5e1', marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: '#0f172a', borderRadius: 10, padding: 14,
    fontSize: 18, fontWeight: '600', color: '#fff',
    borderWidth: 1, borderColor: '#334155',
  },

  quickRow: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 16 },
  quickBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    backgroundColor: '#0f172a', alignItems: 'center',
    borderWidth: 1, borderColor: '#334155',
  },
  quickBtnActive: { borderColor: BLUE, backgroundColor: `${BLUE}22` },
  quickBtnText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  quickBtnTextActive: { color: BLUE },

  networkRow: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 8 },
  networkBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    backgroundColor: '#0f172a', alignItems: 'center',
    borderWidth: 1, borderColor: '#334155',
  },
  networkBtnActive: { borderColor: '#22c55e', backgroundColor: '#22c55e22' },
  networkBtnText: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  networkBtnTextActive: { color: '#22c55e' },

  feeNote: { fontSize: 11, color: '#64748b', textAlign: 'center', marginVertical: 12 },

  submitBtn: {
    backgroundColor: BLUE, padding: 16, borderRadius: 12, alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
