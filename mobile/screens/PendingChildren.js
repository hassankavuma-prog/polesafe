// PoleSafe Mobile — Pending Children Screen
// School approves or rejects kids registered by parents

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE from '../config';
import { COLORS, getTheme, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme';

export default function PendingChildren({ navigation }) {
  const theme = getTheme();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPending = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const schoolId = await AsyncStorage.getItem('polesafe_school_id');
      const res = await fetch(`${API_BASE}/api/schools/${schoolId}/pending-children`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPending(data.pending || []);
      }
    } catch (err) {
      console.log('Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPending(); }, [loadPending]);

  const handleAction = async (childId, action, childName) => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const schoolId = await AsyncStorage.getItem('polesafe_school_id');
      const res = await fetch(`${API_BASE}/api/schools/${schoolId}/approve-child/${childId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        Alert.alert(action === 'approve' ? '✅ Approved' : '❌ Rejected', `${childName} has been ${action === 'approve' ? 'added to' : 'removed from'} the school.`);
        loadPending();
      } else {
        const err = await res.json();
        Alert.alert('Error', err.error);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1565C0" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadPending(); setRefreshing(false); }} />}>
      <Text style={styles.title}>👋 New Children Awaiting Approval</Text>
      <Text style={styles.subtitle}>Parents registered these kids. Verify and approve.</Text>

      {pending.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyText}>No pending children</Text>
          <Text style={styles.emptySub}>All parent-registered kids have been handled.</Text>
        </View>
      ) : (
        <Text style={styles.countBadge}>{pending.length} pending</Text>
      )}

      {pending.map((child) => (
        <View key={child._id} style={styles.childCard}>
          <View style={styles.childHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{child.name?.charAt(0)}</Text>
            </View>
            <View style={styles.childInfo}>
              <Text style={styles.childName}>{child.name}</Text>
              <Text style={styles.childClass}>{child.class || 'No class set'}</Text>
            </View>
          </View>

          <View style={styles.parentInfo}>
            <Text style={styles.parentLabel}>👤 Registered by parent:</Text>
            <Text style={styles.parentName}>{child.parentId?.name || 'Unknown'}</Text>
            <Text style={styles.parentPhone}>{child.parentId?.phone || ''}</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.approveBtn} onPress={() => handleAction(child._id, 'approve', child.name)}>
              <Text style={styles.approveText}>✅ Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => handleAction(child._id, 'reject', child.name)}>
              <Text style={styles.rejectText}>❌ Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>ℹ️ How it works</Text>
        <Text style={styles.infoText}>When a parent signs up on PoleSafe and adds their child, the child appears here as "pending". You verify the details and approve. Once approved, the child is included in your attendance reports and the parent can book rides.</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas, padding: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.canvas },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginBottom: 16 },
  emptyCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 32, alignItems: 'center', elevation: 1, marginBottom: 16 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  emptySub: { fontSize: 12, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },
  countBadge: { backgroundColor: COLORS.blue, color: '#fff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, fontSize: 13, fontWeight: '600', marginBottom: 12, alignSelf: 'flex-start', overflow: 'hidden' },
  childCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  childHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.blue, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 22, color: '#fff', fontWeight: '700' },
  childInfo: { flex: 1 },
  childName: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  childClass: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  parentInfo: { backgroundColor: COLORS.canvas, borderRadius: 8, padding: 12, marginBottom: 12 },
  parentLabel: { fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: 4 },
  parentName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  parentPhone: { fontSize: 13, color: COLORS.textSecondary },
  actionRow: { flexDirection: 'row', gap: 10 },
  approveBtn: { flex: 1, backgroundColor: COLORS.greenBg, padding: 14, borderRadius: 10, alignItems: 'center' },
  approveText: { fontSize: 15, fontWeight: '700', color: COLORS.green },
  rejectBtn: { flex: 1, backgroundColor: COLORS.redBg, padding: 14, borderRadius: 10, alignItems: 'center' },
  rejectText: { fontSize: 15, fontWeight: '700', color: COLORS.red },
  infoCard: { backgroundColor: COLORS.blueBg, borderRadius: 12, padding: 16, marginTop: 8 },
  infoTitle: { fontSize: 14, fontWeight: '600', color: COLORS.blue, marginBottom: 8 },
  infoText: { fontSize: 13, color: COLORS.textPrimary, lineHeight: 20 },
});
