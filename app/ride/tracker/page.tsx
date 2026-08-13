'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, MapPinned, ShieldAlert, Siren, Smartphone, Truck } from 'lucide-react';
import { buildSOSAlert, evaluateJourneyTelemetry } from '../../../lib/ride/engine';
import { upsertRideSnapshot } from '../../../lib/ride/registry';
import type { LiveJourneyState } from '../../../types/polesafe';

const INITIAL_STATE: LiveJourneyState = {
  rideId: 'ride_ug_001',
  vehicleKind: 'boda_boda',
  parentId: 'par_88392',
  driverId: 'drv_01',
  childId: 'child_001',
  routeName: 'Kampala Central → School Gate',
  confidenceState: 'confirmed',
  confidence: 'confirmed',
  confidenceNote: 'Driver accepted and route confirmed',
  currentLocationLabel: 'Departed home gate • approx. position',
  geofenceStatus: 'approaching',
  etaMinutes: 12,
  speedKph: 0,
  plannedStopSeconds: 180,
  currentStopSeconds: 0,
  checkpoints: [
    { checkpointId: 'cp_1', label: 'Home gate', type: 'home_gate', confidence: 'confirmed' },
    { checkpointId: 'cp_2', label: 'Makerere corridor', type: 'route_point', confidence: 'in_transit' },
    { checkpointId: 'cp_3', label: 'School gate', type: 'school_gate', confidence: 'arrived' },
  ],
};

const baseRoute = {
  rideId: 'ride_ug_001',
  routeName: 'Kampala Central → School Gate',
  homeGateLabel: 'Home gate',
  schoolGateLabel: 'School gate',
  allowedStopSeconds: 240,
  vehicleKind: 'boda_boda' as const,
};

