'use client';

import React, { useEffect, useMemo, useState } from 'react';
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

function ActionButton({ label, onClick, variant = 'default' }: { label: string; onClick: () => void; variant?: 'default' | 'success' | 'warning' }) {
  return (
    <button type="button" style={{ ...styles.actionBtn, ...(variant === 'success' ? styles.actionSuccess : {}), ...(variant === 'warning' ? styles.actionWarning : {}) }} onClick={onClick}>
      <span style={styles.actionText}>{label}</span>
    </button>
  );
}

function IncidentCard({ incident, onAcknowledge, onAssign, onEscalate, onResolve, onMask, onUnmask }: {
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
    <div style={styles.card}>
      <div style={styles.cardTop}>
        <div style={{ flex: 1 }}>
          <div style={styles.incidentNumber}>{incident.incidentNumber}</div>
          <div style={styles.cardTitle}>{safeLocation(incident)}</div>
          <div style={styles.cardSub}>{incident.triggerType} • {incident.reporterRole || 'system'}</div>
        </div>
        <div style={{ ...styles.badge, backgroundColor: color.bg }}>
          <div style={{ ...styles.badgeText, color: color.fg }}>{incident.severity.toUpperCase()}</div>
        </div>
      </div>

      <div style={styles.metaRow}><span style={styles.metaLabel}>Status</span><span style={styles.metaValue}>{statusLabel(incident.status)}</span></div>
      <div style={styles.metaRow}><span style={styles.metaLabel}>Privacy</span><span style={styles.metaValue}>{incident.privacyMasked ? 'Masked' : 'Unmasked'}</span></div>

      <div style={styles.row}>
        <ActionButton label="Acknowledge" onClick={() => onAcknowledge(incident)} />
        <ActionButton label="Assign" onClick={() => onAssign(incident)} />
      </div>
      <div style={styles.row}>
        <ActionButton label="Escalate" onClick={() => onEscalate(incident)} />
        <ActionButton label="Resolve" variant="success" onClick={() => onResolve(incident)} />
      </div>
      <div style={styles.row}>
        <ActionButton label={incident.privacyMasked ? 'Unmask' : 'Mask'} variant="warning" onClick={() => incident.privacyMasked ? onUnmask(incident) : onMask(incident)} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
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
      try { await loadDashboard(); } catch (e: any) { setError(e?.message || 'Unable to load dispatcher dashboard'); } finally { setLoading(false); }
    })();
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    setError(null);
    try { await loadDashboard(); } catch (e: any) { setError(e?.message || 'Refresh failed'); } finally { setRefreshing(false); }
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
      const base = { incidentId: selected._id, userId: 'current-user', userRole: 'polesafe_admin', note: note || undefined };
      const result = modalKind === 'acknowledge' ? await acknowledgeIncidentAction(base)
        : modalKind === 'assign' ? await assignIncidentAction(base)
        : modalKind === 'escalate' ? await escalateIncidentAction(base)
        : await resolveIncidentAction({ ...base, resolutionNote: note || 'Resolved from dispatcher console' });
      if (!result.ok) throw new Error(result.error);
      setModalKind(null);
      setSelected(null);
      setNote('');
      await loadDashboard();
    } catch (e: any) { setError(e?.message || 'Unable to complete action'); } finally { setBusy(false); }
  };

  const handleMask = async (incident: SafetyIncident) => {
    try {
      const result = await maskIncidentAction({ incidentId: incident._id, userId: 'current-user', userRole: 'polesafe_admin', note: 'Masked from ops console' });
      if (!result.ok) throw new Error(result.error);
      await loadDashboard();
    } catch (e: any) { setError(e?.message || 'Unable to mask incident'); }
  };

  const handleUnmask = async (incident: SafetyIncident) => {
    try {
      const result = await unmaskIncidentAction({ incidentId: incident._id, userId: 'current-user', userRole: 'polesafe_admin', note: 'Operator requested reveal for verified triage', verified: true });
      if (!result.ok) throw new Error(result.error);
      await loadDashboard();
    } catch (e: any) { setError(e?.message || 'Unable to reveal incident'); }
  };

  const statsMemo = useMemo(() => stats, [stats]);
  if (loading) return <div style={styles.center}><div style={styles.loadingText}>Loading Safety Ops…</div></div>;

  return (
    <div style={styles.root}>
      <div style={styles.container}>
        <div style={styles.title}>Safety Ops</div>
        <div style={styles.subtitle}>Dispatcher triage console for SOS incidents</div>
        <div style={styles.statsGrid}><Stat label="Active" value={statsMemo.active} /><Stat label="Triaged" value={statsMemo.triaged} /><Stat label="Resolved" value={statsMemo.resolved} /></div>
        {error ? <div style={styles.errorBanner}>{error}</div> : null}
        {refreshing ? <div style={styles.refreshing}>Refreshing…</div> : null}
        <div style={styles.refreshRow}><button type="button" style={styles.refreshBtn} onClick={refresh}><span style={styles.refreshText}>{refreshing ? 'Refreshing…' : 'Refresh'}</span></button></div>
        {incidents.map((item) => <IncidentCard key={item._id} incident={item} onAcknowledge={(i) => openModal('acknowledge', i)} onAssign={(i) => openModal('assign', i)} onEscalate={(i) => openModal('escalate', i)} onResolve={(i) => openModal('resolve', i)} onMask={handleMask} onUnmask={handleUnmask} />)}
        {incidents.length === 0 ? <div style={styles.emptyText}>No incidents right now.</div> : null}
      </div>
      {selected && modalKind ? (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <div style={styles.modalTitle}>{modalKind.toUpperCase()} Incident</div>
            <div style={styles.modalSub}>{selected.incidentNumber}</div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Operator note" style={styles.input as React.CSSProperties} />
            <div style={styles.modalActions}>
              <button type="button" style={{ ...styles.modalBtn, ...styles.cancelBtn }} onClick={() => setModalKind(null)} disabled={busy}><span style={styles.cancelText}>Cancel</span></button>
              <button type="button" style={{ ...styles.modalBtn, ...styles.confirmBtn }} onClick={runAction} disabled={busy}><span style={styles.confirmText}>{busy ? 'Working…' : 'Confirm'}</span></button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const styles: Record<string, any> = {
  root: { minHeight: '100vh', backgroundColor: '#F8FAFC', color: '#111827' },
  center: { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#475569' },
  container: { padding: 16, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 920, margin: '0 auto' },
  title: { fontSize: 28, fontWeight: 800, color: '#111827' },
  subtitle: { fontSize: 14, color: '#475569' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 },
  statCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, border: '1px solid #E5E7EB' },
  statValue: { fontSize: 24, fontWeight: 800, color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  errorBanner: { color: '#991B1B', backgroundColor: '#FEE2E2', padding: 12, borderRadius: 12 },
  refreshing: { color: '#475569', fontSize: 12 },
  refreshRow: { display: 'flex', justifyContent: 'flex-end' },
  refreshBtn: { backgroundColor: '#111827', padding: '10px 14px', borderRadius: 12, border: 'none' },
  refreshText: { color: '#fff', fontWeight: 800 },
  emptyText: { color: '#6B7280', padding: '20px 0' },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 14, border: '1px solid #E5E7EB', marginTop: 10 },
  cardTop: { display: 'flex', flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 10 },
  incidentNumber: { fontSize: 12, color: '#6B7280', fontWeight: 700 },
  cardTitle: { fontSize: 16, fontWeight: 800, color: '#111827', marginTop: 2 },
  cardSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  badge: { borderRadius: 999, padding: '6px 10px' },
  badgeText: { fontSize: 12, fontWeight: 800 },
  metaRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 4 },
  metaLabel: { fontSize: 12, color: '#6B7280' },
  metaValue: { fontSize: 12, fontWeight: 700, color: '#111827' },
  row: { display: 'flex', gap: 8, marginTop: 10 },
  actionBtn: { flex: 1, borderRadius: 12, padding: '12px 0', border: 'none', backgroundColor: '#F3F4F6', cursor: 'pointer' },
  actionSuccess: { backgroundColor: '#DCFCE7' },
  actionWarning: { backgroundColor: '#FFEDD5' },
  actionText: { fontSize: 13, fontWeight: 800, color: '#111827' },
  modalBackdrop: { position: 'fixed', inset: 0, backgroundColor: 'rgba(17,24,39,0.45)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, gap: 10, width: 'min(100%, 520px)' },
  modalTitle: { fontSize: 18, fontWeight: 800, color: '#111827' },
  modalSub: { fontSize: 13, color: '#6B7280' },
  input: { minHeight: 90, border: '1px solid #D1D5DB', borderRadius: 14, padding: 12, color: '#111827', resize: 'vertical', fontFamily: 'inherit' },
  modalActions: { display: 'flex', gap: 10 },
  modalBtn: { flex: 1, borderRadius: 12, padding: '12px 0', border: 'none', cursor: 'pointer' },
  cancelBtn: { backgroundColor: '#E5E7EB' },
  confirmBtn: { backgroundColor: '#111827' },
  cancelText: { color: '#111827', fontWeight: 800 },
  confirmText: { color: '#fff', fontWeight: 800 },
};
