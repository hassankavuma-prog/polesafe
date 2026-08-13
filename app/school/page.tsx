import type { Metadata } from 'next';
import { BusFront, CheckCircle2, Clock3, Users2, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { School } from '../../types/polesafe';

type AttendanceRecord = {
  id: string;
  childName: string;
  guardianName: string;
  campusName: string;
  status: 'checked_in' | 'checked_out';
  time: string;
  route: string;
};

type DriverComplianceRow = {
  driverId: string;
  driverName: string;
  route: string;
  status: 'verified' | 'pending' | 'rejected';
  vehicle: string;
  lastReviewed: string;
};

export const metadata: Metadata = {
  title: 'School Dashboard — PoleSafe',
  description: 'School admin attendance and compliance dashboard for PoleSafe.',
};

const school: School = {
  id: 'school_ug_001',
  kind: 'school',
  name: 'Kampala Preparatory School',
  country: 'Uganda',
  currency: 'UGX',
  campuses: [
    {
      id: 'campus_1',
      organizationId: 'school_ug_001',
      name: 'Main Campus',
      address: 'Makerere Hill, Kampala',
      region: 'Kampala',
      contactPhone: '+256700000001',
      isPrimary: true,
    },
    {
      id: 'campus_2',
      organizationId: 'school_ug_001',
      name: 'North Wing',
      address: 'Gayaza Road, Wakiso',
      region: 'Wakiso',
      contactPhone: '+256700000002',
      isPrimary: false,
    },
  ],
  createdAt: '2026-08-13T00:00:00.000Z',
};

const attendanceStream: AttendanceRecord[] = [
  { id: 'a1', childName: 'Amina N.', guardianName: 'Mariam N.', campusName: 'Main Campus', status: 'checked_in', time: '07:18', route: 'Route A' },
  { id: 'a2', childName: 'Brian K.', guardianName: 'Joseph K.', campusName: 'Main Campus', status: 'checked_in', time: '07:22', route: 'Route B' },
  { id: 'a3', childName: 'Faith T.', guardianName: 'Sarah T.', campusName: 'North Wing', status: 'checked_out', time: '07:27', route: 'Route C' },
  { id: 'a4', childName: 'Kevin M.', guardianName: 'Alex M.', campusName: 'Main Campus', status: 'checked_in', time: '07:31', route: 'Route A' },
  { id: 'a5', childName: 'Nadia S.', guardianName: 'Patience S.', campusName: 'North Wing', status: 'checked_out', time: '07:35', route: 'Route D' },
  { id: 'a6', childName: 'Joel P.', guardianName: 'Peter P.', campusName: 'Main Campus', status: 'checked_in', time: '07:39', route: 'Route B' },
];

const driverCompliance: DriverComplianceRow[] = [
  { driverId: 'drv_01', driverName: 'Ivan Ssebuufu', route: 'Route A', status: 'verified', vehicle: 'UAX 482B', lastReviewed: 'Yesterday' },
  { driverId: 'drv_02', driverName: 'Grace Nakato', route: 'Route B', status: 'pending', vehicle: 'UAY 114C', lastReviewed: 'Today' },
  { driverId: 'drv_03', driverName: 'Moses Kato', route: 'Route C', status: 'verified', vehicle: 'UAZ 902D', lastReviewed: '2 days ago' },
  { driverId: 'drv_04', driverName: 'Samuel Sserunkuuma', route: 'Route D', status: 'rejected', vehicle: 'UAW 331A', lastReviewed: 'Today' },
];

function statusTone(status: AttendanceRecord['status'] | DriverComplianceRow['status']) {
  if (status === 'verified' || status === 'checked_in') return 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20';
  if (status === 'pending') return 'bg-amber-500/10 text-amber-300 ring-amber-500/20';
  if (status === 'rejected') return 'bg-red-500/10 text-red-300 ring-red-500/20';
  return 'bg-slate-500/10 text-slate-300 ring-slate-500/20';
}

export default function SchoolDashboardPage() {
  const campusCount = school.campuses.length;
  const mainCampus = school.campuses.find((campus) => campus.isPrimary) ?? school.campuses[0];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-orange-300">
                <ShieldCheck className="h-3.5 w-3.5" /> School admin dashboard
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {school.name}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Multi-tenant attendance, transport oversight, and driver compliance for your campuses in Uganda.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="glass rounded-2xl px-4 py-3">
                <div className="text-xs text-slate-400">Campus count</div>
                <div className="mt-1 text-xl font-semibold text-white">{campusCount}</div>
              </div>
              <div className="glass rounded-2xl px-4 py-3">
                <div className="text-xs text-slate-400">Today in</div>
                <div className="mt-1 text-xl font-semibold text-emerald-300">{attendanceStream.filter((item) => item.status === 'checked_in').length}</div>
              </div>
              <div className="glass rounded-2xl px-4 py-3">
                <div className="text-xs text-slate-400">Today out</div>
                <div className="mt-1 text-xl font-semibold text-orange-300">{attendanceStream.filter((item) => item.status === 'checked_out').length}</div>
              </div>
              <div className="glass rounded-2xl px-4 py-3">
                <div className="text-xs text-slate-400">Primary campus</div>
                <div className="mt-1 text-sm font-semibold text-white">{mainCampus.name}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:px-8 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="glass-strong rounded-3xl p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Live attendance stream</h2>
                <p className="mt-1 text-sm text-slate-400">Check-ins and check-outs updating at the gate.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                <Clock3 className="h-3.5 w-3.5" /> Real-time feed
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {attendanceStream.map((record) => (
                <article key={record.id} className="rounded-2xl border border-white/8 bg-white/[0.04] p-4 transition hover:border-white/15 hover:bg-white/[0.06]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{record.childName}</div>
                      <div className="mt-1 text-xs text-slate-400">Guardian: {record.guardianName}</div>
                    </div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${statusTone(record.status)}`}>
                      {record.status === 'checked_in' ? 'Checked in' : 'Checked out'}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Campus</span>
                      <span>{record.campusName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Route</span>
                      <span>{record.route}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Time</span>
                      <span>{record.time}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Campus overview</h2>
                <p className="mt-1 text-sm text-slate-400">Multi-tenant structure for schools and campuses.</p>
              </div>
              <Users2 className="h-5 w-5 text-orange-300" />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {school.campuses.map((campus) => (
                <div key={campus.id} className="rounded-2xl border border-white/8 bg-slate-950/60 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-white">{campus.name}</div>
                      <div className="mt-1 text-xs text-slate-400">{campus.address}</div>
                    </div>
                    {campus.isPrimary ? <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-[11px] text-orange-300 ring-1 ring-orange-500/20">Primary</span> : null}
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Region</span>
                      <span>{campus.region}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Phone</span>
                      <span>{campus.contactPhone}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="glass-strong rounded-3xl p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Driver compliance overview</h2>
                <p className="mt-1 text-sm text-slate-400">Assigned school transport operators and current review state.</p>
              </div>
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-white/8">
              <table className="min-w-full divide-y divide-white/8 text-left text-sm">
                <thead className="bg-white/[0.04] text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Driver</th>
                    <th className="px-4 py-3 font-medium">Vehicle</th>
                    <th className="px-4 py-3 font-medium">Route</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8 bg-slate-950/50">
                  {driverCompliance.map((driver) => (
                    <tr key={driver.driverId} className="text-slate-300">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{driver.driverName}</div>
                        <div className="text-xs text-slate-500">Reviewed {driver.lastReviewed}</div>
                      </td>
                      <td className="px-4 py-3">{driver.vehicle}</td>
                      <td className="px-4 py-3">{driver.route}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 capitalize ${statusTone(driver.status)}`}>
                          {driver.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-300" />
              <div>
                <h3 className="text-lg font-semibold text-white">Operations reminder</h3>
                <p className="text-sm text-slate-400">Keep attendance, route, and compliance data in sync before school dismissals.</p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Live gate tracking enabled
            </div>
            <div className="mt-3 flex items-center gap-3 text-sm text-slate-300">
              <BusFront className="h-4 w-4 text-orange-300" />
              Driver compliance review in progress
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