export default function RideTrackerPage() {
  const [state, setState] = useState<LiveJourneyState>(INITIAL_STATE);
  const [alerts, setAlerts] = useState<string[]>([]);

  const confidenceTone = useMemo(() => ({ confirmed: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20', in_transit: 'bg-sky-500/10 text-sky-300 ring-sky-500/20', delayed: 'bg-amber-500/10 text-amber-300 ring-amber-500/20', arrived: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20' }) as const, []);

  const persist = (nextState: LiveJourneyState, nextAlerts: string[]) => {
    setState(nextState);
    setAlerts(nextAlerts);
    upsertRideSnapshot({ state: nextState, alerts: nextAlerts.map((message, idx) => ({ alertId: `${nextState.rideId}-${idx}`, rideId: nextState.rideId, alertType: idx === 0 && message.toLowerCase().includes('sos') ? 'sos' : message.toLowerCase().includes('arrival') ? 'geofence_arrival' : message.toLowerCase().includes('stop') ? 'unscheduled_stop' : 'route_deviation', severity: message.toLowerCase().includes('sos') ? 'critical' : message.toLowerCase().includes('arrival') ? 'low' : 'high', message, confidence: nextState.confidence, createdAt: new Date().toISOString() })), updatedAt: new Date().toISOString() });
  };

  const pushTelemetry = (kind: 'route' | 'stop' | 'arrived' | 'sos') => {
    if (kind === 'sos') {
      const sos = buildSOSAlert({ rideId: state.rideId, driverId: state.driverId, parentId: state.parentId, vehicleKind: state.vehicleKind, maskedLocation: state.currentLocationLabel, reason: 'Driver pressed emergency SOS', timestamp: new Date().toISOString() });
      persist({ ...state, confidenceState: 'delayed', confidence: 'delayed', activeAlertTypes: [...(state.activeAlertTypes ?? []), 'sos'], confidenceNote: sos.confidenceNote, confidenceUpdatedAt: sos.createdAt }, [sos.message]);
      return;
    }

    const telemetry = { rideId: state.rideId, latitude: -1.2921, longitude: 36.8219, speedKph: kind === 'stop' ? 0 : kind === 'arrived' ? 0 : 28, timestamp: new Date().toISOString(), vehicleKind: state.vehicleKind, currentZone: kind === 'arrived' ? 'school_gate' : kind === 'route' ? 'route' : 'unknown', accuracyMeters: kind === 'route' ? 320 : 40 } as const;
    const result = evaluateJourneyTelemetry({ state, route: baseRoute, telemetry, routeToleranceMeters: 180 });
    persist(result.nextState, result.alerts.map((a) => a.message));
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100"><div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.14),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(56,189,248,0.10),_transparent_26%)]" /><div className="pointer-events-none fixed inset-0 soft-grid opacity-[0.16]" />
      <section className="border-b border-white/5 bg-slate-950/70 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-orange-300 shadow-sm shadow-black/20"><MapPinned className="h-3.5 w-3.5" /> Live journey</div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Live Transit Tracker</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">Safety-hardened tracking for car and boda rides with geofencing, anomaly alerts, and SOS escalation.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/dispatch" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10">Open dispatch</Link>
              <Link href="/parent" className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400">Parent view</Link>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="space-y-4">
          <div className="glass-strong rounded-[2rem] p-5 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <div><h2 className="text-lg font-semibold text-white">Current ride state</h2><p className="mt-1 text-sm text-slate-400">Geofence-aware confidence layer for the active ride.</p></div>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ${confidenceTone[state.confidenceState]}`}>{state.confidenceState.replace('_', ' ')}</div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4"><div className="text-xs text-slate-500">Vehicle</div><div className="mt-1 text-sm font-semibold text-white">{state.vehicleKind === 'boda_boda' ? 'Boda Boda' : 'Car'}</div></div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4"><div className="text-xs text-slate-500">Zone</div><div className="mt-1 text-sm font-semibold text-white">{state.geofenceStatus}</div></div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4"><div className="text-xs text-slate-500">ETA</div><div className="mt-1 text-sm font-semibold text-white">{state.etaMinutes ?? '—'} min</div></div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4"><div className="text-xs text-slate-500">Location</div><div className="mt-1 text-sm font-semibold text-white">{state.currentLocationLabel}</div></div>
            </div>
          </div>
          <div className="glass rounded-[1.75rem] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold text-white">Live transit map</h2><p className="mt-1 text-sm text-slate-400">Approximate position, route corridor, and gate checkpoints.</p></div><Truck className="h-5 w-5 text-orange-300" /></div>
            <div className="mt-5 rounded-3xl border border-white/8 bg-slate-950/70 p-5">
              <div className="flex items-center justify-between text-sm text-slate-300"><span>{baseRoute.homeGateLabel}</span><ArrowRight className="h-4 w-4 text-slate-500" /><span>{baseRoute.routeName}</span><ArrowRight className="h-4 w-4 text-slate-500" /><span>{baseRoute.schoolGateLabel}</span></div>
              <div className="mt-5 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300"><Smartphone className="h-5 w-5" /></div><div><div className="text-sm font-semibold text-white">{state.currentLocationLabel}</div><div className="text-xs text-slate-400">Vehicle moving in real time with geofence checks</div></div></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => pushTelemetry('route')} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur-xl hover:bg-white/10">Simulate route drift</button><button onClick={() => pushTelemetry('stop')} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur-xl hover:bg-white/10">Simulate long stop</button><button onClick={() => pushTelemetry('arrived')} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur-xl hover:bg-white/10">Simulate arrival</button></div>
          </div>
        </div>
        <aside className="space-y-4">
          <div className="glass-strong rounded-[2rem] p-5 shadow-2xl shadow-black/20"><div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold text-white">SOS / Panic</h2><p className="mt-1 text-sm text-slate-400">One tap escalates to parent + platform owner + dispatch.</p></div><ShieldAlert className="h-5 w-5 text-red-300" /></div><button onClick={() => pushTelemetry('sos')} className="mt-5 flex w-full items-center justify-center gap-3 rounded-[1.5rem] bg-red-500 px-6 py-5 text-lg font-semibold text-white shadow-lg shadow-red-950/30"><Siren className="h-6 w-6" /> ONE-TAP SOS</button></div>
          <div className="glass rounded-[1.75rem] p-5 sm:p-6"><h3 className="text-lg font-semibold text-white">Confidence events</h3><div className="mt-4 space-y-2 text-sm text-slate-300">{alerts.length ? alerts.map((alert, idx) => <div key={`${alert}-${idx}`} className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">{alert}</div>) : <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">No active anomalies. Ride is being monitored.</div>}</div></div>
          <div className="glass rounded-[1.75rem] p-5 sm:p-6"><h3 className="text-lg font-semibold text-white">Ride checkpoints</h3><div className="mt-4 space-y-3">{(state.checkpoints ?? []).map((cp) => <div key={cp.checkpointId} className="rounded-2xl border border-white/8 bg-white/[0.04] p-3"><div className="flex items-center justify-between gap-3"><div className="font-medium text-white">{cp.label}</div><CheckCircle2 className="h-4 w-4 text-emerald-300" /></div><div className="text-xs text-slate-400">{cp.type.replace('_', ' ')} • {cp.confidence}</div></div>)}</div></div>
        </aside>
      </section>
    </main>
  );
}
