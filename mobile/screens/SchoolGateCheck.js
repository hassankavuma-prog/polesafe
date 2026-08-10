// PoleSafe Mobile — School Gate Check-In Screen
// Track arriving kids at the school gate with status updates

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_BASE from '../config';
import { COLORS, getTheme, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme';
const ORANGE = COLORS.orange;

export default function SchoolGateCheck({ navigation }) {
  const theme = getTheme();
  const [arrivals, setArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadArrivals();
  }, []);

  const loadArrivals = async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const schoolId = await AsyncStorage.getItem('polesafe_school_id');
      const headers = { Authorization: `Bearer ${token}` };

      const res = await fetch(`${API_BASE}/api/schools/${schoolId}/arrivals`, {
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        setArrivals(data.arrivals || data.rides || []);
      }
    } catch (err) {
      console.log('Error loading arrivals:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadArrivals();
    setRefreshing(false);
  };

  const handleStatus = async (rideId, status) => {
    setActionLoading(rideId);
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const schoolId = await AsyncStorage.getItem('polesafe_school_id');
      const res = await fetch(`${API_BASE}/api/schools/${schoolId}/gate-checkin`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rideId, status }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Update failed');
      }

      Alert.alert(
        status === 'received' ? 'Checked In ✅' : 'Marked Missing ❓',
        status === 'received'
          ? 'Kid has been checked in at the gate.'
          : 'This kid has been marked as missing. Parent will be notified.'
      );

      await loadArrivals();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const expected = arrivals.length;
  const arrived = arrivals.filter(a => a.status === 'gate_confirmed' || a.status === 'received').length;
  const missing = arrivals.filter(a => a.status === 'missing').length;
  const progressPct = expected > 0 ? (arrived / expected) * 100 : 0;

  if (loading) {
    return (
      <View style={[styles.centerContainer, {backgroundColor: theme.canvas}]}>
        <ActivityIndicator size="large" color={ORANGE} />
        <Text style={styles.loadingText}>Loading arrivals...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: theme.canvas}]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Progress Header */}
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>🚪 Morning Arrivals</Text>
        <Text style={styles.progressCount}>
          {arrived} / {expected} checked in
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>
        <View style={styles.progressStats}>
          <View style={styles.progressStat}>
            <Text style={[styles.progressNum, { color: COLORS.green }]}>{arrived}</Text>
            <Text style={styles.progressLabel}>Arrived ✅</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={[styles.progressNum, { color: ORANGE }]}>{expected - arrived - missing}</Text>
            <Text style={styles.progressLabel}>Pending ⏳</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={[styles.progressNum, { color: COLORS.red }]}>{missing}</Text>
            <Text style={styles.progressLabel}>Missing ❓</Text>
          </View>
        </View>
      </View>

      {/* Arrivals List */}
      <Text style={styles.sectionTitle}>Expected Arrivals</Text>

      {arrivals.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🚪</Text>
          <Text style={styles.emptyText}>No arrivals expected right now</Text>
        </View>
      ) : (
        arrivals.map((item) => {
          const kid = item.childId || item.child || {};
          const driver = item.driverId || item.driver || {};
          const isReceived = item.status === 'gate_confirmed' || item.status === 'received';
          const isMissing = item.status === 'missing';
          const isPending = !isReceived && !isMissing;

          return (
            <View
              key={item._id}
              style={[
                styles.arrivalCard,
                isReceived && styles.arrivalReceived,
                isMissing && styles.arrivalMissing,
              ]}
            >
              {/* Kid Row */}
              <View style={styles.arrivalRow}>
                {/* Photo Placeholder */}
                <View style={[
                  styles.photoPlaceholder,
                  { backgroundColor: isReceived ? COLORS.greenBg : isMissing ? COLORS.redBg : COLORS.orangeBg },
                ]}>
                  <Text style={styles.photoText}>
                    {(kid.name || '?').charAt(0)}
                  </Text>
                </View>

                {/* Info */}
                <View style={styles.arrivalInfo}>
                  <Text style={styles.arrivalName}>{kid.name || 'Unknown'}</Text>
                  <Text style={styles.arrivalClass}>{kid.class || kid.grade || ''}</Text>
                  <View style={styles.arrivalDriver}>
                    <Text style={styles.arrivalDriverText}>
                      🚗 {driver.name || 'Assigning...'}
                    </Text>
                    {item.scheduledPickupTime && (
                      <Text style={styles.arrivalTime}>
                        {new Date(item.scheduledPickupTime).toLocaleTimeString('en-UG', {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Status */}
                {isReceived && <Text style={styles.statusReceived}>✅</Text>}
                {isMissing && <Text style={styles.statusMissing}>❓</Text>}
                {isPending && <Text style={styles.statusPending}>⏳</Text>}
              </View>

              {/* Action Buttons */}
              {isPending && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.receivedBtn]}
                    onPress={() => handleStatus(item._id, 'received')}
                    disabled={actionLoading === item._id}
                  >
                    {actionLoading === item._id ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.actionBtnText}>✅ Received</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.missingBtn]}
                    onPress={() => handleStatus(item._id, 'missing')}
                    disabled={actionLoading === item._id}
                  >
                    {actionLoading === item._id ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.actionBtnText}>❓ Missing</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Already processed */}
              {isReceived && (
                <TouchableOpacity
                  style={styles.processedBtn}
                  onPress={() => handleStatus(item._id, 'pending')}
                >
                  <Text style={styles.processedBtnText}>Undo</Text>
                </TouchableOpacity>
              )}
              {isMissing && (
                <TouchableOpacity
                  style={styles.processedBtn}
                  onPress={() => handleStatus(item._id, 'received')}
                >
                  <Text style={[styles.processedBtnText, { color: COLORS.green }]}>
                    ✅ Mark as Received
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas, padding: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.canvas },
  loadingText: { marginTop: 12, color: COLORS.textSecondary, fontSize: 14 },

  // Progress
  progressCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 14, elevation: 2 },
  progressTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  progressCount: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 12 },
  progressBar: { height: 10, backgroundColor: '#f0f0f0', borderRadius: 5, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', backgroundColor: ORANGE, borderRadius: 5 },
  progressStats: { flexDirection: 'row', justifyContent: 'space-around' },
  progressStat: { alignItems: 'center' },
  progressNum: { fontSize: 24, fontWeight: '700' },
  progressLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },

  // Section
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },

  // Empty
  emptyCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 32, alignItems: 'center', elevation: 1 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: COLORS.textMuted },

  // Arrival Card
  arrivalCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  arrivalReceived: { borderLeftWidth: 4, borderLeftColor: COLORS.green },
  arrivalMissing: { borderLeftWidth: 4, borderLeftColor: COLORS.red },
  arrivalRow: { flexDirection: 'row', alignItems: 'center' },

  // Photo
  photoPlaceholder: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  photoText: { fontSize: 20, fontWeight: '700', color: ORANGE },

  // Info
  arrivalInfo: { flex: 1 },
  arrivalName: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  arrivalClass: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  arrivalDriver: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  arrivalDriverText: { fontSize: 12, color: COLORS.textSecondary, flex: 1 },
  arrivalTime: { fontSize: 11, color: COLORS.textMuted },

  // Status
  statusReceived: { fontSize: 22 },
  statusMissing: { fontSize: 22 },
  statusPending: { fontSize: 22 },

  // Actions
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  receivedBtn: { backgroundColor: COLORS.green },
  missingBtn: { backgroundColor: COLORS.red },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  processedBtn: { alignItems: 'center', marginTop: 8 },
  processedBtnText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
});
