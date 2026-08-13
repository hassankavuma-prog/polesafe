import type { Metadata } from 'next';
import { AlertTriangle, BadgeCheck, CalendarClock, Clock3, CreditCard, ShieldCheck, Siren, TrendingUp, MapPinned } from 'lucide-react';
import type { ComplianceAttentionEvent } from '../../lib/safety-ops/types';
import { detectAiGeneratedDocumentRisk } from '../../lib/safety-ops/compliance';
import { detectPaymentReconciliationIssue } from '../../lib/safety-ops/reconciliation';
import { detectRecurringIncidentPattern, buildRecurringIncidentAlert } from '../../lib/safety-ops/recurrence';

export const metadata: Metadata = {
  title: 'Ops Intelligence — PoleSafe',
  description: 'Platform ops automation, trust intelligence, compliance alerts, and payment reconciliation exceptions for PoleSafe school and community rides.',
};

type OpsComplianceRow = {
  label: string;
  value: string;
  tone: string;
};

const complianceRows: OpsComplianceRow[] = [
  { label: 'Compliant drivers', value: '42', tone: 'text-emerald-300' },
  { label: 'Pending renewals', value: '7', tone: 'text-amber-300' },
  { label: 'Expired trust records', value: '2', tone: 'text-red-300' },
  { label: 'Active incidents', value: '5', tone: 'text-orange-300' },
  { label: 'Recurring hotspots', value: '3', tone: 'text-sky-300' },
  { label: 'Payment exceptions', value: '4', tone: 'text-violet-300' },
];

const sampleAttention: ComplianceAttentionEvent[] = [
  {
    id: 'cmp_doc_001',
    targetType: 'driver',
    targetId: 'drv_02',
    reason: 'Possible AI-generated or synthetic document markers detected',
    severity: 'high',
    maskedSummary: 'driver:drv_02: document needs review • attention required',
    attentionRequired: true,
    aiGeneratedRisk: true,
    aiGeneratedRiskScore: 0.82,
    createdAt: '2026-08-13T11:10:00Z',
    createdBy: 'hamna',
  },
  {
    id: 'cmp_doc_002',
    targetType: 'vehicle',
    targetId: 'veh_11',
    reason: 'LC1 letter expiry approaching',
    severity: 'medium',
    maskedSummary: 'vehicle:veh_11: document needs review • attention required',
    attentionRequired: true,
    aiGeneratedRisk: false,
    aiGeneratedRiskScore: 0,
    createdAt: '2026-08-13T11:25:00Z',
    createdBy: 'hamna',
  },
];

const paymentIssues = [
  detectPaymentReconciliationIssue({ transactionId: 'TXN-UG-98215', organizationId: 'ORG-KAMPALA-01', paymentRail: 'airtel_money', paymentStatus: 'pending', paymentMatchStatus: 'pending', callbackDelayMinutes: 48, termReference: 'Term 1 2026' }),
  detectPaymentReconciliationIssue({ transactionId: 'TXN-UG-98216', organizationId: 'ORG-KAMPALA-01', paymentRail: 'mtn_momo', paymentStatus: 'failed', paymentMatchStatus: 'failed', callbackDelayMinutes: 0, termReference: 'Term 1 2026' }),
  detectPaymentReconciliationIssue({ transactionId: 'TXN-UG-98217', organizationId: 'ORG-KAMPALA-01', paymentRail: 'card', paymentStatus: 'success', paymentMatchStatus: 'pending', callbackDelayMinutes: 52, termReference: 'Term 1 2026' }),
];


const recurringPattern = detectRecurringIncidentPattern({
  kind: 'route_deviation',
  routeName: 'Kampala Northern Bypass',
  vehicleKind: 'boda_boda',
  driverId: 'drv_02',
  schoolId: 'school_ug_001',
  threshold: 3,
  windowDays: 30,
  occurrences: [
    { occurredAt: '2026-08-03T08:20:00Z', severity: 'high' },
    { occurredAt: '2026-08-08T08:25:00Z', severity: 'high' },
    { occurredAt: '2026-08-13T08:30:00Z', severity: 'critical' },
  ],
});
const recurringAlert = buildRecurringIncidentAlert(recurringPattern);
const aiRiskPreview = detectAiGeneratedDocumentRisk({
  status: 'pending',
  attentionRequired: false,
  aiGeneratedRisk: false,
  trustDocuments: [
    { type: 'nin', reference: 'NIN-UG-091223', status: 'pending', aiGenerated: false, aiConfidence: 0.12, attentionRequired: false },
    { type: 'proof_of_ownership', reference: 'OWN-UG-7741', status: 'pending', aiGenerated: true, aiConfidence: 0.88, attentionRequired: true, attentionReason: 'Image structure inconsistent' },
  ],
});

