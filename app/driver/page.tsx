'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, FileCheck2, Mic2, Navigation2, PhoneCall, ShieldAlert, Smartphone, Truck, WifiOff, XCircle, MapPinned, Users2 } from 'lucide-react';
import type { DriverComplianceVault, LiveJourneyState, RideAlertEvent, RideConfidenceState } from '../../types/polesafe';
import { buildSOSAlert, evaluateJourneyTelemetry } from '../../lib/ride/engine';
import { upsertRideSnapshot } from '../../lib/ride/registry';

const vault: DriverComplianceVault = {
  driverId: 'drv_01',
  nationalIdNumber: 'CM12345678',
  status: 'verified',
  documents: [
    { id: 'doc_1', type: 'national_id', url: '#', status: 'verified', reviewedAt: '2026-08-12T09:00:00Z', aiGenerated: false, attentionRequired: false },
    { id: 'doc_2', type: 'drivers_license', url: '#', status: 'verified', reviewedAt: '2026-08-12T09:00:00Z', aiGenerated: false, attentionRequired: false },
    { id: 'doc_3', type: 'police_clearance', url: '#', status: 'pending', aiGenerated: false, attentionRequired: false },
    { id: 'doc_4', type: 'vehicle_inspection', url: '#', status: 'verified', reviewedAt: '2026-08-11T15:30:00Z', aiGenerated: false, attentionRequired: false },
  ],
  verifiedAt: '2026-08-12T09:15:00Z',
  verifiedBy: 'school_admin_01',
};

const baseState: LiveJourneyState = {
  rideId: 'ride_ug_001',
  vehicleKind: 'boda_boda',
  parentId: 'par_88392',
  driverId: 'drv_01',
  childId: 'child_001',
  routeName: 'Kampala Central → School Gate',
  confidence: 'confirmed',
  confidenceState: 'confirmed',
  confidenceNote: 'Driver ready for pickup',
  currentLocationLabel: 'Home gate, Kampala Central',
  geofenceStatus: 'approaching',
  etaMinutes: 12,
  speedKph: 0,
  plannedStopSeconds: 180,
  currentStopSeconds: 0,
  checkpoints: [
    { checkpointId: 'cp_1', label: 'Home gate', type: 'home_gate', confidence: 'confirmed' },
    { checkpointId: 'cp_2', label: 'Route corridor', type: 'route_point', confidence: 'in_transit' },
    { checkpointId: 'cp_3', label: 'School gate', type: 'school_gate', confidence: 'confirmed' },
  ],
};

const tripStats = [
  { label: 'Active route', value: 'Route A', tone: 'emerald' as const },
  { label: 'Today pickups', value: '18', tone: 'orange' as const },
  { label: 'Alerts', value: '0', tone: 'slate' as const },
  { label: 'Compliance', value: 'Verified', tone: 'emerald' as const },
];

const complianceStatusClass: Record<'verified' | 'pending' | 'rejected' | 'expired', string> = {
  verified: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-300 ring-amber-500/20',
  rejected: 'bg-red-500/10 text-red-300 ring-red-500/20',
  expired: 'bg-slate-500/10 text-slate-300 ring-slate-500/20',
};

const journeyTone: Record<RideConfidenceState, string> = {
  confirmed: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
  in_transit: 'bg-sky-500/10 text-sky-300 ring-sky-500/20',
  delayed: 'bg-amber-500/10 text-amber-300 ring-amber-500/20',
  arrived: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
};

