// PoleSafe Mobile — Parent Track Screen
// Real-time ride tracking with driver info, status timeline, and ETA

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StatusBadge from '../components/StatusBadge';

import API_BASE from '../config';

/**
 * Timeline steps for a school ride
 */
const TIMELINE_STEPS = [
  { key: 'scheduled', label: 'Scheduled', emoji: '📅' },
  { key: 'en_route', label: 'Driver En Route', emoji: '🚗' },
  { key: 'picked_up', label: 'Kid Picked Up', emoji: '👧' },
  { key: 'dropped_off', label: 'Arrived at School', emoji: '📍' },
  { key: 'gate_confirmed', label: 'Gate Confirmed', emoji: '✅' },
];

export default function ParentTrack({ navigation, route }) {
  const rideId = route?.params?.rideId;
  const [ride, setRide] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchRideData = useCallback(async () => {
    if (!rideId) return;
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API_BASE}/api/rides/${rideId}/track`, { headers });
      if (!res.ok) throw new Error('Failed to load ride');
      const data = await res.json();
      setRide(data.ride || data);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [rideId]);

  const fetchDriverLocation = useCallback(async () => {
    if (!rideId) return;
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API_BASE}/api/tracking/${rideId}/location`, { headers });
      if (res.ok) {
        const data = await res.json();
        setDriverLocation(data);
      }
    } catch {
      // Silent — location polling is best-effort
    }
  }, [rideId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchRideData();
      setLoading(false);
    };
    init();
  }, [fetchRideData]);

  // Poll every 10 seconds for driver location and ride updates
  useEffect(() => {
    if (!rideId) return;
    const interval = setInterval(async () => {
      await Promise.all([fetchRideData(), fetchDriverLocation()]);
    }, 10000);
    return () => clearInterval(interval);
  }, [rideId, fetchRideData, fetchDriverLocation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchRideData(), fetchDriverLocation()]);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading ride details...</Text>
      </View>
    );
  }

  if (error && !ride) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>😕</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchRideData}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>🚗</Text>
        <Text style={styles.emptyText}>No ride selected</Text>
      </View>
    );
  }

  const driverInfo = ride.driverId || ride.driver;
  const childInfo = ride.childId || ride.child;
  const status = ride.status || 'scheduled';
  const currentStepIndex = TIMELINE_STEPS.findIndex((s) => s.key === status);

  // Calculate ETA if we have driver location
  const etaText = driverLocation?.eta
    ? `~${driverLocation.eta} min away`
    : status === 'en_route'
      ? 'Calculating...'
      : status === 'picked_up'
        ? 'En route to destination'
        : '—';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapEmoji}>🗺️</Text>
        <Text style={styles.mapTitle}>Live Map</Text>
        <Text style={styles.mapSub}>Real-time GPS tracking</Text>
        {driverLocation && (
          <View style={styles.coordBox}>
            <Text style={styles.coordText}>
              📍 {driverLocation.latitude?.toFixed(4)}, {driverLocation.longitude?.toFixed(4)}
            </Text>
          </View>
        )}
        <View style={styles.etaBox}>
          <Text style={styles.etaLabel}>Estimated Arrival</Text>
          <Text style={styles.etaValue}>{etaText}</Text>
        </View>
      </View>

      {/* Driver Info Card */}
      <View style={styles.driverCard}>
        <Text style={styles.cardTitle}>🚘 Driver</Text>
        <View style={styles.driverInfoRow}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverAvatarText}>
              {driverInfo?.name?.charAt(0) || 'D'}
            </Text>
          </View>
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>
              {driverInfo?.name || 'Assigning driver...'}
            </Text>
            <Text style={styles.driverPhone}>
              📞 {driverInfo?.phone || '—'}
            </Text>
            <Text style={styles.driverVehicle}>
              🚗 {ride.vehicleType || 'School vehicle'}
            </Text>
          </View>
        </View>
      </View>

      {/* Kid Info */}
      <View style={styles.kidCard}>
        <Text style={styles.cardTitle}>👦 Kid</Text>
        <View style={styles.kidRow}>
          <View style={styles.kidAvatar}>
            <Text style={styles.kidAvatarText}>
              {childInfo?.name?.charAt(0) || 'K'}
            </Text>
          </View>
          <View style={styles.kidInfo}>
            <Text style={styles.kidName}>{childInfo?.name || 'Unknown'}</Text>
            <Text style={styles.kidSchool}>
              🏫 {childInfo?.school?.name || ride.schoolName || 'School'}
            </Text>
          </View>
          <StatusBadge status={status} size="md" />
        </View>
      </View>

      {/* Ride Info */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ride Type</Text>
          <Text style={styles.infoValue}>
            {ride.type === 'morning' ? '🌅 Morning Drop-off' : '🌇 Afternoon Pickup'}
          </Text>
        </View>
        {ride.scheduledPickupTime && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Scheduled</Text>
            <Text style={styles.infoValue}>
              {new Date(ride.scheduledPickupTime).toLocaleTimeString('en-UG', {
                hour: '2-digit', minute: '2-digit',
              })}
            </Text>
          </View>
        )}
        {ride.pickupLocation && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pickup</Text>
            <Text style={styles.infoValue}>{ride.pickupLocation}</Text>
          </View>
        )}
        {ride.dropoffLocation && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dropoff</Text>
            <Text style={styles.infoValue}>{ride.dropoffLocation}</Text>
          </View>
        )}
      </View>

      {/* Status Timeline */}
      <View style={styles.timelineCard}>
        <Text style={styles.cardTitle}>📋 Ride Status</Text>
        {TIMELINE_STEPS.map((step, idx) => {
          const isCompleted = idx <= currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          return (
            <View key={step.key} style={styles.timelineStep}>
              <View style={styles.timelineLeft}>
                <View
                  style={[
                    styles.timelineDot,
                    isCompleted && styles.timelineDotCompleted,
                    isCurrent && styles.timelineDotCurrent,
                  ]}
                />
                {idx < TIMELINE_STEPS.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      isCompleted && styles.timelineLineCompleted,
                    ]}
                  />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text
                  style={[
                    styles.timelineLabel,
                    isCompleted && styles.timelineLabelCompleted,
                    isCurrent && styles.timelineLabelCurrent,
                  ]}
                >
                  {step.emoji} {step.label}
                </Text>
                {isCurrent && (
                  <Text style={styles.timelineCurrent}>Current</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Contact Driver */}
      <TouchableOpacity style={styles.contactBtn}>
        <Text style={styles.contactBtnText}>📞 Call Driver</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 32 },
  loadingText: { marginTop: 12, color: '#666', fontSize: 14 },
  errorIcon: { fontSize: 48, marginBottom: 12 },
  errorText: { fontSize: 15, color: '#C62828', textAlign: 'center', marginBottom: 16 },
  emptyText: { fontSize: 15, color: '#999', textAlign: 'center' },
  retryBtn: { backgroundColor: '#2E7D32', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },

  // Map Placeholder
  mapPlaceholder: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#C8E6C9',
    borderStyle: 'dashed',
  },
  mapEmoji: { fontSize: 48, marginBottom: 8 },
  mapTitle: { fontSize: 18, fontWeight: '700', color: '#2E7D32' },
  mapSub: { fontSize: 12, color: '#666', marginBottom: 12 },
  coordBox: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 8 },
  coordText: { fontSize: 12, color: '#555', fontFamily: Platform?.OS === 'ios' ? 'Menlo' : 'monospace' },
  etaBox: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  etaLabel: { fontSize: 11, color: '#999', textAlign: 'center' },
  etaValue: { fontSize: 18, fontWeight: '800', color: '#2E7D32', textAlign: 'center' },

  // Driver Card
  driverCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#999', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  driverInfoRow: { flexDirection: 'row', alignItems: 'center' },
  driverAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1565C0', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  driverAvatarText: { fontSize: 22, color: '#fff', fontWeight: '700' },
  driverDetails: { flex: 1 },
  driverName: { fontSize: 17, fontWeight: '700', color: '#333' },
  driverPhone: { fontSize: 13, color: '#1565C0', marginTop: 2 },
  driverVehicle: { fontSize: 13, color: '#666', marginTop: 2 },

  // Kid Card
  kidCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 },
  kidRow: { flexDirection: 'row', alignItems: 'center' },
  kidAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2E7D32', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  kidAvatarText: { fontSize: 18, color: '#fff', fontWeight: '700' },
  kidInfo: { flex: 1 },
  kidName: { fontSize: 16, fontWeight: '600' },
  kidSchool: { fontSize: 12, color: '#666', marginTop: 2 },

  // Info Card
  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  infoLabel: { fontSize: 13, color: '#999' },
  infoValue: { fontSize: 13, fontWeight: '500', color: '#333', maxWidth: '60%', textAlign: 'right' },

  // Timeline
  timelineCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 },
  timelineStep: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 44 },
  timelineLeft: { alignItems: 'center', width: 24, marginRight: 12 },
  timelineDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#e0e0e0', marginTop: 4 },
  timelineDotCompleted: { backgroundColor: '#2E7D32' },
  timelineDotCurrent: { backgroundColor: '#2E7D32', width: 18, height: 18, borderRadius: 9, marginTop: 2 },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#e0e0e0', marginVertical: 2 },
  timelineLineCompleted: { backgroundColor: '#2E7D32' },
  timelineContent: { flex: 1, paddingBottom: 8 },
  timelineLabel: { fontSize: 14, color: '#bbb', fontWeight: '500' },
  timelineLabelCompleted: { color: '#333' },
  timelineLabelCurrent: { color: '#2E7D32', fontWeight: '700' },
  timelineCurrent: { fontSize: 11, color: '#2E7D32', fontWeight: '600', marginTop: 2 },

  // Contact
  contactBtn: { backgroundColor: '#2E7D32', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  contactBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
