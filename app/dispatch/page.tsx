'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, MapPinned, RadioTower, ShieldCheck, Siren, Truck, Users2 } from 'lucide-react';
import type { OperationalConfidence, OperationalEvent } from '../../types/polesafe';
import { UnifiedTimeline } from '../../components/operations/unified-timeline';
import { listRideSnapshots } from '../../lib/ride/registry';
import { buildIncidentLifecycleNotes, evaluateJourneyRisk, type IncidentLifecycle } from '../../lib/engine/hamnah-core';

const confidenceTone: Record<OperationalConfidence, string> = {
  confirmed: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
  inferred: 'bg-sky-500/10 text-sky-300 ring-sky-500/20',
  delayed: 'bg-amber-500/10 text-amber-300 ring-amber-500/20',
  'offline-received': 'bg-violet-500/10 text-violet-300 ring-violet-500/20',
  'manually-verified': 'bg-orange-500/10 text-orange-300 ring-orange-500/20',
};

const severityTone = {
  critical: 'bg-red-500/10 text-red-300 ring-red-500/20',
  high: 'bg-orange-500/10 text-orange-300 ring-orange-500/20',
  medium: 'bg-amber-500/10 text-amber-300 ring-amber-500/20',
} as const;

type DispatchIncident = {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium';
  route: string;
  location: string;
  privacyMasked: boolean;
  status: IncidentLifecycle;
  confidence: OperationalConfidence;
  kind: 'speed_violation' | 'geofence_breach' | 'stop_duration' | 'sos_escalation';
  note: string;
  vehicleKind: 'car' | 'boda_boda';
  currentStopSeconds: number;
  plannedStopSeconds: number;
  locationAccuracyMeters: number;
  speedKph: number;
};

const seedIncidents: DispatchIncident[] = [
  { id: 'inc_01', title: 'Child pickup missing', severity: 'critical', route: 'Route A', location: 'Makerere Hill area', privacyMasked: true, status: 'active', confidence: 'confirmed', kind: 'sos_escalation', note: 'Driver SOS raised and awaiting dispatcher ack', vehicleKind: 'boda_boda', currentStopSeconds: 0, plannedStopSeconds: 120, locationAccuracyMeters: 35, speedKph: 0 },
  { id: 'inc_02', title: 'Vehicle delay', severity: 'medium', route: 'Route B', location: 'Kampala Northern Bypass', privacyMasked: true, status: 'investigating', confidence: 'inferred', kind: 'stop_duration', note: 'Stop duration exceeds expected corridor threshold', vehicleKind: 'car', currentStopSeconds: 290, plannedStopSeconds: 180, locationAccuracyMeters: 220, speedKph: 0 },
  { id: 'inc_03', title: 'Gate confirmation pending', severity: 'high', route: 'Route D', location: 'North Wing campus', privacyMasked: false, status: 'acknowledged', confidence: 'delayed', kind: 'geofence_breach', note: 'Geo-fence exit detected, confirmation still pending', vehicleKind: 'car', currentStopSeconds: 40, plannedStopSeconds: 180, locationAccuracyMeters: 60, speedKph: 0 },
  { id: 'inc_04', title: 'Speed spike detected', severity: 'high', route: 'Route C', location: 'Wakiso corridor', privacyMasked: true, status: 'parent_contacted', confidence: 'offline-received', kind: 'speed_violation', note: 'Telemetry queue replay flagged an above-threshold burst', vehicleKind: 'boda_boda', currentStopSeconds: 0, plannedStopSeconds: 120, locationAccuracyMeters: 80, speedKph: 72 },
];

