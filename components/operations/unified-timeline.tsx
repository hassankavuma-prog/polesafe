'use client';

import React, { useMemo } from 'react';
import type { OperationalConfidence, OperationalEvent } from '../../types/polesafe';

export type UnifiedTimelineProps = {
  events: OperationalEvent[];
  title?: string;
  subtitle?: string;
};

const confidenceTone: Record<OperationalConfidence, string> = {
  confirmed: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
  inferred: 'bg-sky-500/10 text-sky-300 ring-sky-500/20',
  delayed: 'bg-amber-500/10 text-amber-300 ring-amber-500/20',
  'offline-received': 'bg-violet-500/10 text-violet-300 ring-violet-500/20',
  'manually-verified': 'bg-orange-500/10 text-orange-300 ring-orange-500/20',
};

const eventTypeTone: Record<OperationalEvent['eventType'], string> = {
  child_checkin: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
  child_checkout: 'bg-blue-500/10 text-blue-300 ring-blue-500/20',
  ride_update: 'bg-orange-500/10 text-orange-300 ring-orange-500/20',
  vehicle_telemetry: 'bg-slate-500/10 text-slate-300 ring-slate-500/20',
  payment: 'bg-amber-500/10 text-amber-300 ring-amber-500/20',
  sos: 'bg-red-500/10 text-red-300 ring-red-500/20',
  school_gate: 'bg-violet-500/10 text-violet-300 ring-violet-500/20',
  sms_log: 'bg-cyan-500/10 text-cyan-300 ring-cyan-500/20',
};

export function UnifiedTimeline({ events, title = 'Unified operational timeline', subtitle = 'Child, ride, vehicle, payments, SOS, gate, and SMS streams in one chronological view.' }: UnifiedTimelineProps) {
  const sortedEvents = useMemo(() => [...events].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()), [events]);

  return (
    <section className="glass-strong rounded-3xl p-6 shadow-2xl shadow-black/20">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        </div>
        <div className="text-xs text-slate-500">{sortedEvents.length} events</div>
      </div>

      <div className="mt-6 space-y-3">
        {sortedEvents.map((event) => (
          <article key={event.eventId} className="rounded-2xl border border-white/8 bg-slate-950/60 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 capitalize ${eventTypeTone[event.eventType]}`}>
                    {event.eventType.replaceAll('_', ' ')}
                  </span>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${confidenceTone[event.confidence]}`}>
                    {event.confidence}
                  </span>
                  {event.privacyMasked ? <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 ring-1 ring-white/10">masked</span> : null}
                </div>
                <div className="mt-3 text-sm font-medium text-white">{event.summary}</div>
                <div className="mt-1 text-xs text-slate-500">{new Date(event.occurredAt).toLocaleString()}</div>
                <div className="mt-2 text-xs text-slate-400">
                  {event.sourceChannel ?? 'unknown'}{event.actorRole ? ` • ${event.actorRole}` : ''}{event.childId ? ` • child ${event.childId}` : ''}{event.rideId ? ` • ride ${event.rideId}` : ''}
                </div>
              </div>
              <div className="text-right text-xs text-slate-500">
                {event.metadata?.routeLabel ? <div>{String(event.metadata.routeLabel)}</div> : null}
                {event.metadata?.note ? <div className="mt-1">{String(event.metadata.note)}</div> : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