export default function DriverDashboardPage() {
  const [journey, setJourney] = useState<LiveJourneyState>(baseState);
  const [driverNotes, setDriverNotes] = useState<string[]>(['Ready at home gate']);
  const [muted, setMuted] = useState(false);

  const alerts = useMemo(() => driverNotes.slice(0, 5), [driverNotes]);
  const documents = vault.documents ?? [];

  const commit = (next: LiveJourneyState, note: string, alert?: RideAlertEvent) => {
    setJourney(next);
    setDriverNotes((prev) => [note, ...prev].slice(0, 6));
    upsertRideSnapshot({ state: next, alerts: alert ? [alert] : [], updatedAt: new Date().toISOString() });
  };

  const handleAction = (action: 'start' | 'board' | 'delay' | 'arrive' | 'sos') => {
    const now = new Date().toISOString();
    if (action === 'sos') {
      const alert = buildSOSAlert({
        rideId: journey.rideId,
        driverId: journey.driverId,
        parentId: journey.parentId,
        vehicleKind: journey.vehicleKind,
        maskedLocation: journey.currentLocationLabel,
        reason: 'Driver pressed emergency SOS',
        timestamp: now,
      });
      const next: LiveJourneyState = { ...journey, confidenceState: 'delayed', confidence: 'delayed', confidenceNote: alert.message, activeAlertTypes: [...(journey.activeAlertTypes ?? []), 'sos'], confidenceUpdatedAt: now };
      commit(next, 'SOS sent to dispatch and parent', alert);
      return;
    }

    if (action === 'start') {
      const next: LiveJourneyState = { ...journey, confidenceState: 'confirmed', confidence: 'confirmed', confidenceNote: 'Trip started from home gate', geofenceStatus: 'approaching', speedKph: 18, currentLocationLabel: 'Leaving home gate', confidenceUpdatedAt: now };
      commit(next, 'Route started and broadcast', { alertId: `${journey.rideId}-start`, rideId: journey.rideId, alertType: 'route_deviation', severity: 'low', message: 'Trip started', confidence: 'confirmed', createdAt: now });
      return;
    }

    if (action === 'board') {
      const next: LiveJourneyState = { ...journey, confidenceState: 'confirmed', confidence: 'confirmed', confidenceNote: 'Child boarded safely', currentLocationLabel: 'Child on board', currentStopSeconds: 0, geofenceStatus: 'inside', confidenceUpdatedAt: now };
      commit(next, 'Marked child on board', { alertId: `${journey.rideId}-board`, rideId: journey.rideId, alertType: 'geofence_arrival', severity: 'low', message: 'Child boarded', confidence: 'confirmed', createdAt: now });
      return;
    }

    if (action === 'delay') {
      const telemetry = { rideId: journey.rideId, latitude: -1.2921, longitude: 36.8219, speedKph: 0, timestamp: now, vehicleKind: journey.vehicleKind, currentZone: 'route' as const, accuracyMeters: 260 };
      const result = evaluateJourneyTelemetry({ state: journey, route: { rideId: journey.rideId, routeName: journey.routeName, homeGateLabel: 'Home gate', schoolGateLabel: 'School gate', allowedStopSeconds: journey.vehicleKind === 'boda_boda' ? 120 : 240, vehicleKind: journey.vehicleKind }, telemetry, routeToleranceMeters: journey.vehicleKind === 'boda_boda' ? 120 : 180 });
      commit(result.nextState, journey.vehicleKind === 'boda_boda' ? 'Boda delay escalated faster' : 'Car delay logged', result.alerts[0]);
      return;
    }

    const next: LiveJourneyState = { ...journey, confidenceState: 'arrived', confidence: 'confirmed', confidenceNote: 'School gate confirmation pending', geofenceStatus: 'inside', speedKph: 0, currentLocationLabel: 'School gate, awaiting confirmation', currentStopSeconds: 0, confidenceUpdatedAt: now };
    commit(next, 'Arrival logged at school gate', { alertId: `${journey.rideId}-arrived`, rideId: journey.rideId, alertType: 'geofence_arrival', severity: 'low', message: 'School gate arrival logged', confidence: 'confirmed', createdAt: now });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(15,23,42,0.92),_transparent_30%)]" />
      <div className="pointer-events-none fixed inset-0 soft-grid opacity-[0.14]" />

      <section className="border-b border-white/5 bg-slate-950/80 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-100 shadow-sm shadow-sky-950/20">
                <Truck className="h-3.5 w-3.5" /> Driver overview
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Driver control center</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Safety-first driving view for live journeys, compliance, and ride status.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-3xl border border-white/8 bg-white/[0.04] p-4 shadow-sm shadow-black/10">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Driver</div>
                  <div className="mt-1 text-base font-semibold text-white">{journey.driverId}</div>
                </div>
                <div className="rounded-3xl border border-white/8 bg-white/[0.04] p-4 shadow-sm shadow-black/10">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Vehicle</div>
                  <div className="mt-1 text-base font-semibold text-white">{journey.vehicleKind === 'boda_boda' ? 'Boda Boda' : 'Car'}</div>
                </div>
                <div className="rounded-3xl border border-white/8 bg-white/[0.04] p-4 shadow-sm shadow-black/10">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Trip status</div>
                  <div className="mt-1 text-base font-semibold text-white">{journey.confidenceState.replace('_', ' ')}</div>
                </div>
                <div className="rounded-3xl border border-white/8 bg-white/[0.04] p-4 shadow-sm shadow-black/10">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Compliance</div>
                  <div className="mt-1 text-base font-semibold text-white">{vault.status}</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {tripStats.map((stat) => (
                <div key={stat.label} className="glass rounded-2xl px-4 py-3">
                  <div className="text-xs text-slate-400">{stat.label}</div>
                  <div className={`mt-1 text-lg font-semibold ${stat.tone === 'emerald' ? 'text-emerald-300' : stat.tone === 'orange' ? 'text-orange-300' : 'text-white'}`}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:grid-cols-[0.98fr_1.02fr]">
        <div className="space-y-6">
          <div className="glass-strong rounded-[2rem] p-5 shadow-2xl shadow-black/20 sm:p-6 ring-1 ring-sky-400/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-100">Active trip</div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">{journey.routeName}</h2>
                <p className="mt-1 text-sm text-slate-400">{journey.currentLocationLabel}</p>
              </div>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ${journeyTone[journey.confidenceState]}`}>{journey.confidenceState.replace('_', ' ')}</div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                <div className="text-xs text-slate-500">Rider / parent</div>
                <div className="mt-1 text-sm font-semibold text-white">Parent {journey.parentId}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                <div className="text-xs text-slate-500">Child / school</div>
                <div className="mt-1 text-sm font-semibold text-white">Child {journey.childId} → School gate</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                <div className="text-xs text-slate-500">Pickup</div>
                <div className="mt-1 text-sm font-semibold text-white">Home gate, Kampala Central</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                <div className="text-xs text-slate-500">Destination</div>
                <div className="mt-1 text-sm font-semibold text-white">School gate</div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-sky-400/10 bg-sky-500/5 p-4">
              <div className="flex items-center justify-between gap-3 text-sm text-slate-200">
                <span className="font-medium text-white">Journey progress</span>
                <span>{journey.geofenceStatus} • {journey.confidence}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                <div className={`h-full rounded-full bg-sky-400 ${journey.confidenceState === 'arrived' ? 'w-full' : journey.confidenceState === 'delayed' ? 'w-2/3' : 'w-3/4'}`} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span>Pickup</span>
                <span>Live tracking</span>
                <span>Drop-off</span>
              </div>
            </div>
          </div>

          <div className="glass rounded-[1.75rem] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Trip lifecycle</h2>
                <p className="mt-1 text-sm text-slate-400">Existing ride controls preserved exactly.</p>
              </div>
              <Clock3 className="h-5 w-5 text-sky-300" />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { title: 'Start route', icon: Truck, tone: 'emerald', action: 'start' as const },
                { title: 'Mark pickup complete', icon: CheckCircle2, tone: 'emerald', action: 'board' as const },
                { title: 'Report delay', icon: AlertTriangle, tone: 'amber', action: 'delay' as const },
                { title: 'Mark arrived', icon: Navigation2, tone: 'slate', action: 'arrive' as const },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.title} onClick={() => handleAction(item.action)} className="flex min-h-[72px] items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-left text-sm font-medium text-white transition hover:border-white/15 hover:bg-white/[0.06]">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone === 'emerald' ? 'bg-emerald-500/10 text-emerald-300' : item.tone === 'amber' ? 'bg-amber-500/10 text-amber-300' : 'bg-slate-500/10 text-slate-300'}`}><Icon className="h-5 w-5" /></span>
                    <span>{item.title}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 rounded-2xl border border-white/8 bg-slate-950/60 p-4">
              <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Current ride</div>
              <div className="mt-2 text-base font-semibold text-white">{journey.routeName}</div>
              <div className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${journeyTone[journey.confidenceState]}`}>{journey.confidenceState}</div>
              <div className="mt-2 text-sm text-slate-400">{journey.currentLocationLabel}</div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-strong rounded-[2rem] p-5 shadow-2xl shadow-black/20 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Compliance vault</h2>
                <p className="mt-1 text-sm text-slate-400">Document state stays visible even when the connection drops.</p>
              </div>
              <div className={`rounded-full px-3 py-1 text-xs font-medium ring-1 capitalize ${complianceStatusClass[vault.status]}`}>{vault.status}</div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {documents.map((doc) => (
                <div key={doc.id} className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">{doc.type.replaceAll('_', ' ')}</div>
                      <div className="mt-1 text-xs text-slate-500">Driver NIN: {vault.nationalIdNumber}</div>
                    </div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 capitalize ${complianceStatusClass[doc.status]}`}>{doc.status}</span>
                  </div>
                  <div className="mt-3 text-xs text-slate-400">{doc.reviewedAt ? new Date(doc.reviewedAt).toLocaleString() : 'Pending review'}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-[1.75rem] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold text-white">Alerts and notes</h2><p className="mt-1 text-sm text-slate-400">Designed for poor signal, glare, and gloved fingers.</p></div><Mic2 className="h-5 w-5 text-sky-300" /></div>
            <div className="mt-6 space-y-3">{alerts.map((item) => <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.04] p-4 text-sm text-slate-300">{item}</div>)}</div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">{[{ label: 'Checkpoints', value: '3', icon: CheckCircle2 }, { label: 'Warnings', value: muted ? 'Muted' : '0', icon: XCircle }, { label: 'Next review', value: 'Today', icon: Clock3 }].map((item) => { const Icon = item.icon; return <div key={item.label} className="glass rounded-2xl p-4"><div className="flex items-center justify-between gap-3"><div><div className="text-xs text-slate-500">{item.label}</div><div className="mt-2 text-lg font-semibold text-white">{item.value}</div></div><Icon className="h-5 w-5 text-sky-300" /></div></div>; })}</div>
        </div>
      </section>
    </main>
  );
}
