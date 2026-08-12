// PoleSafe Driver Dashboard v3 — Premium Driver Hub
// WCAG AA compliant — theme-aware, large tap targets, readable in sunlight
// Better than Uber: clear trip flow, safety tools, earnings at a glance
// From Home to School. And Beyond. 🚸

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, ActivityIndicator, Animated, SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_BASE from '../config';
import { BRAND, STATUS, getTheme, BORDER_RADIUS, SPACING } from '../theme';
import HapticFeedback from '../utils/hapticFeedback';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';

// ─── Helpers ──────────────────────────────────────────
const formatCurrency = (amt) => Number(amt || 0).toLocaleString('en-UG');
const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' }) : '';

const getStatusMeta = (status) => {
  const map = {
    scheduled: { label: 'Upcoming', emoji: '⏳', color: STATUS.neutral },
    en_route: { label: 'En Route', emoji: '🚗', color: STATUS.info },
    picked_up: { label: 'On Board', emoji: '👧', color: STATUS.inTransit },
    dropped_off: { label: 'Arriving', emoji: '📍', color: STATUS.info },
    gate_confirmed: { label: 'At School ✅', emoji: '✅', color: STATUS.safe },
    completed: { label: 'Done', emoji: '✅', color: STATUS.neutral },
    cancelled: { label: 'Cancelled', emoji: '❌', color: STATUS.neutral },
  };
  return map[status] || { label: status, emoji: '⏳', color: STATUS.neutral };
};

// ─── Trip Card ────────────────────────────────────────
function TripCard({ ride, onAccept, onComplete, onSOS }) {
  const meta = getStatusMeta(ride.status);
  const childName = ride.childId?.name || 'Child';
  const schoolName = ride.dropoffLocation || 'School';
  const pickupAddr = ride.pickupLocation || 'Home';

  return (
    <GlassCard style={tripStyles.card} elevated>
      {/* Header */}
      <View style={tripStyles.header}>
        <View style={tripStyles.headerLeft}>
          <View style={[tripStyles.avatar, { backgroundColor: meta.color }]}>
            <Text style={tripStyles.avatarText}>{childName.charAt(0)}</Text>
          </View>
          <View>
            <Text style={tripStyles.childName}>{childName}</Text>
            <Text style={tripStyles.school}>{schoolName}</Text>
          </View>
        </View>
        <View style={[tripStyles.statusBadge, { backgroundColor: meta.color + '20' }]}>
          <Text style={[tripStyles.statusText, { color: meta.color }]}>{meta.emoji} {meta.label}</Text>
        </View>
      </View>

      {/* Details */}
      <View style={tripStyles.details}>
        <View style={tripStyles.detailItem}>
          <Text style={tripStyles.detailEmoji}>📍</Text>
          <Text style={tripStyles.detailLabel}>From</Text>
          <Text style={tripStyles.detailValue}>{pickupAddr}</Text>
        </View>
        <View style={tripStyles.detailItem}>
          <Text style={tripStyles.detailEmoji}>🏁</Text>
          <Text style={tripStyles.detailLabel}>To</Text>
          <Text style={tripStyles.detailValue}>{ride.dropoffLocation || 'Home'}</Text>
        </View>
        <View style={tripStyles.detailItem}>
          <Text style={tripStyles.detailEmoji}>🕐</Text>
          <Text style={tripStyles.detailLabel}>Time</Text>
          <Text style={tripStyles.detailValue}>{formatTime(ride.scheduledPickupTime) || '--:--'}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={tripStyles.actions}>
        {ride.status === 'scheduled' && (
          <TouchableOpacity style={tripStyles.acceptBtn} onPress={() => onAccept(ride._id)}>
            <Text style={tripStyles.acceptText}>🚗 Start Trip</Text>
          </TouchableOpacity>
        )}
        {['en_route', 'picked_up'].includes(ride.status) && (
          <>
            <TouchableOpacity style={tripStyles.completeBtn} onPress={() => onComplete(ride._id)}>
              <Text style={tripStyles.completeText}>✅ Mark Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={tripStyles.pickupVerifyBtn} onPress={() => onSOS(ride._id)}>
              <Text style={tripStyles.pickupVerifyText}>🔐 Verify Pickup</Text>
            </TouchableOpacity>
          </>
        )}
        {ride.status === 'dropped_off' && (
          <TouchableOpacity style={tripStyles.completeBtn} onPress={() => onComplete(ride._id)}>
            <Text style={tripStyles.completeText}>✅ Confirm Drop-off</Text>
          </TouchableOpacity>
        )}
      </View>
    </GlassCard>
  );
}

