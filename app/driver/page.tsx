import type { Metadata } from 'next';
import { AlertTriangle, CheckCircle2, Clock3, FileCheck2, Mic2, PhoneCall, ShieldAlert, Smartphone, Truck, WifiOff, XCircle } from 'lucide-react';
import type { DriverComplianceVault } from '../../types/polesafe';

export const metadata: Metadata = {
  title: 'Driver Dashboard — PoleSafe',
  description: 'Driver compliance and transport operations dashboard for PoleSafe.',
};

type TripStat = {
  label: string;
  value: string;
  tone: 'emerald' | 'orange' | 'red' | 'slate';
};

const vault: DriverComplianceVault = {
  driverId: 'drv_01',
  nationalIdNumber: 'CM12345678',
  status: 'verified',
  documents: [
    { id: 'doc_1', type: 'national_id', url: '#', status: 'verified', reviewedAt: '2026-08-12T09:00:00Z' },
    { id: 'doc_2', type: 'drivers_license', url: '#', status: 'verified', reviewedAt: '2026-08-12T09:00:00Z' },
    { id: 'doc_3', type: 'police_clearance', url: '#', status: 'pending' },
    { id: 'doc_4', type: 'vehicle_inspection', url: '#', status: 'verified', reviewedAt: '2026-08-11T15:30:00Z' },
  ],
  verifiedAt: '2026-08-12T09:15:00Z',
  verifiedBy: 'school_admin_01',
};

const tripStats: TripStat[] = [
  { label: 'Active route', value: 'Route A', tone: 'emerald' },
  { label: 'Today pickups', value: '18', tone: 'orange' },
  { label: 'Alerts', value: '0', tone: 'slate' },
  { label: 'Compliance', value: 'Verified', tone: 'emerald' },
];

const complianceStatusClass: Record<'verified' | 'pending' | 'rejected' | 'expired', string> = {
  verified: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-300 ring-amber-500/20',
  rejected: 'bg-red-500/10 text-red-300 ring-red-500/20',
  expired: 'bg-slate-500/10 text-slate-300 ring-slate-500/20',
};

export default function DriverDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-orange-300">
                <Truck className="h-3.5 w-3.5" /> Driver operations
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Driver stress mode
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Big controls, offline-friendly flow, and one-tap SOS for low-end Android devices in the field.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {tripStats.map((stat) => (
                <div key={stat.label} className="glass rounded-2xl px-4 py-3">
                  <div className="text-xs text-slate-400">{stat.label}</div>
                  <div className={`mt-1 text-lg font-semibold ${stat.tone === 'emerald' ? 'text-emerald-300' : stat.tone === 'orange' ? 'text-orange-300' : stat.tone === 'red' ? 'text-red-300' : 'text-white'}`}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="glass-strong rounded-3xl p-5 shadow-2xl shadow-black/20 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Panic response</h2>
                <p className="mt-1 text-sm text-slate-400">Single action for emergencies, even when the network is weak.</p>
              </div>
              <ShieldAlert className="h-5 w-5 text-orange-300" />
            </div>

            <button className="mt-6 flex w-full items-center justify-center gap-3 rounded-[1.5rem] bg-red-500 px-6 py-5 text-lg font-semibold text-white shadow-lg shadow-red-950/30 transition active:scale-[0.99] sm:min-h-[88px]">
              <PhoneCall className="h-6 w-6" />
              ONE-TAP SOS
            </button>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Fallback mode</div>
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-200">
                  <WifiOff className="h-4 w-4 text-amber-300" /> Offline queue enabled
                </div>
                <div className="mt-1 text-sm text-slate-400">Actions sync automatically when signal returns.</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Handset profile</div>
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-200">
                  <Smartphone className="h-4 w-4 text-emerald-300" /> Low-end Android optimized
                </div>
                <div className="mt-1 text-sm text-slate-400">Large targets and reduced visual noise.</div>
              </div>
            </div>
          </div>

          <div className="glass rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Tap-friendly daily actions</h2>
                <p className="mt-1 text-sm text-slate-400">Short list, large buttons, and no hunting through menus.</p>
              </div>
              <Clock3 className="h-5 w-5 text-emerald-300" />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { title: 'Start route', icon: Truck, tone: 'emerald' },
                { title: 'Mark pickup complete', icon: CheckCircle2, tone: 'emerald' },
                { title: 'Report delay', icon: AlertTriangle, tone: 'orange' },
                { title: 'Log fuel check', icon: FileCheck2, tone: 'slate' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.title} className="flex min-h-[72px] items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/60 px-4 py-3 text-left text-sm font-medium text-white">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone === 'emerald' ? 'bg-emerald-500/10 text-emerald-300' : item.tone === 'orange' ? 'bg-orange-500/10 text-orange-300' : 'bg-slate-500/10 text-slate-300'}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>{item.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-strong rounded-3xl p-5 shadow-2xl shadow-black/20 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Compliance vault</h2>
                <p className="mt-1 text-sm text-slate-400">Document state stays visible even when the connection drops.</p>
              </div>
              <div className={`rounded-full px-3 py-1 text-xs font-medium ring-1 capitalize ${complianceStatusClass[vault.status]}`}>
                {vault.status}
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-white/8">
              <table className="min-w-full divide-y divide-white/8 text-left text-sm">
                <thead className="bg-white/[0.04] text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Document</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Reviewed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8 bg-slate-950/50">
                  {(vault.documents ?? []).map((doc) => (
                    <tr key={doc.id} className="text-slate-300">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{doc.type.replaceAll('_', ' ')}</div>
                        <div className="text-xs text-slate-500">Driver NIN: {vault.nationalIdNumber}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 capitalize ${complianceStatusClass[doc.status]}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{doc.reviewedAt ? new Date(doc.reviewedAt).toLocaleString() : 'Pending review'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Offline safety notes</h2>
                <p className="mt-1 text-sm text-slate-400">Designed for poor signal, glare, and gloved fingers.</p>
              </div>
              <Mic2 className="h-5 w-5 text-orange-300" />
            </div>

            <div className="mt-6 space-y-3">
              {[
                'One-tap SOS stays on screen at all times',
                'Queued actions sync when the network returns',
                'Buttons are large enough for quick thumb taps',
                'Critical route info remains readable in bright light',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.04] p-4 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: 'Checkpoints', value: '3', icon: CheckCircle2 },
              { label: 'Warnings', value: '0', icon: XCircle },
              { label: 'Next review', value: 'Today', icon: Clock3 },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="glass rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs text-slate-500">{item.label}</div>
                      <div className="mt-2 text-lg font-semibold text-white">{item.value}</div>
                    </div>
                    <Icon className="h-5 w-5 text-orange-300" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
