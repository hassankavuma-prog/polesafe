import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, MapPinned, RadioTower, ShieldCheck, Siren, Truck, Users2 } from 'lucide-react';
import type { OperationalConfidence, OperationalEvent } from '../../types/polesafe';
import { UnifiedTimeline } from '../../components/operations/unified-timeline';

export const metadata: Metadata = {
  title: 'Dispatch Map — PoleSafe',
  description: 'Emergency dispatch and live route visibility for PoleSafe.',
};

type DispatchIncident = {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium';
  route: string;
  location: string;
  privacyMasked: boolean;
  status: 'active' | 'triaged' | 'escalated';
  confidence: OperationalConfidence;
  kind: 'speed_violation' | 'geofence_breach' | 'stop_duration' | 'sos_escalation';
  note: string;
};

type VehiclePin = {
  id: string;
  label: string;
  route: string;
  status: 'moving' | 'stopped' | 'delayed';
  maskedLocation: string;
  confidence: OperationalConfidence;
};

const incidents: DispatchIncident[] = [
  { id: 'inc_01', title: 'Child pickup missing', severity: 'critical', route: 'Route A', location: 'Makerere Hill area', privacyMasked: true, status: 'active', confidence: 'confirmed', kind: 'sos_escalation', note: 'Driver SOS escalated and awaiting dispatcher ack' },
  { id: 'inc_02', title: 'Vehicle delay', severity: 'medium', route: 'Route B', location: 'Kampala Northern Bypass', privacyMasked: true, status: 'triaged', confidence: 'inferred', kind: 'stop_duration', note: 'Stop duration exceeds expected corridor threshold' },
  { id: 'inc_03', title: 'Gate confirmation pending', severity: 'high', route: 'Route D', location: 'North Wing campus', privacyMasked: false, status: 'escalated', confidence: 'delayed', kind: 'geofence_breach', note: 'Geo-fence exit detected, confirmation still pending' },
  { id: 'inc_04', title: 'Speed spike detected', severity: 'high', route: 'Route C', location: 'Wakiso corridor', privacyMasked: true, status: 'triaged', confidence: 'offline-received', kind: 'speed_violation', note: 'Telemetry queue replay flagged an above-threshold burst' },
];

const vehicles: VehiclePin[] = [
  { id: 'veh_01', label: 'UAX 482B', route: 'Route A', status: 'moving', maskedLocation: 'Near Makerere Hill • masked', confidence: 'confirmed' },
  { id: 'veh_02', label: 'UAY 114C', route: 'Route B', status: 'delayed', maskedLocation: 'Nairobi Road junction • masked', confidence: 'inferred' },
  { id: 'veh_03', label: 'UAZ 902D', route: 'Route C', status: 'stopped', maskedLocation: 'Main Campus pickup zone • masked', confidence: 'delayed' },
  { id: 'veh_04', label: 'UAW 331A', route: 'Route D', status: 'moving', maskedLocation: 'Wakiso corridor • masked', confidence: 'confirmed' },
];

const routeHealth = [
  { route: 'Route A', status: 'good', anomaly: 'none' },
  { route: 'Route B', status: 'watch', anomaly: 'speed spike' },
  { route: 'Route C', status: 'critical', anomaly: 'long stop' },
  { route: 'Route D', status: 'critical', anomaly: 'geo-fence alert' },
] as const;

const severityTone = {
  critical: 'bg-red-500/10 text-red-300 ring-red-500/20',
  high: 'bg-orange-500/10 text-orange-300 ring-orange-500/20',
  medium: 'bg-amber-500/10 text-amber-300 ring-amber-500/20',
} as const;

const routeTone = {
  good: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
  watch: 'bg-amber-500/10 text-amber-300 ring-amber-500/20',
  critical: 'bg-red-500/10 text-red-300 ring-red-500/20',
} as const;

const operationalEvents: OperationalEvent[] = [
  { eventId: 'evt_01', eventType: 'sos', confidence: 'confirmed', actorRole: 'driver', actorId: 'drv_01', organizationId: 'org_1', schoolId: 'school_1', rideId: 'ride_1', incidentId: 'inc_01', occurredAt: '2026-08-13T07:12:00Z', summary: 'Driver SOS raised from Route A', sourceChannel: 'app', privacyMasked: true, metadata: { routeLabel: 'Route A', note: 'Immediate dispatcher review required' } },
  { eventId: 'evt_02', eventType: 'vehicle_telemetry', confidence: 'inferred', actorRole: 'system', actorId: 'telemetry', organizationId: 'org_1', vehicleId: 'veh_02', occurredAt: '2026-08-13T07:10:00Z', summary: 'Speed burst above route norm on Kampala Northern Bypass', sourceChannel: 'telemetry', privacyMasked: true, metadata: { routeLabel: 'Route B', note: 'Speed anomaly', speedKph: 72 } },
  { eventId: 'evt_03', eventType: 'school_gate', confidence: 'manually-verified', actorRole: 'school_admin', actorId: 'sch_01', organizationId: 'org_1', schoolId: 'school_1', occurredAt: '2026-08-13T07:08:00Z', summary: 'School gate scan confirmed student arrival', sourceChannel: 'manual', privacyMasked: false, metadata: { routeLabel: 'Route D', note: 'Teacher verified arrival' } },
  { eventId: 'evt_04', eventType: 'sms_log', confidence: 'offline-received', actorRole: 'system', actorId: 'gateway', organizationId: 'org_1', childId: 'child_1', occurredAt: '2026-08-13T07:06:00Z', summary: 'Kabiriti SMS fallback delivery replayed successfully', sourceChannel: 'sms', privacyMasked: false, metadata: { routeLabel: 'Fallback SMS', note: 'Delivery recovered after outage' } },
  { eventId: 'evt_05', eventType: 'payment', confidence: 'delayed', actorRole: 'parent', actorId: 'par_1', organizationId: 'org_1', transactionId: 'TXN-UG-98215', occurredAt: '2026-08-13T07:04:00Z', summary: 'Airtel Money payment waiting for callback match', sourceChannel: 'payment_gateway', privacyMasked: false, metadata: { routeLabel: 'Finance', note: 'Pending reconciliation' } },
];

