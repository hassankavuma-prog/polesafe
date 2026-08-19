'use client';

import { useState } from 'react';
import { apiUrl } from '@/lib/api-base';
import { Bus, CheckCircle2, MapPin, School, ShieldAlert, Smartphone } from 'lucide-react';
import { freshnessFromTimestamp, humanizeRideStatus } from './ride-utils';

export default function PoleSafeLive() {
  const liveCards = [
    { label: 'Rides in progress', value: 'Open live lookup below', tone: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', icon: Bus },
    { label: 'Verified drivers', value: 'Connected', tone: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
    { label: 'Safe handoffs', value: 'Monitoring', tone: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: ShieldAlert },
    { label: 'Schools connected', value: 'Selected schools', tone: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', icon: School },
    { label: 'Coverage / service areas', value: 'Available in selected areas', tone: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: MapPin },
    { label: 'System status', value: 'Monitoring', tone: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', icon: Smartphone },
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

  function renderStateCard() {
    if (lookupState === 'success' && lookupResult) {
      return (
        <div className="mt-5 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Ride status</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">{statusLabel}</div>
            </div>
            <div className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">{freshness.label}</div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {child?.name && <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"><span className="font-semibold text-slate-900">Child:</span> {child.name}</div>}
            {ride?.scheduledPickup && <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"><span className="font-semibold text-slate-900">Scheduled pickup:</span> {ride.scheduledPickup}</div>}
            {ride?.actualPickup && <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"><span className="font-semibold text-slate-900">Actual pickup:</span> {ride.actualPickup}</div>}
            {ride?.actualDropoff && <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"><span className="font-semibold text-slate-900">Actual dropoff:</span> {ride.actualDropoff}</div>}
            {driver?.name && <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"><span className="font-semibold text-slate-900">Driver:</span> {driver.name}</div>}
            {driver?.phone && <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"><span className="font-semibold text-slate-900">Driver phone:</span> {driver.phone}</div>}
            {location?.label && <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"><span className="font-semibold text-slate-900">Last known location:</span> {location.label}</div>}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"><span className="font-semibold text-slate-900">Freshness:</span> {freshness.detail}</div>
          </div>
        </div>
      );
    }
    if (lookupState === 'not_found') return <div className="mt-5 rounded-[1.75rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">Ride not found or access denied.</div>;
    if (lookupState === 'error') return <div className="mt-5 rounded-[1.75rem] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900">{lookupError || 'Network error while loading ride status.'}</div>;
    return <div className="mt-5 rounded-[1.75rem] border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600">Enter a ride ID to view live status.</div>;
  }

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

        <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">Live ride lookup</div>
              <p className="text-sm text-slate-600">Enter a ride ID to view the current status from the live track endpoint.</p>
            </div>
            <div className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">Real backend lookup</div>
          </div>
          <p className="mt-3 text-sm text-slate-600">Hamna can help explain your current ride status.</p>
          <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={submitRideLookup}>
            <input value={rideId} onChange={(e) => setRideId(e.target.value)} className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-200" placeholder="Ride ID" />
            <button type="submit" className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-500">View ride status</button>
          </form>
          {renderStateCard()}
        </div>
      </div>
    </section>
  );
}
