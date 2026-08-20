'use client';

import { useState } from 'react';
import { apiUrl } from '@/lib/api-base';
import { ArrowRight, Bus, CheckCircle2, MapPin, School, ShieldAlert, Smartphone } from 'lucide-react';
import { freshnessFromTimestamp, humanizeRideStatus } from './ride-utils';

const trustPoints = [
  'Server-confirmed ride status',
  'Freshness-aware updates',
  'Privacy-aware tracking',
  'Hamna guidance without authority',
];

function statusStyles(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes('journey completed') || normalized.includes('pickup confirmed') || normalized.includes('driver assigned') || normalized.includes('driver arrived') || normalized.includes('journey in progress')) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  if (normalized.includes('stale')) return 'border-amber-200 bg-amber-50 text-amber-800';
  if (normalized.includes('cancelled')) return 'border-red-200 bg-red-50 text-red-700';
  return 'border-slate-200 bg-slate-100 text-slate-700';
}

export default function PoleSafeLive() {
  const liveCards = [
    { label: 'Server-confirmed', value: 'Real ride lookup below', tone: 'text-slate-900', bg: 'bg-white', border: 'border-slate-200', icon: Bus },
    { label: 'Freshness-aware', value: 'Recent updates highlighted', tone: 'text-slate-900', bg: 'bg-white', border: 'border-slate-200', icon: CheckCircle2 },
    { label: 'Privacy-aware', value: 'Access-controlled tracking', tone: 'text-slate-900', bg: 'bg-white', border: 'border-slate-200', icon: ShieldAlert },
    { label: 'Hamna', value: 'Guidance only, not authority', tone: 'text-slate-900', bg: 'bg-white', border: 'border-slate-200', icon: School },
    { label: 'Weak connectivity', value: 'Clear when updates may lag', tone: 'text-slate-900', bg: 'bg-white', border: 'border-slate-200', icon: MapPin },
    { label: 'Status view', value: 'For parents, guardians, schools', tone: 'text-slate-900', bg: 'bg-white', border: 'border-slate-200', icon: Smartphone },
  ];
  const [rideId, setRideId] = useState('');
  const [lookupState, setLookupState] = useState<'initial' | 'loading' | 'success' | 'not_found' | 'error'>('initial');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupError, setLookupError] = useState('');

  async function submitRideLookup(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = rideId.trim();
    if (!trimmed) {
      setLookupState('error');
      setLookupError('Enter a ride ID to look up the live status.');
      setLookupResult(null);
      return;
    }
    setLookupState('loading');
    setLookupError('');
    setLookupResult(null);
    try {
      const response = await fetch(apiUrl(`/api/rides/${encodeURIComponent(trimmed)}/track`));
      if (response.status === 404 || response.status === 403) {
        setLookupState('not_found');
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Unable to load ride status.');
      setLookupResult(data);
      setLookupState('success');
    } catch (err: any) {
      setLookupState('error');
      setLookupError(err?.message || 'Network error while loading ride status.');
    }
  }

  const child = lookupResult?.child;
  const ride = lookupResult?.ride;
  const driver = lookupResult?.driver;
  const location = lookupResult?.location || lookupResult?.lastLocation;
  const freshness = freshnessFromTimestamp(location?.updatedAt || location?.timestamp || location?.lastUpdatedAt);
  const statusLabel = humanizeRideStatus(ride?.status);
  const freshnessTone = freshness.label === 'LIVE' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : freshness.label === 'RECENT' ? 'border-amber-200 bg-amber-50 text-amber-800' : freshness.label === 'STALE' ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-slate-100 text-slate-700';

  function renderStateCard() {
    if (lookupState === 'success' && lookupResult) {
      return (
        <div className="mt-5 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Ride status</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{statusLabel}</div>
            </div>
            <div className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles(statusLabel)}`}>
              {statusLabel}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Current ride</div>
              <div className="mt-1 font-semibold text-slate-900">{ride?.reference || ride?.id || 'Ride lookup matched'}</div>
            </div>
            <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${freshnessTone}`}>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-inherit/70">Update freshness</div>
              <div className="mt-1">{freshness.label}</div>
              <div className="mt-1 text-sm font-normal">{freshness.detail}</div>
            </div>
            {child?.name && <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"><span className="font-semibold text-slate-900">Child:</span> {child.name}</div>}
            {ride?.scheduledPickup && <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"><span className="font-semibold text-slate-900">Scheduled pickup:</span> {ride.scheduledPickup}</div>}
            {ride?.actualPickup && <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"><span className="font-semibold text-slate-900">Actual pickup:</span> {ride.actualPickup}</div>}
            {ride?.actualDropoff && <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"><span className="font-semibold text-slate-900">Actual dropoff:</span> {ride.actualDropoff}</div>}
            {driver?.name && <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"><span className="font-semibold text-slate-900">Driver:</span> {driver.name}</div>}
            {driver?.phone && <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"><span className="font-semibold text-slate-900">Driver phone:</span> {driver.phone}</div>}
            {location?.label && <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"><span className="font-semibold text-slate-900">Last known location:</span> {location.label}</div>}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <div className="font-semibold text-slate-900">Freshness note</div>
            <div className="mt-1">Updated recently may be delayed. Server-confirmed updates remain authoritative.</div>
          </div>
        </div>
      );
    }
    if (lookupState === 'not_found') return <div className="mt-5 rounded-[1.75rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">We couldn’t find a ride you can track with that ID. Check the ride ID and try again.</div>;
    if (lookupState === 'error') return <div className="mt-5 rounded-[1.75rem] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900">{lookupError || 'Network error while loading ride status.'}</div>;
    return <div className="mt-5 rounded-[1.75rem] border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600">Enter a ride ID to view the current server-confirmed status.</div>;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-[2.25rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6 lg:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">PoleSafe Live</div>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">See the journey. Know what&apos;s happening.</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Track an active PoleSafe ride using verified ride information and current server-confirmed updates.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {trustPoints.map((point) => (
                <div key={point} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-500">Hamna can explain the status, call out delayed updates, and suggest what to do next — but the server remains authoritative.</p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">Live ride lookup</div>
                <p className="text-sm text-slate-600">Enter your ride ID to view the latest server-confirmed journey status.</p>
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">Server-confirmed tracking</div>
            </div>
            <p className="mt-3 text-sm text-slate-600">Hamna is here for guidance only.</p>
            <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={submitRideLookup}>
              <input value={rideId} onChange={(e) => setRideId(e.target.value)} className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-200" placeholder="Ride ID" />
              <button type="submit" className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-500">View ride status</button>
            </form>
            {renderStateCard()}
          </div>
        </div>
      </div>
    </section>
  );
}
