// PoleSafe Parent Dashboard v3 — Redesigned
// Safety-first, kid-focused, better than Uber + Lyft
// From Home to School. And Beyond. 🚸

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, TextInput, ActivityIndicator, Animated, Platform, SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_BASE from '../config';
import { BRAND, STATUS, getTheme, TYPOGRAPHY, SPACING, BORDER_RADIUS, WCAG } from '../theme';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import StatusBadge from '../components/StatusBadge';
import RoleSwitcherAction from '../components/RoleSwitcherAction';
const API_URL = API_BASE;

// ─── Helpers ──────────────────────────────────────────
function getStatusMeta(status) {
  const map = {
    scheduled: { label: 'Scheduled', emoji: '⏳', color: STATUS.neutral, bg: '#F5F5F5' },
    en_route: { label: 'Driver En Route', emoji: '🚗', color: STATUS.info, bg: '#E3F2FD' },
    picked_up: { label: 'Picked Up', emoji: '👧', color: STATUS.inTransit, bg: '#E8EAF6' },
    dropped_off: { label: 'Dropped Off', emoji: '📍', color: STATUS.info, bg: '#E3F2FD' },
    gate_confirmed: { label: 'At School ✅', emoji: '✅', color: STATUS.safe, bg: '#E8F5E9' },
    completed: { label: 'Completed', emoji: '✅', color: STATUS.safe, bg: '#E8F5E9' },
    cancelled: { label: 'Cancelled', emoji: '❌', color: STATUS.neutral, bg: '#F5F5F5' },
    missed: { label: 'Missed', emoji: '😤', color: STATUS.danger, bg: '#FFEBEE' },
    sick_day: { label: 'Sick Day', emoji: '🩺', color: STATUS.sick, bg: '#F3E5F5' },
    arrived_home: { label: 'Home 🏠', emoji: '🏠', color: STATUS.safe, bg: '#E8F5E9' },
  };
  return map[status] || { label: status, emoji: '⏳', color: STATUS.neutral, bg: '#F5F5F5' };
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' });
}

// ─── Kid Card Component ───────────────────────────────
function KidCard({ kid, rides, navigation, refresh }) {
  const kidRides = rides.filter(r => r.childId?._id === kid._id);
  const activeRide = kidRides.find(r => ['scheduled', 'en_route', 'picked_up'].includes(r.status));
  const status = activeRide ? activeRide.status : 'completed';
  const meta = getStatusMeta(status);
  const [showCodeSection, setShowCodeSection] = useState(false);
  const [customCode, setCustomCode] = useState('');

  const handleSetWord = async () => {
    if (!customCode.trim()) return;
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      await fetch(`${API_URL}/api/safety/set-pickup-word`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: kid._id, word: customCode.trim() }),
      });
      setCustomCode('');
      refresh();
    } catch (err) {
      console.log(err);
    }
  };

  const handleRandomWord = async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const res = await fetch(`${API_URL}/api/safety/generate-pickup-word`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: kid._id }),
      });
      const data = await res.json();
      refresh();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <GlassCard elevated style={styles.kidCard}>
      {/* Kid Header — Always visible */}
      <TouchableOpacity onPress={() => setShowCodeSection(!showCodeSection)} activeOpacity={0.7}>
        <View style={styles.kidHeader}>
          <View style={styles.kidInfoRow}>
            <View style={[styles.avatarCircle, { backgroundColor: meta.bg }]}>
              <Text style={styles.avatarText}>{kid.name?.charAt(0) || '👶'}</Text>
            </View>
            <View style={styles.kidMeta}>
              <Text style={styles.kidName}>{kid.name}</Text>
              <Text style={styles.kidClass}>{kid.class || kid.grade || 'Student'}</Text>
            </View>
          </View>
          <StatusBadge status={status} />
        </View>
      </TouchableOpacity>

      {/* Active Ride — The main event */}
      {activeRide ? (
        <View style={styles.activeRide}>
          <View style={styles.rideInfoBar}>
            <Text style={styles.rideEmoji}>{meta.emoji}</Text>
            <View style={styles.rideInfoText}>
              <Text style={styles.rideStatusLabel}>{meta.label}</Text>
              {activeRide.scheduledPickupTime && (
                <Text style={styles.rideTime}>
                  {formatTime(activeRide.scheduledPickupTime)}
                  {activeRide.driverId?.name ? ` · ${activeRide.driverId.name}` : ''}
                </Text>
              )}
            </View>
          </View>
          
          {/* Quick Actions for Active Ride */}
          <View style={styles.rideActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionPrimary]}
              onPress={() => navigation.navigate('TrackRide', { rideId: activeRide._id })}
            >
              <Text style={styles.actionPrimaryText}>📍 Track Live</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('SickDay', { childId: kid._id, childName: kid.name })}
            >
              <Text style={styles.actionText}>🩺 Sick</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('EarlyPickup', { childId: kid._id, childName: kid.name })}
            >
              <Text style={styles.actionText}>🏃 Early</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* No active ride — show Book CTA */
        <View style={styles.noRideSection}>
          <Text style={styles.noRideText}>
            {kidRides.length === 0 ? 'No rides scheduled' : 'All rides completed for today'}
          </Text>
          <TouchableOpacity
            style={styles.bookQuickBtn}
            onPress={() => navigation.navigate('Booking', { childId: kid._id })}
          >
            <Text style={styles.bookQuickText}>+ Book Ride</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Pickup Code Section — Collapsible */}
      {showCodeSection && (
        <View style={styles.codeSection}>
          <View style={styles.codeDivider} />
          <Text style={styles.codeSectionTitle}>🔐 Pickup Word</Text>
          <Text style={styles.codeHint}>
            One word the driver says at EVERY pickup. If they don't say it, your child doesn't get in.
          </Text>
          
          {kid.pickupCode ? (
            <View style={styles.currentCodeBox}>
              <Text style={styles.currentCodeLabel}>Current word:</Text>
              <Text style={styles.currentCode}>{kid.pickupCode}</Text>
              <Text style={styles.codeReminder}>
                Tell {kid.name}: "Driver must say "{kid.pickupCode}" before you get in. Every time."
              </Text>
            </View>
          ) : (
            <Text style={styles.noCodeWarning}>⚠️ No pickup word set — add one now!</Text>
          )}

          <View style={styles.codeActions}>
            <TouchableOpacity style={styles.randomWordBtn} onPress={handleRandomWord}>
              <Text style={styles.randomWordText}>🎲 Generate Word</Text>
            </TouchableOpacity>
            <View style={styles.customWordRow}>
              <TextInput
                style={styles.wordInput}
                placeholder="Custom word (e.g. Mango)"
                placeholderTextColor="#9CA3AF"
                maxLength={16}
                value={customCode}
                onChangeText={setCustomCode}
              />
              <TouchableOpacity style={styles.setWordBtn} onPress={handleSetWord}>
                <Text style={styles.setWordText}>Set</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </GlassCard>
  );
}

