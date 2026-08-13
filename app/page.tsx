import Link from 'next/link';
import { ArrowRight, Bus, Lock, Radio, ShieldAlert, Smartphone, Users, CheckCircle2 } from 'lucide-react';
import { PolepayHeroSection } from '../components/polepay-firebase-section';

const highlights = [
  {
    icon: ShieldAlert,
    title: 'Live safety operations',
    description: 'Dispatch-ready incident handling for schools, drivers, and safety teams in real time.',
  },
  {
    icon: Bus,
    title: 'Transport visibility',
    description: 'Track school trips, pickup flows, drop-offs, and route activity across your fleet.',
  },
  {
    icon: Smartphone,
    title: 'SMS / USSD fallback',
    description: 'Keep parents connected even on feature phones or low bandwidth connections.',
  },
  {
    icon: Users,
    title: 'Multi-tenant school control',
    description: 'Manage organizations, campuses, teachers, drivers, and guardians from one system.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/5 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/10 ring-1 ring-orange-500/20">
              <ShieldAlert className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">PolePay</div>
              <div className="text-xs text-slate-400">School Mobility & Emergency Operations</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/ops/safety"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Dispatch Ops Console <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <PolepayHeroSection />

      <main>
        <section className="mx-auto grid max-w-7xl gap-12 px-6 py-12 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-16">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-orange-300 shadow-sm shadow-black/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Uganda-first school transport and safety grid
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              Protect every child from pickup to drop-off.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              PolePay combines transport tracking, school operations, incident response, and fallback communications for real-world school mobility in Uganda.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/ops/safety"
                className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-400"
              >
                Launch Dispatcher Ops <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-300">
                <Lock className="h-4 w-4 text-emerald-400" /> Privacy-first masked data
              </div>
            </div>
          </div>

          <div className="glass-strong rounded-3xl p-6 shadow-2xl shadow-black/30 ring-accent lg:p-8">
            <div className="soft-grid rounded-2xl border border-white/5 bg-slate-950/60 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Ops status</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Command-ready from day one</h2>
                </div>
                <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/20">
                  Online
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {[
                  'School dashboards for admin teams',
                  'Driver compliance vault and document review',
                  'Parent and guardian transport visibility',
                  'Emergency alerts with SMS / USSD fallback',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-200">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-10 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="glass rounded-3xl p-6 transition hover:border-white/20 hover:bg-white/[0.07]">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 ring-1 ring-orange-500/15">
                    <Icon className="h-6 w-6 text-orange-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{item.description}</p>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
        PolePay Core Architecture • Multi-tenant school safety operations for Uganda
      </footer>
    </div>
  );
}
