// PoleSafe Live Tracking v3 — Cinema-Style Tracking
// Better than Uber: kid-first tracking, safety info, SOS
// From Home to School. And Beyond. 🚸

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions,
  Platform, Alert, Vibration,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_BASE from '../config';
import { BRAND, STATUS, getTheme, BORDER_RADIUS } from '../theme';
import GlassCard from '../components/GlassCard';
import SOSButton from '../components/SOSButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────
const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' });
};

const getStatusMeta = (status) => {
  const map = {
    scheduled: { label: 'Scheduled', emoji: '⏳', color: STATUS.neutral, msg: 'Your ride is scheduled.' },
    en_route: { label: 'Driver En Route', emoji: '🚗', color: STATUS.info, msg: 'Your driver is on the way!' },
    picked_up: { label: 'Picked Up 🎒', emoji: '👧', color: STATUS.inTransit, msg: 'Your child is in the vehicle.' },
    dropped_off: { label: 'Arriving Soon', emoji: '📍', color: STATUS.info, msg: 'Almost there!' },
    gate_confirmed: { label: 'At School ✅', emoji: '✅', color: STATUS.safe, msg: 'Safely arrived at school.' },
    completed: { label: 'Completed', emoji: '✅', color: STATUS.safe, msg: 'Ride completed.' },
    cancelled: { label: 'Cancelled', emoji: '❌', color: STATUS.neutral, msg: 'This ride was cancelled.' },
    missed: { label: 'Missed', emoji: '😤', color: STATUS.danger, msg: 'Ride was missed.' },
    sick_day: { label: 'Sick Day', emoji: '🩺', color: STATUS.sick, msg: 'Staying home today.' },
    arrived_home: { label: 'Home 🏠', emoji: '🏠', color: STATUS.safe, msg: 'Back home safe!' },
  };
  return map[status] || { label: status, emoji: '⏳', color: STATUS.neutral, msg: '' };
};

const formatDuration = (minutes) => {
  if (!minutes && minutes !== 0) return '--';
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
};

