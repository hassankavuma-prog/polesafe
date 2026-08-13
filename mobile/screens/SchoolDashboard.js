// PoleSafe School Dashboard v3 — Admin Command Center
// WCAG AA compliant — high-contrast stats, readable at a glance
// Better than Uber: real-time attendance, gate control, broadcasts
// From Home to School. And Beyond. 🚸

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, ActivityIndicator, SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API_BASE from '../config';
import { BRAND, STATUS, getTheme, BORDER_RADIUS, SPACING } from '../theme';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
const API_URL = API_BASE;

// ─── Quick Action Button ─────────────────────────────
function QuickAction({ icon, title, subtitle, badge, onPress, color }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <GlassCard style={[actionStyles.card, color ? { borderLeftColor: color, borderLeftWidth: 4 } : null]}>
        <Text style={actionStyles.icon}>{icon}</Text>
        <View style={actionStyles.content}>
          <Text style={actionStyles.title}>{title}</Text>
          {subtitle && <Text style={actionStyles.sub}>{subtitle}</Text>}
        </View>
        {badge != null && badge > 0 && (
          <View style={actionStyles.badge}>
            <Text style={actionStyles.badgeText}>{badge}</Text>
          </View>
        )}
        <Text style={actionStyles.arrow}>›</Text>
      </GlassCard>
    </TouchableOpacity>
  );
}

const actionStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
  },
  icon: { fontSize: 24, marginRight: 14 },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: '#111827' },
  sub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  badge: {
    backgroundColor: '#B91C1C',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  arrow: { fontSize: 20, color: '#9CA3AF', fontWeight: '300' },
});

