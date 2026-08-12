// PoleSafe Safety Ops Dashboard — Dispatcher / Admin incident command center
// Calm, simple, operator-friendly, low-bandwidth first.

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE from '../config';
import { BRAND, STATUS, getTheme, BORDER_RADIUS, SPACING } from '../theme';
import GlassCard from '../components/GlassCard';

const API_URL = API_BASE;

const severityMeta = {
  low: { label: 'Low', color: '#6B7280' },
  medium: { label: 'Medium', color: '#D97706' },
  high: { label: 'High', color: '#DC2626' },
  critical: { label: 'Critical', color: '#B91C1C' },
};

function IncidentCard({ incident, onAcknowledge, onAssign, onEscalate, onResolve, onMask }) {
  const sev = severityMeta[incident.severity] || severityMeta.high;
  const status = incident.status || 'active';
  return (
    <GlassCard style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.incidentNo}>{incident.incidentNumber || 'INC-—'}</Text>
          <Text style={styles.title}>{incident.locationLabel || 'Location hidden'}</Text>
          <Text style={styles.sub}>
            {incident.triggerType || 'manual_sos'} • {incident.reporterRole || 'user'}
          </Text>
        </View>
        <View style={[styles.sevBadge, { borderColor: sev.color }]}>
          <Text style={[styles.sevText, { color: sev.color }]}>{sev.label}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Status</Text>
        <Text style={styles.metaValue}>{status}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Privacy</Text>
        <Text style={styles.metaValue}>{incident.privacyMasked ? 'Masked' : 'Open'}</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onAcknowledge(incident)}>
          <Text style={styles.actionText}>Acknowledge</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onAssign(incident)}>
          <Text style={styles.actionText}>Assign</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onEscalate(incident)}>
          <Text style={styles.actionText}>Escalate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.resolveBtn]} onPress={() => onResolve(incident)}>
          <Text style={styles.resolveText}>Resolve</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={[styles.actionBtn, styles.maskBtn]} onPress={() => onMask(incident)}>
        <Text style={styles.maskText}>Mask Sensitive Data</Text>
      </TouchableOpacity>
    </GlassCard>
  );
}

