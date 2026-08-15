'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { apiUrl } from '@/lib/api-base';
import { ArrowRight, Bus, CheckCircle2, MapPin, Phone, School, ShieldAlert, Smartphone, TimerReset, Users } from 'lucide-react';
function HamnaSection() {
  const capabilities = [
    {
      title: 'Journey Monitoring',
      text: 'Helps observe trip progress and highlight when a journey may need a person to take a closer look.',
    },
    {
      title: 'Safety Attention',
      text: 'Surfaces unusual situations so the team can decide whether action is needed.',
    },
    {
      title: 'Compliance Review',
      text: 'Brings documents, checks, and ride context into one place for human review.',
    },
    {
      title: 'Incident Support',
      text: 'Helps organize the details that matter during an incident without replacing human judgment.',
    },
  ];

  const previewItems = [
    { label: 'Route deviation', value: 'Needs review' },
    { label: 'Prolonged stop', value: 'Monitoring' },
    { label: 'Driver document', value: 'Human review required' },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] border border-sky-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="bg-slate-950 px-5 py-6 text-white sm:px-6 sm:py-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200">Hamna</div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">Meet Hamna</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">Hamna is PoleSafe’s intelligent safety assistant that helps surface situations requiring human attention.</p>

            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-base font-semibold leading-7 text-white sm:text-lg">“Hamna helps surface what matters. People make the decisions.”</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">Hamna does not make autonomous decisions. It simply helps the right person see what deserves review.</p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">NON-LIVE preview</div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                {previewItems.map((item, index) => (
                  <div key={item.label} className={index > 0 ? 'mt-3 border-t border-white/10 pt-3' : ''}>
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{item.label}</div>
                    <div className="mt-1 text-sm font-semibold text-sky-200">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 px-5 py-6 sm:px-6 sm:py-8">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 sm:p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Capabilities</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {capabilities.map((item) => (
                  <article key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                    <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                  </article>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                This preview is clearly labeled and intentionally non-live. It shows what Hamna may surface for human review, not autonomous action.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FloatingSafetyBadge3D() {
  return (
    <div style={{position:'relative',height:'clamp(280px,32vw,380px)',width:'100%',overflow:'hidden',borderRadius:'2rem',border:'1px solid rgba(255,255,255,0.10)',background:'radial-gradient(circle at top, rgba(249,115,22,0.16), transparent 55%), linear-gradient(180deg, rgba(2,6,23,0.92), rgba(15,23,42,0.92))',boxShadow:'0 18px 60px rgba(2,6,23,0.55)'}}><div style={{position:'absolute',inset:0,background:'radial-gradient(circle at 50% 50%, rgba(56,189,248,0.16), transparent 58%)'}} /><div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',padding:'1.5rem',textAlign:'center',color:'#e2e8f0'}}><div><div style={{display:'inline-flex',alignItems:'center',gap:'0.5rem',border:'1px solid rgba(56,189,248,0.2)',background:'rgba(56,189,248,0.10)',color:'#7dd3fc',borderRadius:'9999px',padding:'0.35rem 0.8rem',fontSize:'12px'}}>Netlify-safe preview</div><div style={{marginTop:'0.9rem',fontSize:'1.45rem',fontWeight:700,color:'#fff'}}>PoleSafe 3D safety badge</div><div style={{marginTop:'0.5rem',fontSize:'0.95rem',lineHeight:1.5,color:'#cbd5e1',maxWidth:'28rem'}}>This fallback renders even if the Three.js bundle fails or Tailwind utilities are delayed.</div></div></div></div>
  );
}

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

type RideMode = 'community' | 'school';

function DriversSection() {
  const benefits = [
    'Community ride opportunities',
    'School transport opportunities',
    'Clear trip information',
    'Transparent earnings',
    'Verified rider / booking context',
    'Safety support',
    'Compliance and trust',
    'Future fleet opportunities',
  ];

  const tripPreview = [
    { label: 'Rider / Parent', value: 'Preview name area', tone: 'text-slate-700' },
    { label: 'Pickup', value: 'Demonstration pickup point', tone: 'text-slate-700' },
    { label: 'Destination', value: 'Demonstration destination', tone: 'text-slate-700' },
    { label: 'Trip status', value: 'Verified booking context', tone: 'text-emerald-700' },
    { label: 'Estimated earnings', value: 'Preview earnings', tone: 'text-sky-700' },
    { label: 'Vehicle / ride context', value: 'Community or school ride preview', tone: 'text-slate-700' },
  ] as const;

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="grid gap-0 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="bg-slate-950 px-5 py-6 text-white sm:px-6 sm:py-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200">Drivers</div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">Drive with PoleSafe</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">PoleSafe positions drivers as trusted members of the network — serving community riders, families, and school journeys with clearer trip context and a stronger safety story.</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/driver" className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(2,132,199,0.25)] transition hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">
                Drive with PoleSafe
              </Link>
              <Link href="/driver" className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">
                Driver Requirements
              </Link>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {benefits.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">{item}</div>
              ))}
            </div>
          </div>

          <div className="bg-white px-5 py-6 sm:px-6 sm:py-8">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Trip preview</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">Driver trip context</div>
                </div>
                <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Verified booking</div>
              </div>

              <div className="mt-5 space-y-3">
                {tripPreview.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{item.label}</div>
                    <div className={`mt-1 text-sm font-semibold ${item.tone}`}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {['Call', 'Message', 'Safety'].map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700">{item}</div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                SOS / Safety is a separate emergency concept preview, distinct from normal communication tools.
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Why drivers choose PoleSafe</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">Clear trip information, transparent earnings, and trusted ride context help drivers serve everyday community trips, school transport, and future fleet opportunities with more confidence.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SchoolsSection() {
  const journey = [
    { title: 'Parent', note: 'Book request, contact details, and visibility start here.' },
    { title: 'Verified Driver', note: 'School-compliant driver assignment and monitoring.' },
    { title: 'Child Pickup', note: 'Pickup verification before the journey moves on.' },
    { title: 'Live Journey', note: 'Trip is monitored in transit.' },
    { title: 'School / Teacher', note: 'School-side receiving point and operations awareness.' },
    { title: 'Verified Handoff', note: 'Student handoff confirmed with school rules.' },
    { title: 'Parent Confirmation', note: 'Confirmation reaches the parent after handoff.' },
  ] as const;

  const opsPreview = [
    { label: "Today's school journeys", value: 'Demo preview', tone: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' },
    { label: 'Verified drivers', value: 'Verified', tone: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { label: 'Students safely handed over', value: 'Handoff complete', tone: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { label: 'Transport status', value: 'Monitoring', tone: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  ] as const;

  const concepts = [
    'Student transportation visibility',
    'Verified drivers',
    'Pickup verification',
    'Teacher / school handoff verification',
    'Parent confirmation',
    'Attendance visibility',
    'Driver compliance',
    'School communications / broadcasts',
    'Safety operations',
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">Schools</div>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">Built for schools that put safety first</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">PoleSafe gives schools, teachers, administrators, and parents a complete transport safety ecosystem — centered on visibility, verification, attendance, compliance, and communication.</p>

            <div className="mt-5 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">School journey flow</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {journey.map((step, index) => (
                  <div key={step.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={index < 3 ? 'flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700' : index === 3 || index === 4 ? 'flex h-10 w-10 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sky-700' : 'flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700'}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{step.title}</div>
                        <div className="mt-1 text-xs leading-5 text-slate-500">{step.note}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Verified states are shown as preview labels. No live statistics are claimed here.
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/schools" className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(2,132,199,0.25)] transition hover:bg-sky-500">For Schools</Link>
              <Link href="#school-safety" className="inline-flex items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-100">See School Safety</Link>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_18px_50px_rgba(2,6,23,0.35)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Operations preview</div>
                  <div className="mt-2 text-lg font-semibold">School transport snapshot</div>
                </div>
                <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">Demo preview</div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {opsPreview.map((item) => (
                  <div key={item.label} className={`rounded-2xl border ${item.border} ${item.bg} p-4`}>
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{item.label}</div>
                    <div className={`mt-2 text-sm font-semibold ${item.tone}`}>{item.value}</div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">A small school-operations preview showing what the school team may monitor across the day, without implying live production statistics.</p>
            </div>

            <div id="school-safety" className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">School safety capabilities</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {concepts.map((item) => (
                  <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">{item}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Hero3DBlock() {
  return (
    <section style={{maxWidth:'80rem',margin:'0 auto',padding:'1rem 1rem 0'}}>
      <div style={{border:'1px solid rgba(255,255,255,0.14)',borderRadius:'2rem',padding:'1.5rem',background:'linear-gradient(180deg, rgba(2,6,23,0.98), rgba(15,23,42,0.96))',boxShadow:'0 20px 70px rgba(2,6,23,0.65)'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:'0.5rem',border:'1px solid rgba(56,189,248,0.22)',background:'rgba(56,189,248,0.12)',color:'#7dd3fc',borderRadius:'9999px',padding:'0.35rem 0.8rem',fontSize:'12px'}}>PoleSafe live platform</div>
        <h2 style={{marginTop:'0.9rem',fontSize:'2rem',lineHeight:1.05,fontWeight:800,color:'#fff'}}>School rides, community rides, and school ops — in one platform.</h2>
        <p style={{marginTop:'0.75rem',maxWidth:'42rem',fontSize:'1rem',lineHeight:1.65,color:'#cbd5e1'}}>This landing screen is now pure inline CSS so Netlify cannot break the layout by missing or delaying Tailwind utilities. It is still dark, premium, and operational.</p>
        <div style={{marginTop:'1rem',display:'grid',gap:'0.75rem',gridTemplateColumns:'repeat(2,minmax(0,1fr))'}}>
          <div style={{border:'1px solid rgba(255,255,255,0.12)',borderRadius:'1rem',background:'rgba(255,255,255,0.04)',padding:'0.9rem 1rem',color:'#e2e8f0'}}>Arrival-only safe-word flow</div>
          <div style={{border:'1px solid rgba(255,255,255,0.12)',borderRadius:'1rem',background:'rgba(255,255,255,0.04)',padding:'0.9rem 1rem',color:'#e2e8f0'}}>200m school gate geofencing</div>
          <div style={{border:'1px solid rgba(255,255,255,0.12)',borderRadius:'1rem',background:'rgba(255,255,255,0.04)',padding:'0.9rem 1rem',color:'#e2e8f0'}}>Staggered dismissal bells</div>
          <div style={{border:'1px solid rgba(255,255,255,0.12)',borderRadius:'1rem',background:'rgba(255,255,255,0.04)',padding:'0.9rem 1rem',color:'#e2e8f0'}}>Bookings, payments, tracker handoff</div>
        </div>
      </div>
    </section>
  );
}

function TrustAndLiveSection() {
  const liveCards = [
    { label: 'Rides in progress', value: 'Live data coming soon', tone: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', icon: Bus },
    { label: 'Verified drivers', value: 'Connected', tone: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
    { label: 'Safe handoffs', value: 'Monitoring', tone: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: ShieldAlert },
    { label: 'Schools connected', value: 'Selected schools', tone: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', icon: School },
    { label: 'Coverage / service areas', value: 'Available in selected areas', tone: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: MapPin },
    { label: 'System status', value: 'Monitoring', tone: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', icon: Smartphone },
  ];

  const statusItems = [
    { label: 'Booking', state: 'Monitoring', tone: 'text-sky-700' },
    { label: 'Tracking', state: 'Connected', tone: 'text-emerald-700' },
    { label: 'Payments', state: 'Connected', tone: 'text-emerald-700' },
    { label: 'Safety systems', state: 'Monitoring', tone: 'text-amber-700' },
  ];

  const trustPillars = [
    { icon: CheckCircle2, title: 'Verified drivers', text: 'Only approved drivers are matched to rides, so families know who is arriving.' },
    { icon: Smartphone, title: 'Live journey visibility', text: 'Parents can follow the trip as it moves, instead of waiting in the dark.' },
    { icon: MapPin, title: 'Safe pickup and handoff', text: 'Pickup and drop-off moments are checked so the right person gets the right child.' },
    { icon: School, title: 'School verification', text: 'School rides use school-specific checks and handoff rules before a trip closes.' },
    { icon: ShieldAlert, title: 'Emergency response', text: 'When something looks wrong, the team can react quickly and escalate the issue.' },
    { icon: Bus, title: 'Ride history and accountability', text: 'Each journey leaves a clear record for review, follow-up, and trust.' },
  ];

  const journeySteps = [
    'Parent books',
    'Driver verified',
    'Child pickup verified',
    'Journey tracked',
    'School/teacher handoff verified',
    'Parent receives confirmation',
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">PoleSafe Live</div>
        <h2 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">PoleSafe Live</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">A visible trust layer for active rides, monitoring, school connections, and service coverage — built to show that PoleSafe is a live safety and mobility network.</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {liveCards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.label} className={`rounded-2xl border ${card.border} ${card.bg} p-4 shadow-sm`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-700">{card.label}</div>
                    <div className={`mt-2 text-lg font-semibold ${card.tone}`}>{card.value}</div>
                  </div>
                  <div className="rounded-xl bg-white/80 p-2 text-slate-600" aria-hidden="true">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-5 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">Service status</div>
              <p className="text-sm text-slate-600">Neutral operational signals for the systems families rely on.</p>
            </div>
            <div className="text-xs text-slate-500">Real data where available; otherwise live monitoring labels</div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {statusItems.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</div>
                <div className={`mt-2 text-sm font-semibold ${item.tone}`}>{item.state}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">How PoleSafe keeps every journey accountable</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {trustPillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div key={pillar.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-sky-50 p-2 text-sky-600" aria-hidden="true">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{pillar.title}</div>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{pillar.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-5 text-white">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">School ride safety journey</div>
            <div className="mt-4 space-y-3">
              {journeySteps.map((step, index) => {
                const isDone = index < journeySteps.length - 1;
                return (
                  <div key={step} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full border ${isDone ? 'border-emerald-300 bg-emerald-500 text-white' : 'border-sky-300 bg-sky-500 text-white'}`}>
                        {index + 1}
                      </div>
                      {index < journeySteps.length - 1 && <div className="h-8 w-px bg-white/15" />}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100">{step}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              Attention: school ride handoffs stay under school verification before confirmation closes.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BookingWidget() {
  const [mode, setMode] = useState<RideMode>('community');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    pickup: '',
    dropoff: '',
    rideTime: '',
    childName: '',
    schoolName: '',
    vehicleType: 'car',
    notes: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<string>('');
  const [bookingMeta, setBookingMeta] = useState<{ rideId?: string; txRef?: string; flwRef?: string; checkoutUrl?: string }>({});
  const [farePreview, setFarePreview] = useState<number | null>(null);

  const routeHint = useMemo(() => mode === 'school'
    ? 'School ride booking will create a trip request for the operations team to confirm.'
    : 'Community ride booking will request an on-demand ride from the live dispatch pool.', [mode]);

  const estimateFare = useMemo(() => {
    const base = mode === 'school' ? 7000 : 2500;
    const complexity = Math.min(5, Math.max(1, Math.ceil(((form.pickup.length + form.dropoff.length) || 1) / 20)));
    const vehicleBoost = form.vehicleType === 'bus' ? 4500 : form.vehicleType === 'taxi' ? 2000 : form.vehicleType === 'boda' ? -500 : 0;
    return base + complexity * 1000 + vehicleBoost;
  }, [mode, form.pickup, form.dropoff, form.vehicleType]);

  async function previewFare() {
    setFarePreview(estimateFare);
    setStatus('idle');
    setResult(mode === 'school'
      ? `Estimated school ride bundle/fleet handling: ${estimateFare.toLocaleString()} UGX`
      : `Estimated community ride fare: ${estimateFare.toLocaleString()} UGX`);
  }

  async function submitBooking() {
    setStatus('submitting');
    setResult('');
    try {
      const payload = mode === 'community'
        ? {
            pickupAddress: form.pickup,
            dropoffAddress: form.dropoff,
            pickupTime: form.rideTime || undefined,
            passengerCount: 1,
            vehicleType: form.vehicleType,
            notes: `${form.name} • ${form.phone}${form.notes ? ` • ${form.notes}` : ''}`,
          }
        : {
            tripName: `${form.childName || form.name} school ride`,
            description: `${form.schoolName || 'School ride'} • ${form.phone}${form.notes ? ` • ${form.notes}` : ''}`,
            destination: form.dropoff,
            departureDate: form.rideTime ? form.rideTime.slice(0, 10) : new Date().toISOString().slice(0, 10),
            departureTime: form.rideTime ? form.rideTime.slice(11, 16) : undefined,
            vehicleType: form.vehicleType,
            notes: `Child: ${form.childName || 'Not provided'} • Pickup: ${form.pickup}`,
          };

      const endpoint = apiUrl(mode === 'community' ? '/api/rides/request' : '/api/trips');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Booking failed');

      if (mode === 'community') {
        const amount = Number(data.price?.total || farePreview || estimateFare || 0);
        if (amount > 0) {
          const provider = /airtel/i.test(form.notes) || /airtel/i.test(form.phone) ? 'airtel' : 'mtn';
          const payResponse = await fetch(apiUrl('/api/payments/momo'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount,
              provider,
              narration: `PoleSafe ride booking ${data.ride?._id || ''}`,
              rideId: data.ride?._id,
            }),
          });
          const payData = await payResponse.json();
          if (!payResponse.ok) throw new Error(payData.error || 'Payment initiation failed');
          setBookingMeta({ rideId: data.ride?._id, txRef: payData.txRef, flwRef: payData.flwRef });
          setResult(`Ride requested. Fare: ${amount} UGX • Payment initiated via ${provider === 'airtel' ? 'Airtel Money' : 'MTN MoMo'}. Confirm on your phone.`);
        } else {
          setBookingMeta({ rideId: data.ride?._id });
          setResult(`Ride requested successfully. Driver: ${data.driver?.name || 'pending'} • Fare: pending`);
        }
      } else {
        setBookingMeta({ rideId: data._id || data.trip?._id });
        setResult(`School trip created successfully. Trip status: ${data.status || 'open'} • Ops will confirm next.`);
      }
      setStatus('done');
    } catch (err: any) {
      setStatus('error');
      setResult(err.message || 'Booking failed');
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-5 shadow-[0_18px_60px_rgba(2,6,23,0.55)] backdrop-blur-2xl sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-emerald-300">Live booking</div>
            <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Book a ride from the website</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">Choose community ride or school ride, enter the journey details, and send the request directly into PoleSafe backend routing.</p>
          </div>
          <div className="flex rounded-2xl border border-white/10 bg-white/5 p-1 text-xs text-slate-300">
            {(['community', 'school'] as RideMode[]).map((item) => (
              <button key={item} onClick={() => setMode(item)} className={`rounded-xl px-4 py-2 capitalize ${mode === item ? 'bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.18)]' : 'hover:bg-white/10'}`}>
                {item} rides
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">Where are you going?</div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Pickup location</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-200">
                  <MapPin className="h-4 w-4 shrink-0 text-sky-500" />
                  <input className="w-full bg-transparent outline-none placeholder:text-slate-400" placeholder={mode === 'school' ? 'Home, stage, or pickup point' : 'Pickup location'} value={form.pickup} onChange={(e) => setForm((f) => ({ ...f, pickup: e.target.value }))} />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Destination</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-200">
                  <MapPin className="h-4 w-4 shrink-0 text-emerald-500" />
                  <input className="w-full bg-transparent outline-none placeholder:text-slate-400" placeholder={mode === 'school' ? 'School or dropoff destination' : 'Dropoff location'} value={form.dropoff} onChange={(e) => setForm((f) => ({ ...f, dropoff: e.target.value }))} />
                </div>
              </label>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Booking preview</div>
            <div className="mt-3 text-lg font-semibold text-white">{mode === 'school' ? 'School ride request' : 'Community ride request'}</div>
            <p className="mt-2 text-sm text-slate-300">{routeHint}</p>

            <div className="mt-4 grid gap-4">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-700 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">When?</div>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-200">
                  <TimerReset className="h-4 w-4 shrink-0 text-sky-500" />
                  <input className="w-full bg-transparent outline-none placeholder:text-slate-400" type="datetime-local" value={form.rideTime} onChange={(e) => setForm((f) => ({ ...f, rideTime: e.target.value }))} />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-700 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Your details</div>
                <div className="mt-2 grid gap-3 md:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-200">
                    <Users className="h-4 w-4 shrink-0 text-sky-500" />
                    <input className="w-full bg-transparent outline-none placeholder:text-slate-400" placeholder="Your name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-200">
                    <Phone className="h-4 w-4 shrink-0 text-sky-500" />
                    <input className="w-full bg-transparent outline-none placeholder:text-slate-400" placeholder="Phone number" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-700 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Ride</div>
                <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-200">
                  <select className="w-full bg-transparent text-sm outline-none" value={form.vehicleType} onChange={(e) => setForm((f) => ({ ...f, vehicleType: e.target.value }))}>
                    <option value="car">Car</option>
                    <option value="boda">Boda Boda</option>
                    <option value="bus">Bus</option>
                    <option value="taxi">Taxi</option>
                  </select>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-700 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Additional information</div>
                <p className="mt-1 text-xs text-slate-500">Optional</p>
                <textarea className="mt-2 min-h-[96px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200" placeholder="Optional landmarks, gate details, or safety instructions" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </section>

              {mode === 'school' && (
                <section className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-slate-700 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold text-sky-800">
                    <School className="h-4 w-4" /> School ride details
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <input className="rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-200" placeholder="Child name / school name" value={form.childName || form.schoolName} onChange={(e) => setForm((f) => ({ ...f, childName: e.target.value, schoolName: e.target.value }))} />
                    <div className="rounded-xl border border-sky-200 bg-white px-4 py-3 text-xs leading-5 text-sky-800">Verified handoffs, school coordination, and child safety details stay in this section.</div>
                  </div>
                </section>
              )}
            </div>

            <section className="mt-4 rounded-[1.75rem] border border-sky-200 bg-sky-50 p-5 text-slate-700 shadow-sm sm:p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Estimated fare</div>
              <div className="mt-2 flex items-end gap-3">
                <div className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">{(farePreview || estimateFare).toLocaleString()} UGX</div>
                <div className="pb-1 text-xs font-medium uppercase tracking-[0.24em] text-sky-700">Estimate</div>
              </div>
              <p className="mt-2 max-w-md text-sm text-slate-600">This is an estimate only. Final fare and payment status are confirmed after booking and provider processing.</p>
              <div className="mt-4 grid gap-2 rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-600 sm:grid-cols-2">
                <div className="flex items-center justify-between gap-3"><span>Pickup</span><span className="font-medium text-slate-900">{form.pickup || '—'}</span></div>
                <div className="flex items-center justify-between gap-3"><span>Dropoff</span><span className="font-medium text-slate-900">{form.dropoff || '—'}</span></div>
              </div>
            </section>
            <div className="mt-5">
              <button onClick={submitBooking} disabled={status === 'submitting'} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-4 text-base font-semibold text-white shadow-[0_12px_30px_rgba(2,132,199,0.25)] transition hover:bg-sky-500 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-70">
                {status === 'submitting' ? 'Submitting...' : 'Book Ride'}
              </button>
            </div>
            {result && (
              <div className={`mt-4 rounded-2xl border px-4 py-4 text-sm ${status === 'done' ? 'border-emerald-500/20 bg-emerald-50 text-emerald-800' : 'border-amber-500/20 bg-amber-50 text-amber-800'}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 h-2.5 w-2.5 rounded-full ${status === 'done' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900">{status === 'done' ? 'Booking confirmed' : 'Booking update'}</div>
                    <div className="mt-1 leading-6 text-slate-700">{result}</div>
                  </div>
                </div>
              </div>
            )}
            {bookingMeta.rideId && status === 'done' && (
              <div className="mt-3 rounded-2xl border border-emerald-200 bg-white px-4 py-4 text-sm text-slate-700 shadow-sm">
                <div className="font-semibold text-emerald-800">Track Ride</div>
                <div className="mt-2 space-y-1 text-slate-600">
                  <div>Booking ID: <span className="font-medium text-slate-900">{bookingMeta.rideId}</span></div>
                  {bookingMeta.flwRef && <div>Payment Ref: <span className="font-medium text-slate-900">{bookingMeta.flwRef}</span></div>}
                  <div className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">Payment support: MTN MoMo / Airtel Money where available</div>
                </div>
                <div className="mt-3">
                  <Link href="/ride/tracker" className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500">Open live tracker</Link>
                </div>
              </div>
            )}
            {status === 'done' && (
              <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <div>Next step: keep this page open to jump into tracking, or use the tracker link after confirmation.</div>
              </div>
            )}
            {status === 'done' && mode === 'school' && (
              <div className="mt-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                School rides will follow arrival-only safe-word reveal, gate checks, and dispatcher approval rules.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function CoverageNetworkWidget() {
  const [activeTab, setActiveTab] = useState<'kampala' | 'wakiso' | 'fleets' | 'gateways'>('kampala');
  const tabs = [
    { key: 'kampala', label: 'Kampala Zones' },
    { key: 'wakiso', label: 'Wakiso Routes' },
    { key: 'fleets', label: 'School Fleets' },
    { key: 'gateways', label: 'Mobile Money Gateways' },
  ] as const;
  const nodes = {
    kampala: ['Kampala Central', 'Makerere Hill', 'Kololo', 'Kawempe'],
    wakiso: ['Gayaza Road', 'Entebbe Spur', 'Nansana', 'Kira'],
    fleets: ['Main Campus Fleet', 'North Wing Fleet', 'Route A Vans', 'Route B Boda'],
    gateways: ['MTN MoMo', 'Airtel Money', 'School Float', 'Dispatch Wallet'],
  } as const;
  const activeNodes = nodes[activeTab];
  const isActive = (label: string) => {
    if (activeTab === 'gateways') return label.includes('MTN') || label.includes('Airtel');
    if (activeTab === 'fleets') return label.includes('Fleet') || label.includes('Route');
    if (activeTab === 'wakiso') return label.includes('Wakiso') || label.includes('Gayaza') || label.includes('Entebbe') || label.includes('Nansana') || label.includes('Kira');
    return label.includes('Kampala') || label.includes('Makerere') || label.includes('Kololo') || label.includes('Kawempe');
  };
  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="glass-strong relative overflow-hidden rounded-[2rem] border border-white/10 p-4 shadow-[0_18px_60px_rgba(2,6,23,0.55)] sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.16),transparent_28%),radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.12),transparent_28%)]" />
        <div className="absolute inset-0 opacity-20" style={{backgroundImage:'linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)', backgroundSize:'42px 42px'}} />
        <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-sky-300">PoleSafe Operational Coverage</div>
                <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Live Coverage & Safety Network</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">Interactive footprint across Kampala, Wakiso, school fleets, and mobile money gateways — optimized for trust, dispatch, and realtime service visibility.</p>
              </div>
              <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 md:block">Live telemetry via MTN & Airtel</div>
            </div>
            <div className="mt-5 rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl">
              <svg viewBox="0 0 960 560" className="h-[320px] w-full" role="img" aria-label="PoleSafe operational coverage map">
                <defs>
                  <linearGradient id="ps-line" x1="0%" x2="100%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0.9" />
                  </linearGradient>
                  <filter id="ps-glow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                </defs>
                <g opacity="0.25">
                  <path d="M80 440 C180 330, 290 290, 410 260 S680 210, 900 120" fill="none" stroke="url(#ps-line)" strokeDasharray="8 12" />
                  <path d="M120 120 C240 180, 320 210, 470 220 S700 245, 860 340" fill="none" stroke="url(#ps-line)" strokeDasharray="8 12" />
                  <path d="M150 490 C250 430, 350 390, 510 360 S760 250, 860 200" fill="none" stroke="url(#ps-line)" strokeDasharray="8 12" />
                </g>
                {[{x:150,y:180,label:'Kampala Central'},{x:310,y:120,label:'Makerere Hill'},{x:410,y:300,label:'Kampala School Fleet'},{x:610,y:170,label:'Wakiso Corridor'},{x:760,y:270,label:'MTN MoMo'},{x:820,y:390,label:'Airtel Money'},{x:520,y:430,label:'North Wing Fleet'},{x:230,y:390,label:'Gate Dispatch'}].map((n,i)=> {
                  const active = isActive(n.label);
                  const fill = active ? (activeTab === 'gateways' ? '#f97316' : activeTab === 'fleets' ? '#34d399' : activeTab === 'wakiso' ? '#38bdf8' : '#f97316') : 'rgba(226, 232, 240, 0.35)';
                  return <g key={i} filter="url(#ps-glow)" opacity={active ? 1 : 0.35}><circle cx={n.x} cy={n.y} r="8" fill={fill} /><circle cx={n.x} cy={n.y} r="24" fill={fill} fillOpacity="0.16" /><text x={n.x + 14} y={n.y - 12} fill="#e2e8f0" fontSize="12">{n.label}</text></g>;
                })}
              </svg>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-4">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
              <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Active corridor</div>
              <div className="mt-2 text-lg font-semibold text-white">{tabs.find((t) => t.key === activeTab)?.label}</div>
              <div className="mt-4 space-y-2">
                {activeNodes.map((node: string) => <div key={node} className="rounded-2xl border border-white/8 bg-slate-950/60 px-3 py-2 text-sm text-slate-200">{node}</div>)}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`rounded-full border px-3 py-2 text-xs transition ${activeTab === tab.key ? 'border-sky-400/40 bg-sky-500/10 text-sky-200 shadow-[0_0_20px_rgba(56,189,248,0.15)]' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}>{tab.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.18),_transparent_30%),radial-gradient(circle_at_85%_20%,_rgba(56,189,248,0.12),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(34,197,94,0.08),_transparent_24%)]" />
      <div style={{pointerEvents:'none',position:'fixed',inset:0,opacity:0.18,backgroundImage:'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.12) 1px, transparent 0)',backgroundSize:'24px 24px'}} />

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
        <BookingWidget />
        <TrustAndLiveSection />
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] border border-sky-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="grid gap-0 lg:grid-cols-[1.02fr_0.98fr]">
              <div className="bg-slate-950 px-5 py-6 text-white sm:px-6 sm:py-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200">Community Rides</div>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">Community Rides</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">PoleSafe also serves everyday riders, not only school transportation.</p>
                <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
                  Use PoleSafe for commuting, appointments, airport rides, shopping, family travel, and other everyday transportation — with verified drivers, estimated fare visibility, journey tracking, and PoleSafe safety protection.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="#booking" className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(2,132,199,0.25)] transition hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">
                    Book a Community Ride
                  </Link>
                  <Link href="#trust-safety" className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">
                    Learn How PoleSafe Keeps You Safe
                  </Link>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    'Everyday transportation',
                    'Verified drivers',
                    'Estimated fare',
                    'Familiar payment options',
                    'Journey tracking',
                    'PoleSafe safety protection',
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">{item}</div>
                  ))}
                </div>
              </div>

              <div className="bg-white px-5 py-6 sm:px-6 sm:py-8">
                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Ride preview</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">Pickup to destination</div>
                    </div>
                    <div className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">Plan, not live</div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {['Pickup', 'Driver assigned', 'Journey', 'Destination'].map((step, index) => (
                      <div key={step} className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${index < 3 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-sky-200 bg-sky-50 text-sky-700'}`}>{index + 1}</div>
                        <div className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800">{step}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Future rider tools</div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-700">
                      {['Call', 'Message', 'Safety'].map((item) => (
                        <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">{item}</span>
                      ))}
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-500">These are visual product-preview elements for the planned rider experience.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
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

        <CoverageNetworkWidget />

        <SchoolsSection />

        <DriversSection />

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
