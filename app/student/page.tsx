import type { Metadata } from 'next';
import { BusFront, CheckCircle2, MapPinned, ShieldCheck, Siren } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Student Checkpoints — PoleSafe',
  description: 'Minimal checkpoint confirmations for children riding school transport.',
};

const checkpoints = [
  { label: 'Van arrived', status: 'confirmed', note: 'Wait near the gate', tone: 'emerald' },
  { label: 'On the bus', status: 'confirmed', note: 'Seat belt on, sit down', tone: 'emerald' },
  { label: 'On the way to school', status: 'inferred', note: 'Driver scan received', tone: 'sky' },
  { label: 'Arrived at school', status: 'pending', note: 'Teacher gate scan pending', tone: 'amber' },
] as const;

const toneClass = {
  emerald: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
  sky: 'bg-sky-500/10 text-sky-300 ring-sky-500/20',
  amber: 'bg-amber-500/10 text-amber-300 ring-amber-500/20',
} as const;

export default function StudentCheckpointPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-orange-300">
            <ShieldCheck className="h-3.5 w-3.5" /> Student checkpoint mode
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Safe ride checkpoints</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Big buttons, minimal text, and clear confirmations so children can move through the ride journey safely and simply.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {checkpoints.map((item) => (
            <article key={item.label} className="glass-strong rounded-3xl p-5 shadow-2xl shadow-black/20">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-white">{item.label}</div>
                  <div className="mt-1 text-sm text-slate-400">{item.note}</div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${toneClass[item.tone]}`}>{item.status}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="glass rounded-3xl p-5 text-sm text-slate-300">
            <div className="flex items-center gap-2 text-white"><BusFront className="h-4 w-4 text-emerald-300" /> Ride signal</div>
            <p className="mt-2 text-slate-400">Child sees one clear ride state at a time.</p>
          </div>
          <div className="glass rounded-3xl p-5 text-sm text-slate-300">
            <div className="flex items-center gap-2 text-white"><MapPinned className="h-4 w-4 text-sky-300" /> Location safety</div>
            <p className="mt-2 text-slate-400">No confusing maps, only checkpoint confirmation.</p>
          </div>
          <div className="glass rounded-3xl p-5 text-sm text-slate-300">
            <div className="flex items-center gap-2 text-white"><Siren className="h-4 w-4 text-orange-300" /> Emergency</div>
            <p className="mt-2 text-slate-400">If something feels wrong, the route can be escalated by adults.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
