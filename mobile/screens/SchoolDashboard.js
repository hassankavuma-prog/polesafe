// PoleSafe Mobile — School Dashboard
// Arrival tracking, broadcasts, gate check-in, sick reports

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://api.polesafe.ug';

export default function SchoolDashboard({ navigation }) {
  const [dashboard, setDashboard] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const schoolId = await AsyncStorage.getItem('polesafe_school_id');

      const res = await fetch(`${API_URL}/api/schools/${schoolId}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDashboard(data);
    } catch (err) {
      console.log('Error loading school dashboard:', err);
    }
  };

  useEffect(() => { loadDashboard(); }, []);
  const onRefresh = async () => { setRefreshing(true); await loadDashboard(); setRefreshing(false); };

  const attendance = dashboard?.attendance || {};

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* School Name */}
      <Text style={styles.schoolName}>{dashboard?.schoolId || 'St Mary's School'}</Text>
      <Text style={styles.dateText}>Today • {dashboard?.date || new Date().toISOString().split('T')[0]}</Text>

      {/* Attendance Stats */}
      <View style={styles.attendanceGrid}>
        <View style={[styles.attendBox, { backgroundColor: '#E8F5E9' }]}>
          <Text style={[styles.attendNum, { color: '#2E7D32' }]}>{attendance.arrived || 0}</Text>
          <Text style={styles.attendLabel}>Arrived ✅</Text>
        </View>
        <View style={[styles.attendBox, { backgroundColor: '#FFF3E0' }]}>
          <Text style={[styles.attendNum, { color: '#E65100' }]}>{attendance.onRoute || 0}</Text>
          <Text style={styles.attendLabel}>On Route 🚗</Text>
        </View>
        <View style={[styles.attendBox, { backgroundColor: '#FFEBEE' }]}>
          <Text style={[styles.attendNum, { color: '#C62828' }]}>{attendance.missing || 0}</Text>
          <Text style={styles.attendLabel}>Missing ❓</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Broadcast')}>
        <Text style={styles.actionIcon}>📢</Text>
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>Send Broadcast</Text>
          <Text style={styles.actionSub}>Half day, closure, emergency — one tap notifies everyone</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('GateCheck')}>
        <Text style={styles.actionIcon}>🚪</Text>
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>Gate Check-In</Text>
          <Text style={styles.actionSub}>Confirm arriving kids at the gate</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Detention')}>
        <Text style={styles.actionIcon}>⏰</Text>
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>Detention / Late Pickup</Text>
          <Text style={styles.actionSub}>Update pickup time — driver + parent notified</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
      </TouchableOpacity>

      {/* Sick Kid Alert */}
      <TouchableOpacity style={styles.sickCard}>
        <Text style={styles.sickTitle}>🩺 Report Sick Kid</Text>
        <Text style={styles.sickSub}>Tap when a kid is unwell — parent will be notified with options</Text>
      </TouchableOpacity>

      {/* Recent Broadcasts */}
      {dashboard?.recentBroadcasts?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent Announcements</Text>
          {dashboard.recentBroadcasts.map((b, i) => (
            <View key={b._id || i} style={styles.broadcastRow}>
              <Text style={styles.broadcastIcon}>
                {b.type === 'half_day' ? '🚩' : b.type === 'school_closed' ? '❄️' : b.type === 'emergency' ? '🚨' : '📢'}
              </Text>
              <View style={styles.broadcastInfo}>
                <Text style={styles.broadcastMsg} numberOfLines={2}>{b.message}</Text>
                <Text style={styles.broadcastTime}>
                  {new Date(b.createdAt).toLocaleString('en-UG')} • {b.parentCount} parents
                </Text>
              </View>
            </View>
          ))}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  schoolName: { fontSize: 22, fontWeight: '700', color: '#333' },
  dateText: { fontSize: 13, color: '#999', marginBottom: 16 },
  attendanceGrid: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  attendBox: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  attendNum: { fontSize: 32, fontWeight: '700' },
  attendLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#333' },
  actionCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 8, elevation: 1 },
  actionIcon: { fontSize: 28, marginRight: 14 },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '600' },
  actionSub: { fontSize: 12, color: '#999', marginTop: 2 },
  arrow: { fontSize: 18, color: '#ccc' },
  sickCard: { backgroundColor: '#FFF3E0', borderRadius: 12, padding: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#E65100' },
  sickTitle: { fontSize: 15, fontWeight: '600', color: '#E65100' },
  sickSub: { fontSize: 12, color: '#666', marginTop: 4 },
  broadcastRow: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8 },
  broadcastIcon: { fontSize: 20, marginRight: 10 },
  broadcastInfo: { flex: 1 },
  broadcastMsg: { fontSize: 13, color: '#333' },
  broadcastTime: { fontSize: 11, color: '#999', marginTop: 2 },
});