const tripStyles = StyleSheet.create({
  card: { padding: 16, marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { fontSize: 18, color: '#fff', fontWeight: '700' },
  childName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  school: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  details: { gap: 6, marginBottom: 14 },
  detailItem: { flexDirection: 'row', alignItems: 'center' },
  detailEmoji: { fontSize: 14, marginRight: 8, width: 20 },
  detailLabel: { fontSize: 13, color: '#6B7280', width: 40 },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#111827', flex: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  acceptBtn: { flex: 1, backgroundColor: BRAND.secondary, paddingVertical: 12, borderRadius: BORDER_RADIUS.sm, alignItems: 'center' },
  acceptText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  completeBtn: { flex: 1, backgroundColor: BRAND.primary, paddingVertical: 12, borderRadius: BORDER_RADIUS.sm, alignItems: 'center' },
  completeText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  pickupVerifyBtn: { flex: 1, backgroundColor: '#FFF8E1', paddingVertical: 12, borderRadius: BORDER_RADIUS.sm, alignItems: 'center', borderWidth: 1, borderColor: '#FDE68A' },
  pickupVerifyText: { fontSize: 14, fontWeight: '600', color: '#92400E' },
});

// ─── Main Dashboard ───────────────────────────────────
export default function DriverDashboard({ navigation }) {
  const theme = getTheme();
  const [trips, setTrips] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ today: 0, earnings: 0, rating: 0 });
  const [voiceOn, setVoiceOn] = useState(false);

  // ─── Voice guidance (safety) ────────────────────
  const announceWelcome = () => {
    // Voice guidance welcome — placeholder for TTS integration
    console.log('[Voice] Welcome to PoleSafe Driver');
  };

  const toggleVoice = () => {
    const newState = !voiceOn;
    setVoiceOn(newState);
    try {
      AsyncStorage.setItem('driver_voice_enabled', JSON.stringify(newState));
    } catch {}
    HapticFeedback.light();
    if (newState) announceWelcome();
  };

  const loadTrips = async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const headers = { Authorization: `Bearer ${token}` };
      const [tripsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/driver/trips`, { headers }),
        fetch(`${API_BASE}/api/driver/stats`, { headers }),
      ]);
      if (tripsRes.ok) setTrips((await tripsRes.json()).trips || []);
      if (statsRes.ok) setStats((await statsRes.json()).stats || {});
    } catch (err) {
      // Demo
      setTrips([
        { _id: 't1', childId: { name: 'Amina Nakato' }, status: 'scheduled', scheduledPickupTime: new Date().toISOString(), pickupLocation: 'Plot 23, Kampala', dropoffLocation: "St. Mary's School" },
        { _id: 't2', childId: { name: 'James Okello' }, status: 'scheduled', scheduledPickupTime: new Date(Date.now() + 3600000).toISOString(), pickupLocation: 'Ntinda', dropoffLocation: "St. Mary's School" },
      ]);
      setStats({ today: 4, earnings: 85000, rating: 4.9 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTrips(); }, []);
  const onRefresh = async () => { setRefreshing(true); await loadTrips(); setRefreshing(false); };

  const activeTrips = trips.filter(t => ['scheduled', 'en_route', 'picked_up'].includes(t.status));
  const completedCount = trips.filter(t => ['completed', 'gate_confirmed'].includes(t.status)).length;

  const handleAccept = (id) => {
    HapticFeedback.medium();
    const trip = trips.find(t => t._id === id);
    if (trip) {
      navigation.navigate('DriverActiveTrip', { trip });
    }
  };

  const handleComplete = (id) => {
    HapticFeedback.success();
    Alert.alert('Complete Trip', 'Mark this trip as complete?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Complete ✅', onPress: () => {
        setTrips(prev => prev.map(t => t._id === id ? { ...t, status: 'completed' } : t));
        Alert.alert('✅ Trip Complete!', 'Well done!');
      }},
    ]);
  };

  const handleSOS = (id) => {
    Alert.alert('🔐 Verify Pickup', 'Enter the pickup code to verify child identity before pickup.');
  };

  const toggleOnline = () => {
    setIsOnline(!isOnline);
    Alert.alert(isOnline ? 'You\'re Offline' : 'You\'re Online', isOnline ? 'New trip requests paused.' : 'You\'ll receive trip requests.');
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: theme.canvas }]}>
        <View style={styles.splashPulse}><Text style={{ fontSize: 40 }}>🚗</Text></View>
        <Text style={[styles.loadingText, { color: theme.text.secondary }]}>Loading your dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.canvas }]}>
      <ScrollView
      style={[styles.container, { backgroundColor: theme.canvas }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.secondary} />}
      contentContainerStyle={styles.content}
    >
      {/* Online Toggle */}
      <View style={styles.onlineBar}>
        <View style={styles.onlineInfo}>
          <View style={[styles.onlineDot, isOnline ? styles.onlineDotActive : styles.onlineDotInactive]} />
          <Text style={styles.onlineLabel}>{isOnline ? 'Online' : 'Offline'}</Text>
        </View>
        <TouchableOpacity
          style={[styles.onlineToggle, isOnline ? styles.onlineToggleOn : styles.onlineToggleOff]}
          onPress={toggleOnline}
        >
          <View style={[styles.toggleKnob, isOnline && styles.toggleKnobOn]} />
        </TouchableOpacity>
      </View>

      {/* Voice Toggle */}
      <View style={styles.voiceBar}>
        <Text style={styles.voiceIcon}>{voiceOn ? '🔊' : '🔇'}</Text>
        <Text style={styles.voiceLabel}>Voice Safety Alerts: {voiceOn ? 'ON' : 'OFF'}</Text>
        <TouchableOpacity
          style={[styles.onlineToggle, voiceOn ? styles.onlineToggleOn : styles.onlineToggleOff]}
          onPress={toggleVoice}
        >
          <View style={[styles.toggleKnob, voiceOn && styles.toggleKnobOn]} />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <GlassCard style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.today || 0}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <Text style={[styles.statNumber, { color: BRAND.primary }]}>{formatCurrency(stats.earnings || 0)}</Text>
          <Text style={styles.statLabel}>Earnings</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#F59E0B' }]}>⭐ {stats.rating || '--'}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </GlassCard>
      </View>

      {/* Safety Reminder */}
      <GlassCard style={styles.safetyCard}>
        <Text style={styles.safetyTitle}>🛡️ Safety Checklist</Text>
        <Text style={styles.safetyItem}>✓ Say the pickup word before the child enters</Text>
        <Text style={styles.safetyItem}>✓ Ensure seat belt is fastened</Text>
        <Text style={styles.safetyItem}>✓ Confirm drop-off with the school gate</Text>
      </GlassCard>

      {/* Active Trips */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {activeTrips.length > 0 ? `Active Trips (${activeTrips.length})` : 'Upcoming Trips'}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Route')}>
          <Text style={styles.seeAllText}>View Route ›</Text>
        </TouchableOpacity>
      </View>

      {trips.length === 0 ? (
        <GlassCard style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🚗</Text>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptyDesc}>Stay online to receive trip requests</Text>
        </GlassCard>
      ) : (
        trips.map(trip => (
          <TripCard
            key={trip._id}
            ride={trip}
            onAccept={handleAccept}
            onComplete={handleComplete}
            onSOS={handleSOS}
          />
        ))
      )}

      {/* Earnings Shortcut */}
      <TouchableOpacity style={styles.earningsShortcut} onPress={() => navigation.navigate('Earnings')}>
        <Text style={styles.earningsShortcutIcon}>💰</Text>
        <View>
          <Text style={styles.earningsShortcutTitle}>View Full Earnings</Text>
          <Text style={styles.earningsShortcutSub}>{formatCurrency(stats.earnings || 0)} UGX today</Text>
        </View>
        <Text style={styles.earningsArrow}>›</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: SPACING.md },

  // Online Bar
  onlineBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS.md,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  onlineInfo: { flexDirection: 'row', alignItems: 'center' },
  onlineDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  onlineDotActive: { backgroundColor: BRAND.primary },
  onlineDotInactive: { backgroundColor: '#757575' },
  onlineLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
  onlineToggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  onlineToggleOn: { backgroundColor: BRAND.primary },
  onlineToggleOff: { backgroundColor: '#D1D5DB' },
  toggleKnob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  toggleKnobOn: { alignSelf: 'flex-end' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statCard: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: '800', color: BRAND.secondary },
  statLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginTop: 2 },

  // Safety
  safetyCard: { padding: 14, marginBottom: 12, backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' },
  safetyTitle: { fontSize: 15, fontWeight: '800', color: '#15803D', marginBottom: 8 },
  safetyItem: { fontSize: 13, color: '#374151', lineHeight: 20 },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  seeAllText: { fontSize: 14, fontWeight: '700', color: '#1E40AF' },

  // Empty
  emptyCard: { padding: 24, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  emptyDesc: { fontSize: 13, color: '#6B7280', marginTop: 4 },

  // Earnings Shortcut
  earningsShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: BORDER_RADIUS.md,
    padding: 14,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  earningsShortcutIcon: { fontSize: 24, marginRight: 12 },
  earningsShortcutTitle: { fontSize: 15, fontWeight: '700', color: BRAND.primary },
  earningsShortcutSub: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  earningsArrow: { fontSize: 24, color: BRAND.primary, marginLeft: 'auto' },

  // Loading
  splashPulse: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(21, 101, 192, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  loadingText: { fontSize: 15, color: '#6B7280' },

  // Voice Toggle
  voiceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  voiceIcon: { fontSize: 20, marginRight: 10 },
  voiceLabel: { fontSize: 14, fontWeight: '600', color: '#111827', flex: 1 },
});
