// PoleSafe Mobile — Driver Dashboard
// Shows today's route, toggle for ride mode, earnings summary

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_BASE from '../config';
import { COLORS, getTheme, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
const API_URL = API_BASE;

export default function DriverDashboard({ navigation }) {
  const theme = getTheme();
  const [route, setRoute] = useState(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadRoute = async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const res = await fetch(`${API_URL}/api/drivers/route`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRoute(data);
    } catch (err) {
      console.log('Error loading route:', err);
    }
  };

  useEffect(() => { setLoading(true); loadRoute().finally(() => setLoading(false)); }, []);
  const onRefresh = async () => { setRefreshing(true); await loadRoute(); setRefreshing(false); };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading your route...</Text>
      </View>
    );
  }

  if (!loading && !route) {
    return (
      <ScrollView style={[styles.container, {backgroundColor: theme.canvas}]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={[styles.center, { paddingTop: 80 }]}>
          <Text style={styles.emptyIcon}>🚗</Text>
          <Text style={styles.emptyTitle}>No Route Today</Text>
          <Text style={styles.emptyText}>You have no rides scheduled for today. Check back later or toggle availability for PoleSafe Ride requests.</Text>
        </View>
      </ScrollView>
    );
  }

  const totalRides = route?.morningStops?.length || 0;
  const afternoonRides = route?.afternoonStops?.length || 0;
  const gapCount = route?.gaps?.length || 0;

  return (
    <ScrollView style={[styles.container, {backgroundColor: theme.canvas}]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* Availability Toggle */}
      <GlassCard style={styles.availableCard}>
        <TouchableOpacity
          style={[styles.toggleBtn, isAvailable ? styles.on : styles.off]}
          onPress={() => setIsAvailable(!isAvailable)}
        >
          <Text style={styles.toggleIcon}>{isAvailable ? '🟢' : '🔴'}</Text>
          <Text style={styles.toggleText}>
            {isAvailable ? 'Available for Rides' : 'Not Available'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.toggleHint}>
          {isAvailable
            ? 'Parents can book you for PoleSafe Ride trips'
            : 'Tap to accept ride requests between school runs'}
        </Text>
      </GlassCard>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <GlassCard style={styles.statBox}>
          <Text style={styles.statNumber}>{totalRides}</Text>
          <Text style={styles.statLabel}>AM Drop-offs</Text>
        </GlassCard>
        <GlassCard style={styles.statBox}>
          <Text style={styles.statNumber}>{afternoonRides}</Text>
          <Text style={styles.statLabel}>PM Pickups</Text>
        </GlassCard>
        <GlassCard style={styles.statBox}>
          <Text style={styles.statNumber}>{gapCount}</Text>
          <Text style={styles.statLabel}>Ride Gaps</Text>
        </GlassCard>
      </View>

      {/* Today's Schedule */}
      <Text style={styles.sectionTitle}>🗓️ Today's Schedule</Text>

      {route?.morningStops?.length > 0 && (
        <GlassCard style={styles.stopGroup}>
          <Text style={styles.stopGroupTitle}>🌅 Morning Drop-offs</Text>
          {route.morningStops.map((stop, i) => (
            <View key={stop._id} style={styles.stopRow}>
              <Text style={styles.stopNum}>{i + 1}.</Text>
              <View style={styles.stopInfo}>
                <Text style={styles.stopName}>{stop.childId?.name || 'Unknown'}</Text>
                <Text style={styles.stopTime}>
                  {new Date(stop.scheduledPickupTime).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(stop.status) }]} />
            </View>
          ))}
        </GlassCard>
      )}

      {route?.afternoonStops?.length > 0 && (
        <GlassCard style={styles.stopGroup}>
          <Text style={styles.stopGroupTitle}>🌇 Afternoon Pickups</Text>
          {route.afternoonStops.map((stop, i) => (
            <View key={stop._id} style={styles.stopRow}>
              <Text style={styles.stopNum}>{i + 1}.</Text>
              <View style={styles.stopInfo}>
                <Text style={styles.stopName}>{stop.childId?.name || 'Unknown'}</Text>
                <Text style={styles.stopTime}>
                  {new Date(stop.scheduledPickupTime).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(stop.status) }]} />
            </View>
          ))}
        </GlassCard>
      )}

      {/* Gap Time Info */}
      {route?.gaps?.length > 0 && (
        <GlassCard style={styles.gapCard}>
          <Text style={styles.gapTitle}>⏱️ Ride Mode Windows</Text>
          {route.gaps.map((gap, i) => (
            <Text key={i} style={styles.gapText}>
              {gap.from?.substring(11, 16)} → {gap.to?.substring(11, 16)} ({Math.round(gap.minutes)} min)
              {gap.minutes >= 30 ? ' 🚗 Can take rides' : ''}
            </Text>
          ))}
        </GlassCard>
      )}

      {/* View Full Route */}
      <PrimaryButton title="🗺️ View Full Route" onPress={() => navigation.navigate('Route')} variant="primary" />

      {/* View Earnings */}
      <PrimaryButton title="💰 View Earnings" onPress={() => navigation.navigate('Earnings')} variant="secondary" />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function getStatusColor(status) {
  const colors = {
    scheduled: COLORS.orangeLight,
    en_route: COLORS.blueLight,
    picked_up: '#66BB6A',
    dropped_off: '#AB47BC',
    gate_confirmed: COLORS.green,
    cancelled: '#EF5350',
    completed: COLORS.green,
  };
  return colors[status] || '#999';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas, padding: 16 },
  availableCard: { padding: 16, marginBottom: 16 }, // layout only — GlassCard handles styling
  toggleBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, justifyContent: 'center' },
  on: { backgroundColor: COLORS.greenBg },
  off: { backgroundColor: COLORS.redBg },
  toggleIcon: { fontSize: 24, marginRight: 8 },
  toggleText: { fontSize: 16, fontWeight: '600' },
  toggleHint: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginTop: 8 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statBox: { flex: 1, padding: 16, alignItems: 'center' }, // layout only — GlassCard handles styling
  statNumber: { fontSize: 28, fontWeight: '700', color: COLORS.blue },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: COLORS.textPrimary },
  stopGroup: { padding: 16, marginBottom: 12 }, // layout only — GlassCard handles styling
  stopGroupTitle: { fontSize: 15, fontWeight: '600', marginBottom: 10, color: COLORS.blue },
  stopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  stopNum: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted, width: 24 },
  stopInfo: { flex: 1 },
  stopName: { fontSize: 15, fontWeight: '500' },
  stopTime: { fontSize: 12, color: COLORS.textSecondary },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  gapCard: { padding: 16, marginBottom: 12 }, // layout only — GlassCard handles styling
  gapTitle: { fontSize: 15, fontWeight: '600', marginBottom: 8, color: COLORS.blue },
  gapText: { fontSize: 13, color: COLORS.textPrimary, marginBottom: 4 },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 15, color: COLORS.textSecondary },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20, lineHeight: 20, paddingHorizontal: 20 },
});
