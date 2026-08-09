// PoleSafe Mobile — Driver Dashboard
// Shows today's route, toggle for ride mode, earnings summary

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://api.polesafe.ug';

export default function DriverDashboard({ navigation }) {
  const [route, setRoute] = useState(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => { loadRoute(); }, []);
  const onRefresh = async () => { setRefreshing(true); await loadRoute(); setRefreshing(false); };

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
    scheduled: '#FFA726',
    en_route: '#42A5F5',
    picked_up: '#66BB6A',
    dropped_off: '#AB47BC',
    gate_confirmed: '#2E7D32',
    cancelled: '#EF5350',
    completed: '#2E7D32',
  };
  return colors[status] || '#999';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  availableCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, justifyContent: 'center' },
  on: { backgroundColor: '#E8F5E9' },
  off: { backgroundColor: '#FFEBEE' },
  toggleIcon: { fontSize: 24, marginRight: 8 },
  toggleText: { fontSize: 16, fontWeight: '600' },
  toggleHint: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 8 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center', elevation: 1 },
  statNumber: { fontSize: 28, fontWeight: '700', color: '#1565C0' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#333' },
  stopGroup: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 },
  stopGroupTitle: { fontSize: 15, fontWeight: '600', marginBottom: 10, color: '#1565C0' },
  stopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  stopNum: { fontSize: 14, fontWeight: '600', color: '#999', width: 24 },
  stopInfo: { flex: 1 },
  stopName: { fontSize: 15, fontWeight: '500' },
  stopTime: { fontSize: 12, color: '#666' },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  gapCard: { backgroundColor: '#E3F2FD', borderRadius: 12, padding: 16, marginBottom: 12 },
  gapTitle: { fontSize: 15, fontWeight: '600', marginBottom: 8, color: '#1565C0' },
  gapText: { fontSize: 13, color: '#333', marginBottom: 4 },
  routeBtn: { backgroundColor: '#1565C0', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  routeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  earningsBtn: { backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1565C0' },
  earningsBtnText: { color: '#1565C0', fontSize: 16, fontWeight: '600' },
});
