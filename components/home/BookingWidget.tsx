'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { apiUrl } from '@/lib/api-base';
import { MapPin, Phone, School, TimerReset, Users } from 'lucide-react';

type RideMode = 'community' | 'school';

export default function BookingWidget() {
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
    <section id="booking" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/5">
        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="bg-[linear-gradient(180deg,#0b1730_0%,#08111f_100%)] px-5 py-6 text-white sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">
              BOOK A RIDE
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Book a safe ride with PoleSafe</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">Choose a community ride or school ride and enter the journey details.</p>

            <div className="mt-6 inline-flex rounded-2xl bg-white/5 p-1 ring-1 ring-white/10">
              {(['community', 'school'] as RideMode[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setMode(item)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${mode === item ? 'bg-sky-500 text-white shadow-[0_10px_24px_rgba(14,165,233,0.28)]' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
                >
                  {item === 'community' ? 'Community Ride' : 'School Ride'}
                </button>
              ))}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">REQUEST DETAILS</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">Tell us pickup, destination, time, and rider details.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">PAYMENT</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">Community rides use the current MoMo flow when available.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-2 lg:col-span-1">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">STATUS</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">Booking feedback appears here after submission.</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-5 lg:p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-800">Pickup location</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 transition focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100">
                    <MapPin className="h-4 w-4 shrink-0 text-sky-500" />
                    <input className="w-full bg-transparent outline-none placeholder:text-slate-400" placeholder={mode === 'school' ? 'Home, stage, or pickup point' : 'Pickup location'} value={form.pickup} onChange={(e) => setForm((f) => ({ ...f, pickup: e.target.value }))} />
                  </div>
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-800">Destination</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 transition focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100">
                    <MapPin className="h-4 w-4 shrink-0 text-emerald-500" />
                    <input className="w-full bg-transparent outline-none placeholder:text-slate-400" placeholder={mode === 'school' ? 'School or dropoff destination' : 'Dropoff location'} value={form.dropoff} onChange={(e) => setForm((f) => ({ ...f, dropoff: e.target.value }))} />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-800">Journey time</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 transition focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100">
                    <TimerReset className="h-4 w-4 shrink-0 text-sky-500" />
                    <input className="w-full bg-transparent outline-none placeholder:text-slate-400" type="datetime-local" value={form.rideTime} onChange={(e) => setForm((f) => ({ ...f, rideTime: e.target.value }))} />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-800">Vehicle type</span>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 transition focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100">
                    <select className="w-full bg-transparent text-sm outline-none" value={form.vehicleType} onChange={(e) => setForm((f) => ({ ...f, vehicleType: e.target.value }))}>
                      <option value="car">Car</option>
                      <option value="boda">Boda Boda</option>
                      <option value="bus">Bus</option>
                      <option value="taxi">Taxi</option>
                    </select>
                  </div>
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-800">Your name</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 transition focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100">
                    <Users className="h-4 w-4 shrink-0 text-sky-500" />
                    <input className="w-full bg-transparent outline-none placeholder:text-slate-400" placeholder="Your name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                  </div>
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-800">Phone number</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 transition focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100">
                    <Phone className="h-4 w-4 shrink-0 text-sky-500" />
                    <input className="w-full bg-transparent outline-none placeholder:text-slate-400" placeholder="Phone number" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                  </div>
                </label>
              </div>

              <section className="mt-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Additional information</div>
                <p className="mt-1 text-xs text-slate-500">Optional</p>
                <textarea className="mt-2 min-h-[96px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100" placeholder="Optional landmarks, gate details, or safety instructions" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </section>

              {mode === 'school' && (
                <section className="mt-4 rounded-[1.5rem] border border-sky-200 bg-sky-50 p-4 sm:p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-sky-800">
                    <School className="h-4 w-4" /> School ride details
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input className="rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100" placeholder="Child name / school name" value={form.childName || form.schoolName} onChange={(e) => setForm((f) => ({ ...f, childName: e.target.value, schoolName: e.target.value }))} />
                    <div className="rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700">Verified handoffs, school coordination, and child safety details stay in this section.</div>
                  </div>
                </section>
              )}

              <section className="mt-4 rounded-[1.5rem] border border-sky-200 bg-sky-50 p-4 sm:p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Estimated fare</div>
                <div className="mt-2 flex items-end gap-3">
                  <div className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">{(farePreview || estimateFare).toLocaleString()} UGX</div>
                  <div className="pb-1 text-xs font-medium uppercase tracking-[0.24em] text-sky-700">Estimate</div>
                </div>
                <p className="mt-2 max-w-md text-sm text-slate-600">This is an estimate only. Final fare and payment status are confirmed after booking and provider processing.</p>
                <div className="mt-4 grid gap-2 rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-600 sm:grid-cols-2">
                  <div className="flex items-center justify-between gap-3"><span>Pickup</span><span className="font-medium text-slate-950">{form.pickup || '—'}</span></div>
                  <div className="flex items-center justify-between gap-3"><span>Dropoff</span><span className="font-medium text-slate-950">{form.dropoff || '—'}</span></div>
                </div>
              </section>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button onClick={submitBooking} disabled={status === 'submitting'} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-4 text-base font-semibold text-white shadow-[0_12px_30px_rgba(2,132,199,0.25)] transition hover:bg-sky-500 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-70">
                  {status === 'submitting' ? 'Submitting...' : 'Book Ride'}
                </button>
              </div>

              {result && (
                <div className={                  `mt-4 rounded-2xl border px-4 py-4 text-sm ${status === 'done' ? 'border-emerald-500/20 bg-emerald-50 text-emerald-800' : 'border-amber-500/20 bg-amber-50 text-amber-800'}`
                }>
                  <div className="flex items-start gap-3">
                    <div className={                      `mt-0.5 h-2.5 w-2.5 rounded-full ${status === 'done' ? 'bg-emerald-500' : 'bg-amber-500'}`
                    } />
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
      </div>
    </section>
  );
}
