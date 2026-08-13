import type { Metadata } from 'next';
import { CheckCircle2, Clock3, FileCheck2, ShieldAlert, Truck, XCircle } from 'lucide-react';
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
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-orange-300">
                <Truck className="h-3.5 w-3.5" /> Driver operations
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Driver compliance vault
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Review route status, trip readiness, and compliance documents in one clean operations view.
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

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:px-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="glass-strong rounded-3xl p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Trip readiness</h2>
                <p className="mt-1 text-sm text-slate-400">Daily operational state for the assigned route.</p>
              </div>
              <ShieldAlert className="h-5 w-5 text-orange-300" />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Current vehicle</div>
                <div className="mt-2 text-lg font-semibold text-white">UAX 482B</div>
                <div className="mt-1 text-sm text-slate-400">Service Toyota Hiace</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Next checkpoint</div>
                <div className="mt-2 text-lg font-semibold text-white">Main Campus</div>
                <div className="mt-1 text-sm text-slate-400">07:55 arrival window</div>
              </div>
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Activity timeline</h2>
                <p className="mt-1 text-sm text-slate-400">Latest driver-side operational events.</p>
              </div>
              <Clock3 className="h-5 w-5 text-emerald-300" />
            </div>

            <div className="mt-6 space-y-4">
              {[
                { title: 'Pre-trip checklist completed', time: '06:45', icon: CheckCircle2, tone: 'emerald' },
                { title: 'Fuel check recorded', time: '06:50', icon: FileCheck2, tone: 'orange' },
                { title: 'Route broadcast sent', time: '06:52', icon: Truck, tone: 'slate' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-slate-950/60 p-4">
                    <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl ${item.tone === 'emerald' ? 'bg-emerald-500/10 text-emerald-300' : item.tone === 'orange' ? 'bg-orange-500/10 text-orange-300' : 'bg-slate-500/10 text-slate-300'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-white">{item.title}</div>
                      <div className="mt-1 text-xs text-slate-500">{item.time}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-strong rounded-3xl p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Compliance vault</h2>
                <p className="mt-1 text-sm text-slate-400">Document review state for the active driver.</p>
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
