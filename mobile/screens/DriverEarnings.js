// PoleSafe Mobile — Driver Earnings Screen
// Earnings dashboard with today, weekly, monthly totals and breakdown

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_BASE from '../config';
const BLUE = '#1565C0';

export default function DriverEarnings({ navigation }) {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      } else {
        // Set demo data if API unavailable
        setEarnings({
          today: { total: 45000, trips: 4, schoolEarnings: 35000, rideEarnings: 10000 },
          weekly: { total: 285000, trips: 22 },
          monthly: { total: 1250000, trips: 98 },
          history: [
            { date: new Date().toISOString(), trips: 4, earnings: 45000, type: 'school' },
            { date: new Date(Date.now() - 86400000).toISOString(), trips: 5, earnings: 52000, type: 'school' },
            { date: new Date(Date.now() - 172800000).toISOString(), trips: 3, earnings: 38000, type: 'school' },
            { date: new Date(Date.now() - 259200000).toISOString(), trips: 6, earnings: 48000, type: 'ride' },
            { date: new Date(Date.now() - 345600000).toISOString(), trips: 4, earnings: 42000, type: 'school' },
          ],
        });
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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={BLUE} />
        <Text style={styles.loadingText}>Loading earnings...</Text>
      </View>
    );
  }

  const today = earnings?.today || {};
  const weekly = earnings?.weekly || {};
  const monthly = earnings?.monthly || {};
  const history = earnings?.history || [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Today's Earnings */}
      <View style={styles.todayCard}>
        <Text style={styles.todayLabel}>💰 Today's Earnings</Text>
        <Text style={styles.todayAmount}>{formatCurrency(today.total || 0)} UGX</Text>
        <Text style={styles.todayTrips}>{today.trips || 0} trips today</Text>
      </View>

      {/* Weekly / Monthly Summary */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#E3F2FD' }]}>
          <Text style={styles.summaryIcon}>📅</Text>
          <Text style={styles.summaryLabel}>Weekly</Text>
          <Text style={[styles.summaryAmount, { color: BLUE }]}>
            {formatCurrency(weekly.total || 0)} UGX
          </Text>
          <Text style={styles.summaryTrips}>{weekly.trips || 0} trips</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}>
          <Text style={styles.summaryIcon}>📆</Text>
          <Text style={styles.summaryLabel}>Monthly</Text>
          <Text style={[styles.summaryAmount, { color: '#2E7D32' }]}>
            {formatCurrency(monthly.total || 0)} UGX
          </Text>
          <Text style={styles.summaryTrips}>{monthly.trips || 0} trips</Text>
        </View>
      </View>

      {/* Earnings Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Earnings Breakdown</Text>
        <View style={styles.breakdownRow}>
          <View style={[styles.breakdownBar, { flex: today.schoolEarnings || 1 }]}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownIcon}>🏫</Text>
              <Text style={styles.breakdownLabel}>School Routes</Text>
              <Text style={styles.breakdownAmount}>
                {formatCurrency(today.schoolEarnings || 0)} UGX
              </Text>
            </View>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={[styles.breakdownBar, { flex: today.rideEarnings || 1 }]}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownIcon}>🚗</Text>
              <Text style={styles.breakdownLabel}>PoleSafe Ride</Text>
              <Text style={styles.breakdownAmount}>
                {formatCurrency(today.rideEarnings || 0)} UGX
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tips / Bonuses */}
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
            <Text style={[styles.perfValue, { color: '#2E7D32' }]}>
              {formatCurrency(earnings?.bonus || 0)} UGX
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
                  {formatCurrency(trip.earnings)} UGX
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Withdraw */}
      <TouchableOpacity style={styles.withdrawBtn}
        onPress={() => Alert.alert('Coming Soon', 'Withdrawal to mobile money coming next week!')}
      >
        <Text style={styles.withdrawBtnText}>💳 Withdraw Earnings</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 14 },

  // Today
  todayCard: { backgroundColor: BLUE, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 14, elevation: 4 },
  todayLabel: { fontSize: 13, color: '#BBDEFB', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 },
  todayAmount: { fontSize: 40, fontWeight: '800', color: '#fff', marginTop: 6 },
  todayTrips: { fontSize: 14, color: '#BBDEFB', marginTop: 4 },

  // Summary
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  summaryCard: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  summaryIcon: { fontSize: 24, marginBottom: 4 },
  summaryLabel: { fontSize: 13, fontWeight: '500', color: '#666' },
  summaryAmount: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  summaryTrips: { fontSize: 11, color: '#999', marginTop: 2 },

  // Section
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 14, elevation: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 },

  // Breakdown
  breakdownRow: { flexDirection: 'row', alignItems: 'stretch' },
  breakdownBar: { paddingVertical: 8 },
  breakdownDivider: { width: 1, backgroundColor: '#eee', marginHorizontal: 12 },
  breakdownItem: { alignItems: 'center' },
  breakdownIcon: { fontSize: 24, marginBottom: 4 },
  breakdownLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
  breakdownAmount: { fontSize: 16, fontWeight: '700', color: '#333' },

  // Performance
  perfRow: { flexDirection: 'row', justifyContent: 'space-around' },
  perfBox: { alignItems: 'center' },
  perfEmoji: { fontSize: 24, marginBottom: 4 },
  perfLabel: { fontSize: 12, color: '#999', marginBottom: 2 },
  perfValue: { fontSize: 18, fontWeight: '700', color: BLUE },

  // History
  historyCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 14, elevation: 1 },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  historyLeft: { flex: 1 },
  historyDate: { fontSize: 13, fontWeight: '500', color: '#333' },
  historyType: { marginTop: 2 },
  historyTypeText: { fontSize: 11, color: '#999' },
  historyMiddle: { marginHorizontal: 12 },
  historyTrips: { fontSize: 13, color: '#666' },
  historyEarnings: { fontSize: 15, fontWeight: '700', color: '#333' },

  // Empty
  emptyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 14, elevation: 1 },
  emptyText: { fontSize: 14, color: '#999' },

  // Withdraw
  withdrawBtn: { backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: BLUE },
  withdrawBtnText: { color: BLUE, fontSize: 16, fontWeight: '600' },
});
