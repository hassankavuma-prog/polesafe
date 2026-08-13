'use client';

import React, { useMemo, useState } from 'react';
import { Ambulance, AlertTriangle, BellOff, PhoneCall, ShieldAlert, Siren, StickyNote, TrafficCone } from 'lucide-react';
import type { SafetyIncident } from '../../../lib/safety-ops/types';

const ACTIVE_INCIDENTS: SafetyIncident[] = [
  {
    _id: 'inc_ug_001',
    incidentNumber: 'PS-INC-260813-001',
    triggerType: 'driver_sos' as any,
    severity: 'critical' as any,
    status: 'active' as any,
    reporterUserId: 'drv_01',
    reporterRole: 'driver' as any,
    childId: 'child_001',
    rideId: 'ride_001',
    schoolId: 'school_ug_001',
    liveLocation: null,
    locationLabel: 'Kampala Northern Bypass',
    deviceStatus: { batteryPercent: 42, networkState: 'degraded' as any },
    contactRelay: [
      { contactType: 'dispatcher', status: 'sent' },
      { contactType: 'parent', status: 'sent' },
      { contactType: 'police', status: 'pending' },
    ] as any,
    privacyMasked: true,
    verified: false,
    auditTrail: [
      { action: 'SOS received', actorId: 'drv_01', actorRole: 'driver', note: 'Driver pressed SOS button', timestamp: new Date() },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'inc_ug_002',
    incidentNumber: 'PS-INC-260813-002',
    triggerType: 'geo_fence_exit' as any,
    severity: 'high' as any,
    status: 'triaged' as any,
    reporterUserId: 'sys_01',
    reporterRole: 'system' as any,
    rideId: 'ride_002',
    schoolId: 'school_ug_001',
    liveLocation: null,
    locationLabel: 'Wakiso corridor',
    deviceStatus: { batteryPercent: 67, networkState: 'stable' as any },
    contactRelay: [
      { contactType: 'dispatcher', status: 'acknowledged' },
      { contactType: 'driver', status: 'sent' },
    ] as any,
    privacyMasked: true,
    verified: true,
    verifiedAt: new Date(),
    auditTrail: [
      { action: 'Geofence alert raised', actorId: 'sys_01', actorRole: 'system', timestamp: new Date() },
      { action: 'Dispatcher acknowledged', actorId: 'disp_01', actorRole: 'dispatcher', timestamp: new Date() },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const contacts = [
  { label: 'Traffic unit', value: '+256 800 000 112' },
  { label: 'School dispatch', value: '+256 700 000 901' },
  { label: 'Emergency ambulance', value: '911 / local ambulance dispatch' },
  { label: 'Driver hotline', value: '+256 700 000 777' },
];

export default function DispatchSOSPage() {
  const [selectedIncidentId, setSelectedIncidentId] = useState(ACTIVE_INCIDENTS[0]?._id);
  const [muted, setMuted] = useState(false);

  const selectedIncident = useMemo(
    () => ACTIVE_INCIDENTS.find((incident) => incident._id === selectedIncidentId) ?? ACTIVE_INCIDENTS[0],
    [selectedIncidentId],
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-white/5 bg-gradient-to-b from-red-950/40 to-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-200">
                <Siren className="h-3.5 w-3.5" /> SOS triage panel
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Emergency response and incident escalation</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Active triage when a driver triggers SOS. Dispatch sees the incident, relays contacts, and tracks response notes without exposing unnecessary location detail.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="glass rounded-2xl px-4 py-3"><div className="text-xs text-slate-400">Active SOS</div><div className="mt-1 text-xl font-semibold text-red-300">{ACTIVE_INCIDENTS.filter((i) => i.status === 'active').length}</div></div>
              <div className="glass rounded-2xl px-4 py-3"><div className="text-xs text-slate-400">Triage</div><div className="mt-1 text-xl font-semibold text-amber-300">{ACTIVE_INCIDENTS.filter((i) => i.status === 'triaged').length}</div></div>
              <div className="glass rounded-2xl px-4 py-3"><div className="text-xs text-slate-400">Contacts</div><div className="mt-1 text-xl font-semibold text-white">{contacts.length}</div></div>
              <div className="glass rounded-2xl px-4 py-3"><div className="text-xs text-slate-400">Muted</div><div className="mt-1 text-xl font-semibold text-white">{muted ? 'Yes' : 'No'}</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:px-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="glass-strong rounded-3xl p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">Live SOS queue</h2>
                <p className="mt-1 text-sm text-slate-400">Select an incident to see the escalation checklist and audit trail.</p>
              </div>
              <button type="button" onClick={() => setMuted((v) => !v)} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">
                {muted ? <BellOff className="h-4 w-4 text-slate-300" /> : <Siren className="h-4 w-4 text-red-300" />}
                {muted ? 'Unmute' : 'Mute alarm'}
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              {ACTIVE_INCIDENTS.map((incident) => (
                <button
                  key={incident._id}
                  type="button"
                  onClick={() => setSelectedIncidentId(incident._id)}
                  className={`rounded-2xl border p-4 text-left transition ${selectedIncidentId === incident._id ? 'border-red-400 bg-red-500/10' : 'border-white/8 bg-white/[0.04] hover:bg-white/[0.06]'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{incident.incidentNumber}</div>
                      <div className="mt-1 text-xs text-slate-400">{incident.locationLabel} • {incident.triggerType}</div>
                    </div>
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-slate-200 ring-1 ring-white/10 capitalize">{incident.status}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">Escalation log</h2>
                <p className="mt-1 text-sm text-slate-400">Track what has been sent and acknowledged.</p>
              </div>
              <StickyNote className="h-5 w-5 text-orange-300" />
            </div>

            <div className="mt-5 space-y-3">
              {selectedIncident?.auditTrail.map((event: any, idx: number) => (
                <div key={`${event.action}-${idx}`} className="rounded-2xl border border-white/8 bg-slate-950/60 p-4">
                  <div className="text-sm font-semibold text-white">{event.action}</div>
                  <div className="mt-1 text-xs text-slate-400">{event.actorRole} • {event.timestamp.toLocaleString()}</div>
                  {event.note ? <div className="mt-2 text-sm text-slate-300">{event.note}</div> : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="glass-strong rounded-3xl p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-red-300" />
              <div>
                <h2 className="text-xl font-semibold text-white">Immediate response</h2>
                <p className="mt-1 text-sm text-slate-400">Contacts and next steps for the selected incident.</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.04] p-4">
              <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Selected incident</div>
              <div className="mt-2 text-lg font-semibold text-white">{selectedIncident?.incidentNumber}</div>
              <div className="mt-1 text-sm text-slate-400">{selectedIncident?.locationLabel}</div>
            </div>

            <div className="mt-4 grid gap-3">
              {contacts.map((contact) => (
                <div key={contact.label} className="rounded-2xl border border-white/8 bg-slate-950/60 p-4">
                  <div className="text-sm font-semibold text-white">{contact.label}</div>
                  <div className="mt-1 text-sm text-slate-300">{contact.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-3">
              <button type="button" className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white hover:bg-red-400">
                <PhoneCall className="h-4 w-4" /> Call lead
              </button>
              <button type="button" className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-400">
                <Ambulance className="h-4 w-4" /> Dispatch help
              </button>
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="flex items-center gap-3">
              <TrafficCone className="h-5 w-5 text-amber-300" />
              <div>
                <h3 className="text-lg font-semibold text-white">Traffic and scene guidance</h3>
                <p className="text-sm text-slate-400">Keep buses safe, keep families informed, keep incident handling auditable.</p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
