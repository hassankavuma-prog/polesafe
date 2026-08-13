import Link from 'next/link';
import { AppWindow, ArrowRight, Building2, BusFront, Download, ShieldCheck, Smartphone } from 'lucide-react';

const downloads = [
  { label: 'Get on Android', href: '#', icon: Smartphone },
  { label: 'View School Demo', href: '/school', icon: Building2 },
  { label: 'Open Driver View', href: '/driver', icon: BusFront },
];

const visuals = [
  'App download animation',
  'School car / transport vehicle arriving',
  'School gate pickup and drop-off',
  'Admin dashboard and incident cards',
  'Hamnah intelligence core active',
  'Parent, school, driver, and dispatcher screens',
];

export function PolepayHeroSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="glass-strong rounded-3xl p-8 shadow-2xl shadow-black/25">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-orange-300">
            <AppWindow className="h-3.5 w-3.5" /> Video landing preview
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Built to show the product, not just describe it.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            PolePay is the transport safety and emergency operations layer for schools, parents, drivers, and dispatch teams in Uganda.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {downloads.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.label} href={item.href} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/10">
                  <Icon className="h-4 w-4 text-orange-300" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {visuals.map((item) => (
              <div key={item} className="rounded-2xl border border-white/8 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-3xl p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Key message</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Show app downloads, school car, dashboard, and Hamnah.</h3>
            </div>
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
          </div>

          <div className="mt-6 space-y-4">
            {[
              'Open with the app download moment',
              'Cut to a school car arriving at the gate',
              'Show the school and driver dashboards',
              'Reveal Hamnah as the intelligent core',
              'Close with a strong call to action',
            ].map((line) => (
              <div key={line} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.04] p-4 text-sm text-slate-300">
                <ArrowRight className="mt-0.5 h-4 w-4 text-orange-300" />
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
