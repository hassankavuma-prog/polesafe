'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  acknowledgeIncidentAction,
  assignIncidentAction,
  escalateIncidentAction,
  fetchDispatcherDashboardAction,
  maskIncidentAction,
  resolveIncidentAction,
  unmaskIncidentAction,
} from '../../../lib/safety-ops/actions';
import type { SafetyIncident } from '../../../lib/safety-ops/types';

function toneFor(severity: SafetyIncident['severity']) {
  switch (severity) {
    case 'critical': return { fg: '#7F1D1D', bg: '#FEE2E2' };
    case 'high': return { fg: '#B91C1C', bg: '#FEE2E2' };
    case 'medium': return { fg: '#B45309', bg: '#FEF3C7' };
    default: return { fg: '#374151', bg: '#E5E7EB' };
  }
}

function statusLabel(status: SafetyIncident['status']) {
  switch (status) {
    case 'active': return 'Active';
    case 'triaged': return 'Triaged';
    case 'escalated': return 'Escalated';
    case 'resolved': return 'Resolved';
    case 'false_alarm': return 'False alarm';
    case 'dismissed': return 'Dismissed';
    default: return status;
  }
}

function safeLocation(incident: SafetyIncident) {
  return incident.privacyMasked ? 'Location masked' : (incident.locationLabel || 'Location available');
}

function ActionButton({ label, onPress, variant = 'default' }: { label: string; onPress: () => void; variant?: 'default' | 'success' | 'warning' }) {
  return (
    <Pressable style={[styles.actionBtn, variant === 'success' && styles.actionSuccess, variant === 'warning' && styles.actionWarning]} onPress={onPress}>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

function IncidentCard({
  incident,
  onAcknowledge,
  onAssign,
  onEscalate,
  onResolve,
  onMask,
  onUnmask,
}: {
  incident: SafetyIncident;
  onAcknowledge: (incident: SafetyIncident) => void;
  onAssign: (incident: SafetyIncident) => void;
  onEscalate: (incident: SafetyIncident) => void;
  onResolve: (incident: SafetyIncident) => void;
  onMask: (incident: SafetyIncident) => void;
  onUnmask: (incident: SafetyIncident) => void;
}) {
  const color = toneFor(incident.severity);
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.incidentNumber}>{incident.incidentNumber}</Text>
          <Text style={styles.cardTitle}>{safeLocation(incident)}</Text>
          <Text style={styles.cardSub}>{incident.triggerType} • {incident.reporterRole || 'system'}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: color.bg }]}>
          <Text style={[styles.badgeText, { color: color.fg }]}>{incident.severity.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Status</Text>
        <Text style={styles.metaValue}>{statusLabel(incident.status)}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Privacy</Text>
        <Text style={styles.metaValue}>{incident.privacyMasked ? 'Masked' : 'Unmasked'}</Text>
      </View>

      <View style={styles.row}>
        <ActionButton label="Acknowledge" onPress={() => onAcknowledge(incident)} />
        <ActionButton label="Assign" onPress={() => onAssign(incident)} />
      </View>
      <View style={styles.row}>
        <ActionButton label="Escalate" onPress={() => onEscalate(incident)} />
        <ActionButton label="Resolve" variant="success" onPress={() => onResolve(incident)} />
      </View>
      <View style={styles.row}>
        <ActionButton
          label={incident.privacyMasked ? 'Unmask' : 'Mask'}
          variant="warning"
          onPress={() => incident.privacyMasked ? onUnmask(incident) : onMask(incident)}
        />
      </View>
    </View>
  );
}

