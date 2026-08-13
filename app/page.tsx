import Link from 'next/link';
import { ArrowRight, Bus, CheckCircle2, School, ShieldAlert, Smartphone, Users } from 'lucide-react';

const highlights = [
  {
    icon: ShieldAlert,
    title: 'Child safety verification',
    description: 'Arrival-only safe-word reveal for school rides, child handoff confirmation, and Boda Boda safety checks where applicable.',
  },
  {
    icon: School,
    title: 'School admin OS',
    description: 'Multi-gate geo-fencing, attendance, staggered dismissal bells, and mass broadcast controls for schools.',
  },
  {
    icon: Users,
    title: 'Dual account modes',
    description: 'Kids Mobility Account and Personal Ride Account keep school rides and community rides separate without mixing the rules.',
  },
  {
    icon: Smartphone,
    title: 'Upfront bundles + fallback',
    description: 'Weekly, monthly, and termly bundles with MTN/Airtel Money plus SMS/USSD fallback support.',
  },
];

const roleCards = [
  {
    title: 'Parents & community riders',
    text: 'Book verified school rides or community rides, set child safe-words for school journeys, and track handoff safety from pickup to drop-off.',
  },
  {
    title: 'Schools',
    text: 'Manage gates, attendance, broadcasts, and dismissal timing from one operations dashboard.',
  },
  {
    title: 'Drivers',
    text: 'Follow route, compliance, safe-word, and arrival verification steps in the right order for the ride type you are on.',
  },
  {
    title: 'Dispatchers',
    text: 'Pin gates physically, monitor 200m geofences, and coordinate safety incidents in real time.',
  },
];

const liveMetrics = [
  { label: 'Active rides', value: '128', delta: '+12 today', tone: 'from-orange-500/20 to-orange-500/5', accent: 'text-orange-300' },
  { label: 'Verified handoffs', value: '99.2%', delta: 'arrival-only', tone: 'from-emerald-500/20 to-emerald-500/5', accent: 'text-emerald-300' },
  { label: 'School gates mapped', value: '34', delta: '200m rules', tone: 'from-sky-500/20 to-sky-500/5', accent: 'text-sky-300' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.18),_transparent_30%),radial-gradient(circle_at_85%_20%,_rgba(56,189,248,0.12),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(34,197,94,0.08),_transparent_24%)]" />
      <div className="pointer-events-none fixed inset-0 soft-grid opacity-[0.18]" />

      <header className="relative border-b border-white/5 bg-slate-950/60 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/10 ring-1 ring-orange-500/20 shadow-[0_0_35px_rgba(249,115,22,0.18)]">
              <ShieldAlert className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">PoleSafe</div>
              <div className="text-xs text-slate-400">Mobility Safety & Operations OS</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/ops/safety"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:border-orange-400/30 hover:bg-white/10"
            >
              Dispatcher Ops Console <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative">
        <section className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-16">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-orange-300 shadow-sm shadow-black/20 backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(74,222,128,0.7)]" />
              Uganda-first mobility safety OS for school rides and community rides
            </div>

            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              Verified rides, glowing operations, and school safety at command depth.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              PoleSafe combines child verification, school admin dashboards, gate geo-fencing, dismissal bells, transport tracking, and fallback communications for both school rides and community rides in Uganda.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/ops/safety"
                className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_40px_rgba(249,115,22,0.22)] transition hover:bg-orange-400"
              >
                Launch Dispatcher Ops <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-300 backdrop-blur-xl">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Masked safety data and verified handoffs
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:pt-4">
            <div className="glass-strong rounded-[2rem] p-5 shadow-2xl shadow-black/30 ring-accent">
              <div className="rounded-[1.5rem] border border-white/8 bg-gradient-to-br from-slate-900/90 to-slate-950/95 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Ops pulse</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Command-ready from day one</h2>
                  </div>
                  <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/20 shadow-[0_0_22px_rgba(74,222,128,0.15)]">
                    Live
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {liveMetrics.map((metric) => (
                    <div key={metric.label} className={`rounded-2xl border border-white/8 bg-gradient-to-br ${metric.tone} p-4 shadow-[0_20px_40px_rgba(2,6,23,0.32)]`}>
                      <div className="text-xs text-slate-300">{metric.label}</div>
                      <div className={`mt-2 text-2xl font-semibold ${metric.accent}`}>{metric.value}</div>
                      <div className="mt-1 text-xs text-slate-400">{metric.delta}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-3">
                  {[
                    'Arrival-only safe-word reveal for school rides',
                    'School dashboards for admin teams',
                    'Driver compliance vault, route review, and document screening',
                    'Emergency alerts with SMS / USSD fallback for every journey',
                  ].map((item, index) => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ring-1 ${index === 0 ? 'bg-orange-500/10 text-orange-300 ring-orange-500/20' : index === 1 ? 'bg-sky-500/10 text-sky-300 ring-sky-500/20' : index === 2 ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20' : 'bg-violet-500/10 text-violet-300 ring-violet-500/20'}`}>
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-10 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="glass rounded-[1.75rem] border-white/10 p-6 transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07] hover:shadow-[0_0_40px_rgba(249,115,22,0.08)]">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 ring-1 ring-orange-500/15 shadow-[0_0_30px_rgba(249,115,22,0.12)]">
                    <Icon className="h-6 w-6 text-orange-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{item.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
          <div className="glass rounded-[2rem] p-6 lg:p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-orange-300">Built for every role</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Clear journeys for parents, schools, drivers, and dispatchers</h2>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {roleCards.map((card) => (
                <div key={card.title} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 shadow-[0_16px_35px_rgba(2,6,23,0.28)] backdrop-blur-xl">
                  <h3 className="text-base font-semibold text-white">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
        PoleSafe • Uganda-first mobility safety and operations
      </footer>
    </div>
  );
}
