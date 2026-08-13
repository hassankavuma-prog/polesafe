'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Bus, CheckCircle2, MapPin, Phone, School, ShieldAlert, Smartphone, TimerReset, Users } from 'lucide-react';

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

  const routeHint = useMemo(() => mode === 'school'
    ? 'School ride booking will create a trip request for the operations team to confirm.'
    : 'Community ride booking will request an on-demand ride from the live dispatch pool.', [mode]);

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

      const endpoint = mode === 'community' ? '/api/rides/request' : '/api/trips';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Booking failed');

      if (mode === 'community') {
        const amount = Number(data.price?.total || 0);
        if (amount > 0) {
          const payResponse = await fetch('/api/payments/momo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount,
              provider: 'mtn',
              narration: `PoleSafe ride booking ${data.ride?._id || ''}`,
              rideId: data.ride?._id,
            }),
          });
          const payData = await payResponse.json();
          if (!payResponse.ok) throw new Error(payData.error || 'Payment initiation failed');
          setBookingMeta({ rideId: data.ride?._id, txRef: payData.txRef, flwRef: payData.flwRef });
          setResult(`Ride requested. Fare: ${amount} UGX • Payment initiated via MTN MoMo. Confirm on your phone.`);
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
      <div className="glass-strong rounded-[2rem] border border-white/10 p-5 shadow-[0_18px_60px_rgba(2,6,23,0.55)] sm:p-6">
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

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4 md:grid-cols-2">
            <input className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" placeholder="Your name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"><Phone className="h-4 w-4 text-orange-300" /><input className="w-full bg-transparent outline-none placeholder:text-slate-500" placeholder="Phone number" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"><MapPin className="h-4 w-4 text-sky-300" /><input className="w-full bg-transparent outline-none placeholder:text-slate-500" placeholder={mode === 'school' ? 'Pickup point / home' : 'Pickup location'} value={form.pickup} onChange={(e) => setForm((f) => ({ ...f, pickup: e.target.value }))} /></div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"><MapPin className="h-4 w-4 text-emerald-300" /><input className="w-full bg-transparent outline-none placeholder:text-slate-500" placeholder={mode === 'school' ? 'School / dropoff destination' : 'Dropoff location'} value={form.dropoff} onChange={(e) => setForm((f) => ({ ...f, dropoff: e.target.value }))} /></div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"><TimerReset className="h-4 w-4 text-violet-300" /><input className="w-full bg-transparent outline-none placeholder:text-slate-500" type="datetime-local" value={form.rideTime} onChange={(e) => setForm((f) => ({ ...f, rideTime: e.target.value }))} /></div>
            <select className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none" value={form.vehicleType} onChange={(e) => setForm((f) => ({ ...f, vehicleType: e.target.value }))}>
              <option value="car">Car</option>
              <option value="boda">Boda Boda</option>
              <option value="bus">Bus</option>
              <option value="taxi">Taxi</option>
            </select>
            {mode === 'school' && <input className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 md:col-span-2" placeholder="Child name / school name" value={form.childName || form.schoolName} onChange={(e) => setForm((f) => ({ ...f, childName: e.target.value, schoolName: e.target.value }))} />}
            <textarea className="min-h-[110px] rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 md:col-span-2" placeholder="Notes, landmarks, gate details, or safety instructions" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Booking preview</div>
            <div className="mt-3 text-lg font-semibold text-white">{mode === 'school' ? 'School ride request' : 'Community ride request'}</div>
            <p className="mt-2 text-sm text-slate-300">{routeHint}</p>
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <div>Pickup: {form.pickup || '—'}</div>
              <div>Dropoff: {form.dropoff || '—'}</div>
              <div>Time: {form.rideTime || '—'}</div>
              <div>Vehicle: {form.vehicleType}</div>
            </div>
            <button onClick={submitBooking} disabled={status === 'submitting'} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_35px_rgba(249,115,22,0.20)] transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-70">
              {status === 'submitting' ? 'Submitting...' : 'Book ride now'}
            </button>
            {result && <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${status === 'done' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : 'border-red-500/20 bg-red-500/10 text-red-200'}`}>{result}</div>}
            {bookingMeta.rideId && status === 'done' && (
              <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-xs text-slate-300">
                <div>Booking ID: {bookingMeta.rideId}</div>
                {bookingMeta.flwRef && <div>Payment Ref: {bookingMeta.flwRef}</div>}
                <div className="mt-2">
                  <Link href="/ride/tracker" className="text-sky-300 underline">Open live tracker</Link>
                </div>
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
        <BookingWidget />
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