const operationalEvents: OperationalEvent[] = [
  { eventId: 'evt_01', eventType: 'sos', confidence: 'confirmed', actorRole: 'driver', actorId: 'drv_01', organizationId: 'org_1', schoolId: 'school_1', rideId: 'ride_1', incidentId: 'inc_01', occurredAt: '2026-08-13T07:12:00Z', summary: 'Driver SOS raised from Route A', sourceChannel: 'app', privacyMasked: true, metadata: { routeLabel: 'Route A', note: 'Immediate dispatcher review required' } },
  { eventId: 'evt_02', eventType: 'vehicle_telemetry', confidence: 'inferred', actorRole: 'system', actorId: 'telemetry', organizationId: 'org_1', vehicleId: 'veh_02', occurredAt: '2026-08-13T07:10:00Z', summary: 'Speed burst above route norm on Kampala Northern Bypass', sourceChannel: 'telemetry', privacyMasked: true, metadata: { routeLabel: 'Route B', note: 'Speed anomaly', speedKph: 72 } },
  { eventId: 'evt_03', eventType: 'school_gate', confidence: 'manually-verified', actorRole: 'school_admin', actorId: 'sch_01', organizationId: 'org_1', schoolId: 'school_1', occurredAt: '2026-08-13T07:08:00Z', summary: 'School gate scan confirmed student arrival', sourceChannel: 'manual', privacyMasked: false, metadata: { routeLabel: 'Route D', note: 'Teacher verified arrival' } },
];

const seeded = seedIncidents.map((incident) => ({
  ...incident,
  risk: evaluateJourneyRisk({
    vehicleClass: incident.vehicleKind,
    currentStopSeconds: incident.currentStopSeconds,
    plannedStopSeconds: incident.plannedStopSeconds,
    currentZone: incident.kind === 'sos_escalation' ? 'unknown' : incident.kind === 'geofence_breach' ? 'route' : 'home_gate',
    speedKph: incident.speedKph,
    routeToleranceMeters: incident.vehicleKind === 'boda_boda' ? 120 : 180,
    locationAccuracyMeters: incident.locationAccuracyMeters,
  }),
}));