const confidenceTone: Record<OperationalConfidence, string> = {
  confirmed: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
  inferred: 'bg-sky-500/10 text-sky-300 ring-sky-500/20',
  delayed: 'bg-amber-500/10 text-amber-300 ring-amber-500/20',
  'offline-received': 'bg-violet-500/10 text-violet-300 ring-violet-500/20',
  'manually-verified': 'bg-orange-500/10 text-orange-300 ring-orange-500/20',
};

export default function DispatchMapPage() {
  const prioritizedIncidents = [...incidents].sort((a, b) => {
    const score = (item: DispatchIncident) => (item.severity === 'critical' ? 4 : item.severity === 'high' ? 3 : 2) + (item.kind === 'sos_escalation' ? 4 : item.kind === 'geofence_breach' ? 3 : item.kind === 'speed_violation' ? 2 : 1);
    return score(b) - score(a);
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-orange-300">
                <RadioTower className="h-3.5 w-3.5" /> Dispatch / emergency command
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Emergency dispatch map</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Automated prioritization for speed violations, geo-fence breaches, prolonged stops, and SOS escalations across Kampala, Wakiso, and Mukono.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/dispatch/sos" className="inline-flex items-center gap-2 rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white hover:bg-red-400">
                <Siren className="h-4 w-4" /> Open SOS panel
              </Link>
              <button type="button" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 hover:bg-white/10">
                Refresh live map
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="glass rounded-2xl px-4 py-3"><div className="text-xs text-slate-400">Incidents</div><div className="mt-1 text-xl font-semibold text-white">{incidents.length}</div></div>
            <div className="glass rounded-2xl px-4 py-3"><div className="text-xs text-slate-400">Vehicles live</div><div className="mt-1 text-xl font-semibold text-emerald-300">{vehicles.length}</div></div>
            <div className="glass rounded-2xl px-4 py-3"><div className="text-xs text-slate-400">Masked mode</div><div className="mt-1 text-xl font-semibold text-orange-300">On</div></div>
            <div className="glass rounded-2xl px-4 py-3"><div className="text-xs text-slate-400">Status</div><div className="mt-1 text-xl font-semibold text-white">Monitoring</div></div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:px-8 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="glass-strong rounded-3xl p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Incident command board</h2>
                <p className="mt-1 text-sm text-slate-400">Prioritized queue for the highest-risk operational events.</p>
              </div>
              <AlertTriangle className="h-5 w-5 text-amber-300" />
            </div>

            <div className="mt-6 space-y-4">
              {prioritizedIncidents.map((incident) => (
                <article key={incident.id} className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">{incident.title}</div>
                      <div className="mt-1 text-xs text-slate-400">{incident.route} • {incident.privacyMasked ? 'privacy masked' : incident.location}</div>
                      <div className="mt-2 text-xs text-slate-500">{incident.note}</div>
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <div className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 capitalize ${severityTone[incident.severity]}`}>{incident.severity}</div>
                      <div className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${confidenceTone[incident.confidence]}`}>{incident.confidence}</div>
                      <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 ring-1 ring-white/10">{incident.kind.replaceAll('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 ring-1 ring-white/10">{incident.status}</span>
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 ring-1 ring-white/10">{incident.privacyMasked ? 'masked' : 'unmasked'}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <UnifiedTimeline events={operationalEvents} />
        </div>

        <aside className="space-y-6">
          <div className="glass-strong rounded-3xl p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Ops summary</h2>
                <p className="mt-1 text-sm text-slate-400">What the dispatcher needs to know at a glance.</p>
              </div>
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
            </div>

            <div className="mt-6 space-y-3">
              {[
                'SOS events are pinned above routine vehicle updates',
                'Speed bursts and stop-duration anomalies are auto-ranked',
                'Privacy masking stays on until verified unmasking',
                'Vehicle positions remain approximate by design',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.04] p-4 text-sm text-slate-300">{item}</div>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="flex items-center gap-3">
              <Users2 className="h-5 w-5 text-orange-300" />
              <div>
                <h3 className="text-lg font-semibold text-white">Dispatcher workflow</h3>
                <p className="text-sm text-slate-400">Triage → notify → escalate → resolve.</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="flex items-center gap-3">
              <MapPinned className="h-5 w-5 text-emerald-300" />
              <div>
                <h3 className="text-lg font-semibold text-white">Route health map</h3>
                <p className="text-sm text-slate-400">Kampala, Wakiso, and Mukono are all monitored with the same policy lens.</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {routeHealth.map((route) => (
                <div key={route.route} className={`rounded-full px-3 py-1 text-xs ring-1 ${routeTone[route.status]}`}>{route.route} • {route.anomaly}</div>
              ))}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="rounded-2xl border border-white/8 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{vehicle.label}</div>
                      <div className="text-xs text-slate-400">{vehicle.route}</div>
                    </div>
                    <Truck className="h-4 w-4 text-orange-300" />
                  </div>
                  <div className="mt-4 text-sm text-slate-300">{vehicle.maskedLocation}</div>
                  <div className="mt-2 inline-flex rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 ring-1 ring-white/10 capitalize">{vehicle.status}</div>
                  <div className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] ring-1 ${confidenceTone[vehicle.confidence]}`}>{vehicle.confidence}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
