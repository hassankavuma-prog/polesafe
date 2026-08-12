// PoleSafe Student Roster Screen v1
// Per-student attendance view with status badges, quick actions
// Schools see who boarded, who arrived, who's missing — by name, not by count
// From Home to School. And Beyond. 🚸

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, TextInput, Alert, ActivityIndicator, Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_BASE from '../config';
import { BRAND, STATUS, getTheme, BORDER_RADIUS, SPACING } from '../theme';
import GlassCard from '../components/GlassCard';

const API_URL = API_BASE;

// ─── Status Config ───────────────────────────────────
const STATUS_CONFIG = {
  boarded:     { label: 'Boarded Bus',   badge: '🚌 Boarded Bus #',   bg: '#E8F5E9',  color: '#2E7D32' },
  arrived:     { label: 'Arrived at Gate', badge: '🎒 Safely Arrived at Gate', bg: '#E3F2FD', color: '#1565C0' },
  expected:    { label: 'Expected',      badge: '⏳ Expected at Bus Stop',  bg: '#FFF8E1', color: '#F57F17' },
  absent:      { label: 'Absent',        badge: '🏠 Absent / Parent Drop-Off', bg: '#F3F4F6', color: '#6B7280' },
  sick:        { label: 'Sick Day',      badge: '🩺 Sick Day', bg: '#FCE4EC', color: '#C62828' },
  pending_pin: { label: 'Awaiting PIN',  badge: '🔑 Awaiting PIN Verification', bg: '#F3E5F5', color: '#7B1FA2' },
};

