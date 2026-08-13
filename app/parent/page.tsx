'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, BusFront, CheckCircle2, Clock3, CreditCard, MapPinned, MessageSquareText, ShieldCheck, Smartphone } from 'lucide-react';
import type { SmsUssdFallbackPayload, TransportLedgerTransaction } from '../../types/polesafe';

type RideStatus = 'waiting' | 'picked_up' | 'en_route' | 'dropped_off';

type ChildRide = {
  childName: string;
  school: string;
  route: string;
  status: RideStatus;
  pickupTime: string;
  dropoffTime?: string;
  maskedVehicleLocation: string;
  vehicleLabel: string;
};

type ScheduleItem = {
  term: string;
  route: string;
  days: string;
  pickup: string;
  dropoff: string;
  feeUgx: number;
  status: 'paid' | 'due' | 'partial';
};

const ride: ChildRide = {
  childName: 'Amina N.',
  school: 'Kampala Preparatory School',
  route: 'Route A',
  status: 'picked_up',
  pickupTime: '07:18',
  maskedVehicleLocation: 'Near Makerere Hill • location masked for privacy',
  vehicleLabel: 'School Van • UAX 482B',
};

const rideHistory = [
  { id: 'r1', route: 'Route A', status: 'picked_up', time: '07:18' },
  { id: 'r2', route: 'Route A', status: 'dropped_off', time: '15:48' },
  { id: 'r3', route: 'Route B', status: 'picked_up', time: '07:26' },
] as const;

const schedule: ScheduleItem[] = [
  { term: 'Term 1 2026', route: 'Route A', days: 'Mon–Fri', pickup: '07:15', dropoff: '15:45', feeUgx: 150000, status: 'paid' },
  { term: 'Term 2 2026', route: 'Route A', days: 'Mon–Fri', pickup: '07:15', dropoff: '15:45', feeUgx: 150000, status: 'due' },
];

