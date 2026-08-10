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
      <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
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
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* Availability Toggle */}
      <View style={styles.availableCard}>
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
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{totalRides}</Text>
          <Text style={styles.statLabel}>AM Drop-offs</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{afternoonRides}</Text>
          <Text style={styles.statLabel}>PM Pickups</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{gapCount}</Text>
          <Text style={styles.statLabel}>Ride Gaps</Text>
        </View>
      </View>

      {/* Today's Schedule */}
      <Text style={styles.sectionTitle}>🗓️ Today's Schedule</Text>

      {route?.morningStops?.length > 0 && (
        <View style={styles.stopGroup}>
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
        </View>
      )}

      {route?.afternoonStops?.length > 0 && (
        <View style={styles.stopGroup}>
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
        </View>
      )}

      {/* Gap Time Info */}
      {route?.gaps?.length > 0 && (
        <View style={styles.gapCard}>
          <Text style={styles.gapTitle}>⏱️ Ride Mode Windows</Text>
          {route.gaps.map((gap, i) => (
            <Text key={i} style={styles.gapText}>
              {gap.from?.substring(11, 16)} → {gap.to?.substring(11, 16)} ({Math.round(gap.minutes)} min)
              {gap.minutes >= 30 ? ' 🚗 Can take rides' : ''}
            </Text>
          ))}
        </View>
      )}

      {/* View Full Route */}
      <TouchableOpacity style={styles.routeBtn} onPress={() => navigation.navigate('Route')}>
        <Text style={styles.routeBtnText}>🗺️ View Full Route</Text>
      </TouchableOpacity>

      {/* View Earnings */}
      <TouchableOpacity style={styles.earningsBtn} onPress={() => navigation.navigate('Earnings')}>
        <Text style={styles.earningsBtnText}>💰 View Earnings</Text>
      </TouchableOpacity>

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
  availableCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, justifyContent: 'center' },
  on: { backgroundColor: COLORS.greenBg },
  off: { backgroundColor: COLORS.redBg },
  toggleIcon: { fontSize: 24, marginRight: 8 },
  toggleText: { fontSize: 16, fontWeight: '600' },
  toggleHint: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginTop: 8 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, alignItems: 'center', elevation: 1 },
  statNumber: { fontSize: 28, fontWeight: '700', color: COLORS.blue },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: COLORS.textPrimary },
  stopGroup: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 },
  stopGroupTitle: { fontSize: 15, fontWeight: '600', marginBottom: 10, color: COLORS.blue },
  stopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  stopNum: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted, width: 24 },
  stopInfo: { flex: 1 },
  stopName: { fontSize: 15, fontWeight: '500' },
  stopTime: { fontSize: 12, color: COLORS.textSecondary },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  gapCard: { backgroundColor: COLORS.blueBg, borderRadius: 12, padding: 16, marginBottom: 12 },
  gapTitle: { fontSize: 15, fontWeight: '600', marginBottom: 8, color: COLORS.blue },
  gapText: { fontSize: 13, color: COLORS.textPrimary, marginBottom: 4 },
  routeBtn: { backgroundColor: COLORS.blue, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  routeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  earningsBtn: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.blue },
  earningsBtnText: { color: COLORS.blue, fontSize: 16, fontWeight: '600' },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 15, color: COLORS.textSecondary },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20, lineHeight: 20, paddingHorizontal: 20 },
});
