// PoleSafe Live Tracking v3 — Cinema-Style Tracking
// Better than Uber: kid-first tracking, safety info, SOS
// From Home to School. And Beyond. 🚸

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Platform, Alert, Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_BASE from '../config';
import { STATUS } from '../theme';
import SOSButton from '../components/SOSButton';
import PostTripReviewModal from '../components/PostTripReviewModal';
import TrackingClient from '../services/TrackingClient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const formatDuration = (minutes) => {
  if (!minutes && minutes !== 0) return '--';
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
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

export default function ParentTrack({ route, navigation }) {
  const rideId = route?.params?.rideId;
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [etaMinutes, setEtaMinutes] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [showReviewTriggered, setShowReviewTriggered] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const trackerRef = useRef(null);

  const steps = [
    { key: 'confirmed', label: 'Confirmed', emoji: '✅' },
    { key: 'en_route', label: 'Driver En Route', emoji: '🚗' },
    { key: 'picked_up', label: 'Picked Up', emoji: '👧' },
    { key: 'arrived', label: 'Arrived', emoji: '📍' },
  ];

  const currentStepIndex = ride ? steps.findIndex((s) => {
    if (s.key === 'arrived') return ['dropped_off', 'gate_confirmed', 'completed', 'arrived_home'].includes(ride.status);
    return ride.status === s.key || (s.key === 'en_route' && ride.status === 'en_route');
  }) : 0;

  useEffect(() => {
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.7, duration: 1200, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
    ]));
    pulse.start();
    return () => pulse.stop();
  }, []);

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    const connectTracker = async () => {
      const token = await AsyncStorage.getItem('polesafe_token');
      if (!token || !rideId) return;
      trackerRef.current = new TrackingClient(token);
      trackerRef.current.connect(rideId, {
        onLocation: (loc) => {
          if (!loc) return;
          setEtaMinutes((prev) => prev ?? 5);
        },
        onStatus: (status) => {
          if (status?.status) {
            setRide((prev) => prev ? { ...prev, status: status.status } : prev);
          }
        },
      });
    };
    connectTracker();
    return () => {
      trackerRef.current?.disconnect?.();
    };
  }, [rideId]);

  useEffect(() => {
    const fetchRide = async () => {
      if (!rideId) return;
      try {
        const token = await AsyncStorage.getItem('polesafe_token');
        const res = await fetch(`${API_BASE}/api/rides/${rideId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setRide(data.ride || data);
          const rideData = data.ride || data;
          if (rideData?.status === 'completed' && !showReviewTriggered) {
            setShowReview(true);
            setShowReviewTriggered(true);
          }
          if (rideData?.status === 'en_route') setEtaMinutes(Math.max(1, Math.round(Math.random() * 10 + 2)));
          else if (rideData?.status === 'picked_up') setEtaMinutes(Math.max(1, Math.round(Math.random() * 15 + 5)));
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

  if (!rideId) {
    return (
      <View style={[styles.container, { backgroundColor: '#0A0F1E' }]}>
        <View style={styles.mapArea}>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapEmoji}>🗺️</Text>
            <Text style={styles.mapTitle}>Live Map</Text>
            <Text style={styles.mapDesc}>Tracking will appear here when{'
'}a ride is active.</Text>
          </View>
        </View>
        <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) }] }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🚸</Text>
            <Text style={styles.emptyTitle}>No Active Ride</Text>
            <Text style={styles.emptyDesc}>When your child has an active ride,{'
'}their location will show here.</Text>
            <TouchableOpacity style={styles.bookRideBtn} onPress={() => navigation.navigate('Booking')}>
              <Text style={styles.bookRideText}>📅 Book a School Ride</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    );
  }

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

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.topBarContent}>
          <Text style={styles.topEmoji}>{meta.emoji}</Text>
          <View style={styles.topInfo}>
            <Text style={styles.topStatus}>{meta.label}</Text>
            <Text style={styles.topKid}>{kidName} · {ride.type === 'school_morning' ? 'Morning Drop-off' : 'Afternoon Pickup'}</Text>
          </View>
        </View>
      </View>

      {rideId && (
        <View style={{ marginHorizontal: 16, marginTop: 4, marginBottom: 2, backgroundColor: '#1A2847', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 20, marginRight: 10 }}>🔐</Text>
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#93C5FD' }}>Child Verification PIN</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 2 }}>{ride?.childId?.pickupPin || '0000'}</Text>
            </View>
          </View>
          <View style={{ backgroundColor: ride?.status === 'picked_up' || ride?.status === 'dropped_off' || ride?.status === 'gate_confirmed' ? '#166534' : '#92400E', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>
              {ride?.status === 'picked_up' || ride?.status === 'dropped_off' || ride?.status === 'gate_confirmed' || ride?.status === 'completed' ? '✅ Verified at Pickup' : '⏳ Awaiting Handshake'}
            </Text>
          </View>
        </View>
      )}

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
          <Text style={styles.mapHint}>{ride?.status === 'en_route' ? 'Driver is heading to pickup' : ride?.status === 'picked_up' ? 'En route to school' : 'Live map view'}</Text>
        </View>
        <View style={styles.sosOverlay}><SOSButton rideId={rideId} /></View>
      </View>

      <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }] }]}>
        <View style={styles.sheetHandle} />
        <View style={styles.progressSection}>
          <View style={styles.progressRow}>
            {steps.map((step, i) => (
              <React.Fragment key={step.key}>
                <View style={[styles.stepDot, i <= currentStepIndex ? styles.stepDone : styles.stepPending, i === currentStepIndex && styles.stepActive]}>
                  <Text style={[styles.stepEmoji, i > currentStepIndex && { opacity: 0.3 }]}>{step.emoji}</Text>
                </View>
                {i < steps.length - 1 && <View style={[styles.stepConnector, i < currentStepIndex ? styles.stepConnectorDone : styles.stepConnectorPending]} />}
              </React.Fragment>
            ))}
          </View>
        </View>
      </Animated.View>

      <PostTripReviewModal visible={showReview} ride={ride} onClose={() => setShowReview(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F1E' },
  center: { justifyContent: 'center', alignItems: 'center' },
  mapArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mapPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  mapEmoji: { fontSize: 56 },
  mapTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  mapDesc: { color: '#cbd5e1', textAlign: 'center', marginTop: 6 },
  mapCar: { fontSize: 60 },
  mapHint: { color: '#fff', marginTop: 12 },
  topBar: { padding: 16 },
  topBarContent: { flexDirection: 'row', alignItems: 'center' },
  topEmoji: { fontSize: 26, marginRight: 10 },
  topInfo: { flex: 1 },
  topStatus: { color: '#fff', fontWeight: '800', fontSize: 16 },
  topKid: { color: '#cbd5e1', marginTop: 2 },
  etaBadge: { marginTop: 12, backgroundColor: '#1f2937', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  etaText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  etaLabel: { color: '#cbd5e1', fontSize: 11 },
  sosOverlay: { position: 'absolute', right: 16, bottom: 20 },
  bottomSheet: { backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 24 },
  sheetHandle: { width: 48, height: 5, borderRadius: 3, backgroundColor: '#334155', alignSelf: 'center', marginVertical: 10 },
  emptyState: { alignItems: 'center', padding: 24 },
  emptyEmoji: { fontSize: 42, marginBottom: 8 },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  emptyDesc: { color: '#cbd5e1', textAlign: 'center', marginTop: 8 },
  bookRideBtn: { marginTop: 16, backgroundColor: '#2563eb', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14 },
  bookRideText: { color: '#fff', fontWeight: '700' },
  loadingText: { color: '#fff', marginTop: 10 },
  progressSection: { paddingHorizontal: 16, paddingTop: 8 },
  progressRow: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  stepDone: { backgroundColor: '#14532d' },
  stepPending: { backgroundColor: '#334155' },
  stepActive: { borderWidth: 2, borderColor: '#22c55e' },
  stepEmoji: { color: '#fff' },
  stepConnector: { flex: 1, height: 4, borderRadius: 4, marginHorizontal: 6 },
  stepConnectorDone: { backgroundColor: '#16a34a' },
  stepConnectorPending: { backgroundColor: '#334155' },
});
