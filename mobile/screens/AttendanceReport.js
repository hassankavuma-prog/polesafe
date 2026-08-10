// PoleSafe Mobile — Attendance Report Screen
// Full attendance for all kids (PoleSafe + non-PoleSafe)

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE from '../config';

export default function AttendanceReport({ navigation }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const loadReport = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const schoolId = await AsyncStorage.getItem('polesafe_school_id');
      const res = await fetch(`${API_BASE}/api/schools/${schoolId}/attendance-report?date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.log('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReport();
    setRefreshing(false);
  };

  const getStatusColor = (attendance) => {
    switch (attendance) {
      case 'present': return '#2E7D32';
      case 'absent': return '#C62828';
      case 'late': return '#E65100';
      case 'sick': return '#6A1B9A';
      case 'excused': return '#0277BD';
      case 'no_data': return '#999';
      default: return '#999';
    }
  };

  const getStatusIcon = (attendance) => {
    switch (attendance) {
      case 'present': return '✅';
      case 'absent': return '❌';
      case 'late': return '⏰';
      case 'sick': return '🤒';
      case 'excused': return '📝';
      case 'no_data': return '❓';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1565C0" />
      </View>
    );
  }

  const stats = report?.stats || {};
  const attendance = report?.attendance || [];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.title}>📊 Attendance Report</Text>
      <Text style={styles.dateText}>{selectedDate}</Text>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statBox, { backgroundColor: '#E8F5E9' }]}>
          <Text style={[styles.statNum, { color: '#2E7D32' }]}>{stats.present || 0}</Text>
          <Text style={styles.statLabel}>Present ✅</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#FFEBEE' }]}>
          <Text style={[styles.statNum, { color: '#C62828' }]}>{stats.absent || 0}</Text>
          <Text style={styles.statLabel}>Absent ❌</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#FFF3E0' }]}>
          <Text style={[styles.statNum, { color: '#E65100' }]}>{stats.late || 0}</Text>
          <Text style={styles.statLabel}>Late ⏰</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#F3E5F5' }]}>
          <Text style={[styles.statNum, { color: '#6A1B9A' }]}>{stats.sick || 0}</Text>
          <Text style={styles.statLabel}>Sick 🤒</Text>
        </View>
      </View>

      {/* Tracking Info */}
      <View style={styles.trackingInfo}>
        <View style={styles.trackingRow}>
          <Text style={styles.trackingLabel}>🚗 Auto-tracked (PoleSafe):</Text>
          <Text style={styles.trackingValue}>{stats.poleSafeTracked || 0} kids</Text>
        </View>
        <View style={styles.trackingRow}>
          <Text style={styles.trackingLabel}>✍️ Manually recorded:</Text>
          <Text style={styles.trackingValue}>{stats.manuallyTracked || 0} kids</Text>
        </View>
        <View style={styles.trackingRow}>
          <Text style={styles.trackingLabel}>❓ No data yet:</Text>
          <Text style={styles.trackingValue}>{stats.noData || 0} kids</Text>
        </View>
      </View>

      {/* Full List */}
      <Text style={styles.sectionTitle}>All Children ({stats.total || 0})</Text>

      {attendance.map((kid, index) => (
        <View key={kid.childId || index} style={styles.kidCard}>
          <View style={styles.kidHeader}>
            <View style={styles.kidAvatar}>
              <Text style={styles.kidAvatarText}>{kid.childName?.charAt(0)}</Text>
            </View>
            <View style={styles.kidInfo}>
              <Text style={styles.kidName}>{kid.childName}</Text>
              <Text style={styles.kidClass}>{kid.class || 'No class'}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(kid.attendance) }]}>
              <Text style={styles.statusIcon}>{getStatusIcon(kid.attendance)}</Text>
            </View>
          </View>

          <View style={styles.kidDetails}>
            <Text style={styles.detailText}>
              👤 Parent: {kid.parentName} {kid.parentOnPoleSafe ? '(PoleSafe)' : '(No app)'}
            </Text>
            {kid.arrivalTime && (
              <Text style={styles.detailText}>
                🕒 Arrived: {new Date(kid.arrivalTime).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
            {kid.source && (
              <Text style={styles.detailText}>
                📍 Source: {kid.source === 'auto_ride' ? 'Auto-tracked (ride)' : 'Manual entry'}
              </Text>
            )}
            {kid.status === 'pending' && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>⏳ Awaiting school approval</Text>
              </View>
            )}
          </View>
        </View>
      ))}

      <View style={styles.helpCard}>
        <Text style={styles.helpTitle}>ℹ️ About Attendance Tracking</Text>
        <Text style={styles.helpText}>
          <Text style={{ fontWeight: '600' }}>Auto-tracked:</Text> Kids whose parents use PoleSafe and have booked rides.{'\n\n'}
          <Text style={{ fontWeight: '600' }}>Manual:</Text> Kids you've marked present/absent manually.{'\n\n'}
          <Text style={{ fontWeight: '600' }}>No data:</Text> Kids not yet tracked today (parents without app or no ride booked).
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 4 },
  dateText: { fontSize: 13, color: '#999', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statBox: { flex: 1, minWidth: '47%', padding: 14, borderRadius: 12, alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: '700' },
  statLabel: { fontSize: 11, color: '#666', marginTop: 4 },
  trackingInfo: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 16, elevation: 1 },
  trackingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  trackingLabel: { fontSize: 13, color: '#666' },
  trackingValue: { fontSize: 13, fontWeight: '600', color: '#333' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#333' },
  kidCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, elevation: 1 },
  kidHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  kidAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1565C0', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  kidAvatarText: { fontSize: 18, color: '#fff', fontWeight: '700' },
  kidInfo: { flex: 1 },
  kidName: { fontSize: 16, fontWeight: '600', color: '#333' },
  kidClass: { fontSize: 12, color: '#999', marginTop: 2 },
  statusBadge: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  statusIcon: { fontSize: 18 },
  kidDetails: { paddingLeft: 50 },
  detailText: { fontSize: 12, color: '#666', marginBottom: 3 },
  pendingBadge: { backgroundColor: '#FFF3E0', borderRadius: 6, padding: 6, marginTop: 4, alignSelf: 'flex-start' },
  pendingText: { fontSize: 11, fontWeight: '600', color: '#E65100' },
  helpCard: { backgroundColor: '#E3F2FD', borderRadius: 12, padding: 16, marginTop: 8 },
  helpTitle: { fontSize: 14, fontWeight: '600', color: '#1565C0', marginBottom: 8 },
  helpText: { fontSize: 12, color: '#333', lineHeight: 18 },
});