// ─── Main Dashboard ───────────────────────────────────
export default function ParentDashboard({ navigation }) {
  const theme = getTheme();
  const [kids, setKids] = useState([]);
  const [rides, setRides] = useState([]);
  const [creditBalance, setCreditBalance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('school');

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const headers = { Authorization: `Bearer ${token}` };
      const [kidsRes, ridesRes, creditsRes] = await Promise.all([
        fetch(`${API_URL}/api/parents/kids`, { headers }),
        fetch(`${API_URL}/api/parents/rides?limit=20`, { headers }),
        fetch(`${API_URL}/api/credits`, { headers }),
      ]);
      const kidsData = await kidsRes.json();
      const ridesData = await ridesRes.json();
      const creditsData = await creditsRes.json();
      setKids(kidsData.kids || []);
      setRides(ridesData.rides || []);
      setCreditBalance(creditsData.balance || 0);
    } catch (err) {
      console.log('Dashboard load error:', err);
    }
  };

  useEffect(() => { setLoading(true); loadData().finally(() => setLoading(false)); }, []);
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const activeRides = rides.filter(r => ['scheduled', 'en_route', 'picked_up'].includes(r.status));
  const todayRides = rides.filter(r => {
    if (!r.scheduledPickupTime) return false;
    const d = new Date(r.scheduledPickupTime);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  // ─── Loading State ────────────────────────────────
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: theme.canvas }]}>
        <View style={styles.splashPulse}>
          <Text style={styles.splashIcon}>🚸</Text>
        </View>
        <Text style={[styles.loadingText, { color: theme.text.secondary }]}>Loading your dashboard...</Text>
        <View style={styles.skeletonRow}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[styles.skeletonCard, { backgroundColor: theme.divider }]}>
              <View style={[styles.skeletonLine, { backgroundColor: theme.border }]} />
              <View style={[styles.skeletonLine, { backgroundColor: theme.border, width: '60%' }]} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // ─── Empty State ──────────────────────────────────
  if (!loading && kids.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.canvas }]}>
        <ScrollView style={[styles.container, { backgroundColor: theme.canvas }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <View style={[styles.container, styles.center, { paddingTop: 80 }]}>
          <View style={styles.emptyIconWrap}>
            <Text style={styles.emptyIcon}>🚸</Text>
          </View>
          <Text style={styles.emptyTitle}>Welcome to PoleSafe!</Text>
          <Text style={styles.emptyDesc}>
            Your child's safety starts here.{'\n'}Add your kids to get started.
          </Text>
          <PrimaryButton title="+ Add Your First Child" onPress={() => navigation.navigate('AddChild')} />
          <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('RideHailing')}>
            <Text style={styles.exploreText}>Or try PoleSafe Ride 🚗</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ─── Main Dashboard ───────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: theme.canvas }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Stats Bar */}
        <View style={styles.statsBar}>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statNumber}>{kids.length}</Text>
            <Text style={styles.statLabel}>Kids</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={[styles.statNumber, { color: STATUS.info }]}>{activeRides.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={[styles.statNumber, { color: BRAND.gold }]}>
              {creditBalance > 0 ? `${Math.round(creditBalance / 1000)}k` : '0'}
            </Text>
            <Text style={styles.statLabel}>Credits</Text>
          </GlassCard>
          <TouchableOpacity style={[styles.statCard, styles.famCard]} onPress={() => navigation.navigate('FamilySharing')}>
            <Text style={styles.famIcon}>👨‍👩‍👧</Text>
            <Text style={styles.statLabel}>Family</Text>
          </TouchableOpacity>
        </View>

        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'school' && styles.modeActiveSchool]}
            onPress={() => setMode('school')}
          >
            <Text style={[styles.modeText, mode === 'school' && styles.modeTextActive]}>🚸 School</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'ride' && styles.modeActiveRide]}
            onPress={() => navigation.navigate('RideHailing')}
          >
            <Text style={[styles.modeText, mode === 'ride' && styles.modeTextActive]}>🚗 Ride</Text>
          </TouchableOpacity>
        </View>

        {/* Active Rides Banner */}
        {activeRides.length > 0 && (
          <TouchableOpacity
            style={styles.activeBanner}
            onPress={() => navigation.navigate('MultiKidDashboard')}
          >
            <Text style={styles.activeBannerIcon}>🚗</Text>
            <View>
              <Text style={styles.activeBannerTitle}>{activeRides.length} Active Ride{activeRides.length > 1 ? 's' : ''}</Text>
              <Text style={styles.activeBannerSub}>Tap to view all kids</Text>
            </View>
            <Text style={styles.activeBannerArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* Credit Balance Banner */}
        {creditBalance > 0 && (
          <TouchableOpacity style={styles.creditBanner} onPress={() => navigation.navigate('Credits')}>
            <Text style={styles.creditIcon}>💰</Text>
            <View>
              <Text style={styles.creditText}>{creditBalance.toLocaleString()} UGX available</Text>
              <Text style={styles.creditSub}>Use for rides or next term fees</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Kids</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MultiKidDashboard')}>
            <Text style={styles.seeAllText}>See All ›</Text>
          </TouchableOpacity>
        </View>

        {/* Kid Cards */}
        {kids.map(kid => (
          <KidCard
            key={kid._id}
            kid={kid}
            rides={rides}
            navigation={navigation}
            refresh={loadData}
          />
        ))}

        {/* Book New Ride Button */}
        <PrimaryButton
          title="+ Book School Ride"
          onPress={() => navigation.navigate('Booking')}
          variant="primary"
          style={styles.bookBtn}
        />

        {/* Quick Access Grid */}
        <Text style={[styles.sectionTitle, { marginTop: SPACING.md }]}>Quick Access</Text>
        <View style={styles.quickGrid}>
          <QuickAccessCard emoji="🏠" label="Family" onPress={() => navigation.navigate('FamilySharing')} />
          <QuickAccessCard emoji="🛡️" label="Safety Board" onPress={() => navigation.navigate('CommunityBoard')} />
          <QuickAccessCard emoji="💡" label="Feature Ideas" onPress={() => navigation.navigate('FeatureVoting')} />
          <QuickAccessCard emoji="🤖" label="Hamna AI" onPress={() => navigation.navigate('HamnaChat')} />
          <QuickAccessCard emoji="📝" label="Blog" onPress={() => navigation.navigate('CommunityBlog')} />
          <QuickAccessCard emoji="⚙️" label="Settings" onPress={() => navigation.navigate('Settings')} />
        </View>

        {/* Week at a Glance */}
        {todayRides.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: SPACING.md }]}>Today's Schedule</Text>
            <GlassCard style={styles.weekCard}>
              {todayRides.map(ride => {
                const m = getStatusMeta(ride.status);
                return (
                  <View key={ride._id} style={styles.todayRideRow}>
                    <Text style={styles.todayRideEmoji}>{m.emoji}</Text>
                    <View style={styles.todayRideInfo}>
                      <Text style={styles.todayRideKid}>
                        {ride.childId?.name || 'Child'} · {ride.type === 'school_morning' ? 'Morning Drop-off' : 'Afternoon Pickup'}
                      </Text>
                      <Text style={styles.todayRideTime}>
                        {formatTime(ride.scheduledPickupTime)}
                        {ride.driverId?.name ? ` · Driver: ${ride.driverId.name}` : ''}
                      </Text>
                    </View>
                    <StatusBadge status={ride.status} compact />
                  </View>
                );
              })}
            </GlassCard>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ─── Quick Access Card ────────────────────────────────
function QuickAccessCard({ emoji, label, onPress }) {
  return (
    <TouchableOpacity style={styles.quickCard} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.quickEmoji}>{emoji}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: SPACING.md, paddingTop: SPACING.sm },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: STATUS.safe,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 2,
  },
  famCard: {
    backgroundColor: 'rgba(21, 101, 192, 0.06)',
  },
  famIcon: { fontSize: 20, marginBottom: 2 },

  // Mode Toggle
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: BORDER_RADIUS.md,
    padding: 3,
    marginBottom: 12,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeActiveSchool: {
    backgroundColor: '#15803D',
  },
  modeActiveRide: {
    backgroundColor: '#1E40AF',
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  modeTextActive: {
    color: '#fff',
  },

  // Active Rides Banner
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: BORDER_RADIUS.md,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: BRAND.secondary,
  },
  activeBannerIcon: { fontSize: 24, marginRight: 12 },
  activeBannerTitle: { fontSize: 15, fontWeight: '700', color: BRAND.secondary },
  activeBannerSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  activeBannerArrow: { fontSize: 24, color: '#1E40AF', marginLeft: 'auto', fontWeight: '300' },

  // Credit Banner
  creditBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: BORDER_RADIUS.md,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: BRAND.gold,
  },
  creditIcon: { fontSize: 22, marginRight: 12 },
  creditText: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  creditSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
  },

  // Kid Card
  kidCard: {
    padding: 16,
    marginBottom: 12,
  },
  kidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kidInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  kidMeta: {},
  kidName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  kidClass: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },

  // Active Ride
  activeRide: {
    marginTop: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: BORDER_RADIUS.md,
    padding: 12,
  },
  rideInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rideEmoji: { fontSize: 28, marginRight: 12 },
  rideInfoText: {},
  rideStatusLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  rideTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  rideActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.sm,
  },
  actionPrimary: {
    backgroundColor: BRAND.primary,
  },
  actionPrimaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },

  // No Ride State
  noRideSection: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  noRideText: {
    fontSize: 13,
    color: '#757575',
    fontStyle: 'italic',
  },
  bookQuickBtn: {
    backgroundColor: 'rgba(21, 128, 61, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.sm,
  },
  bookQuickText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },

  // Pickup Code Section
  codeSection: {
    marginTop: 12,
  },
  codeDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
  },
  codeSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND.accent,
    marginBottom: 4,
  },
  codeHint: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
    marginBottom: 10,
  },
  currentCodeBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: BORDER_RADIUS.sm,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  currentCodeLabel: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '700',
    marginBottom: 2,
  },
  currentCode: {
    fontSize: 28,
    fontWeight: '800',
    color: BRAND.accent,
    marginBottom: 6,
  },
  codeReminder: {
    fontSize: 12,
    color: '#78350F',
    fontStyle: 'italic',
  },
  noCodeWarning: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 10,
    fontWeight: '500',
  },
  codeActions: {
    gap: 8,
  },
  randomWordBtn: {
    backgroundColor: BRAND.accent,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  randomWordText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  customWordRow: {
    flexDirection: 'row',
    gap: 8,
  },
  wordInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  setWordBtn: {
    backgroundColor: BRAND.primary,
    paddingHorizontal: 20,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
  },
  setWordText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Quick Access Grid
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  quickCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.md,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },

  // Today's Schedule
  weekCard: {
    padding: 12,
  },
  todayRideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  todayRideEmoji: { fontSize: 22, marginRight: 10 },
  todayRideInfo: { flex: 1 },
  todayRideKid: { fontSize: 14, fontWeight: '700', color: '#111827' },
  todayRideTime: { fontSize: 12, color: '#6B7280', marginTop: 1 },

  // Book Button
  bookBtn: {
    marginTop: 8,
  },

  // Loading State
  splashPulse: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  splashIcon: { fontSize: 32 },
  loadingText: { fontSize: 15, color: '#6B7280', marginBottom: 24 },
  skeletonRow: { width: '100%', paddingHorizontal: 16, gap: 12 },
  skeletonCard: {
    backgroundColor: '#E5E7EB',
    borderRadius: BORDER_RADIUS.md,
    padding: 20,
    gap: 8,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: '#D1D5DB',
    borderRadius: 7,
    width: '80%',
  },

  // Empty State
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
  emptyDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  exploreBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  exploreText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.secondary,
  },

  roleSwitcherBtn: {
    alignSelf: 'flex-end',
    marginBottom: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  roleSwitcherBtnText: {
    color: '#2E7D32',
    fontWeight: '800',
    fontSize: 12,
  },
});