export default function DispatchMapPage() {
  const rideSnapshots = listRideSnapshots();
  const [incidents, setIncidents] = useState(seeded);

  const rankedIncidents = useMemo(() => [...incidents].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2 } as const;
    return order[a.severity] - order[b.severity];
  }), [incidents]);

  const counts = useMemo(() => ({ active: incidents.filter((i) => i.status === 'active' || i.status === 'acknowledged' || i.status === 'investigating').length, triaged: incidents.filter((i) => i.status === 'driver_contacted' || i.status === 'parent_contacted' || i.status === 'school_contacted' || i.status === 'police_contacted').length, resolved: incidents.filter((i) => i.status === 'resolved' || i.status === 'false_alarm').length }), [incidents]);

  const updateIncident = (id: string, status: IncidentLifecycle) => setIncidents((prev) => prev.map((incident) => incident.id === id ? { ...incident, status, note: buildIncidentLifecycleNotes(status) } : incident));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-orange-300"><RadioTower className="h-3.5 w-3.5" /> Dispatch / emergency command</div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Emergency dispatch map</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Emergency-first triage for SOS, route deviation, and prolonged stops across Uganda, with privacy masking by default.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/dispatch/sos" className="inline-flex items-center gap-2 rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white hover:bg-red-400"><Siren className="h-4 w-4" /> Open SOS panel</Link>
              <Link href="/ride/tracker" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 hover:bg-white/10">Open live tracker</Link>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="glass rounded-2xl px-4 py-3"><div className="text-xs text-slate-400">Active</div><div className="mt-1 text-xl font-semibold text-white">{counts.active}</div></div>
            <div className="glass rounded-2xl px-4 py-3"><div className="text-xs text-slate-400">Triaged</div><div className="mt-1 text-xl font-semibold text-amber-300">{counts.triaged}</div></div>
            <div className="glass rounded-2xl px-4 py-3"><div className="text-xs text-slate-400">Resolved</div><div className="mt-1 text-xl font-semibold text-emerald-300">{counts.resolved}</div></div>
            <div className="glass rounded-2xl px-4 py-3"><div className="text-xs text-slate-400">Vehicles live</div><div className="mt-1 text-xl font-semibold text-orange-300">{rideSnapshots.length}</div></div>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:px-8 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="glass-strong rounded-3xl p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold text-white">Incident command board</h2><p className="mt-1 text-sm text-slate-400">SOS and critical anomalies stay at the top.</p></div><AlertTriangle className="h-5 w-5 text-amber-300" /></div>
            <div className="mt-6 space-y-4">
              {rankedIncidents.map((incident) => (
                <article key={incident.id} className={`rounded-2xl border p-4 ${incident.severity === 'critical' ? 'border-red-400/40 bg-red-500/10' : 'border-white/8 bg-white/[0.04]'}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">{incident.title}</div>
                      <div className="mt-1 text-xs text-slate-400">{incident.route} • {incident.privacyMasked ? 'privacy masked' : incident.location} • {incident.vehicleKind === 'boda_boda' ? 'Boda Boda' : 'Car'}</div>
                      <div className="mt-2 text-xs text-slate-500">{incident.note}</div>
                      <div className="mt-2 text-xs text-slate-500">Risk: {incident.risk.riskBand} • {incident.risk.reason}</div>
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <div className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 capitalize ${severityTone[incident.severity]}`}>{incident.severity}</div>
                      <div className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${confidenceTone[incident.confidence]}`}>{incident.confidence}</div>
                      <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 ring-1 ring-white/10">{incident.kind.replaceAll('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => updateIncident(incident.id, 'acknowledged')} className="rounded-2xl bg-white/5 px-3 py-2 text-xs text-slate-200 ring-1 ring-white/10">Acknowledge</button>
                    <button type="button" onClick={() => updateIncident(incident.id, 'investigating')} className="rounded-2xl bg-white/5 px-3 py-2 text-xs text-slate-200 ring-1 ring-white/10">Investigate</button>
                    <button type="button" onClick={() => updateIncident(incident.id, 'driver_contacted')} className="rounded-2xl bg-white/5 px-3 py-2 text-xs text-slate-200 ring-1 ring-white/10">Driver contacted</button>
                    <button type="button" onClick={() => updateIncident(incident.id, 'parent_contacted')} className="rounded-2xl bg-white/5 px-3 py-2 text-xs text-slate-200 ring-1 ring-white/10">Parent contacted</button>
                    <button type="button" onClick={() => updateIncident(incident.id, 'school_contacted')} className="rounded-2xl bg-white/5 px-3 py-2 text-xs text-slate-200 ring-1 ring-white/10">School contacted</button>
                    <button type="button" onClick={() => updateIncident(incident.id, 'resolved')} className="rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white">Resolve</button>
                    <button type="button" onClick={() => updateIncident(incident.id, 'false_alarm')} className="rounded-2xl bg-slate-700 px-3 py-2 text-xs text-white">False alarm</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <UnifiedTimeline events={operationalEvents} />
        </div>
        <aside className="space-y-6">
          <div className="glass-strong rounded-3xl p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold text-white">Ops summary</h2><p className="mt-1 text-sm text-slate-400">What the dispatcher needs to know at a glance.</p></div><ShieldCheck className="h-5 w-5 text-emerald-300" /></div>
            <div className="mt-6 space-y-3">{['SOS events are pinned above routine vehicle updates','Boda trips escalate faster on stop-duration alerts','Privacy masking stays on until verified unmasking','Vehicle positions remain approximate by design'].map((item) => <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.04] p-4 text-sm text-slate-300">{item}</div>)}</div>
          </div>
          <div className="glass rounded-3xl p-6"><div className="flex items-center gap-3"><Users2 className="h-5 w-5 text-orange-300" /><div><h3 className="text-lg font-semibold text-white">Dispatcher workflow</h3><p className="text-sm text-slate-400">Acknowledge → investigate → contact → resolve.</p></div></div></div>
          <div className="glass rounded-3xl p-6"><div className="flex items-center gap-3"><MapPinned className="h-5 w-5 text-emerald-300" /><div><h3 className="text-lg font-semibold text-white">Ride snapshots</h3><p className="text-sm text-slate-400">Same live engine, now bound into dispatch.</p></div></div><div className="mt-4 space-y-2">{rideSnapshots.length ? rideSnapshots.map((snap) => <div key={snap.state.rideId} className="rounded-2xl border border-white/8 bg-white/[0.04] p-3 text-sm text-slate-300"><div className="font-medium text-white">{snap.state.routeName}</div><div className="text-xs text-slate-400">{snap.state.vehicleKind} • {snap.state.confidenceState} • {snap.state.currentLocationLabel}</div></div>) : <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3 text-sm text-slate-300">No live rides yet.</div>}</div></div>
        </aside>
      </section>
    </main>
  );
}
