'use client';

import Link from 'next/link';
import { ArrowRight, ShieldAlert, School, Smartphone, Users } from 'lucide-react';
import BookingWidget from '@/components/home/BookingWidget';
import PoleSafeLive from '@/components/home/PoleSafeLive';

function PublicHeader() {
  const nav = [
    ['Ride', '#ride'],
    ['Community Rides', '#community-rides'],
    ['Schools', '#schools'],
    ['Drivers', '#drivers'],
    ['Safety', '#safety'],
    ['Hamna', '#hamna'],
    ['Updates', '#updates'],
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
            <Link href="/" className="flex shrink-0 items-center gap-3 rounded-2xl px-2 py-1.5 transition hover:bg-slate-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-600/10 ring-1 ring-sky-200">
                <ShieldAlert className="h-5 w-5 text-sky-700" />
              </div>
              <div>
                <div className="text-base font-semibold tracking-tight text-slate-950">PoleSafe</div>
                <div className="text-xs text-slate-900">Uganda-first mobility safety</div>
              </div>
            </Link>

            <nav className="-mx-1 flex items-center gap-1 overflow-x-auto rounded-2xl bg-white px-1 pb-1 text-slate-950 shadow-[0_1px_0_rgba(15,23,42,0.08),0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/80 backdrop-blur-md lg:flex-1 lg:justify-center lg:pb-0" aria-label="Primary">
              {nav.map(([label, href]) => (
                <Link key={label} href={href} className="whitespace-nowrap rounded-md px-2.5 py-2 text-sm font-medium text-black transition hover:text-black hover:underline hover:decoration-sky-300 hover:underline-offset-4">{label}</Link>
              ))}
            </nav>

            <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-2xl bg-white px-1 py-1 text-black shadow-[0_1px_0_rgba(15,23,42,0.08),0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/80 sm:gap-3 lg:justify-end">
              <Link href="/ops" className="whitespace-nowrap rounded-full border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-black transition hover:border-slate-300 hover:text-black">Dispatcher Ops Console</Link>
              <Link href="#booking" className="inline-flex whitespace-nowrap items-center justify-center rounded-full bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(2,132,199,0.22)] transition hover:bg-sky-500">Book a Ride</Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function PublicHero() {
  return (
    <section className="border-b border-slate-200 bg-[linear-gradient(180deg,#08111f_0%,#0d1728_70%,#f8fafc_70%,#f8fafc_100%)]">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-14 lg:px-8 lg:pb-12 lg:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-700">Public transportation safety platform</div>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">Safer school rides.<br />Stronger communities.</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-100 sm:text-lg">PoleSafe connects parents, students, schools, drivers and communities on one trusted platform with safer journeys, real-time visibility and accountable transport.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="#booking" className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(14,165,233,0.25)] transition hover:bg-sky-400">Book a Ride</Link>
              <Link href="#trust-safety" className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-[rgba(255,255,255,0.05)] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">How PoleSafe Works</Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 -m-6 rounded-[2rem] bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.28),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.18),transparent_26%),radial-gradient(circle_at_50%_75%,rgba(14,165,233,0.16),transparent_30%)] blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-800/80 bg-[linear-gradient(180deg,#06111f_0%,#0b1730_52%,#08111f_100%)] p-5 shadow-[0_24px_60px_rgba(8,15,32,0.42)] backdrop-blur-xl sm:p-6">
              <div className="rounded-[1.75rem] bg-slate-950/70 p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Trusted journeys</div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[["Parents", "Clear booking and pickup visibility"], ["Schools", "Safer handoffs and coordinated transport"], ["Drivers", "Structured ride requests and routes"], ["Communities", "Shared mobility with accountability"]].map(([title, text]) => (
                    <div key={title} className="rounded-2xl bg-[rgba(255,255,255,0.05)] p-4">
                      <div className="text-sm font-semibold text-white">{title}</div>
                      <div className="mt-1 text-sm leading-6 text-slate-300">{text}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl bg-sky-500/10 px-4 py-3 text-sm leading-6 text-sky-100">Built for Uganda-first mobility, without fake metrics or misleading live data.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CommunityRidesSection() {
  const useCases = [
    { title: 'Everyday trips', body: 'Work, shopping, appointments and visits.' },
    { title: 'Scheduled rides', body: 'Plan transport ahead for important journeys.' },
    { title: 'Family rides', body: 'Book trusted transport for relatives or dependents where appropriate.' },
    { title: 'Airport transfers — coming later', body: 'Scheduled airport transfers are planned for a future PoleSafe release.' },
  ];

  return (
    <section id="community-rides" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="overflow-hidden rounded-[2.25rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="grid gap-0 lg:grid-cols-[0.98fr_1.02fr] lg:items-stretch">
          <div className="bg-[linear-gradient(180deg,#08111f_0%,#0b1730_100%)] px-5 py-6 text-white sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">Community Rides</div>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">Everyday rides, built around your community.</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">Book trusted local transport for work, appointments, shopping, family visits and scheduled journeys — with PoleSafe accountability built in.</p>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400 sm:text-[15px]">Uganda-first mobility for everyday riders and families, with the current PoleSafe payment flow where already supported.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="#booking" className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(14,165,233,0.25)] transition hover:bg-sky-400">Book a Community Ride</Link>
              <Link href="#booking" className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">Go to booking</Link>
            </div>
            <div className="mt-7 rounded-[1.75rem] border border-white/10 bg-white/5 p-4 sm:p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Hamna</div>
              <p className="mt-2 text-sm leading-6 text-slate-200">Hamna can guide riders through booking, explain ride updates and help with next steps.</p>
            </div>
          </div>
          <div className="bg-slate-50 px-5 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="grid gap-3 sm:grid-cols-2">
              {useCases.map((item) => (
                <article key={item.title} className={item.title === 'Airport transfers — coming later' ? 'rounded-[1.5rem] border border-amber-200 bg-amber-50/70 p-4 shadow-sm sm:p-5' : 'rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5'}>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{item.title}</div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{item.body}</p>
                </article>
              ))}
            </div>
            <div className="mt-4 rounded-[1.75rem] border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Community ride preview</div>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Trusted local transport with a clean, premium booking experience for everyday mobility.</p>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">Accountable by design</div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {['Trusted driver context', 'Planned journeys', 'Family-friendly booking', 'Current payment flow'].map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">{item}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SchoolsSection() {
  const valueCards = [
    {
      title: 'Transport visibility',
      body: 'Help authorized school staff understand scheduled transport activity and important journey updates.',
    },
    {
      title: 'Arrivals & dismissals',
      body: 'Support clearer coordination around expected arrivals, dismissal changes and transport exceptions.',
    },
    {
      title: 'Family communication',
      body: 'Give schools and families a structured place for transport notices, announcements and important updates.',
    },
    {
      title: 'Accountability',
      body: 'Keep transport activity tied to authorized users, drivers, vehicles and auditable PoleSafe events.',
    },
  ];

  return (
    <section id="schools" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="overflow-hidden rounded-[2.25rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="grid gap-0 lg:grid-cols-[0.96fr_1.04fr]">
          <div className="bg-[linear-gradient(180deg,#08111f_0%,#0b1730_100%)] px-5 py-6 text-white sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">For Schools</div>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">A clearer way to coordinate school transport.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Give authorized school staff better visibility into transport activity, schedule changes and family communication — while PoleSafe keeps safety, permissions and accountability at the center.</p>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-[15px]">School portal access is being prepared as part of the PoleSafe role-based platform experience.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="#booking" className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(14,165,233,0.25)] transition hover:bg-sky-400">Learn about School Transport</Link>
            </div>
            <div className="mt-7 rounded-[1.75rem] border border-white/10 bg-white/5 p-4 sm:p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">School & Family Updates</div>
              <p className="mt-2 text-sm leading-6 text-slate-200">A structured communication space can help schools, teachers and authorized families share transport announcements, schedule changes and important pickup or dismissal information.</p>
            </div>
          </div>
          <div className="bg-slate-50 px-5 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="grid gap-3 sm:grid-cols-2">
              {valueCards.map((item) => (
                <article key={item.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{item.title}</div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{item.body}</p>
                </article>
              ))}
            </div>
            <div className="mt-4 rounded-[1.75rem] border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Uganda-first school context</div>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Flexible schedules, day-by-day exceptions, school vans and buses, and weak-connectivity-aware coordination all matter in the realities PoleSafe is built around.</p>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">Role-based access</div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {['Authorized users only', 'Verified transport events', 'Driver and vehicle accountability', 'Family coordination without custody changes'].map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">{item}</div>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">Hamna can help explain transport updates, guide staff through next steps and support communication — without approving transport or overriding safety permissions.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DriversSection() {
  return (
    <section id="drivers" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="grid gap-0 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="bg-slate-950 px-5 py-6 text-white sm:px-6 sm:py-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200">Drivers</div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">Drive with PoleSafe</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">PoleSafe positions drivers as trusted members of the network — serving community riders, families, and school journeys with clearer trip context and a stronger safety story.</p>
          </div>
          <div className="bg-white px-5 py-6 sm:px-6 sm:py-8">
            <div className="rounded-[1.75rem] bg-slate-50 p-4 sm:p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Trip preview</div>
              <div className="mt-4 space-y-3">
                {['Rider / Parent', 'Pickup', 'Destination', 'Trip status', 'Estimated earnings', 'Vehicle / ride context'].map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{item}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SafetySection() {
  return (
    <section id="safety" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[1.75rem] bg-slate-50 p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Safety highlights</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {['Child safety verification', 'School admin OS', 'Dual account modes', 'Upfront bundles + fallback'].map((item) => (
                <div key={item} className="rounded-2xl bg-white p-4 shadow-sm text-sm font-semibold text-slate-700">{item}</div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.75rem] bg-slate-950 p-5 text-white">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Built for every role</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {['Parents & community riders', 'Schools', 'Drivers', 'Dispatchers'].map((item) => (
                <div key={item} className="rounded-2xl bg-[rgba(255,255,255,0.05)] p-4 text-sm text-slate-200">{item}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CoverageNetworkWidget() {
  return (
    <section id="updates" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Coverage / network</div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Coverage content placeholder restored in the original layout position. This will remain visually unchanged for now.</p>
      </div>
    </section>
  );
}

function HamnaSection() {
  return (
    <section id="hamna" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] border border-sky-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="bg-slate-950 px-5 py-6 text-white sm:px-6 sm:py-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200">Hamna</div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">Meet Hamna</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">Hamna is PoleSafe’s intelligent safety assistant that helps surface situations requiring human attention.</p>
          </div>
          <div className="bg-slate-50 px-5 py-6 sm:px-6 sm:py-8">
            <div className="rounded-[1.75rem] bg-white p-4 sm:p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Capabilities</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {['Journey Monitoring', 'Safety Attention', 'Compliance Review', 'Incident Support'].map((item) => (
                  <article key={item} className="rounded-2xl bg-slate-50 p-4 shadow-sm">
                    <h3 className="text-base font-semibold text-slate-900">{item}</h3>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GlobalFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PoleSafe. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/ops/safety" className="text-slate-300 transition hover:text-white">Service status</Link>
            <span className="text-slate-600">•</span>
            <span>Safety and mobility support for Uganda and beyond.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Page() {
  return (
    <main>
      <PublicHeader />
      <PublicHero />
      <BookingWidget />
      <PoleSafeLive />
      <CommunityRidesSection />
      <SchoolsSection />
      <DriversSection />
      <SafetySection />
      <CoverageNetworkWidget />
      <HamnaSection />
      <GlobalFooter />
    </main>
  );
}

export default Page;