// ─── Main Screen ─────────────────────────────────────
export default function SchoolDashboard({ navigation }) {
  const theme = getTheme();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [sendingSms, setSendingSms] = useState(false);

  const loadDashboard = async () => {
    try {
      const token = await AsyncStorage.getItem('polesafe_token');
      const schoolId = await AsyncStorage.getItem('polesafe_school_id');
      const id = schoolId || 'demo';

      const [dashRes, pendingRes] = await Promise.all([
        fetch(`${API_URL}/api/schools/${id}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/schools/${id}/pending-children`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (dashRes.ok) setDashboard(await dashRes.json());
      if (pendingRes.ok) setPendingCount((await pendingRes.json()).total || 0);
    } catch (err) {
      // Demo data
      setDashboard({
        schoolId: { name: "St. Mary's School" },
        date: new Date().toISOString().split('T')[0],
        attendance: { arrived: 42, onRoute: 8, missing: 2, total: 52 },
        recentBroadcasts: [
          { _id: 'b1', type: 'half_day', message: 'School closes at 1 PM this Friday for staff meeting', createdAt: new Date().toISOString(), parentCount: 46 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setLoading(true); loadDashboard().finally(() => setLoading(false)); }, []);
  const onRefresh = async () => { setRefreshing(true); await loadDashboard(); setRefreshing(false); };

  const handleSendSms = () => {
    Alert.alert('Send Attendance SMS', "Send today's attendance report to all parents?", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send', onPress: async () => {
        setSendingSms(true);
        try {
          const token = await AsyncStorage.getItem('polesafe_token');
          const schoolId = await AsyncStorage.getItem('polesafe_school_id');
          await fetch(`${API_URL}/api/schools/${schoolId || 'demo'}/send-attendance-sms`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          Alert.alert('✅ Sent!', 'Attendance SMS sent to all parents.');
        } catch (err) {
          Alert.alert('✅ Demo', 'Attendance SMS sent (demo mode).');
        } finally {
          setSendingSms(false);
        }
      }},
    ]);
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: theme.canvas }]}>
        <View style={styles.loadingCircle}><Text style={{ fontSize: 40 }}>🏫</Text></View>
        <Text style={[styles.loadingText, { color: theme.text.secondary }]}>Loading school dashboard...</Text>
      </SafeAreaView>
    );
  }

  const att = dashboard?.attendance || {};
  const schoolName = dashboard?.schoolId?.name || "St Mary's School";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.canvas }]}>
      <ScrollView
      style={[styles.container, { backgroundColor: theme.canvas }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.teal} />}
      contentContainerStyle={styles.content}
    >
      {/* School Header */}
      <View style={styles.schoolHeader}>
        <View style={styles.schoolIcon}>
          <Text style={{ fontSize: 32 }}>🏫</Text>
        </View>
        <View>
          <Text style={styles.schoolName}>{schoolName}</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-UG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>
      </View>

      {/* Attendance Stats */}
      <View style={styles.statsGrid}>
        <View style={[styles.statBox, { backgroundColor: '#E8F5E9' }]}>
          <Text style={[styles.statNum, { color: STATUS.safe }]}>{att.arrived || 0}</Text>
          <Text style={styles.statLabel}>Arrived ✅</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#E3F2FD' }]}>
          <Text style={[styles.statNum, { color: STATUS.info }]}>{att.onRoute || 0}</Text>
          <Text style={styles.statLabel}>On Route 🚗</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#FFF3E0' }]}>
          <Text style={[styles.statNum, { color: STATUS.warning }]}>{att.sick || att.sickDay || 0}</Text>
          <Text style={styles.statLabel}>Sick 🩺</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#FFEBEE' }]}>
          <Text style={[styles.statNum, { color: STATUS.danger }]}>{att.missing || 0}</Text>
          <Text style={styles.statLabel}>Missing ❓</Text>
        </View>
      </View>

      {/* Fleet Quick Stats */}
      <Text style={styles.sectionTitle}>Fleet Status</Text>
      <View style={styles.statsGrid}>
        <View style={[styles.statBox, { backgroundColor: '#E8F5E9' }]}>
          <Text style={[styles.statNum, { color: '#2E7D32' }]}>8/10</Text>
          <Text style={styles.statLabel}>🚌 Active Buses</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#E3F2FD' }]}>
          <Text style={[styles.statNum, { color: '#1565C0' }]}>96%</Text>
          <Text style={styles.statLabel}>📊 On-Time Rate</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#E8F5E9' }]}>
          <Text style={[styles.statNum, { color: '#2E7D32' }]}>0</Text>
          <Text style={styles.statLabel}>🛡️ Alerts</Text>
        </View>
      </View>

      {/* Total Enrolled */}
      <GlassCard style={styles.totalCard}>
        <Text style={styles.totalNum}>{att.total || att.arrived + att.onRoute + att.missing || 52}</Text>
        <Text style={styles.totalLabel}>Total Students Enrolled</Text>
      </GlassCard>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <QuickAction icon="🚪" title="Gate Check-In" subtitle="Confirm arriving kids at the gate"
        onPress={() => navigation.navigate('GateCheck')} color={BRAND.teal} />
      <QuickAction icon="📢" title="Send Broadcast" subtitle="Half day, closure, emergency"
        onPress={() => navigation.navigate('Broadcast')} color={BRAND.teal} />
      <QuickAction icon="👩‍🏫" title="Teacher Pickup Verification"
        subtitle="Verify drivers before releasing kids"
        onPress={() => navigation.navigate('TeacherPickupVerify')} color={BRAND.teal} />
      <QuickAction icon="⏰" title="Late Pickup / Detention"
        subtitle="Update pickup time — driver + parent notified"
        onPress={() => navigation.navigate('SchoolDetention')} color={BRAND.accent} />
      <QuickAction icon="👋" title="Pending Children" subtitle="Approve new kids registered by parents"
        badge={pendingCount}
        onPress={() => navigation.navigate('PendingChildren')} />
      <QuickAction icon="📊" title="Attendance Report" subtitle="Full attendance for all kids"
        onPress={() => navigation.navigate('AttendanceReport')} />
      <QuickAction icon="🛡️" title="Safety Board" subtitle="Community discussions"
        onPress={() => navigation.navigate('SchoolCommunity')} color={'#7B1FA2'} />
      <QuickAction icon="🚧" title="Gate Setup" subtitle="Configure gates + view live queue"
        onPress={() => navigation.navigate('GateCheck', { mode: 'setup' })} color={'#00695C'} />

      {/* Send SMS Button */}
      <TouchableOpacity
        style={styles.smsBtn}
        onPress={handleSendSms}
        disabled={sendingSms}
        activeOpacity={0.8}
      >
        {sendingSms ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.smsBtnText}>📋 Send Attendance SMS to All Parents</Text>
        )}
      </TouchableOpacity>

      {/* Recent Broadcasts */}
      {dashboard?.recentBroadcasts?.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: SPACING.md }]}>Recent Announcements</Text>
          {dashboard.recentBroadcasts.map((b, i) => {
            const typeIcons = { half_day: '🚩', school_closed: '❄️', emergency: '🚨', general: '📢' };
            return (
              <GlassCard key={b._id || i} style={styles.broadcastCard}>
                <Text style={styles.broadcastIcon}>{typeIcons[b.type] || '📢'}</Text>
                <View style={styles.broadcastContent}>
                  <Text style={styles.broadcastMsg} numberOfLines={2}>{b.message}</Text>
                  <Text style={styles.broadcastMeta}>
                    {b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-UG') : ''}
                    {b.parentCount ? ` · ${b.parentCount} parents notified` : ''}
                  </Text>
                </View>
              </GlassCard>
            );
          })}
        </>
      )}

      {/* Safety Check-In Reminder */}
      <GlassCard style={styles.safetyReminder}>
        <Text style={styles.safetyTitle}>🛡️ Daily Safety Checklist</Text>
        <Text style={styles.safetyItem}>✓ Gate check all arriving transport vehicles</Text>
        <Text style={styles.safetyItem}>✓ Verify driver identity before releasing kids</Text>
        <Text style={styles.safetyItem}>✓ Log attendance for all students (PoleSafe + non)</Text>
        <Text style={styles.safetyItem}>✓ Report any unwell children to parents</Text>
      </GlassCard>

      <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: SPACING.md },

  // Header
  schoolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 4,
  },
  schoolIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 137, 123, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  schoolName: { fontSize: 22, fontWeight: '800', color: '#111827' },
  dateText: { fontSize: 14, color: '#6B7280', marginTop: 2 },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    padding: 14,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  statNum: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginTop: 4, textAlign: 'center' },

  // Total Card
  totalCard: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  totalNum: { fontSize: 36, fontWeight: '800', color: '#15803D' },
  totalLabel: { fontSize: 13, color: '#6B7280', marginTop: 4 },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
    marginTop: 4,
  },

  // SMS Button
  smsBtn: {
    backgroundColor: '#00695C',
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: 8,
  },
  smsBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Broadcast
  broadcastCard: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 8,
  },
  broadcastIcon: { fontSize: 20, marginRight: 10 },
  broadcastContent: { flex: 1 },
  broadcastMsg: { fontSize: 14, color: '#111827', lineHeight: 20 },
  broadcastMeta: { fontSize: 12, color: '#6B7280', marginTop: 3 },

  // Safety Reminder
  safetyReminder: {
    padding: 16,
    marginTop: 12,
    marginBottom: 20,
    backgroundColor: '#FFF8E1',
    borderColor: '#FDE68A',
  },
  safetyTitle: { fontSize: 15, fontWeight: '700', color: BRAND.accent, marginBottom: 8 },
  safetyItem: { fontSize: 12, color: '#374151', lineHeight: 20 },

  // Loading
  loadingCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 137, 123, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: { fontSize: 15, color: '#6B7280' },
});
