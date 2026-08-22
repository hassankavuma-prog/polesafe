'use client';

import Image from 'next/image';
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
  const cards = [
    {
      title: 'Clear work opportunities',
      body: 'See eligible ride opportunities based on your service role, availability and vehicle.',
    },
    {
      title: 'Earnings visibility',
      body: 'Understand ride earnings, payment status, commissions and settlement activity as PoleSafe expands its driver finance tools.',
    },
    {
      title: 'Safety & accountability',
      body: 'Keep driver, vehicle and journey activity tied to clear PoleSafe safety and compliance rules.',
    },
    {
      title: 'Flexible services',
      body: 'Eligible drivers may support school transport, Community Rides and future services such as airport transfers or deliveries.',
    },
  ];

  return (
    <section id="drivers" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="overflow-hidden rounded-[2.25rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="bg-[linear-gradient(180deg,#08111f_0%,#0b1730_100%)] px-5 py-6 text-white sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">For drivers</div>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">Drive with clearer expectations and stronger support.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">PoleSafe is built to help eligible drivers understand their work, stay accountable, manage opportunities and build trust with families, schools and community riders.</p>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-[15px]">Driver access is being prepared as part of PoleSafe’s role-based platform experience.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="#booking" className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(14,165,233,0.25)] transition hover:bg-sky-400">Learn about driving with PoleSafe</Link>
            </div>
            <div className="mt-7 rounded-[1.75rem] border border-white/10 bg-white/5 p-4 sm:p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Uganda-first driver economics</div>
              <p className="mt-2 text-sm leading-6 text-slate-200">PoleSafe is designed around cash-heavy transport realities, plus MTN MoMo, Airtel Money and card payments where supported, with fair driver economics, clear commissions, transparent payment status and different vehicle types in mind.</p>
            </div>
          </div>
          <div className="bg-slate-50 px-5 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="grid gap-3 sm:grid-cols-2">
              {cards.map((card) => (
                <article key={card.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{card.title}</div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{card.body}</p>
                </article>
              ))}
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 sm:p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Eligibility and roles</div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {['Eligible drivers only', 'Service-specific eligibility', 'Vehicle suitability', 'Compliance and reliability'].map((item) => (
                    <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">{item}</div>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">School transport eligibility does not automatically extend to Community Rides, and future services remain separate until they are officially launched.</p>
              </div>
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 sm:p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Hamna support</div>
                <p className="mt-3 text-sm leading-6 text-slate-600">Hamna can help drivers understand ride updates, reminders, next steps and PoleSafe procedures.</p>
                <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">Hamna does not assign rides, choose drivers, override eligibility, change earnings or payment status, waive safety checks, or start journeys.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SafetySection() {
  const safetyCards = [
    {
      title: 'AUTHORIZED ACCESS',
      body: 'Important transport actions are tied to verified roles and permissions.',
    },
    {
      title: 'DRIVER & VEHICLE ELIGIBILITY',
      body: 'PoleSafe can apply service-specific eligibility before a driver or vehicle is considered for transport.',
    },
    {
      title: 'VERIFIED JOURNEY EVENTS',
      body: 'Pickup, journey and recovery states should rely on authoritative PoleSafe events rather than assumptions.',
    },
    {
      title: 'PROTECTED RECOVERY',
      body: 'When a ride needs recovery, PoleSafe preserves accountability and controlled handoff instead of allowing arbitrary reassignment.',
    },
  ];

  return (
    <section id="safety" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="overflow-hidden rounded-[2.25rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="grid gap-0 lg:grid-cols-[0.96fr_1.04fr]">
          <div className="bg-[linear-gradient(180deg,#08111f_0%,#0b1730_100%)] px-5 py-6 text-white sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">Safety</div>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">Safety built into the journey, not added afterward.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">PoleSafe is designed around verified events, role-based permissions, driver eligibility and clear recovery rules — so important transport decisions stay accountable.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="#hamna" className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">Learn how PoleSafe protects journeys</Link>
            </div>
            <div className="mt-7 rounded-[1.75rem] border border-white/10 bg-white/5 p-4 sm:p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Child and school transport</div>
              <p className="mt-2 text-sm leading-6 text-slate-200">Child and school transport receives additional safeguards around pickup, journey start, authorization and recovery. Before child or school transport begins, PoleSafe is designed to require a deliberate safety check before journey start.</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">Ordinary passenger rides may receive a reminder, while the stronger acknowledgment flow stays reserved for protected transport where implemented.</p>
            </div>
          </div>
          <div className="bg-slate-50 px-5 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="grid gap-3 sm:grid-cols-2">
              {safetyCards.map((card) => (
                <article key={card.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{card.title}</div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{card.body}</p>
                </article>
              ))}
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.95fr]">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 sm:p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Uganda connectivity</div>
                <p className="mt-3 text-sm leading-6 text-slate-600">PoleSafe distinguishes between locally pending information and server-confirmed transport state, so weak connectivity does not silently turn an unconfirmed action into a completed safety event.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {['Server-authoritative state', 'Locally pending stays pending', 'Auditable journey events', 'Confirmed before completion'].map((item) => (
                    <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">{item}</div>
                  ))}
                </div>
              </div>
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 sm:p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Hamna support</div>
                <p className="mt-3 text-sm leading-6 text-slate-600">Hamna can explain safety steps, reminders and next actions, while PoleSafe’s deterministic safety rules remain authoritative.</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">Safety concerns and incidents can be escalated separately from ordinary ride updates.</p>
                <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">Hamna cannot approve pickup, waive safety requirements, acknowledge seat belts, choose replacement drivers, transfer custody, start journeys, override permissions or close incidents.</div>
              </div>
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
  const valueCards = [
    {
      title: "Explain what's happening",
      body: 'Hamna can help parents, riders, drivers and schools understand current ride information and next steps.',
    },
    {
      title: 'Remind & prepare',
      body: 'Hamna can provide reminders around scheduled journeys, transport steps and important actions.',
    },
    {
      title: 'Support communication',
      body: 'Hamna can help make PoleSafe information easier to understand across different roles and, over time, different languages.',
    },
    {
      title: 'Help with recovery',
      body: 'When something changes, Hamna can explain the authorized recovery process and help users understand what happens next.',
    },
  ];

  const roles = [
    { title: 'For parents', body: 'Explain ride updates, scheduled transport and next steps.' },
    { title: 'For drivers', body: 'Explain ride procedures, reminders and operational guidance.' },
    { title: 'For schools', body: 'Help authorized staff understand transport updates and communication workflows.' },
    { title: 'For community riders', body: 'Guide booking, scheduled rides and journey information. Keep this presentation-only.' },
  ];

  return (
    <section id="hamna" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="overflow-hidden rounded-[2.5rem] border border-sky-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_56%,#f2f7ff_100%)] shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
        <div className="grid gap-0 lg:grid-cols-[0.96fr_1.04fr]">
          <div className="bg-[linear-gradient(180deg,#07101d_0%,#0b1730_52%,#09111e_100%)] px-5 py-7 text-white sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">HAMNA</div>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">Guidance when you need it. Authority where it belongs.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Hamna helps people understand PoleSafe, follow ride updates, prepare for next steps and get support — while safety, dispatch, payments and permissions remain controlled by PoleSafe’s authoritative rules.</p>
            <div className="mt-7 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 sm:p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Hamna guides. PoleSafe decides.</div>
              <p className="mt-3 text-sm leading-6 text-slate-200">Hamna can explain, remind and support. She cannot bypass safety checks, assign drivers, approve payments, change permissions, transfer custody or start a journey.</p>
            </div>
            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 sm:p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Uganda-first support</div>
              <p className="mt-3 text-sm leading-6 text-slate-200">Hamna is designed for an Uganda-first experience, beginning with English and Luganda support and expanding over time.</p>
            </div>
            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 sm:p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Future services</div>
              <p className="mt-3 text-sm leading-6 text-slate-200">Hamna may also help explain future PoleSafe services such as airport transfer reminders and delivery guidance, once those services are officially available.</p>
            </div>
          </div>

          <div className="bg-[linear-gradient(180deg,#07101d_0%,#0b1730_52%,#09111e_100%)] px-5 py-6 text-white sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div className="grid gap-4">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 sm:p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Role-aware support</div>
                  <p className="mt-3 text-sm leading-6 text-slate-200">Hamna stays grounded in PoleSafe role boundaries while helping each audience understand the transport information that matters to them.</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 sm:p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Hamna guides. PoleSafe decides.</div>
                  <p className="mt-3 text-sm leading-6 text-slate-200">Hamna can explain, remind and support. She cannot bypass safety checks, assign drivers, approve payments, change permissions, transfer custody or start a journey.</p>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-[2rem] border border-sky-200 bg-[linear-gradient(180deg,#06111f_0%,#0b1730_52%,#09111e_100%)] p-3 shadow-[0_18px_40px_rgba(15,23,42,0.16)] lg:min-h-[31rem] lg:p-4">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.2),transparent_28%),radial-gradient(circle_at_85%_10%,rgba(59,130,246,0.14),transparent_24%),radial-gradient(circle_at_50%_80%,rgba(14,165,233,0.12),transparent_28%)] animate-[hamna-glow_14s_ease-in-out_infinite] motion-reduce:animate-none" />
                <div className="relative flex h-full flex-col overflow-hidden rounded-[1.5rem] bg-slate-950/10">
                  <div className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
                    <div className="rounded-full border border-white/60 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700 shadow-sm backdrop-blur-sm motion-safe:animate-[hamna-breathe_10s_ease-in-out_infinite] motion-reduce:animate-none">Hamna</div>
                    <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100">English • Luganda</div>
                  </div>
                  <div className="relative mt-3 min-h-[18rem] flex-1 overflow-hidden rounded-[1.25rem] sm:min-h-[20rem] lg:min-h-[22rem]">
                    <Image
                      src="/images/hamna/hamna-hero-portrait.png"
                      alt="Hamna, PoleSafe guidance assistant"
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 44vw, 520px"
                      className="object-cover object-[50%_18%] sm:object-[50%_16%] lg:object-[50%_12%] animate-[hamna-float_12s_ease-in-out_infinite] motion-reduce:animate-none"
                    />
                  </div>
                  <div className="px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
                    <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm leading-6 text-slate-100 shadow-lg backdrop-blur-sm">
                      <div className="font-semibold text-white">Hamna guides. PoleSafe decides.</div>
                      <div className="mt-1 text-slate-200">Hamna can explain, remind and support. She cannot bypass safety checks or authority.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="bg-slate-50 px-5 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="grid gap-3 sm:grid-cols-2">
              {valueCards.map((card) => (
                <article key={card.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{card.title}</div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{card.body}</p>
                </article>
              ))}
            </div>
            <div className="mt-4 rounded-[1.75rem] border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Role-aware support</div>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Hamna stays grounded in PoleSafe role boundaries while helping each audience understand the transport information that matters to them.</p>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">Presentation only</div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {roles.map((role) => (
                  <article key={role.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{role.title}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{role.body}</p>
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
