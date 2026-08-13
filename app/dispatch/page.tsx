import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, MapPinned, RadioTower, ShieldCheck, Siren, Truck, Users2 } from 'lucide-react';

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
};

type VehiclePin = {
  id: string;
  label: string;
  route: string;
  status: 'moving' | 'stopped' | 'delayed';
  maskedLocation: string;
};

const incidents: DispatchIncident[] = [
  { id: 'inc_01', title: 'Child pickup missing', severity: 'critical', route: 'Route A', location: 'Makerere Hill area', privacyMasked: true, status: 'active' },
  { id: 'inc_02', title: 'Vehicle delay', severity: 'medium', route: 'Route B', location: 'Kampala Northern Bypass', privacyMasked: true, status: 'triaged' },
  { id: 'inc_03', title: 'Gate confirmation pending', severity: 'high', route: 'Route D', location: 'North Wing campus', privacyMasked: false, status: 'escalated' },
];

const vehicles: VehiclePin[] = [
  { id: 'veh_01', label: 'UAX 482B', route: 'Route A', status: 'moving', maskedLocation: 'Near Makerere Hill • masked' },
  { id: 'veh_02', label: 'UAY 114C', route: 'Route B', status: 'delayed', maskedLocation: 'Nairobi Road junction • masked' },
  { id: 'veh_03', label: 'UAZ 902D', route: 'Route C', status: 'stopped', maskedLocation: 'Main Campus pickup zone • masked' },
  { id: 'veh_04', label: 'UAW 331A', route: 'Route D', status: 'moving', maskedLocation: 'Wakiso corridor • masked' },
];

const routeHealth = [
  { route: 'Route A', status: 'good', anomaly: 'none' },
  { route: 'Route B', status: 'watch', anomaly: 'speed spike' },
  { route: 'Route C', status: 'good', anomaly: 'none' },
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

export default function DispatchMapPage() {
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
                Live route visibility, masked privacy mode, route health alerts, and escalation workflows for school mobility incidents.
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
                <p className="mt-1 text-sm text-slate-400">Escalate, triage, and resolve the current safety queue.</p>
              </div>
              <AlertTriangle className="h-5 w-5 text-amber-300" />
            </div>

            <div className="mt-6 space-y-4">
              {incidents.map((incident) => (
                <article key={incident.id} className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">{incident.title}</div>
                      <div className="mt-1 text-xs text-slate-400">{incident.route} • {incident.privacyMasked ? 'privacy masked' : incident.location}</div>
                    </div>
                    <div className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 capitalize ${severityTone[incident.severity]}`}>
                      {incident.severity}
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

          <div className="glass rounded-3xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Route health map</h2>
                <p className="mt-1 text-sm text-slate-400">Track route performance, delays, and geo-fence pressure.</p>
              </div>
              <MapPinned className="h-5 w-5 text-emerald-300" />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {routeHealth.map((route) => (
                <div key={route.route} className={`rounded-full px-3 py-1 text-xs ring-1 ${routeTone[route.status]}`}>
                  {route.route} • {route.anomaly}
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                  <div className="mt-3 inline-flex rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 ring-1 ring-white/10 capitalize">{vehicle.status}</div>
                </div>
              ))}
            </div>
          </div>
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
                'Hamnah surfaces urgent incidents first',
                'Privacy masking stays on until verified unmasking',
                'Vehicle positions remain approximate by design',
                'Route health and escalation workflow stay visible',
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
        </aside>
      </section>
    </main>
  );
}