export default function SafetyOpsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ active: 0, triaged: 0, resolved: 0 });
  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
  const [selected, setSelected] = useState<SafetyIncident | null>(null);
  const [modalKind, setModalKind] = useState<'acknowledge' | 'assign' | 'escalate' | 'resolve' | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async () => {
    const res = await fetchDispatcherDashboardAction();
    if (!res.ok) throw new Error(res.error);
    setStats(res.data.stats);
    setIncidents(res.data.incidents);
  };

  useEffect(() => {
    (async () => {
      try {
        await loadDashboard();
      } catch (e: any) {
        setError(e?.message || 'Unable to load dispatcher dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await loadDashboard();
    } catch (e: any) {
      setError(e?.message || 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  const openModal = (kind: 'acknowledge' | 'assign' | 'escalate' | 'resolve', incident: SafetyIncident) => {
    setSelected(incident);
    setModalKind(kind);
    setNote('');
  };

  const runAction = async () => {
    if (!selected || !modalKind) return;
    setBusy(true);
    try {
      const base = {
        incidentId: selected._id,
        userId: 'current-user',
        userRole: 'polesafe_admin' as const,
        note: note || undefined,
      };

      let result;
      if (modalKind === 'acknowledge') result = await acknowledgeIncidentAction(base);
      else if (modalKind === 'assign') result = await assignIncidentAction(base);
      else if (modalKind === 'escalate') result = await escalateIncidentAction(base);
      else result = await resolveIncidentAction({ ...base, resolutionNote: note || 'Resolved from dispatcher console' });

      if (!result.ok) throw new Error(result.error);
      setModalKind(null);
      setSelected(null);
      setNote('');
      await loadDashboard();
    } catch (e: any) {
      setError(e?.message || 'Unable to complete action');
    } finally {
      setBusy(false);
    }
  };

  const handleMask = async (incident: SafetyIncident) => {
    try {
      const result = await maskIncidentAction({
        incidentId: incident._id,
        userId: 'current-user',
        userRole: 'polesafe_admin',
        note: 'Masked from ops console',
      });
      if (!result.ok) throw new Error(result.error);
      await loadDashboard();
    } catch (e: any) {
      setError(e?.message || 'Unable to mask incident');
    }
  };

  const handleUnmask = async (incident: SafetyIncident) => {
    try {
      const result = await unmaskIncidentAction({
        incidentId: incident._id,
        userId: 'current-user',
        userRole: 'polesafe_admin',
        note: 'Operator requested reveal for verified triage',
        verified: true,
      });
      if (!result.ok) throw new Error(result.error);
      setIncidents(prev => prev.map(x => x._id === incident._id ? { ...x, privacyMasked: false } : x));
    } catch (e: any) {
      setError(e?.message || 'Unable to reveal incident');
    }
  };

  const statsMemo = useMemo(() => stats, [stats]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#111827" />
        <Text style={styles.loadingText}>Loading Safety Ops…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Safety Ops</Text>
        <Text style={styles.subtitle}>Dispatcher triage console for SOS incidents</Text>

        <View style={styles.statsGrid}>
          <Stat label="Active" value={statsMemo.active} />
          <Stat label="Triaged" value={statsMemo.triaged} />
          <Stat label="Resolved" value={statsMemo.resolved} />
        </View>

        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
        {refreshing ? <Text style={styles.refreshing}>Refreshing…</Text> : null}

        <View style={styles.refreshRow}>
          <Pressable style={styles.refreshBtn} onPress={refresh}>
            <Text style={styles.refreshText}>{refreshing ? 'Refreshing…' : 'Refresh'}</Text>
          </Pressable>
        </View>

        {incidents.map((item) => (
          <IncidentCard
            key={item._id}
            incident={item}
            onAcknowledge={(incident) => openModal('acknowledge', incident)}
            onAssign={(incident) => openModal('assign', incident)}
            onEscalate={(incident) => openModal('escalate', incident)}
            onResolve={(incident) => openModal('resolve', incident)}
            onMask={handleMask}
            onUnmask={handleUnmask}
          />
        ))}
        {incidents.length === 0 ? <Text style={styles.emptyText}>No incidents right now.</Text> : null}

          )}
        />
      </ScrollView>

      <Modal visible={!!selected && !!modalKind} transparent animationType="slide" onRequestClose={() => setModalKind(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{modalKind?.toUpperCase()} Incident</Text>
            <Text style={styles.modalSub}>{selected?.incidentNumber}</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Operator note"
              placeholderTextColor="#9CA3AF"
              multiline
              style={styles.input}
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalKind(null)} disabled={busy}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.confirmBtn]} onPress={runAction} disabled={busy}>
                <Text style={styles.confirmText}>{busy ? 'Working…' : 'Confirm'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#475569' },
  errorText: { color: '#B91C1C', fontWeight: '700' },
  container: { padding: 16, gap: 12 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#475569' },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  errorBanner: { color: '#991B1B', backgroundColor: '#FEE2E2', padding: 12, borderRadius: 12, overflow: 'hidden' },
  refreshing: { color: '#475569', fontSize: 12 },
  refreshRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  refreshBtn: { backgroundColor: '#111827', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  refreshText: { color: '#fff', fontWeight: '800' },
  emptyText: { color: '#6B7280', paddingVertical: 20 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', marginTop: 10 },
  cardTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 10 },
  incidentNumber: { fontSize: 12, color: '#6B7280', fontWeight: '700' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginTop: 2 },
  cardSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  metaLabel: { fontSize: 12, color: '#6B7280' },
  metaValue: { fontSize: 12, fontWeight: '700', color: '#111827' },
  row: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: '#F3F4F6' },
  actionSuccess: { backgroundColor: '#DCFCE7' },
  actionWarning: { backgroundColor: '#FFEDD5' },
  actionText: { fontSize: 13, fontWeight: '800', color: '#111827' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(17,24,39,0.45)', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, gap: 10 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  modalSub: { fontSize: 13, color: '#6B7280' },
  input: { minHeight: 90, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 14, padding: 12, color: '#111827', textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#E5E7EB' },
  confirmBtn: { backgroundColor: '#111827' },
  cancelText: { color: '#111827', fontWeight: '800' },
  confirmText: { color: '#fff', fontWeight: '800' },
});
