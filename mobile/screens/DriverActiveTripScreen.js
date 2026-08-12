// PoleSafe Driver Active Trip Screen v1
// PIN Handshake → On Trip → Complete the loop
// Stage 1: Verify PIN, Stage 2: On Trip, Stage 3: Complete & Summary
// From Home to School. And Beyond. 🚸

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, Animated, Vibration, Platform,
  Dimensions, Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_BASE from '../config';
import { BRAND, STATUS, BORDER_RADIUS, SPACING } from '../theme';
import GlassCard from '../components/GlassCard';
import HapticFeedback from '../utils/hapticFeedback';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────
const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' }) : '';
const formatCurrency = (amt) => Number(amt || 0).toLocaleString('en-UG');

// ─── Main Component ──────────────────────────────────
export default function DriverActiveTripScreen({ route, navigation }) {
  const tripParam = route?.params?.trip;
  const [trip, setTrip] = useState(tripParam || null);
  const [stage, setStage] = useState('verify'); // verify → on_trip → complete → summary
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const kidName = trip?.childId?.name || 'Child';
  const driverName = trip?.driverId?.name || 'You';
  const pickupLocation = trip?.pickupLocation || 'School Gate';
  const dropoffLocation = trip?.dropoffLocation || 'Home';
  const correctPin = trip?.childId?.pickupPin || '4821';

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

  // ─── PIN Input Handler ────────────────────────────
  const handlePinDigit = (digit) => {
    if (pin.length >= 4) return;
    HapticFeedback.light();
    setPin(prev => prev + digit);
    setPinError(false);
  };

  const handlePinDelete = () => {
    if (pin.length === 0) return;
    HapticFeedback.light();
    setPin(prev => prev.slice(0, -1));
    setPinError(false);
  };

  // ─── Verify PIN & Start Trip ──────────────────────
  const handleVerifyPin = () => {
    if (pin.length !== 4) return;
    HapticFeedback.medium();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (pin === correctPin) {
        HapticFeedback.success();
        setStage('on_trip');
        Vibration.vibrate(100);
        Alert.alert('✅ PIN Verified', `${kidName} is on board! Trip started.`);
      } else {
        HapticFeedback.error();
        setPinError(true);
        setPin('');
        Vibration.vibrate([0, 100, 50, 200]);
      }
    }, 800);
  };

  // ─── Complete Drop-off ────────────────────────────
  const handleComplete = () => {
    HapticFeedback.success();
    setStage('summary');
    setShowSummary(true);
  };

  // ─── Reset PIN for retry ──────────────────────────
  const handleRetryPin = () => {
    setPin('');
    setPinError(false);
  };

  // ─── Render PIN Dots ──────────────────────────────
  const renderPinDots = () => {
    return (
      <View style={styles.pinDotsRow}>
        {[0, 1, 2, 3].map(i => (
          <View
            key={i}
            style={[
              styles.pinDot,
              i < pin.length && styles.pinDotFilled,
              pinError && styles.pinDotError,
              i === pin.length && !pinError && styles.pinDotActive,
            ]}
          >
            {i < pin.length && (
              <Text style={[styles.pinDotChar, pinError && { color: '#DC2626' }]}>●</Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  // ─── Keypad Digit ─────────────────────────────────
  const renderKeypad = () => (
    <View style={styles.keypad}>
      {[['1','2','3'],['4','5','6'],['7','8','9']].map((row, ri) => (
        <View key={ri} style={styles.keypadRow}>
          {row.map(d => (
            <TouchableOpacity
              key={d}
              style={styles.keypadBtn}
              onPress={() => handlePinDigit(d)}
              activeOpacity={0.6}
            >
              <Text style={styles.keypadBtnText}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
      <View style={styles.keypadRow}>
        <TouchableOpacity
          style={styles.keypadBtn}
          onPress={handlePinDelete}
          activeOpacity={0.6}
        >
          <Text style={styles.keypadBtnText}>⌫</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.keypadBtn}
          onPress={() => handlePinDigit('0')}
          activeOpacity={0.6}
        >
          <Text style={styles.keypadBtnText}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.keypadBtn}
          onPress={handleVerifyPin}
          activeOpacity={pin.length === 4 ? 0.6 : 1}
        >
          <Text style={[styles.keypadBtnText, { color: pin.length === 4 ? BRAND.primary : '#D1D5DB' }]}>✓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Post-Trip Summary Modal ──────────────────────
  const SummaryModal = () => (
    <Modal visible={showSummary} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalEmoji}>🎉</Text>
          <Text style={styles.modalTitle}>Trip Complete!</Text>
          <Text style={styles.modalSubtitle}>{kidName} · {dropoffLocation}</Text>

          <View style={styles.modalDivider} />

          <View style={styles.modalRow}>
            <Text style={styles.modalLabel}>Trip payout</Text>
            <Text style={styles.modalValue}>UGX {formatCurrency(trip?.price || 5000)}</Text>
          </View>
          <View style={styles.modalRow}>
            <Text style={styles.modalLabel}>Payment method</Text>
            <View style={[styles.paymentBadge, { backgroundColor: '#FFF8E1' }]}>
              <Text style={styles.paymentBadgeText}>🟡 MTN MoMo</Text>
            </View>
          </View>
          <View style={styles.modalRow}>
            <Text style={styles.modalLabel}>Payout status</Text>
            <Text style={[styles.modalValue, { color: '#2E7D32' }]}>✅ Instant Payout Sent</Text>
          </View>

          <View style={styles.modalDivider} />

          <Text style={styles.ratingPrompt}>How was the trip?</Text>
          <View style={styles.starRow}>
            {['⭐','⭐','⭐','⭐','⭐'].map((s, i) => (
              <TouchableOpacity key={i} onPress={() => { HapticFeedback.light(); Alert.alert('Thanks!', 'Your 5-star rating was submitted.'); }}>
                <Text style={styles.star}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => {
              setShowSummary(false);
              navigation.goBack();
            }}
          >
            <Text style={styles.modalCloseBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ─── Render ──────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{'‹ Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {stage === 'verify' ? 'Verify & Start Trip' : stage === 'on_trip' ? 'Active Trip' : 'Complete Trip'}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {/* Map Placeholder Area */}
      <View style={styles.mapArea}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Text style={styles.mapEmoji}>🗺️</Text>
        </Animated.View>
        <Text style={styles.mapLabel}>
          {stage === 'verify' ? `Navigate to ${pickupLocation}` : `Heading to ${dropoffLocation}`}
        </Text>
        <Text style={styles.mapHint}>
          {pickupLocation} → {dropoffLocation}
        </Text>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* STAGE 1: PIN Verification */}
        {stage === 'verify' && (
          <>
            {/* Child Pickup Card */}
            <GlassCard style={styles.childCard}>
              <View style={styles.childCardRow}>
                <View style={styles.childAvatar}>
                  <Text style={styles.childAvatarText}>{kidName.charAt(0)}</Text>
                </View>
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{kidName}</Text>
                  <Text style={styles.childDetail}>📍 {pickupLocation}</Text>
                  <Text style={styles.childDetail}>🏁 {dropoffLocation}</Text>
                </View>
              </View>
            </GlassCard>

            {/* PIN Input Section */}
            <View style={styles.pinSection}>
              <Text style={styles.pinTitle}>Enter Child Verification PIN</Text>
              <Text style={styles.pinSubtitle}>Ask the parent or child for the 4-digit security code</Text>
              {renderPinDots()}

              {pinError && (
                <TouchableOpacity onPress={handleRetryPin}>
                  <Text style={styles.pinErrorText}>❌ Invalid PIN — Ask parent or child again</Text>
                </TouchableOpacity>
              )}

              {renderKeypad()}

              <TouchableOpacity
                style={[styles.verifyBtn, pin.length !== 4 && styles.verifyBtnDisabled]}
                onPress={handleVerifyPin}
                disabled={pin.length !== 4 || loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.verifyBtnText}>🔐 Verify PIN & Start Trip</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* STAGE 2: On Trip */}
        {stage === 'on_trip' && (
          <>
            {/* PIN Verified Banner */}
            <View style={styles.verifiedBanner}>
              <Text style={styles.verifiedIcon}>✅</Text>
              <Text style={styles.verifiedText}>PIN Verified — {kidName} On Board</Text>
            </View>

            {/* Live Metrics */}
            <View style={styles.metricsRow}>
              <GlassCard style={[styles.metricCard, { flex: 1 }]}>
                <Text style={styles.metricLabel}>ETA to Dropoff</Text>
                <Text style={styles.metricValue}>8 min</Text>
              </GlassCard>
              <GlassCard style={[styles.metricCard, { flex: 1 }]}>
                <Text style={styles.metricLabel}>Trip Payout</Text>
                <Text style={[styles.metricValue, { color: BRAND.secondary }]}>
                  UGX {formatCurrency(trip?.price || 5000)}
                </Text>
                <Text style={styles.metricBadge}>🟡 MTN MoMo</Text>
              </GlassCard>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => Alert.alert('Call Parent', 'Calling parent of ' + kidName + '...')}
              >
                <Text style={styles.actionBtnText}>📞 Call Parent</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => Alert.alert('Open Maps', `Navigate to ${dropoffLocation}`)}
              >
                <Text style={styles.actionBtnText}>🗺️ Open in Maps</Text>
              </TouchableOpacity>
            </View>

            {/* Complete Button */}
            <TouchableOpacity
              style={styles.completeBtn}
              onPress={handleComplete}
              activeOpacity={0.8}
            >
              <Text style={styles.completeBtnText}>✅ Mark Complete Drop-off</Text>
            </TouchableOpacity>
          </>
        )}

        {/* STAGE 3: Summary */}
        {stage === 'summary' && (
          <View style={styles.completeView}>
            <Text style={styles.completeEmoji}>🎉</Text>
            <Text style={styles.completeTitle}>Drop-off Complete</Text>
            <Text style={styles.completeSub}>{kidName} arrived at {dropoffLocation}</Text>
            <TouchableOpacity
              style={styles.viewSummaryBtn}
              onPress={() => setShowSummary(true)}
            >
              <Text style={styles.viewSummaryBtnText}>📊 View Trip Summary</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Summary Modal */}
      <SummaryModal />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F1E' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 60 },
  backBtnText: { fontSize: 16, color: '#fff', fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff', textAlign: 'center', flex: 1 },

  // Map
  mapArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapEmoji: { fontSize: 60, marginBottom: 12 },
  mapLabel: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  mapHint: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },

  // Bottom Section
  bottomSection: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
    maxHeight: 480,
  },

  // Child Card
  childCard: { padding: 16, marginBottom: 12 },
  childCardRow: { flexDirection: 'row', alignItems: 'center' },
  childAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: BRAND.secondary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  childAvatarText: { fontSize: 22, color: '#fff', fontWeight: '700' },
  childInfo: { flex: 1 },
  childName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  childDetail: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  // PIN Section
  pinSection: { alignItems: 'center', marginBottom: 4 },
  pinTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  pinSubtitle: { fontSize: 11, color: '#6B7280', marginTop: 2, marginBottom: 16, textAlign: 'center' },

  // PIN Dots
  pinDotsRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  pinDot: { width: 48, height: 48, borderRadius: 12, borderWidth: 2, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  pinDotFilled: { borderColor: BRAND.primary, backgroundColor: BRAND.primary + '10' },
  pinDotActive: { borderColor: BRAND.primary },
  pinDotError: { borderColor: '#DC2626', backgroundColor: '#FEE2E2' },
  pinDotChar: { fontSize: 24, color: '#111827' },

  // Keypad
  keypad: { marginBottom: 16, width: '100%' },
  keypadRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 8 },
  keypadBtn: { width: 60, height: 52, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  keypadBtnText: { fontSize: 22, fontWeight: '600', color: '#111827' },

  // Error
  pinErrorText: { fontSize: 12, color: '#DC2626', fontWeight: '700', marginBottom: 8, textDecorationLine: 'underline' },

  // Verify Button
  verifyBtn: { backgroundColor: BRAND.primary, paddingVertical: 14, borderRadius: BORDER_RADIUS.md, width: '100%', alignItems: 'center' },
  verifyBtnDisabled: { opacity: 0.4 },
  verifyBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Verified Banner
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: BORDER_RADIUS.sm,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  verifiedIcon: { fontSize: 20, marginRight: 10 },
  verifiedText: { fontSize: 14, fontWeight: '700', color: '#166534', flex: 1 },

  // Metrics
  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  metricCard: { padding: 16, alignItems: 'center' },
  metricLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600', marginBottom: 4 },
  metricValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
  metricBadge: { fontSize: 10, color: '#92400E', fontWeight: '700', marginTop: 4 },

  // Quick Actions
  quickActions: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  actionBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#374151' },

  // Complete Button
  completeBtn: {
    backgroundColor: BRAND.primary,
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  completeBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Complete View
  completeView: { alignItems: 'center', paddingVertical: 20 },
  completeEmoji: { fontSize: 48, marginBottom: 8 },
  completeTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  completeSub: { fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 20 },
  viewSummaryBtn: {
    backgroundColor: BRAND.secondary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
  },
  viewSummaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Summary Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalEmoji: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#111827', textAlign: 'center' },
  modalSubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 4 },
  modalDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalLabel: { fontSize: 14, color: '#6B7280' },
  modalValue: { fontSize: 15, fontWeight: '700', color: '#111827' },
  paymentBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  paymentBadgeText: { fontSize: 12, fontWeight: '700', color: '#92400E' },
  ratingPrompt: { fontSize: 15, fontWeight: '600', color: '#374151', textAlign: 'center', marginBottom: 10 },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  star: { fontSize: 28 },
  modalCloseBtn: {
    backgroundColor: BRAND.primary,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  modalCloseBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
