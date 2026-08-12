// PoleSafe Multi-Kid Dashboard v3 — All Kids in One View
// Better than Uber: see every kid's ride status at a glance
// From Home to School. And Beyond. 🚸

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import API_BASE from '../config';
import { BRAND, STATUS, getTheme, BORDER_RADIUS, SPACING } from '../theme';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';

// ─── Status Config ────────────────────────────────────
const STATUS_META = {
  scheduled: { bg: '#FFF3E0', text: '#E65100', icon: '⏳', label: 'Scheduled' },
  en_route: { bg: '#E3F2FD', text: '#1565C0', icon: '🚗', label: 'En Route' },
  picked_up: { bg: '#E8EAF6', text: '#3949AB', icon: '👧', label: 'On Board' },
  dropped_off: { bg: '#E8F5E9', text: '#2E7D32', icon: '📍', label: 'Arriving' },
  gate_confirmed: { bg: '#E8F5E9', text: '#2E7D32', icon: '✅', label: 'At School' },
  completed: { bg: '#F5F5F5', text: '#616161', icon: '✅', label: 'Completed' },
  arrived_home: { bg: '#E8F5E9', text: '#2E7D32', icon: '🏠', label: 'Home' },
  cancelled: { bg: '#FFEBEE', text: '#C62828', icon: '❌', label: 'Cancelled' },
  sick_day: { bg: '#F3E5F5', text: '#7B1FA2', icon: '🩺', label: 'Sick Day' },
};

const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' }) : '';

