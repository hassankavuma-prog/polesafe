// PoleSafe Mobile — School Dashboard
// Arrival tracking, broadcasts, gate check-in, sick reports

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_BASE from '../config';
const API_URL = API_BASE;

export default function SchoolDashboard({ navigation }) {
  const [dashboard, setDashboard] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [sendingSms, setSendingSms] = useState(false);

  const loadDashboard = async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const schoolId = await AsyncStorage.getItem('polesafe_school_id');

      const res = await fetch(`${API_URL}/api/schools/${schoolId}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDashboard(data);

      // Load pending children count
      const pendingRes = await fetch(`${API_URL}/api/schools/${schoolId}/pending-children`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        setPendingCount(pendingData.total || 0);
      }
    } catch (err) {
      console.log('Error loading school dashboard:', err);
    }
  };

  useEffect(() => { loadDashboard(); }, []);
  const onRefresh = async () => { setRefreshing(true); await loadDashboard(); setRefreshing(false); };

  const handleSendAttendance = async () => {
    Alert.alert(
      'Send Attendance SMS',
      "This will send today's attendance report to all parents via SMS. Continue?",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SMS',
          onPress: async () => {
            setSendingSms(true);
            try {
              const token = await AsyncStorage.getItem('polesafe_token');
              const schoolId = await AsyncStorage.getItem('polesafe_school_id');
              const res = await fetch(`${API_URL}/api/schools/${schoolId}/send-attendance-sms`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
              });
              const data = await res.json();
              Alert.alert('Attendance SMS Sent 📋', data.message || 'Done!');
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setSendingSms(false);
            }
          },
        },
      ]
    );
  };

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

      <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('TeacherPickupVerify')}>
        <Text style={styles.actionIcon}>👩‍🏫</Text>
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>Pickup Verification</Text>
          <Text style={styles.actionSub}>Verify drivers before releasing kids</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('PendingChildren')}>
        <Text style={styles.actionIcon}>👋</Text>
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>Pending Children</Text>
          <Text style={styles.actionSub}>Approve new kids registered by parents</Text>
        </View>
        {pendingCount > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
          </View>
        )}
        <Text style={styles.arrow}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('AttendanceReport')}>
        <Text style={styles.actionIcon}>📊</Text>
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>Attendance Report</Text>
          <Text style={styles.actionSub}>Full attendance for all kids (PoleSafe + non-PoleSafe)</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionCard} onPress={handleSendAttendance}>
        <Text style={styles.actionIcon}>📋</Text>
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>Send Attendance SMS</Text>
          <Text style={styles.actionSub}>End-of-day attendance report to all parents via SMS</Text>
        </View>
        {sendingSms && <ActivityIndicator color="#E65100" size="small" />}
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
  pendingBadge: { backgroundColor: '#C62828', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  pendingBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