const quickPayOptions = [
  { label: 'MTN MoMo', hint: 'Pay in UGX', tone: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20' },
  { label: 'Airtel Money', hint: 'Pay in UGX', tone: 'bg-orange-500/10 text-orange-300 ring-orange-500/20' },
] as const;

const notificationLogs: SmsUssdFallbackPayload[] = [
  {
    messageId: 'sms_01',
    senderPhone: 'Kabiriti',
    gatewayProvider: 'africas_talking',
    rawText: 'CHILD PICKED UP OK',
    interpretedAction: 'CHECKIN',
    associatedChildId: 'child_001',
    processedAt: '2026-08-13T06:19:00Z',
    success: true,
    schoolId: 'school_ug_001',
    campusId: 'campus_1',
  },
  {
    messageId: 'sms_02',
    senderPhone: 'Kabiriti',
    gatewayProvider: 'africas_talking',
    rawText: 'RIDE DELAYED DUE TO TRAFFIC',
    interpretedAction: 'UNKNOWN',
    processedAt: '2026-08-13T06:52:00Z',
    success: true,
    schoolId: 'school_ug_001',
    campusId: 'campus_1',
  },
  {
    messageId: 'sms_03',
    senderPhone: 'Kabiriti',
    gatewayProvider: 'custom_ussd',
    rawText: '*123# pickup confirmation queued',
    interpretedAction: 'PICKUP_CONFIRM',
    processedAt: '2026-08-13T07:01:00Z',
    success: false,
    schoolId: 'school_ug_001',
    campusId: 'campus_1',
  },
];

const mobileMoneyDraft: TransportLedgerTransaction = {
  transactionId: 'TXN-UG-99001',
  organizationId: 'ORG-KAMPALA-01',
  parentId: 'PAR-88392',
  amountUgx: 150000,
  paymentMethod: 'flutterwave_momo',
  status: 'pending',
  termReference: 'Term 2 2026',
  createdAt: '2026-08-13T02:00:00Z',
};

const rideTone: Record<RideStatus, string> = {
  waiting: 'bg-slate-500/10 text-slate-300 ring-slate-500/20',
  picked_up: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
  en_route: 'bg-orange-500/10 text-orange-300 ring-orange-500/20',
  dropped_off: 'bg-blue-500/10 text-blue-300 ring-blue-500/20',
};

export default function ParentDashboardPage() {
  const [payments, setPayments] = useState<TransportLedgerTransaction[]>([mobileMoneyDraft]);
  const [selectedRail, setSelectedRail] = useState<'MTN MoMo' | 'Airtel Money'>('MTN MoMo');

  const dueTotal = useMemo(() => schedule.filter((item) => item.status !== 'paid').reduce((sum, item) => sum + item.feeUgx, 0), []);
  const latestLog = notificationLogs[0];

  useEffect(() => {
    void fetch('/api/safety/dispatcher/summary').catch(() => undefined);
  }, []);

  const handleQuickPay = () => {
    setPayments((prev) => [
      ...prev,
      {
        ...mobileMoneyDraft,
        transactionId: `TXN-UG-${Date.now()}`,
        paymentMethod: selectedRail === 'MTN MoMo' ? 'flutterwave_momo' : 'airtel_money',
        status: 'pending',
      },
    ]);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-orange-300">
                <ShieldCheck className="h-3.5 w-3.5" /> Parent portal
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Parent Ride Companion
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Low-bandwidth tracking, pickup alerts, payment shortcuts, and SMS/USSD visibility for Kabiriti and other feature phones.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/finance" className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400">
                Pay now
              </Link>
              <Link href="/dispatch" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10">
                Track dispatch
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="space-y-4">
          <div className="glass-strong rounded-3xl p-5 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Live ride tracker</h2>
                <p className="mt-1 text-sm text-slate-400">Pickup status, drop-off notifications, and privacy-masked location.</p>
              </div>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ${rideTone[ride.status]}`}>
                {ride.status === 'picked_up' ? <BusFront className="h-3.5 w-3.5" /> : <MapPinned className="h-3.5 w-3.5" />}
                {ride.status.replace('_', ' ')}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                <div className="text-xs text-slate-500">Child</div>
                <div className="mt-1 text-sm font-semibold text-white">{ride.childName}</div>
                <div className="mt-1 text-xs text-slate-400">{ride.school}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                <div className="text-xs text-slate-500">Vehicle</div>
                <div className="mt-1 text-sm font-semibold text-white">{ride.vehicleLabel}</div>
                <div className="mt-1 text-xs text-slate-400">Pickup {ride.pickupTime}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                <div className="text-xs text-slate-500">Location</div>
                <div className="mt-1 text-sm font-semibold text-white">Masked</div>
                <div className="mt-1 text-xs text-slate-400">{ride.maskedVehicleLocation}</div>
              </div>
            </div>
          </div>

          <div className="glass rounded-3xl p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Ride history</h2>
                <p className="mt-1 text-sm text-slate-400">Quick recent history for pickup and drop-off checks.</p>
              </div>
              <Clock3 className="h-5 w-5 text-orange-300" />
            </div>

            <div className="mt-4 space-y-3">
              {rideHistory.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/8 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{item.route}</div>
                      <div className="mt-1 text-xs text-slate-400">{item.time}</div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] text-slate-300 ring-1 ring-white/10 capitalize ${rideTone[item.status as RideStatus]}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Term-based ride schedule</h2>
                <p className="mt-1 text-sm text-slate-400">Keep transport aligned to school terms and route cycles.</p>
              </div>
              <Clock3 className="h-5 w-5 text-orange-300" />
            </div>

            <div className="mt-4 space-y-3">
              {schedule.map((item) => (
                <div key={`${item.term}-${item.route}`} className="rounded-2xl border border-white/8 bg-slate-950/60 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">{item.term} • {item.route}</div>
                      <div className="mt-1 text-xs text-slate-400">{item.days} • Pickup {item.pickup} • Drop-off {item.dropoff}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Fee</div>
                        <div className="text-sm font-semibold text-white">{item.feeUgx.toLocaleString()} UGX</div>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${item.status === 'paid' ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20' : item.status === 'partial' ? 'bg-amber-500/10 text-amber-300 ring-amber-500/20' : 'bg-red-500/10 text-red-300 ring-red-500/20'}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-strong rounded-3xl p-5 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Quick pay</h2>
                <p className="mt-1 text-sm text-slate-400">Mobile Money rails in UGX for term transport payments.</p>
              </div>
              <CreditCard className="h-5 w-5 text-emerald-300" />
            </div>

            <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.04] p-4">
              <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Due this term</div>
              <div className="mt-2 text-2xl font-semibold text-white">{dueTotal.toLocaleString()} UGX</div>
              <div className="mt-1 text-sm text-slate-400">One-tap payment keeps the ride active.</div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {quickPayOptions.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setSelectedRail(option.label)}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${selectedRail === option.label ? 'border-orange-400 bg-orange-500/10' : 'border-white/8 bg-slate-950/60 hover:bg-white/[0.05]'}`}
                >
                  <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${option.tone}`}>{option.label}</div>
                  <div className="mt-2 text-sm text-slate-300">{option.hint}</div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleQuickPay}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-400"
            >
              <CreditCard className="h-4 w-4" /> Pay with {selectedRail}
            </button>
          </div>

          <div className="glass rounded-3xl p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">SMS / USSD log preview</h2>
                <p className="mt-1 text-sm text-slate-400">Offline updates sent to Kabiriti and feature phones.</p>
              </div>
              <Smartphone className="h-5 w-5 text-orange-300" />
            </div>

            <div className="mt-4 space-y-3">
              {notificationLogs.map((log) => (
                <div key={log.messageId} className="rounded-2xl border border-white/8 bg-slate-950/60 p-4 text-sm text-slate-300">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-white">{log.senderPhone}</div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${log.success ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20' : 'bg-amber-500/10 text-amber-300 ring-amber-500/20'}`}>
                      {log.success ? 'dispatched' : 'retry queued'}
                    </span>
                  </div>
                  <div className="mt-2 text-slate-400">{log.rawText}</div>
                  <div className="mt-1 text-xs text-slate-500">{new Date(log.processedAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-300" />
              <div>
                <h3 className="text-lg font-semibold text-white">Latest alert</h3>
                <p className="mt-1 text-sm text-slate-400">{latestLog.rawText} → {latestLog.interpretedAction} via {latestLog.gatewayProvider}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Parent notifications stay visible even when the app is offline.
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
              <MessageSquareText className="h-4 w-4 text-orange-300" /> USSD and SMS updates stay readable for feature-phone families.
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
        PoleSafe Parent Portal • mobile-first • low bandwidth • Uganda-first
      </footer>
    </main>
  );
}