// ─── Kid Ride Card ────────────────────────────────────
function KidRideCard({ kid, ride, navigation }) {
  const meta = STATUS_META[ride?.status] || STATUS_META.scheduled;
  const kidName = ride?.childId?.name || kid?.name || 'Child';
  const isActive = ['scheduled', 'en_route', 'picked_up'].includes(ride?.status);
  const isComplete = ['completed', 'gate_confirmed', 'arrived_home'].includes(ride?.status);

  return (
    <GlassCard style={[kidStyles.card, isActive && kidStyles.activeCard]} elevated={isActive}>
      <View style={kidStyles.header}>
        <View style={kidStyles.avatarRow}>
          <View style={[kidStyles.avatar, { backgroundColor: isActive ? BRAND.primary : '#E5E7EB' }]}>
            <Text style={kidStyles.avatarText}>{kidName.charAt(0)}</Text>
          </View>
          <View style={kidStyles.info}>
            <Text style={kidStyles.name}>{kidName}</Text>
            <Text style={kidStyles.school}>{ride?.dropoffLocation || kid?.school || kid?.class || 'School'}</Text>
          </View>
        </View>
        <View style={[kidStyles.statusBadge, { backgroundColor: meta.bg }]}>
          <Text style={[kidStyles.statusText, { color: meta.text }]}>{meta.icon} {meta.label}</Text>
        </View>
      </View>

      {ride && (
        <View style={kidStyles.rideInfo}>
          <View style={kidStyles.rideDetail}>
            <Text style={kidStyles.detailIcon}>🕐</Text>
            <Text style={kidStyles.detailLabel}>{ride.type === 'school_morning' ? 'Pickup' : 'Drop-off'}</Text>
            <Text style={kidStyles.detailValue}>{formatTime(ride.scheduledPickupTime) || '--:--'}</Text>
          </View>
          {ride.driverId?.name && (
            <View style={kidStyles.rideDetail}>
              <Text style={kidStyles.detailIcon}>🚗</Text>
              <Text style={kidStyles.detailLabel}>Driver</Text>
              <Text style={kidStyles.detailValue}>{ride.driverId.name}</Text>
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={kidStyles.actions}>
        {ride && isActive && (
          <TouchableOpacity
            style={kidStyles.trackBtn}
            onPress={() => navigation.navigate('TrackRide', { rideId: ride._id })}
          >
            <Text style={kidStyles.trackBtnText}>📍 Track Live</Text>
          </TouchableOpacity>
        )}
        {ride && !isComplete && (
          <>
            <TouchableOpacity
              style={kidStyles.actionBtn}
              onPress={() => navigation.navigate('SickDay', { childId: ride.childId?._id || kid._id, childName: kidName })}
            >
              <Text style={kidStyles.actionText}>🩺 Sick</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={kidStyles.actionBtn}
              onPress={() => navigation.navigate('EarlyPickup', { childId: ride.childId?._id || kid._id, childName: kidName })}
            >
              <Text style={kidStyles.actionText}>🏃 Early</Text>
            </TouchableOpacity>
          </>
        )}
        {!ride && (
          <TouchableOpacity
            style={kidStyles.bookBtn}
            onPress={() => navigation.navigate('Booking', { childId: kid._id })}
          >
            <Text style={kidStyles.bookBtnText}>+ Book Ride</Text>
          </TouchableOpacity>
        )}
      </View>
    </GlassCard>
  );
}

const kidStyles = StyleSheet.create({
  card: { padding: 16, marginBottom: 12 },
  activeCard: { borderColor: BRAND.primary, borderWidth: 1.5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { fontSize: 20, color: '#fff', fontWeight: '700' },
  info: {},
  name: { fontSize: 17, fontWeight: '700', color: '#111827' },
  school: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  rideInfo: { marginTop: 12, gap: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  rideDetail: { flexDirection: 'row', alignItems: 'center' },
  detailIcon: { fontSize: 14, marginRight: 8, width: 20 },
  detailLabel: { fontSize: 12, color: '#9CA3AF', width: 60 },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#111827', flex: 1 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  trackBtn: { flex: 2, backgroundColor: BRAND.primary, paddingVertical: 10, borderRadius: BORDER_RADIUS.sm, alignItems: 'center' },
  trackBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  actionBtn: { flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 10, borderRadius: BORDER_RADIUS.sm, alignItems: 'center' },
  actionText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  bookBtn: { flex: 1, backgroundColor: 'rgba(46, 125, 50, 0.1)', paddingVertical: 10, borderRadius: BORDER_RADIUS.sm, alignItems: 'center' },
  bookBtnText: { fontSize: 13, fontWeight: '700', color: BRAND.primary },
});

// ─── Main Screen ──────────────────────────────────────
export default function MultiKidDashboard({ navigation }) {
  const [rides, setRides] = useState([]);
  const [kids, setKids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'completed'

  const fetchAll = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [kidsRes, ridesRes] = await Promise.all([
        fetch(`${API_BASE}/api/parents/kids`, { headers }),
        fetch(`${API_BASE}/api/parents/rides`, { headers }),
      ]);

      const kidsData = await kidsRes.json();
      const ridesData = await ridesRes.json();

      setKids(kidsData.kids || []);
      
      // Today's rides
      const today = new Date();
      const allRides = ridesData.rides || ridesData || [];
      const todayRides = allRides.filter(r => {
        if (!r.scheduledPickupTime) return false;
        const d = new Date(r.scheduledPickupTime);
        return d.toDateString() === today.toDateString();
      });
      setRides(todayRides);
    } catch (err) {
      console.log('Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]));

  const onRefresh = async () => { setRefreshing(true); await fetchAll(); setRefreshing(false); };

  // Merge kids with their rides
  const getKidRide = (kid) => rides.find(r => r.childId?._id === kid._id);

  const activeRides = rides.filter(r => ['scheduled', 'en_route', 'picked_up'].includes(r.status));
  const completedRides = rides.filter(r => ['completed', 'gate_confirmed', 'arrived_home', 'cancelled'].includes(r.status));

  let displayKids = kids;
  if (filter === 'active') displayKids = kids.filter(k => activeRides.some(r => r.childId?._id === k._id));
  if (filter === 'completed') displayKids = kids.filter(k => completedRides.some(r => r.childId?._id === k._id));

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: '#F0F2F5' }]}>
        <ActivityIndicator size="large" color={BRAND.primary} />
        <Text style={styles.loadingText}>Loading kids...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#F0F2F5' }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />}
      >
        {/* Summary Bar */}
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNum}>{kids.length}</Text>
            <Text style={styles.summaryLabel}>Kids</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNum, { color: STATUS.info }]}>{activeRides.length}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNum, { color: STATUS.safe }]}>{completedRides.length}</Text>
            <Text style={styles.summaryLabel}>Done</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNum, { color: '#9CA3AF' }]}>{kids.length - activeRides.length - completedRides.filter(r => kids.some(k => k._id === r.childId?._id)).length}</Text>
            <Text style={styles.summaryLabel}>No Ride</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {[
            { key: 'all', label: 'All Kids' },
            { key: 'active', label: `Active (${activeRides.length})` },
            { key: 'completed', label: `Completed` },
          ].map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterBtn, filter === f.key && styles.filterActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Kid Cards */}
        {displayKids.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>👶</Text>
            <Text style={styles.emptyTitle}>
              {filter === 'active' ? 'No Active Rides' : filter === 'completed' ? 'No Completed Rides' : 'No Kids Yet'}
            </Text>
            <Text style={styles.emptyDesc}>
              {filter !== 'all' ? 'Try a different filter' : 'Add your child to get started'}
            </Text>
            {filter === 'all' && (
              <PrimaryButton title="+ Add Child" onPress={() => navigation.navigate('AddChild')} />
            )}
          </GlassCard>
        ) : (
          displayKids.map(kid => (
            <KidRideCard
              key={kid._id}
              kid={kid}
              ride={getKidRide(kid)}
              navigation={navigation}
            />
          ))
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: SPACING.md },

  // Summary
  summaryBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS.md,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryNum: { fontSize: 24, fontWeight: '800', color: '#111827' },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginTop: 2 },

  // Filter
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterActive: {
    backgroundColor: BRAND.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#fff',
  },

  // Empty
  emptyCard: { padding: 32, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: '#6B7280', marginBottom: 20 },

  // Loading
  loadingText: { marginTop: 12, fontSize: 15, color: '#6B7280' },
});