export default function OpsIntelligencePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-orange-300">
                <ShieldCheck className="h-3.5 w-3.5" /> Ops intelligence
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Platform ops automation and compliance intelligence for school and community rides</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Hamna watches trust documents, flags suspicious submissions, and surfaces payment and incident exceptions for the dispatch and compliance team.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="glass rounded-2xl px-4 py-3"><div className="text-xs text-slate-400">Hamna alerts</div><div className="mt-1 text-xl font-semibold text-orange-300">12</div></div>
              <div className="glass rounded-2xl px-4 py-3"><div className="text-xs text-slate-400">Exceptions</div><div className="mt-1 text-xl font-semibold text-violet-300">4</div></div>
              <div className="glass rounded-2xl px-4 py-3"><div className="text-xs text-slate-400">AI risk</div><div className="mt-1 text-xl font-semibold text-red-300">{aiRiskPreview.attentionRequired ? 'High' : 'Low'}</div></div>
              <div className="glass rounded-2xl px-4 py-3"><div className="text-xs text-slate-400">Recurring hotspots</div><div className="mt-1 text-xl font-semibold text-sky-300">{recurringPattern.count}</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:px-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="glass-strong rounded-3xl p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Fleet trust dashboard</h2>
                <p className="mt-1 text-sm text-slate-400">Compact operational view for Uganda fleet trust and compliance.</p>
              </div>
              <TrendingUp className="h-5 w-5 text-emerald-300" />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {complianceRows.map((row) => (
                <div key={row.label} className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                  <div className="text-xs text-slate-400">{row.label}</div>
                  <div className={`mt-1 text-2xl font-semibold ${row.tone}`}>{row.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-strong rounded-3xl p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Hamna attention queue</h2>
                <p className="mt-1 text-sm text-slate-400">Documents needing manual review or alerting.</p>
              </div>
              <Siren className="h-5 w-5 text-red-300" />
            </div>
            <div className="mt-6 space-y-3">
              {sampleAttention.map((item) => (
                <article key={item.id} className="rounded-2xl border border-white/8 bg-slate-950/60 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-white">{item.id}</div>
                      <div className="mt-1 text-xs text-slate-400">{item.reason}</div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] ring-1 ${item.severity === 'high' ? 'bg-orange-500/10 text-orange-300 ring-orange-500/20' : 'bg-amber-500/10 text-amber-300 ring-amber-500/20'}`}>{item.attentionRequired ? 'Attention' : 'OK'}</span>
                  </div>
                  <div className="mt-3 text-xs text-slate-500">Masked: {item.maskedSummary}</div>
                  <div className="mt-2 text-xs text-slate-500">AI risk: {item.aiGeneratedRisk ? `yes (${Math.round((item.aiGeneratedRiskScore ?? 0) * 100)}%)` : 'no'}</div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="glass-strong rounded-3xl p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-violet-300" />
              <div>
                <h2 className="text-xl font-semibold text-white">Payment reconciliation exceptions</h2>
                <p className="mt-1 text-sm text-slate-400">Delayed callbacks and failed payments need follow-up.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {paymentIssues.map((issue) => (
                <div key={issue.issueId} className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">{issue.paymentRail.toUpperCase()} • {issue.transactionId}</div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] ring-1 ${issue.status === 'failed' ? 'bg-red-500/10 text-red-300 ring-red-500/20' : 'bg-amber-500/10 text-amber-300 ring-amber-500/20'}`}>{issue.status}</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">{issue.maskedSummary}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="flex items-center gap-3">
              <MapPinned className="h-5 w-5 text-sky-300" />
              <div>
                <h3 className="text-lg font-semibold text-white">Recurring incident detection</h3>
                <p className="text-sm text-slate-400">Repeat route or driver patterns that need intervention.</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/60 p-4">
              <div className="text-sm font-semibold text-white">{recurringPattern.routeName}</div>
              <div className="mt-1 text-xs text-slate-400">{recurringPattern.maskedSummary}</div>
              <div className="mt-2 text-xs text-slate-500">Alert: {recurringAlert.reason}</div>
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="flex items-center gap-3">
              <CalendarClock className="h-5 w-5 text-emerald-300" />
              <div>
                <h3 className="text-lg font-semibold text-white">SLA and audit posture</h3>
                <p className="text-sm text-slate-400">Track response time, contact time, and closure time for every incident.</p>
              </div>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/8 bg-slate-950/60 p-4"><Clock3 className="mb-2 h-4 w-4 text-emerald-300" /> SOS acknowledgement measured in audit trail</div>
              <div className="rounded-2xl border border-white/8 bg-slate-950/60 p-4"><BadgeCheck className="mb-2 h-4 w-4 text-orange-300" /> Hamna alerts routed to dispatch and compliance</div>
              <div className="rounded-2xl border border-white/8 bg-slate-950/60 p-4"><AlertTriangle className="mb-2 h-4 w-4 text-red-300" /> Suspicious documents remain masked until reviewed</div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
