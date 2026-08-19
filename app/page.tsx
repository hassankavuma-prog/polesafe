'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Bus, CheckCircle2, MapPin, Phone, School, ShieldAlert, Smartphone, TimerReset, Users } from 'lucide-react';
import PoleSafeLive from '@/components/home/PoleSafeLive';
import BookingWidget from '@/components/home/BookingWidget';
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

function CommunityUpdatesSection() {
  const categories = [
    {
      label: 'Coverage',
      title: 'Coverage update',
      text: 'Placeholder/demo card for a newly covered area or service expansion.',
    },
    {
      label: 'Schools',
      title: 'School partnership',
      text: 'Placeholder/demo card for a new school collaboration or onboarding milestone.',
    },
    {
      label: 'Safety',
      title: 'Safety improvement',
      text: 'Placeholder/demo card for a process, verification, or response improvement.',
    },
    {
      label: 'Community',
      title: 'Community announcement',
      text: 'Placeholder/demo card for a driver opportunity, product update, or public note.',
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="grid gap-0 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="bg-slate-950 px-5 py-6 text-white sm:px-6 sm:py-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200">Community</div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">PoleSafe Community &amp; Updates</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">A transparent space for service expansion, school partnerships, coverage growth, safety improvements, driver opportunities, and community announcements.</p>
            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Preview / demo</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">No fabricated news or live announcements are shown here. These cards are clearly labeled placeholders until a real update feed is connected.</p>
            </div>
            <div className="mt-6">
              <Link href="#community-updates" className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(2,132,199,0.25)] transition hover:bg-sky-500">
                View Community Updates
              </Link>
            </div>
          </div>
          <div className="bg-slate-50 px-5 py-6 sm:px-6 sm:py-8">
            <div id="community-updates" className="grid gap-3 sm:grid-cols-2">
              {categories.map((item) => (
                <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">{item.label}</div>
                  <h3 className="mt-2 text-base font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                </article>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">Preview content only. No dates, metrics, or live announcements are invented here.</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GlobalFooter() {
  const rideLinks = [
    { label: 'Book a Ride', href: '/#booking' },
    { label: 'Track Ride', href: '/ride/tracker' },
    { label: 'Community Rides', href: '/#community-rides' },
  ];
  const safetyLinks = [
    { label: 'How PoleSafe Works', href: '/#trust-safety' },
    { label: 'School Safety', href: '/schools' },
    { label: 'Emergency / Safety', href: '/ops/safety' },
  ];
  const partnerLinks = [
    { label: 'Schools', href: '/schools' },
    { label: 'Drivers', href: '/driver' },
    { label: 'Fleets', href: '/ops' },
  ];
  const companyLinks = [
    { label: 'About', href: '/#hero' },
    { label: 'Community', href: '#community-updates' },
    { label: 'Updates', href: '#community-updates' },
    { label: 'Hamna', href: '#hamna' },
  ];
  const supportLinks = [
    { label: 'Help', href: '/#support' },
    { label: 'Contact', href: '/#support' },
  ];

  return (
    <footer id="footer" className="border-t border-white/10 bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1.9fr]">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 ring-1 ring-sky-400/20">
                <ShieldAlert className="h-5 w-5 text-sky-300" />
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tight">PoleSafe</div>
                <div className="text-xs text-slate-400">Uganda-first mobility safety OS</div>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">Built for Uganda today, with room to expand to more communities and markets as the platform grows.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Ride</div>
              <div className="mt-3 space-y-2 text-sm">{rideLinks.map((item) => <div key={item.label}><Link href={item.href} className="text-slate-300 transition hover:text-white">{item.label}</Link></div>)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Safety</div>
              <div className="mt-3 space-y-2 text-sm">{safetyLinks.map((item) => <div key={item.label}><Link href={item.href} className="text-slate-300 transition hover:text-white">{item.label}</Link></div>)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Partners</div>
              <div className="mt-3 space-y-2 text-sm">{partnerLinks.map((item) => <div key={item.label}><Link href={item.href} className="text-slate-300 transition hover:text-white">{item.label}</Link></div>)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Company</div>
              <div className="mt-3 space-y-2 text-sm">{companyLinks.map((item) => <div key={item.label}><Link href={item.href} className="text-slate-300 transition hover:text-white">{item.label}</Link></div>)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Support</div>
              <div className="mt-3 space-y-2 text-sm">{supportLinks.map((item) => <div key={item.label}><Link href={item.href} className="text-slate-300 transition hover:text-white">{item.label}</Link></div>)}</div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
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
              <Link href="/school" className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(2,132,199,0.25)] transition hover:bg-sky-500">For Schools</Link>
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

function formatRelativeMinutes(minutes: number) {
  if (minutes <= 0) return 'just now';
  if (minutes === 1) return '1 minute ago';
  return `${minutes} minutes ago`;
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
        <PoleSafeLive />
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
        <section className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-8 lg:py-18">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200 shadow-sm shadow-sky-950/20 backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-sky-300 shadow-[0_0_18px_rgba(56,189,248,0.55)]" />
              Safer journeys for families, schools, and communities
            </div>

            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              Safer journeys. Stronger communities.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl sm:leading-9">
              PoleSafe connects families, schools, communities and trusted drivers through safer, trackable transportation built around verification, visibility and accountability.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="#booking"
                className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(14,165,233,0.28)] transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Book a Ride <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/ride/tracker"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white/90 backdrop-blur-xl transition hover:border-sky-300/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Track Ride
              </Link>
              <Link
                href="/schools"
                className="inline-flex items-center gap-2 rounded-2xl border border-sky-300/20 bg-sky-500/10 px-5 py-3.5 text-sm font-semibold text-sky-100 backdrop-blur-xl transition hover:bg-sky-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                School Transport
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-300">
              {['Verified drivers', 'Journey tracking', 'Safe handoff'].map((item) => (
                <div key={item} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl">
                  <CheckCircle2 className="h-4 w-4 text-sky-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 lg:pt-2">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,15,33,0.96),rgba(10,18,38,0.92))] p-5 shadow-[0_24px_80px_rgba(2,6,23,0.58)] ring-1 ring-white/5 sm:p-6">
              <div className="rounded-[1.5rem] border border-sky-300/10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_50%),linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.96))] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.32em] text-sky-200/70">PoleSafe mobility</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Verified driver. Clear journey. Safe handoff.</h2>
                  </div>
                  <div className="rounded-full border border-sky-300/15 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-200 shadow-[0_0_22px_rgba(56,189,248,0.12)]">
                    Live visibility
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Verified driver', value: 'Confirmed' },
                    { label: 'Journey tracking', value: 'Visible' },
                    { label: 'Safe handoff', value: 'Protected' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/8 bg-white/5 p-4 shadow-[0_16px_36px_rgba(2,6,23,0.24)]">
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{item.label}</div>
                      <div className="mt-2 text-lg font-semibold text-sky-200">{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-3">
                  {[
                    'School and community trips in one trusted platform',
                    'Trackable journeys from pickup to drop-off',
                    'Simple visibility for parents and school teams',
                    'Safety-first ride support built around accountability',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-sky-300/20 bg-sky-500/10 text-sky-200">
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

      <GlobalFooter />
    </div>
  );
}