export default function SafetyOpsDashboard() {
  const theme = getTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ active: 0, triaged: 0, resolved: 0 });
  const [incidents, setIncidents] = useState([]);
  const [identity, setIdentity] = useState({ userId: null, userRole: null });

  const loadDashboard = useCallback(async () => {
    const token = await AsyncStorage.getItem('polesafe_token');
    const res = await fetch(`${API_URL}/api/safety/dispatcher/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load safety ops dashboard');
    setStats(data.stats || { active: 0, triaged: 0, resolved: 0 });
    setIncidents(data.incidents || []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const userRole = (await AsyncStorage.getItem('userRole')) || 'polesafe_admin';
        setIdentity({ userId, userRole });
        await loadDashboard();
      } catch (err) {
        Alert.alert('Safety Ops', err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadDashboard]);

  const onRefresh = async () => {
    setRefreshing(true);
    try { await loadDashboard(); } catch (err) { Alert.alert('Safety Ops', err.message); }
    setRefreshing(false);
  };

  const postAction = async (path, body) => {
    const token = await AsyncStorage.getItem('polesafe_token');
    const method = (path.includes('/acknowledge') || path.includes('/resolve')) ? 'POST' : 'PATCH';
    const res = await fetch(`${API_URL}/api/safety${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Action failed');
    await loadDashboard();
  };

  const handleAcknowledge = async (incident) => {
    try {
      await postAction(`/sos/acknowledge`, {
        incidentId: incident._id,
        userId: identity.userId || 'current',
        userRole: identity.userRole || 'polesafe_admin',
        note: 'Ack from dispatcher dashboard',
      });
    } catch (err) { Alert.alert('Acknowledge', err.message); }
  };

  const handleAssign = async (incident) => {
    try {
      await postAction(`/incidents/${incident._id}/assign`, {
        assignedOperatorId: identity.userId || 'current',
        userId: identity.userId || 'current',
        userRole: identity.userRole || 'polesafe_admin',
        note: 'Assigned from dashboard',
      });
    } catch (err) { Alert.alert('Assign', err.message); }
  };

  const handleEscalate = async (incident) => {
    try {
      await postAction(`/incidents/${incident._id}/escalate`, {
        userId: identity.userId || 'current',
        userRole: identity.userRole || 'polesafe_admin',
        note: 'Escalated from dashboard',
      });
    } catch (err) { Alert.alert('Escalate', err.message); }
  };

  const handleResolve = async (incident) => {
    Alert.alert('Resolve Incident', 'Mark this incident as resolved?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Resolve',
        onPress: async () => {
          try {
            await postAction(`/sos/resolve`, {
              incidentId: incident._id,
              userId: identity.userId || 'current',
              userRole: identity.userRole || 'polesafe_admin',
              resolutionNote: 'Resolved from dashboard',
            });
          } catch (err) { Alert.alert('Resolve', err.message); }
        },
      },
    ]);
  };

  const handleMask = async (incident) => {
    try {
      await postAction(`/incidents/${incident._id}/mask`, {
        userId: identity.userId || 'current',
        userRole: identity.userRole || 'polesafe_admin',
        note: 'Masked from dashboard',
      });
    } catch (err) {
      Alert.alert('Mask', err.message);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: theme.canvas }]}>
        <ActivityIndicator size="large" color={BRAND.primary} />
        <Text style={styles.loadingText}>Loading Safety Ops...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.canvas }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />}
      >
        <Text style={styles.header}>Safety Ops</Text>
        <Text style={styles.subheader}>Dispatcher command center for SOS and incident triage</Text>

        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}><Text style={styles.statNum}>{stats.active}</Text><Text style={styles.statLabel}>Active</Text></GlassCard>
          <GlassCard style={styles.statCard}><Text style={styles.statNum}>{stats.triaged}</Text><Text style={styles.statLabel}>In Review</Text></GlassCard>
          <GlassCard style={styles.statCard}><Text style={styles.statNum}>{stats.resolved}</Text><Text style={styles.statLabel}>Resolved</Text></GlassCard>
        </View>

        <Text style={styles.section}>Live Incidents</Text>
        {incidents.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🟢</Text>
            <Text style={styles.emptyTitle}>No active incidents</Text>
            <Text style={styles.emptySub}>Everything is calm right now.</Text>
          </GlassCard>
        ) : incidents.map((incident) => (
          <IncidentCard
            key={incident._id}
            incident={incident}
            onAcknowledge={handleAcknowledge}
            onAssign={handleAssign}
            onEscalate={handleEscalate}
            onResolve={handleResolve}
            onMask={handleMask}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: SPACING.md },
  header: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subheader: { fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 16 },
  loadingText: { marginTop: 10, color: '#6B7280' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statCard: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '800', color: BRAND.primary },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2, fontWeight: '600' },
  section: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },
  card: { padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  incidentNo: { fontSize: 12, color: '#6B7280', fontWeight: '700' },
  title: { fontSize: 16, fontWeight: '800', color: '#111827', marginTop: 2 },
  sub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  sevBadge: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  sevText: { fontSize: 12, fontWeight: '800' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  metaLabel: { color: '#6B7280', fontSize: 12 },
  metaValue: { color: '#111827', fontSize: 12, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionBtn: { flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 12, borderRadius: BORDER_RADIUS.sm, alignItems: 'center' },
  actionText: { fontSize: 13, fontWeight: '700', color: '#111827' },
  resolveBtn: { backgroundColor: '#E8F5E9' },
  resolveText: { fontSize: 13, fontWeight: '800', color: '#15803D' },
  maskBtn: { marginTop: 8, backgroundColor: '#FFF7ED' },
  maskText: { fontSize: 13, fontWeight: '800', color: '#B45309' },
  emptyCard: { padding: 24, alignItems: 'center' },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  emptySub: { fontSize: 13, color: '#6B7280', marginTop: 4, textAlign: 'center' },
});
