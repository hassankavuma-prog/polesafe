// PoleSafe Mobile — Driver Earnings Screen (Uber-style)
// Features: hide/show toggle, Friday auto-payout info, early cash-out (1k fee), bank + mobile money

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, Modal, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_BASE from '../config';
import { COLORS, getTheme } from '../theme';
import { calculatePayoutBreakdown, calculateWeeklyBreakdown, formatPaymentBadge, getPaymentBadge } from '../services/driverPayoutService';
const BLUE = COLORS.blue;

export default function DriverEarnings({ navigation }) {
  const theme = getTheme();
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hideAmounts, setHideAmounts] = useState(false);

  // Withdrawal state
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [wallet, setWallet] = useState(null);

  // Payout method tab (mobile_money / bank)
  const [payoutTab, setPayoutTab] = useState('mobile_money');

  // Mobile money fields
  const [mmPhone, setMmPhone] = useState('');
  const [mmNetwork, setMmNetwork] = useState('mtn');

  // Bank fields
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankBranch, setBankBranch] = useState('');

  // Withdrawal type: 'scheduled' (free, Friday) or 'early' (1k fee)
  const [withdrawalType, setWithdrawalType] = useState('scheduled');

  // Phase 10 features
  const [transactions, setTransactions] = useState([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [weeklyToggle, setWeeklyToggle] = useState('daily'); // 'daily' | 'weekly'
  const [showPayoutHistory, setShowPayoutHistory] = useState(false);

  useEffect(() => { loadEarnings(); }, []);

  const loadEarnings = async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API_BASE}/api/drivers/earnings`, { headers });

      if (res.ok) {
        const data = await res.json();
        setEarnings(data);
        setWallet(data.wallet || null);
        setTransactions(data?.transactions || []);
      } else {
        setEarnings({
          summary: { totalTrips: 98, schoolTrips: 75, rideHailingTrips: 23, schoolEarnings: 850000, rideHailingEarnings: 400000, totalEarnings: 1250000 },
          today: { total: 45000, trips: 4, schoolEarnings: 35000, rideEarnings: 10000 },
          weekly: { total: 285000, trips: 22 },
          monthly: { total: 1250000, trips: 98 },
          wallet: {
            availableBalance: 320000, pendingEarlyWithdrawals: 0, scheduledForFriday: 150000,
            totalBalance: 470000, lifetimeEarnings: 4120000,
            nextPayoutLabel: 'Friday, Aug 14', daysUntilPayout: 4,
            payoutMethod: 'mobile_money', hasMobileMoney: true, hasBankDetails: false,
          },
          history: [
            { date: new Date().toISOString(), trips: 4, earnings: 45000, type: 'school' },
            { date: new Date(Date.now() - 86400000).toISOString(), trips: 5, earnings: 52000, type: 'school' },
            { date: new Date(Date.now() - 172800000).toISOString(), trips: 3, earnings: 38000, type: 'school' },
            { date: new Date(Date.now() - 259200000).toISOString(), trips: 6, earnings: 48000, type: 'ride' },
            { date: new Date(Date.now() - 345600000).toISOString(), trips: 4, earnings: 42000, type: 'school' },
          ],
          transactions: [
            { id: 't1', childName: 'Sarah M.', school: 'Greenhill Academy', destination: 'Naalya', fare: 15000, paymentMethod: 'momo_mtn', time: '8:15 AM', date: new Date().toISOString(), distance: '4.2 km', duration: '18 min', tip: 0, status: 'completed' },
            { id: 't2', childName: 'James K.', school: 'Ntinda Community', destination: 'Bukoto', fare: 6000, paymentMethod: 'cash', time: '10:30 AM', date: new Date().toISOString(), distance: '2.1 km', duration: '10 min', tip: 2000, status: 'completed' },
            { id: 't3', childName: 'Amina N.', school: 'Naalya Family', destination: 'Kiwatule', fare: 28000, paymentMethod: 'momo_airtel', time: '2:45 PM', date: new Date().toISOString(), distance: '6.8 km', duration: '25 min', tip: 0, status: 'completed' },
            { id: 't4', childName: 'Peter O.', school: 'Kololo SS', destination: 'Wandegeya', fare: 18000, paymentMethod: 'momo_mtn', time: '7:00 AM', date: new Date(Date.now() - 86400000).toISOString(), distance: '5.3 km', duration: '22 min', tip: 0, status: 'completed' },
            { id: 't5', childName: 'Grace L.', school: 'Uphill Academy', destination: 'Kisaasi', fare: 12000, paymentMethod: 'cash', time: '9:20 AM', date: new Date(Date.now() - 86400000).toISOString(), distance: '3.5 km', duration: '15 min', tip: 1000, status: 'completed' },
            { id: 't6', childName: 'Daniel W.', school: 'Kabojja Juniour', destination: 'Muyenga', fare: 22000, paymentMethod: 'momo_mtn', time: '1:30 PM', date: new Date(Date.now() - 86400000).toISOString(), distance: '7.5 km', duration: '28 min', tip: 0, status: 'completed' },
            { id: 't7', childName: 'Faith I.', school: 'Lake View', destination: 'Namasuba', fare: 8500, paymentMethod: 'cash', time: '6:45 AM', date: new Date(Date.now() - 172800000).toISOString(), distance: '2.8 km', duration: '12 min', tip: 500, status: 'completed' },
            { id: 't8', childName: 'Brian S.', school: 'St. Mary\'s Kitende', destination: 'Kampala Road', fare: 32000, paymentMethod: 'momo_airtel', time: '4:00 PM', date: new Date(Date.now() - 172800000).toISOString(), distance: '9.2 km', duration: '35 min', tip: 0, status: 'completed' },
          ],
        });
        setWallet({
          availableBalance: 320000, pendingEarlyWithdrawals: 0, scheduledForFriday: 150000,
          totalBalance: 470000, lifetimeEarnings: 4120000,
          nextPayoutLabel: 'Friday, Aug 14', daysUntilPayout: 4,
          payoutMethod: 'mobile_money', hasMobileMoney: true, hasBankDetails: false,
          payoutHistory: [
            { id: 'p1', amount: 50000, date: new Date(Date.now() - 86400000 * 3).toISOString(), method: 'MTN MoMo', status: 'completed' },
            { id: 'p2', amount: 35000, date: new Date(Date.now() - 86400000 * 7).toISOString(), method: 'Airtel Money', status: 'completed' },
            { id: 'p3', amount: 100000, date: new Date(Date.now() - 86400000 * 10).toISOString(), method: 'MTN MoMo', status: 'completed' },
          ],
        });
        setTransactions([
          { id: 't1', childName: 'Sarah M.', school: 'Greenhill Academy', destination: 'Naalya', fare: 15000, paymentMethod: 'momo_mtn', time: '8:15 AM', date: new Date().toISOString(), distance: '4.2 km', duration: '18 min', tip: 0, status: 'completed' },
          { id: 't2', childName: 'James K.', school: 'Ntinda Community', destination: 'Bukoto', fare: 6000, paymentMethod: 'cash', time: '10:30 AM', date: new Date().toISOString(), distance: '2.1 km', duration: '10 min', tip: 2000, status: 'completed' },
          { id: 't3', childName: 'Amina N.', school: 'Naalya Family', destination: 'Kiwatule', fare: 28000, paymentMethod: 'momo_airtel', time: '2:45 PM', date: new Date().toISOString(), distance: '6.8 km', duration: '25 min', tip: 0, status: 'completed' },
          { id: 't4', childName: 'Peter O.', school: 'Kololo SS', destination: 'Wandegeya', fare: 18000, paymentMethod: 'momo_mtn', time: '7:00 AM', date: new Date(Date.now() - 86400000).toISOString(), distance: '5.3 km', duration: '22 min', tip: 0, status: 'completed' },
          { id: 't5', childName: 'Grace L.', school: 'Uphill Academy', destination: 'Kisaasi', fare: 12000, paymentMethod: 'cash', time: '9:20 AM', date: new Date(Date.now() - 86400000).toISOString(), distance: '3.5 km', duration: '15 min', tip: 1000, status: 'completed' },
          { id: 't6', childName: 'Daniel W.', school: 'Kabojja Juniour', destination: 'Muyenga', fare: 22000, paymentMethod: 'momo_mtn', time: '1:30 PM', date: new Date(Date.now() - 86400000).toISOString(), distance: '7.5 km', duration: '28 min', tip: 0, status: 'completed' },
        ]);
      }
    } catch (err) {
      console.log('Error loading earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => { setRefreshing(true); await loadEarnings(); setRefreshing(false); };
  const formatCurrency = (amount) => Number(amount || 0).toLocaleString('en-UG');
  const displayAmount = (amount) => hideAmounts ? '•••• UGX' : `${formatCurrency(amount)} UGX`;

  // Open withdrawal modal — fetch latest wallet
  const openWithdraw = async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API_BASE}/api/drivers/wallet`, { headers });
      if (res.ok) {
        const data = await res.json();
        setWallet(data);
        setMmPhone(data.mobileMoneyNumber || '');
        setPayoutTab(data.payoutMethod || 'mobile_money');
        if (data.bankDetails) {
          setBankName(data.bankDetails.bankName || '');
          setBankAccountName(data.bankDetails.accountName || '');
          setBankAccountNumber(data.bankDetails.accountNumber || '');
          setBankBranch(data.bankDetails.branch || '');
        }
      }
    } catch (_) {}
    setWithdrawAmount('');
    setWithdrawalType('scheduled');
    setShowWithdraw(true);
  };

  // Submit withdrawal
  const submitWithdrawal = async () => {
    const amount = parseInt(withdrawAmount.replace(/,/g, ''), 10);
    if (!amount || amount < 1000) { Alert.alert('Invalid Amount', 'Minimum is 1,000 UGX'); return; }

    const isEarly = withdrawalType === 'early';
    const maxAmount = wallet?.availableBalance || 0;
    if (amount > maxAmount) { Alert.alert('Insufficient Balance', `Available: ${formatCurrency(maxAmount)} UGX`); return; }

    // Validate payout method
    if (payoutTab === 'mobile_money') {
      if (!mmPhone || mmPhone.length < 10) { Alert.alert('Missing Number', 'Enter your mobile money number'); return; }
    } else {
      if (!bankName || !bankAccountName || !bankAccountNumber) { Alert.alert('Missing Bank Details', 'Fill all bank fields'); return; }
    }

    setWithdrawLoading(true);
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const body = {
        amount,
        early: isEarly,
        payoutMethod: payoutTab,
      };
      if (payoutTab === 'mobile_money') { body.mobileMoneyNumber = mmPhone; body.mobileMoneyNetwork = mmNetwork; }
      else { body.bankName = bankName; body.bankAccountName = bankAccountName; body.bankAccountNumber = bankAccountNumber; body.bankBranch = bankBranch; }

      const res = await fetch(`${API_BASE}/api/drivers/withdraw`, { method: 'POST', headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) {
        Alert.alert(
          isEarly ? '✅ Cash Out Requested' : '✅ Scheduled for Friday',
          isEarly
            ? `${formatCurrency(amount)} UGX → ${mmPhone}\nFee: 1,000 UGX inconvenience fee\nNet: ${formatCurrency(amount - 1000)} UGX`
            : `${formatCurrency(amount)} UGX scheduled for ${wallet?.nextPayoutLabel || 'Friday'}\nNo fee.`
        );
        setShowWithdraw(false);
        loadEarnings();
      } else {
        Alert.alert('Error', data.error || 'Request failed');
      }
    } catch (_) { Alert.alert('Error', 'Could not process request'); }
    finally { setWithdrawLoading(false); }
  };

  if (loading) {
    return (
      <View style={[stw.center, { backgroundColor: theme.canvas }]}>
        <ActivityIndicator size="large" color={BLUE} />
        <Text style={{ marginTop: 12, color: COLORS.textSecondary, fontSize: 14 }}>Loading earnings...</Text>
      </View>
    );
  }

  const today = earnings?.today || {};
  const weekly = earnings?.weekly || {};
  const monthly = earnings?.monthly || {};
  const history = earnings?.history || [];
  const summary = earnings?.summary || {};
  const w = wallet || earnings?.wallet || {};

  return (
    <View style={{ flex: 1, backgroundColor: theme.canvas }}>
      <ScrollView style={{ flex: 1, padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ===== NEXT PAYOUT (like Uber's "Next payout" bar) ===== */}
        {w.nextPayoutLabel && (
          <View style={stw.nextPayout}>
            <View style={{ flex: 1 }}>
              <Text style={stw.nextPayoutLabel}>NEXT AUTO-PAYOUT</Text>
              <Text style={stw.nextPayoutDate}>{w.nextPayoutLabel}</Text>
              {w.scheduledForFriday > 0 && (
                <Text style={stw.nextPayoutAmount}>{displayAmount(w.scheduledForFriday)} scheduled</Text>
              )}
            </View>
            <TouchableOpacity style={stw.payoutBadge} onPress={openWithdraw}>
              <Text style={stw.payoutBadgeText}>Cash Out</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ===== BALANCE CARD ===== */}
        <TouchableOpacity style={stw.balanceCard} onPress={openWithdraw} activeOpacity={0.8}>
          <View style={{ flex: 1 }}>
            <Text style={stw.balanceLabel}>Available Balance</Text>
            <Text style={stw.balanceAmount}>{displayAmount(w.availableBalance || 0)}</Text>
            {w.pendingEarlyWithdrawals > 0 && (
              <Text style={stw.balancePending}>{displayAmount(w.pendingEarlyWithdrawals)} cashing out</Text>
            )}
          </View>
          <View style={stw.balanceArrow}>
            <Text style={{ fontSize: 14, color: '#fff' }}>
              {w.payoutMethod === 'bank' ? '🏦' : '📱'} {'>'}</Text>
          </View>
        </TouchableOpacity>

        {/* ===== TODAY w/ EYE ===== */}
        <View style={stw.todayCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={stw.todayLabel}>💰 Today's Earnings</Text>
            <TouchableOpacity onPress={() => setHideAmounts(!hideAmounts)} hitSlop={12}>
              <Text style={{ fontSize: 22 }}>{hideAmounts ? '👁️‍🗨️' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={stw.todayAmount}>{displayAmount(today.total || 0)}</Text>
          <Text style={stw.todayTrips}>{today.trips || 0} trips today</Text>
        </View>

        {/* ===== WEEKLY / MONTHLY ===== */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          <View style={[stw.summaryCard, { backgroundColor: COLORS.blueBg }]}>
            <Text style={{ fontSize: 24, marginBottom: 4 }}>📅</Text>
            <Text style={stw.summaryLabel}>Weekly</Text>
            <Text style={[stw.summaryAmount, { color: BLUE }]}>{displayAmount(weekly.total || 0)}</Text>
            <Text style={stw.summaryTrips}>{weekly.trips || 0} trips</Text>
          </View>
          <View style={[stw.summaryCard, { backgroundColor: COLORS.greenBg }]}>
            <Text style={{ fontSize: 24, marginBottom: 4 }}>📆</Text>
            <Text style={stw.summaryLabel}>Monthly</Text>
            <Text style={[stw.summaryAmount, { color: COLORS.green }]}>{displayAmount(monthly.total || 0)}</Text>
            <Text style={stw.summaryTrips}>{monthly.trips || 0} trips</Text>
          </View>
        </View>

        {/* ===== LIFETIME ===== */}
        {w.lifetimeEarnings > 0 && (
          <View style={stw.lifetimeCard}>
            <Text style={{ fontSize: 13, color: '#f59e0b', fontWeight: '600' }}>🏆 All-Time Earnings</Text>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 4 }}>{displayAmount(w.lifetimeEarnings)}</Text>
            <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{summary.totalTrips || 0} total trips</Text>
          </View>
        )}

        {/* ===== COMMISSION BREAKDOWN ===== */}
        <View style={stw.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={stw.sectionTitle}>📊 Earnings Breakdown</Text>
            <TouchableOpacity onPress={() => setWeeklyToggle(t => t === 'daily' ? 'weekly' : 'daily')}>
              <Text style={{ fontSize: 13, color: '#3B82F6', fontWeight: '600' }}>{weeklyToggle === 'daily' ? '📅 Weekly' : '📋 Daily'}</Text>
            </TouchableOpacity>
          </View>
          {(() => {
            const grossFare = weeklyToggle === 'daily' ? (today.total || 0) : (weekly.total || 0);
            const commission = Math.round(grossFare * 0.12);
            const cash = Math.round(grossFare * 0.15);
            const net = grossFare - commission - cash;
            return (
              <View>
                <View style={stw.bdRow}><Text style={stw.bdLabel}>Gross Fare Total</Text><Text style={stw.bdValue}>{displayAmount(grossFare)}</Text></View>
                <View style={stw.bdRow}><Text style={[stw.bdLabel, { color: '#ef4444' }]}>PoleSafe Service Fee (12%)</Text><Text style={[stw.bdValue, { color: '#ef4444' }]}>- {displayAmount(commission)}</Text></View>
                <View style={stw.bdRow}><Text style={[stw.bdLabel, { color: '#f59e0b' }]}>Cash Collected in Hand</Text><Text style={[stw.bdValue, { color: '#f59e0b' }]}>- {displayAmount(cash)}</Text></View>
                <View style={[stw.bdDivider]} />
                <View style={stw.bdRow}><Text style={[stw.bdLabel, { fontWeight: '700', color: '#22c55e' }]}>Net Payout Total</Text><Text style={[stw.bdValue, { fontWeight: '800', color: '#22c55e', fontSize: 18 }]}>🟢 {displayAmount(net)}</Text></View>
              </View>
            );
          })()}
        </View>

        {/* ===== BREAKDOWN ===== */}
        <View style={stw.section}>
          <Text style={stw.sectionTitle}>📊 Today's Breakdown</Text>
          <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
            <View style={{ flex: today.schoolEarnings || 1, paddingVertical: 8, alignItems: 'center' }}>
              <Text style={{ fontSize: 24, marginBottom: 4 }}>🏫</Text>
              <Text style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 4 }}>School Routes</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.textPrimary }}>{displayAmount(today.schoolEarnings || 0)}</Text>
            </View>
            <View style={{ width: 1, backgroundColor: '#eee', marginHorizontal: 12 }} />
            <View style={{ flex: today.rideEarnings || 1, paddingVertical: 8, alignItems: 'center' }}>
              <Text style={{ fontSize: 24, marginBottom: 4 }}>🚗</Text>
              <Text style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 4 }}>PoleSafe Ride</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.textPrimary }}>{displayAmount(today.rideEarnings || 0)}</Text>
            </View>
          </View>
        </View>

        {/* ===== PERFORMANCE ===== */}
        <View style={stw.section}>
          <Text style={stw.sectionTitle}>🎯 Performance</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {[
              { emoji: '⭐', label: 'Rating', value: earnings?.rating || '4.8' },
              { emoji: '✅', label: 'Completion', value: `${earnings?.completionRate || '98'}%` },
              { emoji: '🎖️', label: 'Bonus', value: displayAmount(earnings?.bonus || 0), green: true },
            ].map((p, i) => (
              <View key={i} style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 24, marginBottom: 4 }}>{p.emoji}</Text>
                <Text style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 2 }}>{p.label}</Text>
                <Text style={{ fontSize: 18, fontWeight: '700', color: p.green ? COLORS.green : BLUE }}>{p.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ===== PER-TRIP TRANSACTION FEED ===== */}
        <Text style={stw.sectionTitle}>📋 Trip Transactions</Text>
        {transactions.length === 0 ? (
          <View style={stw.emptyCard}><Text style={{ fontSize: 14, color: '#6B7280' }}>No trips yet today</Text></View>
        ) : (
          <View style={stw.historyCard}>
            {transactions.map((trip) => {
              const badge = getPaymentBadge(trip.paymentMethod);
              const breakdown = calculatePayoutBreakdown(trip.fare, trip.paymentMethod, trip.tip);
              return (
                <TouchableOpacity key={trip.id} style={stw.historyRow}
                  onPress={() => { setSelectedTrip({ ...trip, breakdown }); setShowReceipt(true); }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{trip.childName}</Text>
                    <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{trip.school} · {trip.time}</Text>
                    <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                      <View style={stw.paymentBadge}>
                        <Text style={{ fontSize: 10 }}>{badge.emoji}</Text>
                        <Text style={{ fontSize: 9, color: '#374151', marginLeft: 2, fontWeight: '600' }}>{badge.label}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>{displayAmount(trip.fare)}</Text>
                    <Text style={{ fontSize: 10, color: '#6B7280', marginTop: 1 }}>{trip.distance}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ===== CASH OUT BUTTON ===== */}
        <TouchableOpacity style={stw.cashOutBtn} onPress={openWithdraw}>
          <Text style={stw.cashOutText}>💳 Cash Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ===== TRANSACTION RECEIPT MODAL ===== */}
      <Modal visible={showReceipt} animationType="slide" transparent>
        <View style={stw.overlay}>
          <View style={[stw.modalContent, { paddingBottom: 40 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff' }}>🧾 Trip Receipt</Text>
              <TouchableOpacity onPress={() => setShowReceipt(false)}>
                <Text style={{ fontSize: 22, color: '#94a3b8', padding: 4 }}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedTrip && (
              <>
                <View style={stw.receiptHeader}>
                  <Text style={stw.receiptChild}>{selectedTrip.childName}</Text>
                  <Text style={stw.receiptSchool}>{selectedTrip.school} → {selectedTrip.destination}</Text>
                </View>
                <View style={stw.receiptRow}><Text style={stw.receiptLabel}>Distance</Text><Text style={stw.receiptValue}>{selectedTrip.distance}</Text></View>
                <View style={stw.receiptRow}><Text style={stw.receiptLabel}>Duration</Text><Text style={stw.receiptValue}>{selectedTrip.duration}</Text></View>
                <View style={stw.receiptRow}><Text style={stw.receiptLabel}>Payment</Text><Text style={stw.receiptValue}>{getPaymentBadge(selectedTrip.paymentMethod).emoji} {getPaymentBadge(selectedTrip.paymentMethod).label}</Text></View>
                <View style={[stw.bdDivider, { marginVertical: 12, borderBottomColor: '#334155' }]} />
                <View style={stw.receiptRow}><Text style={stw.receiptLabel}>Gross Fare</Text><Text style={stw.receiptValue}>{displayAmount(selectedTrip.breakdown?.grossFare)}</Text></View>
                <View style={stw.receiptRow}><Text style={[stw.receiptLabel, { color: '#ef4444' }]}>Service Fee (12%)</Text><Text style={[stw.receiptValue, { color: '#ef4444' }]}>- {displayAmount(selectedTrip.breakdown?.commission)}</Text></View>
                {selectedTrip.tip > 0 && (
                  <View style={stw.receiptRow}><Text style={[stw.receiptLabel, { color: '#f59e0b' }]}>Driver Tip</Text><Text style={[stw.receiptValue, { color: '#f59e0b' }]}>+ {displayAmount(selectedTrip.tip)}</Text></View>
                )}
                <View style={[stw.bdDivider, { marginVertical: 12, borderBottomColor: '#334155' }]} />
                <View style={stw.receiptRow}><Text style={[stw.receiptLabel, { fontWeight: '700', color: '#22c55e' }]}>Net Earnings</Text><Text style={[stw.receiptValue, { fontWeight: '800', color: '#22c55e', fontSize: 18 }]}>🟢 {displayAmount(selectedTrip.breakdown?.netPayout)}</Text></View>
                <TouchableOpacity
                  style={{ backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 }}
                  onPress={() => setShowReceipt(false)}
                >
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Close Receipt</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ===== WITHDRAWAL MODAL (UBER-STYLE) ===== */}
      <Modal visible={showWithdraw} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={stw.overlay}>
          <View style={stw.modalContent}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff' }}>💳 Cash Out</Text>
              <TouchableOpacity onPress={() => setShowWithdraw(false)}>
                <Text style={{ fontSize: 22, color: '#94a3b8', padding: 4 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 15, color: '#94a3b8', marginBottom: 16 }}>
              Available: <Text style={{ fontWeight: '700', color: BLUE }}>{formatCurrency(w.availableBalance || 0)} UGX</Text>
            </Text>

            {/* Withdrawal type selector */}
            <View style={stw.typeRow}>
              <TouchableOpacity
                style={[stw.typeBtn, withdrawalType === 'scheduled' && stw.typeBtnActive]}
                onPress={() => setWithdrawalType('scheduled')}
              >
                <Text style={stw.typeBtnLabel}>📅</Text>
                <Text style={[stw.typeBtnTitle, withdrawalType === 'scheduled' && { color: '#fff' }]}>Wait for Friday</Text>
                <Text style={[stw.typeBtnFee, withdrawalType === 'scheduled' && { color: '#6ee7b7' }]}>Free</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[stw.typeBtn, withdrawalType === 'early' && stw.typeBtnActive]}
                onPress={() => setWithdrawalType('early')}
              >
                <Text style={stw.typeBtnLabel}>⚡</Text>
                <Text style={[stw.typeBtnTitle, withdrawalType === 'early' && { color: '#fff' }]}>Cash Out Now</Text>
                <Text style={[stw.typeBtnFee, withdrawalType === 'early' && { color: '#fbbf24' }]}>1,000 UGX fee</Text>
              </TouchableOpacity>
            </View>

            {/* Amount input */}
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#cbd5e1', marginBottom: 6, marginTop: 8 }}>Amount (UGX)</Text>
            <TextInput
              style={stw.input}
              placeholder="e.g. 50000"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 16 }}>
              {[10000, 25000, 50000, 100000].map((amt) => (
                <TouchableOpacity key={amt} style={[stw.quickBtn, parseInt(withdrawAmount) === amt && stw.quickBtnActive]}
                  onPress={() => setWithdrawAmount(String(amt))}
                >
                  <Text style={[stw.quickBtnText, parseInt(withdrawAmount) === amt && { color: BLUE }]}>{formatCurrency(amt)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Payout method tabs */}
            <View style={stw.payoutTabRow}>
              <TouchableOpacity style={[stw.payoutTab, payoutTab === 'mobile_money' && stw.payoutTabActive]}
                onPress={() => setPayoutTab('mobile_money')}>
                <Text style={[stw.payoutTabText, payoutTab === 'mobile_money' && { color: '#fff' }]}>📱 Mobile Money</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[stw.payoutTab, payoutTab === 'bank' && stw.payoutTabActive]}
                onPress={() => setPayoutTab('bank')}>
                <Text style={[stw.payoutTabText, payoutTab === 'bank' && { color: '#fff' }]}>🏦 Bank</Text>
              </TouchableOpacity>
            </View>

            {/* Mobile Money fields */}
            {payoutTab === 'mobile_money' && (
              <>
                <Text style={stw.inputLabel}>Mobile Money Number</Text>
                <TextInput style={stw.input} placeholder="e.g. 0772123456" placeholderTextColor="#64748b"
                  keyboardType="phone-pad" value={mmPhone} onChangeText={setMmPhone} />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 8 }}>
                  {['mtn', 'airtel', 'other'].map(net => (
                    <TouchableOpacity key={net} style={[stw.netBtn, mmNetwork === net && stw.netBtnActive]}
                      onPress={() => setMmNetwork(net)}>
                      <Text style={[stw.netBtnText, mmNetwork === net && { color: '#22c55e' }]}>{net.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Bank fields */}
            {payoutTab === 'bank' && (
              <>
                <Text style={stw.inputLabel}>Bank Name</Text>
                <TextInput style={stw.input} placeholder="e.g. Stanbic" placeholderTextColor="#64748b" value={bankName} onChangeText={setBankName} />
                <Text style={stw.inputLabel}>Account Name</Text>
                <TextInput style={stw.input} placeholder="Full account name" placeholderTextColor="#64748b" value={bankAccountName} onChangeText={setBankAccountName} />
                <Text style={stw.inputLabel}>Account Number</Text>
                <TextInput style={stw.input} placeholder="Account number" placeholderTextColor="#64748b" keyboardType="numeric" value={bankAccountNumber} onChangeText={setBankAccountNumber} />
                <Text style={stw.inputLabel}>Branch (optional)</Text>
                <TextInput style={stw.input} placeholder="e.g. Kampala Road" placeholderTextColor="#64748b" value={bankBranch} onChangeText={setBankBranch} />
              </>
            )}

            {/* Fee info */}
            <Text style={{ fontSize: 11, color: '#64748b', textAlign: 'center', marginVertical: 12 }}>
              {withdrawalType === 'early'
                ? '⚡ 1,000 UGX inconvenience fee applies for early cash-out'
                : '📅 Free — auto-paid every Friday'}
            </Text>

            {/* Submit */}
            <TouchableOpacity style={[stw.submitBtn, withdrawLoading && { opacity: 0.6 }]}
              onPress={submitWithdrawal} disabled={withdrawLoading}>
              {withdrawLoading ? <ActivityIndicator color="#fff" /> : (
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                  {withdrawalType === 'early' ? '⚡ Cash Out Now' : '📅 Schedule for Friday'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const COL = COLORS;

const stw = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Next payout bar
  nextPayout: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1e293b', borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#334155',
  },
  nextPayoutLabel: { fontSize: 10, color: '#64748b', fontWeight: '600', letterSpacing: 1 },
  nextPayoutDate: { fontSize: 16, fontWeight: '700', color: '#fff', marginTop: 2 },
  nextPayoutAmount: { fontSize: 12, color: '#f59e0b', marginTop: 2 },
  payoutBadge: { backgroundColor: BLUE, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  payoutBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Balance
  balanceCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#065f46', borderRadius: 14, padding: 16,
    marginBottom: 14, borderLeftWidth: 4, borderLeftColor: '#22c55e',
  },
  balanceLabel: { fontSize: 11, color: '#6ee7b7', fontWeight: '600', letterSpacing: 0.5 },
  balanceAmount: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 2 },
  balancePending: { fontSize: 11, color: '#fbbf24', marginTop: 2 },
  balanceArrow: { paddingLeft: 12 },

  // Today
  todayCard: { backgroundColor: BLUE, borderRadius: 16, padding: 24, marginBottom: 14, elevation: 4 },
  todayLabel: { fontSize: 13, color: '#BBDEFB', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 },
  todayAmount: { fontSize: 40, fontWeight: '800', color: '#fff', marginTop: 6 },
  todayTrips: { fontSize: 14, color: '#BBDEFB', marginTop: 4 },

  // Summary
  summaryCard: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  summaryLabel: { fontSize: 13, fontWeight: '500', color: COL.textSecondary },
  summaryAmount: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  summaryTrips: { fontSize: 11, color: COL.textMuted, marginTop: 2 },

  // Lifetime
  lifetimeCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 14, alignItems: 'center', borderWidth: 1, borderColor: '#f59e0b' },

  // Section
  section: { backgroundColor: COL.surface, borderRadius: 12, padding: 16, marginBottom: 14, elevation: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COL.textPrimary, marginBottom: 12 },

  historyCard: { backgroundColor: COL.surface, borderRadius: 12, marginBottom: 14, elevation: 1 },
  historyRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  emptyCard: { backgroundColor: COL.surface, borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 14, elevation: 1 },

  // Cash Out button
  cashOutBtn: { backgroundColor: BLUE, padding: 18, borderRadius: 14, alignItems: 'center' },
  cashOutText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },

  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#0f172a', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  typeBtnActive: { borderColor: BLUE, backgroundColor: `${BLUE}22` },
  typeBtnLabel: { fontSize: 24, marginBottom: 4 },
  typeBtnTitle: { fontSize: 13, fontWeight: '700', color: '#94a3b8' },
  typeBtnFee: { fontSize: 11, fontWeight: '600', color: '#64748b', marginTop: 2 },

  inputLabel: { fontSize: 13, fontWeight: '600', color: '#cbd5e1', marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: '#0f172a', borderRadius: 10, padding: 14, fontSize: 18, fontWeight: '600', color: '#fff', borderWidth: 1, borderColor: '#334155' },

  quickBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#0f172a', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  quickBtnActive: { borderColor: BLUE, backgroundColor: `${BLUE}22` },
  quickBtnText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },

  netBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#0f172a', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  netBtnActive: { borderColor: '#22c55e', backgroundColor: '#22c55e22' },
  netBtnText: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },

  payoutTabRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  payoutTab: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#0f172a', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  payoutTabActive: { borderColor: BLUE, backgroundColor: `${BLUE}22` },
  payoutTabText: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },

  submitBtn: { backgroundColor: BLUE, padding: 16, borderRadius: 12, alignItems: 'center' },

  // Breakdown styles
  bdRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  bdLabel: { fontSize: 14, color: '#374151' },
  bdValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  bdDivider: { borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginVertical: 6 },

  // Payment badge
  paymentBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },

  // Receipt modal
  receiptHeader: { alignItems: 'center', marginBottom: 16 },
  receiptChild: { fontSize: 18, fontWeight: '700', color: '#fff' },
  receiptSchool: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  receiptLabel: { fontSize: 14, color: '#94a3b8' },
  receiptValue: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
