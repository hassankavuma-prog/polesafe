import type { Metadata } from 'next';
import { AlertTriangle, CheckCircle2, RefreshCcw, RadioTower, Smartphone, MessageSquareText, WifiOff } from 'lucide-react';
import type { SmsUssdFallbackPayload } from '../../../types/polesafe';

export const metadata: Metadata = {
  title: 'Gateway Panel — PolePay',
  description: 'SMS and USSD fallback gateway control panel for PolePay.',
};

type GatewayLog = SmsUssdFallbackPayload & {
  providerLabel: string;
  routeLabel: string;
  latencyMs: number;
};

const gatewayStats = {
  uptime: '99.4%',
  failedDeliveries: 3,
  pendingRetries: 5,
  activeZones: 12,
};

const fallbackLogs: GatewayLog[] = [
  {
    messageId: 'msg_001',
    senderPhone: '+256772123456',
    gatewayProvider: 'africas_talking',
    rawText: 'SOS child not found at pickup gate',
    interpretedAction: 'SOS',
    associatedChildId: 'child_014',
    processedAt: '2026-08-13T06:41:00Z',
    success: true,
    providerLabel: 'Africa\'s Talking SMS',
    routeLabel: 'School alert pipeline',
    latencyMs: 420,
  },
  {
    messageId: 'msg_002',
    senderPhone: '+256701999888',
    gatewayProvider: 'africas_talking',
    rawText: 'CHECKIN Amina N',
    interpretedAction: 'CHECKIN',
    associatedChildId: 'child_021',
    processedAt: '2026-08-13T06:45:00Z',
    success: true,
    providerLabel: 'Africa\'s Talking SMS',
    routeLabel: 'Attendance confirmation',
    latencyMs: 210,
  },
  {
    messageId: 'msg_003',
    senderPhone: '+256700111222',
    gatewayProvider: 'custom_ussd',
    rawText: '*123# > Confirm pickup',
    interpretedAction: 'PICKUP_CONFIRM',
    processedAt: '2026-08-13T06:48:00Z',
    success: false,
    providerLabel: 'USSD gateway',
    routeLabel: 'Retry queue',
    latencyMs: 980,
  },
  {
    messageId: 'msg_004',
    senderPhone: '+256780444555',
    gatewayProvider: 'twilio',
    rawText: 'Driver delayed by traffic',
    interpretedAction: 'UNKNOWN',
    processedAt: '2026-08-13T06:52:00Z',
    success: true,
    providerLabel: 'Fallback SMS relay',
    routeLabel: 'Ops note',
    latencyMs: 365,
  },
];

const eventColor = (action: SmsUssdFallbackPayload['interpretedAction']) => {
  switch (action) {
    case 'SOS': return 'bg-red-500/10 text-red-300 ring-red-500/20';
    case 'CHECKIN': return 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20';
    case 'PICKUP_CONFIRM': return 'bg-orange-500/10 text-orange-300 ring-orange-500/20';
    default: return 'bg-slate-500/10 text-slate-300 ring-slate-500/20';
  }
};

export default function GatewayPanelPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-orange-300">
                <RadioTower className="h-3.5 w-3.5" /> SMS / USSD gateway control
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Fallback gateway panel
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Inspect feature-phone logs, translated fallback events, delivery status, and retry activity for low-bandwidth zones.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="glass rounded-2xl px-4 py-3">
                <div className="text-xs text-slate-400">Gateway uptime</div>
                <div className="mt-1 text-xl font-semibold text-emerald-300">{gatewayStats.uptime}</div>
              </div>
              <div className="glass rounded-2xl px-4 py-3">
                <div className="text-xs text-slate-400">Failed deliveries</div>
                <div className="mt-1 text-xl font-semibold text-red-300">{gatewayStats.failedDeliveries}</div>
              </div>
              <div className="glass rounded-2xl px-4 py-3">
                <div className="text-xs text-slate-400">Manual retries</div>
                <div className="mt-1 text-xl font-semibold text-orange-300">{gatewayStats.pendingRetries}</div>
              </div>
              <div className="glass rounded-2xl px-4 py-3">
                <div className="text-xs text-slate-400">Active zones</div>
                <div className="mt-1 text-xl font-semibold text-white">{gatewayStats.activeZones}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:px-8 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="glass-strong rounded-3xl p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Incoming fallback logs</h2>
                <p className="mt-1 text-sm text-slate-400">Live SMS and USSD events mapped to system actions.</p>
              </div>
              <Smartphone className="h-5 w-5 text-orange-300" />
            </div>

            <div className="mt-6 space-y-4">
              {fallbackLogs.map((log) => (
                <article key={log.messageId} className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-white">{log.providerLabel}</span>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${eventColor(log.interpretedAction)}`}>
                          {log.interpretedAction}
                        </span>
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 ring-1 ring-white/10">
                          {log.success ? 'Delivered' : 'Needs retry'}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                        <div><span className="text-slate-500">Sender</span> — {log.senderPhone}</div>
                        <div><span className="text-slate-500">Route</span> — {log.routeLabel}</div>
                        <div><span className="text-slate-500">Raw text</span> — {log.rawText}</div>
                        <div><span className="text-slate-500">Processed</span> — {new Date(log.processedAt).toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 md:items-end">
                      <div className="rounded-2xl border border-white/8 bg-slate-950/60 px-4 py-3 text-right">
                        <div className="text-xs text-slate-500">Latency</div>
                        <div className="mt-1 text-lg font-semibold text-white">{log.latencyMs} ms</div>
                      </div>
                      <button type="button" className="inline-flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-100 ring-1 ring-white/10 transition hover:bg-white/10">
                        <RefreshCcw className="h-4 w-4 text-orange-300" /> Manual retry
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Webhook ingestion stream</h2>
                <p className="mt-1 text-sm text-slate-400">Text translations mapped to SOS, check-ins, and pickup confirmations.</p>
              </div>
              <MessageSquareText className="h-5 w-5 text-emerald-300" />
            </div>

            <div className="mt-6 space-y-4">
              {[
                'SOS child not found at pickup gate → automated critical incident',
                'CHECKIN Amina N → attendance updated successfully',
                'PICKUP_CONFIRM → USSD confirmation queued for retry',
                'Driver delayed by traffic → ops note routed to dispatcher',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-slate-950/60 p-4 text-sm text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="glass-strong rounded-3xl p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Gateway health summary</h2>
                <p className="mt-1 text-sm text-slate-400">At-a-glance status for operators monitoring low-bandwidth zones.</p>
              </div>
              <WifiOff className="h-5 w-5 text-orange-300" />
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Current status</span>
                  <span className="inline-flex rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-300 ring-1 ring-emerald-500/20">Healthy</span>
                </div>
                <div className="mt-3 text-sm text-slate-300">Fallback providers are actively receiving and translating incoming events.</div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Retry queue</div>
                <div className="mt-3 space-y-2 text-sm text-slate-300">
                  <div>• 2 SMS retries pending in Kampala East</div>
                  <div>• 1 USSD session retry pending in Wakiso</div>
                  <div>• 2 confirmation callbacks pending</div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-300" />
              <div>
                <h3 className="text-lg font-semibold text-white">Manual intervention</h3>
                <p className="mt-1 text-sm text-slate-400">Use retries when a child check-in or pickup confirmation fails over poor connectivity.</p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