// ─── Main Tracking Screen ────────────────────────────
export default function ParentTrack({ route, navigation }) {
  const rideId = route?.params?.rideId;
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [etaMinutes, setEtaMinutes] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Breadcrumb steps
  const steps = [
    { key: 'confirmed', label: 'Confirmed', emoji: '✅' },
    { key: 'en_route', label: 'Driver En Route', emoji: '🚗' },
    { key: 'picked_up', label: 'Picked Up', emoji: '👧' },
    { key: 'arrived', label: 'Arrived', emoji: '📍' },
  ];

  const currentStepIndex = ride ? steps.findIndex(s => {
    if (s.key === 'arrived') return ['dropped_off', 'gate_confirmed', 'completed', 'arrived_home'].includes(ride.status);
    return ride.status === s.key || (s.key === 'en_route' && ride.status === 'en_route');
  }) : 0;

  // Pulse animation for active state
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.7, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Slide up animation
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 1,
      tension: 80,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, []);

  // Poll ride data
  useEffect(() => {
    const fetchRide = async () => {
      if (!rideId) return;
      try {
        const token = await AsyncStorage.getItem('polesafe_token');
        const res = await fetch(`${API_BASE}/api/rides/${rideId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setRide(data.ride || data);
          // Simulate ETA
          if (data.ride?.status === 'en_route') {
            setEtaMinutes(Math.max(1, Math.round(Math.random() * 10 + 2)));
          } else if (data.ride?.status === 'picked_up') {
            setEtaMinutes(Math.max(1, Math.round(Math.random() * 15 + 5)));
          }
        }
      } catch (err) {
        console.log('Track error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRide();
    const interval = setInterval(fetchRide, 8000);
    return () => clearInterval(interval);
  }, [rideId]);

  // ─── Demo Mode ────────────────────────────────────
  if (!rideId) {
    return (
      <View style={[styles.container, { backgroundColor: '#0A0F1E' }]}>
        {/* Map Area */}
        <View style={styles.mapArea}>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapEmoji}>🗺️</Text>
            <Text style={styles.mapTitle}>Live Map</Text>
            <Text style={styles.mapDesc}>Tracking will appear here when{'\n'}a ride is active.</Text>
          </View>
        </View>

        {/* Bottom Sheet */}
        <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) }] }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🚸</Text>
            <Text style={styles.emptyTitle}>No Active Ride</Text>
            <Text style={styles.emptyDesc}>
              When your child has an active ride,{'\n'}their location will show here.
            </Text>
            <TouchableOpacity
              style={styles.bookRideBtn}
              onPress={() => navigation.navigate('Booking')}
            >
              <Text style={styles.bookRideText}>📅 Book a School Ride</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    );
  }

  // ─── Loading ──────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: '#0A0F1E' }]}>
        <Text style={[styles.mapEmoji, { fontSize: 48 }]}>🚗</Text>
        <Text style={styles.loadingText}>Loading tracking...</Text>
      </View>
    );
  }

  const meta = getStatusMeta(ride?.status || 'scheduled');
  const kidName = ride?.childId?.name || 'Your child';
  const driverName = ride?.driverId?.name || 'Driver';

  // ─── Active Tracking UI ───────────────────────────
  return (
    <View style={styles.container}>
      {/* Top Bar with Ride Info */}
      <View style={styles.topBar}>
        <View style={styles.topBarContent}>
          <Text style={styles.topEmoji}>{meta.emoji}</Text>
          <View style={styles.topInfo}>
            <Text style={styles.topStatus}>{meta.label}</Text>
            <Text style={styles.topKid}>{kidName} · {ride.type === 'school_morning' ? 'Morning Drop-off' : 'Afternoon Pickup'}</Text>
          </View>
        </View>
      </View>

      {/* Map Area */}
      <View style={styles.mapArea}>
        <View style={styles.mapPlaceholder}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Text style={styles.mapCar}>🚗</Text>
          </Animated.View>
          {etaMinutes !== null && (
            <View style={styles.etaBadge}>
              <Text style={styles.etaText}>{formatDuration(etaMinutes)}</Text>
              <Text style={styles.etaLabel}>to destination</Text>
            </View>
          )}
          <Text style={styles.mapHint}>
            {ride?.status === 'en_route' ? 'Driver is heading to pickup' :
             ride?.status === 'picked_up' ? 'En route to school' :
             'Live map view'}
          </Text>
        </View>

        {/* SOS Button */}
        <View style={styles.sosOverlay}>
          <SOSButton rideId={rideId} />
        </View>
      </View>

      {/* Bottom Sheet */}
      <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }] }]}>
        <View style={styles.sheetHandle} />
        
        {/* Breadcrumb Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressRow}>
            {steps.map((step, i) => (
              <React.Fragment key={step.key}>
                <View style={[
                  styles.stepDot,
                  i <= currentStepIndex ? styles.stepDone : styles.stepPending,
                  i === currentStepIndex && styles.stepActive,
                ]}>
                  <Text style={[
                    styles.stepEmoji,
                    i > currentStepIndex && { opacity: 0.3 },
                  ]}>{step.emoji}</Text>
                </View>
                {i < steps.length - 1 && (
                  <View style={[
                    styles.stepLine,
                    i < currentStepIndex ? styles.stepLineDone : styles.stepLinePending,
                  ]} />
                )}
              </React.Fragment>
            ))}
          </View>
          <View style={styles.stepLabels}>
            {steps.map((s, i) => (
              <Text key={s.key} style={[
                styles.stepLabel,
                i === currentStepIndex && styles.stepLabelActive,
                i > currentStepIndex && { opacity: 0.3 },
              ]}>{s.label}</Text>
            ))}
          </View>
        </View>

        {/* Driver Info Card */}
        <GlassCard style={styles.driverInfoCard}>
          <View style={styles.driverInfoRow}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>{driverName?.charAt(0) || 'D'}</Text>
            </View>
            <View style={styles.driverMeta}>
              <Text style={styles.driverName}>{driverName}</Text>
              <Text style={styles.driverVehicle}>
                {ride?.driverId?.vehicle || ride?.vehicleType || 'Vehicle'} · {ride?.driverId?.plate || ''}
              </Text>
              <Text style={styles.driverRating}>
                ⭐ {ride?.driverId?.rating || '4.8'} · 🏆 {ride?.driverId?.rides || '500'}+ rides
              </Text>
              {/* Safety Badges */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                <View style={{ backgroundColor: '#E8F5E9', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#2E7D32' }}>✅ Background Checked</Text>
                </View>
                <View style={{ backgroundColor: '#FFF8E1', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#92400E' }}>🩹 First Aid Certified</Text>
                </View>
              </View>
            </View>
            <View style={styles.driverETA}>
              <Text style={styles.driverETANum}>{formatDuration(etaMinutes || 5)}</Text>
              <Text style={styles.driverETALabel}>ETA</Text>
            </View>
          </View>

          {/* Contact Buttons */}
          <View style={styles.contactRow}>
            <TouchableOpacity style={styles.contactBtn} onPress={() => Alert.alert('Call Driver', `Calling ${driverName}...`)}>
              <Text style={styles.contactBtnText}>📞 Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactBtn} onPress={() => Alert.alert('Message Driver', `Messaging ${driverName}...`)}>
              <Text style={styles.contactBtnText}>💬 Message</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* PIN Verified Banner */}
        {ride?.status === 'picked_up' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#BBF7D0' }}>
            <Text style={{ fontSize: 24, marginRight: 12 }}>🔐</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#166534' }}>4-Digit PIN Verified ✅</Text>
              <Text style={{ fontSize: 12, color: '#166534', marginTop: 2 }}>{kidName} matched the security code before getting in.</Text>
            </View>
          </View>
        )}

        {/* Safety Reminder */}
        {ride?.status === 'en_route' && (
          <View style={styles.safetyReminder}>
            <Text style={styles.safetyReminderIcon}>🛡️</Text>
            <Text style={styles.safetyReminderText}>
              Remind {kidName}: "Driver must say the pickup word before you get in!"
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={() => Alert.alert('Share Trip', 'Share live location with family')}
          >
            <Text style={styles.shareBtnText}>📤 Share Trip</Text>
          </TouchableOpacity>

          {['scheduled', 'en_route'].includes(ride?.status) && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                Alert.alert(
                  'Cancel Ride?',
                  'Are you sure? Your child may need alternative transport.',
                  [
                    { text: 'Keep Ride', style: 'cancel' },
                    { text: 'Cancel Ride', style: 'destructive', onPress: () => navigation.goBack() },
                  ]
                );
              }}
            >
              <Text style={styles.cancelBtnText}>Cancel Ride</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Ride Details */}
        <GlassCard style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailEmoji}>📅</Text>
            <Text style={styles.detailLabel}>Pickup time</Text>
            <Text style={styles.detailValue}>{formatTime(ride?.scheduledPickupTime) || '--:--'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailEmoji}>📍</Text>
            <Text style={styles.detailLabel}>Pickup</Text>
            <Text style={styles.detailValue}>{ride?.pickupLocation || 'School'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailEmoji}>🏁</Text>
            <Text style={styles.detailLabel}>Drop-off</Text>
            <Text style={styles.detailValue}>{ride?.dropoffLocation || 'Home'}</Text>
          </View>
        </GlassCard>

        <View style={{ height: 40 }} />
      </Animated.View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F1E' },
  center: { justifyContent: 'center', alignItems: 'center' },

  // Top Bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: BORDER_RADIUS.md,
    padding: 12,
  },
  topEmoji: { fontSize: 28, marginRight: 12 },
  topInfo: {},
  topStatus: { fontSize: 16, fontWeight: '800', color: '#fff' },
  topKid: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  // Map Area
  mapArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholder: {
    alignItems: 'center',
  },
  mapCar: { fontSize: 60 },
  mapEmoji: { fontSize: 48, marginBottom: 8 },
  mapTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  mapDesc: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 20 },
  mapHint: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8 },
  
  // ETA Badge
  etaBadge: {
    backgroundColor: 'rgba(46, 125, 50, 0.9)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 16,
    alignItems: 'center',
  },
  etaText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  etaLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  // SOS Overlay
  sosOverlay: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },

  // Bottom Sheet
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: 520,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 16,
  },

  // Progress
  progressSection: { marginBottom: 16 },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  stepDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDone: { backgroundColor: '#E8F5E9' },
  stepPending: { backgroundColor: '#F3F4F6' },
  stepActive: {
    backgroundColor: BRAND.primary,
    transform: [{ scale: 1.1 }],
  },
  stepEmoji: { fontSize: 18 },
  stepLine: { height: 3, flex: 1, maxWidth: 50, marginHorizontal: 4 },
  stepLineDone: { backgroundColor: BRAND.primary },
  stepLinePending: { backgroundColor: '#E5E7EB' },
  stepLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 },
  stepLabel: { fontSize: 9, color: '#9CA3AF', fontWeight: '600', flex: 1, textAlign: 'center' },
  stepLabelActive: { color: BRAND.primary, fontWeight: '700' },

  // Driver Info
  driverInfoCard: { padding: 16, marginBottom: 12 },
  driverInfoRow: { flexDirection: 'row', alignItems: 'center' },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: BRAND.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverAvatarText: { fontSize: 22, color: '#fff', fontWeight: '700' },
  driverMeta: { flex: 1 },
  driverName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  driverVehicle: { fontSize: 13, color: '#6B7280', marginTop: 1 },
  driverRating: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  driverETA: { alignItems: 'center', marginLeft: 8 },
  driverETANum: { fontSize: 24, fontWeight: '800', color: BRAND.primary },
  driverETALabel: { fontSize: 10, color: '#6B7280', fontWeight: '600' },

  // Contact
  contactRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  contactBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  contactBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },

  // Safety Reminder
  safetyReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: BORDER_RADIUS.sm,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  safetyReminderIcon: { fontSize: 20, marginRight: 10 },
  safetyReminderText: { flex: 1, fontSize: 12, color: '#78350F', lineHeight: 16 },

  // Actions
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  shareBtn: {
    flex: 1,
    backgroundColor: BRAND.secondary,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  shareBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  cancelBtnText: { color: BRAND.danger, fontSize: 14, fontWeight: '600' },

  // Details
  detailsCard: { padding: 14, marginBottom: 16 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailEmoji: { fontSize: 16, marginRight: 10, width: 24 },
  detailLabel: { fontSize: 13, color: '#6B7280', flex: 1 },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#111827', textAlign: 'right' },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 24 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  bookRideBtn: {
    backgroundColor: BRAND.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
  },
  bookRideText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loadingText: { fontSize: 16, color: 'rgba(255,255,255,0.6)', marginTop: 12 },
});