// ─── Student Card ────────────────────────────────────
function StudentCard({ student, onCall, onViewPin }) {
  const config = STATUS_CONFIG[student.status] || STATUS_CONFIG.expected;
  const initials = (student.name || '??').split(' ').map(s => s[0]).join('').substring(0, 2).toUpperCase();

  return (
    <GlassCard style={[sCard.card, { borderLeftColor: config.color, borderLeftWidth: 4 }]}>
      {/* Row 1: Avatar + Name + Status */}
      <View style={sCard.row}>
        {/* Avatar */}
        <View style={[sCard.avatar, { backgroundColor: config.bg }]}>
          <Text style={[sCard.avatarText, { color: config.color }]}>{initials}</Text>
        </View>

        {/* Details */}
        <View style={sCard.details}>
          <Text style={sCard.name}>{student.name || 'Unknown Student'}</Text>
          <Text style={sCard.meta}>
            {student.grade ? `${student.grade}  ·  ` : ''}
            Bus #{student.route || '—'}
          </Text>
        </View>

        {/* Status Badge */}
        <View style={[sCard.statusBadge, { backgroundColor: config.bg }]}>
          <Text style={[sCard.statusText, { color: config.color }]}>{config.badge}</Text>
          {student.boardedTime && (
            <Text style={[sCard.statusTime, { color: config.color }]}> — {student.boardedTime}</Text>
          )}
        </View>
      </View>

      {/* Row 2: Quick Actions */}
      <View style={sCard.actions}>
        {student.parentPhone ? (
          <TouchableOpacity
            style={sCard.actionBtn}
            onPress={() => onCall(student.parentPhone, student.name)}
            activeOpacity={0.7}
          >
            <Text style={sCard.actionIcon}>📞</Text>
            <Text style={sCard.actionLabel}>Call Parent</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={sCard.actionBtn}
          onPress={() => onViewPin(student)}
          activeOpacity={0.7}
        >
          <Text style={sCard.actionIcon}>🔑</Text>
          <Text style={sCard.actionLabel}>View PIN</Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
}

const sCard = StyleSheet.create({
  card: { padding: 12, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 15, fontWeight: '800' },
  details: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, maxWidth: 140,
  },
  statusText: { fontSize: 9, fontWeight: '700' },
  statusTime: { fontSize: 9, fontWeight: '600', marginTop: 1 },
  actions: {
    flexDirection: 'row', gap: 8, marginTop: 10,
    borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB',
  },
  actionIcon: { fontSize: 14, marginRight: 4 },
  actionLabel: { fontSize: 11, fontWeight: '600', color: '#374151' },
});

// ─── Stats Row ───────────────────────────────────────
function StatsBar({ total, tracked, onTime, alerts }) {
  return (
    <View style={stats.bar}>
      <StatBox value={tracked} total={total} label="Tracked" color={BRAND.teal} />
      <StatBox value={alerts <= 2 ? 0 : alerts} total={alerts} label="Alerts" color={alerts > 0 ? BRAND.danger : BRAND.teal} />
      <StatBox value={`${onTime}`} label="On-Time" color={onTime >= 90 ? BRAND.teal : BRAND.warning} />
    </View>
  );
}

function StatBox({ value, total, label, color }) {
  return (
    <View style={stats.box}>
      <Text style={[stats.value, { color }]}>{value}{total != null ? `/${total}` : '%'}</Text>
      <Text style={stats.label}>{label}</Text>
    </View>
  );
}

const stats = StyleSheet.create({
  bar: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  box: {
    flex: 1, backgroundColor: '#F9FAFB', borderRadius: BORDER_RADIUS.md,
    padding: 12, alignItems: 'center',
  },
  value: { fontSize: 22, fontWeight: '800' },
  label: { fontSize: 10, fontWeight: '600', color: '#6B7280', marginTop: 2 },
});

// ─── Main Screen ─────────────────────────────────────
export default function StudentRosterScreen({ navigation }) {
  const theme = getTheme();
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const loadStudents = async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const schoolId = await AsyncStorage.getItem('polesafe_school_id');
      const id = schoolId || 'demo';

      const res = await fetch(`${API_URL}/api/schools/${id}/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      } else {
        // Demo data
        setStudents(DEMO_STUDENTS);
      }
    } catch (err) {
      setStudents(DEMO_STUDENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setLoading(true); loadStudents().finally(() => setLoading(false)); }, []);
  const onRefresh = async () => { setRefreshing(true); await loadStudents(); setRefreshing(false); };

  // Filter students
  useEffect(() => {
    let list = students;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.grade || '').toLowerCase().includes(q) ||
        (s.route || '').toString().includes(q)
      );
    }
    if (filterStatus !== 'all') {
      list = list.filter(s => s.status === filterStatus);
    }
    setFiltered(list);
  }, [students, search, filterStatus]);

  const handleCall = (phone, name) => {
    const cleaned = phone.replace(/[\s\-]/g, '');
    Linking.openURL(`tel:${cleaned}`).catch(() =>
      Alert.alert('📞 Call', `Call ${cleaned} (${name}'s parent)`)
    );
  };

  const handleViewPin = (student) => {
    if (student.pickupPin) {
      Alert.alert(
        '🔑 Child Safety PIN',
        `${student.name}'s pickup PIN: ${student.pickupPin}\n\nDriver must say this word before child gets in.`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('No PIN', `${student.name} has no pickup PIN set.`);
    }
  };

  // ─── Stats ───────────────────────────────────────────
  const total = students.length;
  const tracked = students.filter(s => ['boarded', 'arrived', 'pending_pin'].includes(s.status)).length;
  const onTime = total > 0 ? Math.round((students.filter(s => ['boarded', 'arrived'].includes(s.status)).length / total) * 100) : 0;
  const alerts = students.filter(s => ['absent', 'sick'].includes(s.status)).length;

  // ─── Filter Bubbles ──────────────────────────────────
  const STATUS_FILTERS = [
    { key: 'all', label: 'All', icon: '📋' },
    { key: 'boarded', label: 'Boarded', icon: '🚌' },
    { key: 'arrived', label: 'Arrived', icon: '🎒' },
    { key: 'expected', label: 'Expected', icon: '⏳' },
    { key: 'absent', label: 'Absent', icon: '🏠' },
    { key: 'sick', label: 'Sick', icon: '🩺' },
  ];

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.canvas }]}>
        <View style={styles.loadingCircle}><Text style={{ fontSize: 40 }}>📋</Text></View>
        <Text style={styles.loadingText}>Loading student roster...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.canvas }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.teal} />}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 Student Roster</Text>
        <Text style={styles.headerSub}>{total} students enrolled</Text>
      </View>

      {/* Stats */}
      <StatsBar total={total} tracked={tracked} onTime={onTime} alerts={alerts} />

      {/* Search */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, grade, or bus..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Status Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filterStatus === f.key && { backgroundColor: BRAND.teal }]}
            onPress={() => setFilterStatus(f.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.filterIcon}>{f.icon}</Text>
            <Text style={[styles.filterText, filterStatus === f.key && { color: '#fff' }]}>{f.label}</Text>
            {f.key !== 'all' && (
              <Text style={[styles.filterCount, filterStatus === f.key && { color: '#E0F2FE' }]}>
                {students.filter(s => s.status === f.key).length}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Student List */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>
            {search ? 'No students match your search' : 'No students found'}
          </Text>
        </View>
      ) : (
        filtered.map((s, i) => (
          <StudentCard
            key={s._id || s.id || i}
            student={s}
            onCall={handleCall}
            onViewPin={handleViewPin}
          />
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Demo Students ───────────────────────────────────
const DEMO_STUDENTS = [
  { id: 's1', name: 'Sarah Nakato', grade: 'P.5', route: '3', status: 'arrived', parentPhone: '+256 772 345 678', pickupPin: '4821', boardedTime: '7:12 AM' },
  { id: 's2', name: 'James Okello', grade: 'P.7', route: '2', status: 'boarded', parentPhone: '+256 701 234 567', pickupPin: '1092', boardedTime: '6:45 AM' },
  { id: 's3', name: 'Amina Nalwoga', grade: 'P.4', route: '1', status: 'expected', parentPhone: '+256 775 678 901', pickupPin: '7314' },
  { id: 's4', name: 'Daniel Ssempijja', grade: 'P.6', route: '3', status: 'absent', parentPhone: '+256 702 345 678', pickupPin: '5520' },
  { id: 's5', name: 'Grace Nabatanzi', grade: 'P.3', route: '1', status: 'boarded', parentPhone: '+256 773 456 789', pickupPin: '8831', boardedTime: '6:55 AM' },
  { id: 's6', name: 'Peter Mukasa', grade: 'P.7', route: '2', status: 'arrived', parentPhone: '+256 782 345 678', pickupPin: '2468', boardedTime: '7:20 AM' },
  { id: 's7', name: 'Faith Nakimuli', grade: 'P.5', route: '1', status: 'pending_pin', parentPhone: '+256 776 543 210', pickupPin: '5793' },
  { id: 's8', name: 'Isaac Lubwama', grade: 'P.4', route: '3', status: 'sick', parentPhone: '+256 788 234 567', pickupPin: '3157' },
  { id: 's9', name: 'Mary Nantongo', grade: 'P.6', route: '2', status: 'expected', parentPhone: '+256 703 456 789', pickupPin: '9902' },
  { id: 's10', name: 'Samuel Kato', grade: 'P.3', route: '1', status: 'boarded', parentPhone: '+256 774 567 890', pickupPin: '4218', boardedTime: '6:50 AM' },
];

// ─── Styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: SPACING.md },

  // Header
  header: { marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  headerSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 12, height: 44,
    borderWidth: 1, borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  clearBtn: { fontSize: 16, color: '#9CA3AF', fontWeight: '600', paddingHorizontal: 4 },

  // Filter
  filterRow: { marginBottom: 14, flexGrow: 0 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#E5E7EB',
  },
  filterIcon: { fontSize: 12, marginRight: 4 },
  filterText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  filterCount: { fontSize: 11, color: '#9CA3AF', marginLeft: 4, fontWeight: '700' },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },

  // Loading
  loadingCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(0, 137, 123, 0.1)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  loadingText: { fontSize: 15, color: '#6B7280' },
});
