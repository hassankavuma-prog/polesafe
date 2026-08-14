'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, DollarSign, Filter, RefreshCw } from 'lucide-react';
import { apiUrl } from '../../lib/api-base';
import type { TransportLedgerTransaction } from '../../types/polesafe';

export type LedgerPanelProps = {
  initialTransactions?: TransportLedgerTransaction[];
  activeTermLabel?: string;
  regionLabel?: string;
};

const statusTone: Record<TransportLedgerTransaction['status'], string> = {
  success: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-300 ring-amber-500/20',
  failed: 'bg-red-500/10 text-red-300 ring-red-500/20',
};

export function LedgerPanel({ initialTransactions = [], activeTermLabel = 'Term 1 2026', regionLabel = 'Kampala Region' }: LedgerPanelProps) {
  const [transactions, setTransactions] = useState<TransportLedgerTransaction[]>(initialTransactions);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<'seed' | 'live'>('seed');
  const [statusFilter, setStatusFilter] = useState<'all' | TransportLedgerTransaction['status']>('all');

  const filteredTransactions = useMemo(
    () => transactions.filter((txn) => (statusFilter === 'all' ? true : txn.status === statusFilter)),
    [transactions, statusFilter],
  );

  useEffect(() => {
    const loadLedger = async () => {
      try {
        setLoading(true);
        const response = await fetch(apiUrl('/api/payments/ledger'), { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        const liveTransactions = Array.isArray(data?.transactions) ? data.transactions.map((txn: any) => ({
          transactionId: txn.reference || txn.txRef || txn._id || `LEDGER-${Math.random().toString(36).slice(2, 8)}`,
          organizationId: txn.organizationId || 'ORG-KAMPALA-01',
          parentId: txn.parentId || txn.userId || 'UNKNOWN',
          amountUgx: Number(txn.amount || txn.amountUgx || 0),
          paymentMethod: txn.method || txn.paymentMethod || txn.provider || 'unknown',
          status: txn.status === 'completed' ? 'success' : txn.status === 'failed' ? 'failed' : 'pending',
          termReference: txn.termReference || 'Live ledger',
          createdAt: txn.createdAt || new Date().toISOString(),
          confidence: txn.status === 'completed' ? 'confirmed' : txn.status === 'failed' ? 'offline-received' : 'delayed',
          confidenceNote: txn.reference ? `Ledger ref ${txn.reference}` : 'Live ledger entry',
          confidenceSource: 'api',
          paymentMatchStatus: txn.status || 'pending',
          paymentProvider: txn.provider || txn.paymentMethod || 'unknown',
        })) : [];
        if (liveTransactions.length > 0) {
          setTransactions(liveTransactions);
          setSource('live');
        }
      } catch {
        setSource('seed');
      } finally {
        setLoading(false);
      }
    };
    void loadLedger();
  }, []);

  const summary = useMemo(() => {
    const totalCollectedUgx = transactions.filter((t) => t.status === 'success').reduce((acc, curr) => acc + curr.amountUgx, 0);
    const pendingParentCredits = transactions.filter((t) => t.status !== 'success').reduce((acc, curr) => acc + curr.amountUgx, 0);
    const retryableFailed = transactions.filter((t) => t.status === 'failed').length;
    return { totalCollectedUgx, pendingParentCredits, retryableFailed };
  }, [transactions]);

  const handleRetryTransaction = (txnId: string) => {
    setTransactions((prev) => prev.map((t) => (t.transactionId === txnId ? { ...t, status: 'pending' } : t)));
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-orange-300">
                <DollarSign className="h-3.5 w-3.5" /> Financial operations
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Financial ledger & mobile money reconciliation
              </h1>
              <p className="mt-2 text-xs text-slate-500">Source: {source === 'live' ? 'Live API ledger' : 'Seed preview'}{loading ? ' • syncing…' : ''}</p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Track term-based transport payments, Mobile Money rails, and reconciliation status across Uganda school routes.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="glass rounded-2xl px-4 py-3"><div className="text-xs text-slate-400">Collected UGX</div><div className="mt-1 text-xl font-semibold text-emerald-300">{summary.totalCollectedUgx.toLocaleString()}</div></div>
              <div className="glass rounded-2xl px-4 py-3"><div className="text-xs text-slate-400">Pending credits</div><div className="mt-1 text-xl font-semibold text-amber-300">{summary.pendingParentCredits.toLocaleString()}</div></div>
              <div className="glass rounded-2xl px-4 py-3"><div className="text-xs text-slate-400">Retry queue</div><div className="mt-1 text-xl font-semibold text-red-300">{summary.retryableFailed}</div></div>
              <div className="glass rounded-2xl px-4 py-3"><div className="text-xs text-slate-400">Currency</div><div className="mt-1 text-xl font-semibold text-white">UGX</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="glass-strong rounded-3xl p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.25em] text-slate-500">
              <span>Successfully reconciled</span><CheckCircle2 className="h-4 w-4 text-emerald-300" />
            </div>
            <div className="mt-3 text-3xl font-semibold text-white">{summary.totalCollectedUgx.toLocaleString()} UGX</div>
          </div>
          <div className="glass-strong rounded-3xl p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.25em] text-slate-500">
              <span>Pending parent credits</span><Clock className="h-4 w-4 text-amber-300" />
            </div>
            <div className="mt-3 text-3xl font-semibold text-white">{summary.pendingParentCredits.toLocaleString()} UGX</div>
          </div>
          <div className="glass-strong rounded-3xl p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.25em] text-slate-500">
              <span>Automated retries</span><RefreshCw className="h-4 w-4 text-orange-300" />
            </div>
            <div className="mt-3 text-3xl font-semibold text-white">{summary.retryableFailed}</div>
          </div>
        </div>

        <div className="glass-strong rounded-3xl p-6 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-4 border-b border-white/5 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Transaction reconciliation table</h2>
              <p className="mt-1 text-sm text-slate-400">Term-based transport payments from Flutterwave and Airtel Money rails.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                <Filter className="h-4 w-4 text-orange-300" /> Filter status
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-orange-400">
                <option value="all">All</option><option value="success">Success</option><option value="pending">Pending</option><option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/8">
            <table className="min-w-full divide-y divide-white/8 text-left text-sm">
              <thead className="bg-white/[0.04] text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Transaction ID</th>
                  <th className="px-4 py-3 font-medium">Parent / Account</th>
                  <th className="px-4 py-3 font-medium">Amount (UGX)</th>
                  <th className="px-4 py-3 font-medium">Rail</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8 bg-slate-950/50">
                {filteredTransactions.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No ledger entries matching filter.</td></tr>
                ) : filteredTransactions.map((txn) => (
                  <tr key={txn.transactionId} className="text-slate-300">
                    <td className="px-4 py-4 font-medium text-white">{txn.transactionId}</td>
                    <td className="px-4 py-4 text-slate-400">{txn.parentId}</td>
                    <td className="px-4 py-4 font-medium text-white">{txn.amountUgx.toLocaleString()} UGX</td>
                    <td className="px-4 py-4 uppercase text-slate-300">{txn.paymentMethod.replace('_', ' ')}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 capitalize ${statusTone[txn.status]}`}>
                        {txn.status === 'success' && <CheckCircle2 className="h-3 w-3" />}
                        {txn.status === 'pending' && <Clock className="h-3 w-3" />}
                        {txn.status === 'failed' && <AlertCircle className="h-3 w-3" />}
                        {txn.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-400">{new Date(txn.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-4 text-right">
                      {txn.status === 'failed' ? (
                        <button type="button" onClick={() => handleRetryTransaction(txn.transactionId)} className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-100 transition hover:bg-white/10">
                          <RefreshCw className="h-3.5 w-3.5 text-orange-300" /> Retry MoMo
                        </button>
                      ) : <span className="text-xs text-slate-500">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="glass rounded-2xl p-4 text-sm text-slate-300"><div className="flex items-center gap-2 text-white"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> Flutterwave rails</div><div className="mt-2 text-slate-400">Use for mobile money and card-backed top-ups tied to school transport terms.</div></div>
          <div className="glass rounded-2xl p-4 text-sm text-slate-300"><div className="flex items-center gap-2 text-white"><Clock className="h-4 w-4 text-amber-300" /> Airtel Money pending</div><div className="mt-2 text-slate-400">Monitor unsettled parent credits and reconcile after payment callbacks land.</div></div>
          <div className="glass rounded-2xl p-4 text-sm text-slate-300"><div className="flex items-center gap-2 text-white"><AlertCircle className="h-4 w-4 text-red-300" /> Failed retries</div><div className="mt-2 text-slate-400">Failed rails can be auto-queued for manual retry and follow-up confirmation.</div></div>
        </div>
      </section>
    </main>
  );
}
