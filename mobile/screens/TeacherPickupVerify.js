// PoleSafe Mobile — Teacher Pickup Verification Screen
// Teacher verifies driver's identity before releasing child

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE from '../config';
import { COLORS, getTheme } from '../theme';
import { enqueueOfflineEvent, flushOfflineQueue } from '../services/offlineSyncService';

const GREEN = COLORS.green;

export default function TeacherPickupVerify({ navigation }) {
  const theme = getTheme();
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, verified: 0, total: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const fetchPickups = async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const schoolId = await AsyncStorage.getItem('polesafe_school_id');
      const res = await fetch(`${API_BASE}/api/safety/teacher-pickups/${schoolId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPickups(data.pickups || []);
      setStats({ pending: data.pending, verified: data.verified, total: data.total });
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchPickups(); }, []);

  const handleVerifyDriver = async (rideId, childName) => {
    Alert.alert(
      'Verify Driver',
      `Has the PoleSafe driver shown their ID and is authorized to pick up ${childName}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: '✅ Release Child',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('polesafe_token');
              const body = { rideId, teacherName: 'School Staff' };
              const payload = {
                type: 'teacher_release',
                rideId,
                payload: body,
                createdAt: new Date().toISOString(),
                source: 'teacher-pickup-verify',
              };
              await enqueueOfflineEvent('TEACHER_RELEASE', payload, { rideId, source: 'teacher-pickup-verify', priority: 'high' });
              try {
                const res = await fetch(`${API_BASE}/api/safety/classroom-handover`, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(body),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to release child');
                Alert.alert('✅ Child Released', data.message);
              } catch (err) {
                await flushOfflineQueue({ socketConnected: false, token });
                Alert.alert('Queued', 'Release was queued and will sync when connection returns.');
              }
              fetchPickups();
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={GREEN} />
        <Text style={styles.loadingText}>Loading afternoon pickups...</Text>
      </View>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified_by_teacher': return COLORS.greenLight;
      case 'completed': return '#1976D2';
      default: return '#FF9800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'verified_by_teacher': return '✅ Teacher Released';
      case 'completed': return '✅ Picked Up';
      default: return '⏳ Awaiting Driver';
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.canvas }]} keyboardShouldPersistTaps="handled">
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: COLORS.orangeBg }]}>
          <Text style={styles.statNumber}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Awaiting</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.greenBg }]}>
          <Text style={[styles.statNumber, { color: COLORS.green }]}>{stats.verified}</Text>
          <Text style={styles.statLabel}>Released</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.blueBg }]}>
          <Text style={[styles.statNumber, { color: COLORS.blue }]}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      <View style={styles.instructionCard}>
        <Text style={styles.instructionTitle}>👩🏫 Classroom Pickup Procedure</Text>
        <Text style={styles.instructionText}>
          1. PoleSafe driver arrives at the classroom door{'
'}
          2. Driver shows their PoleSafe ID badge{'
'}
          3. Tap the child below to verify + release{'
'}
          4. Child leaves with the verified driver
        </Text>
      </View>

      {pickups.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No afternoon pickups scheduled for today</Text>
        </View>
      ) : (
        pickups.map((p) => (
          <TouchableOpacity
            key={p.rideId}
            style={[styles.pickupCard, p.classroomStatus !== 'pending' && styles.pickupCardDone]}
            onPress={() => { if (p.classroomStatus === 'pending') handleVerifyDriver(p.rideId, p.childName); }}
            disabled={p.classroomStatus !== 'pending'}
          >
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(p.classroomStatus) }]} />
            <View style={styles.pickupContent}>
              <Text style={styles.childName}>{p.childName}</Text>
              <Text style={styles.childClass}>Class: {p.childClass}</Text>
              <View style={styles.driverInfo}>
                <Text style={styles.driverLabel}>🚗 Driver: {p.driverName}</Text>
                <Text style={styles.driverId}>ID: {p.driverIdNumber}</Text>
              </View>
              {p.pickupWord && <Text style={styles.codeBadge}>🔐 Word: {p.pickupWord}</Text>}
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(p.classroomStatus) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(p.classroomStatus) }]}>{getStatusLabel(p.classroomStatus)}</Text>
              </View>
            </View>
            {p.classroomStatus === 'pending' && <Text style={styles.tapHint}>Tap to verify →</Text>}
          </TouchableOpacity>
        ))
      )}

      <TouchableOpacity style={styles.refreshBtn} onPress={() => { setRefreshing(true); fetchPickups(); }}>
        {refreshing ? <ActivityIndicator color={GREEN} size="small" /> : <Text style={styles.refreshText}>🔄 Refresh</Text>}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: COLORS.textSecondary, fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', elevation: 1 },
  statNumber: { fontSize: 28, fontWeight: '800', color: COLORS.orange },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  instructionCard: { backgroundColor: COLORS.greenBg, borderRadius: 12, padding: 16, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: GREEN },
  instructionTitle: { fontSize: 15, fontWeight: '700', color: GREEN, marginBottom: 8 },
  instructionText: { fontSize: 13, color: '#444', lineHeight: 20 },
  emptyCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 40, alignItems: 'center', elevation: 1 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
  pickupCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 1, borderLeftWidth: 4, borderLeftColor: '#FF9800' },
  pickupCardDone: { opacity: 0.75 },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  pickupContent: { flex: 1 },
  childName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  childClass: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  driverInfo: { marginTop: 8 },
  driverLabel: { fontSize: 12, color: COLORS.textPrimary, fontWeight: '600' },
  driverId: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  codeBadge: { marginTop: 8, fontSize: 12, color: GREEN, fontWeight: '700' },
  statusBadge: { marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '700' },
  tapHint: { fontSize: 12, color: GREEN, fontWeight: '700', marginLeft: 8 },
  refreshBtn: { marginTop: 10, alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 16 },
  refreshText: { color: GREEN, fontWeight: '700' },
});
