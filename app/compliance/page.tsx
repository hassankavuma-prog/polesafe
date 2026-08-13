'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, FileText, Filter, Search, ShieldCheck, XCircle } from 'lucide-react';
import type { ComplianceStatus, DriverComplianceVault } from '../../types/polesafe';

const INITIAL_COMPLIANCE_RECORDS: DriverComplianceVault[] = [
  {
    driverId: 'DRV-UG-2026-01',
    nationalIdNumber: 'CM9801210284XY',
    nationalIdDocumentUrl: '/docs/nin_01.pdf',
    driversLicenseUrl: '/docs/license_01.pdf',
    policeCheckCertificateUrl: '/docs/police_01.pdf',
    vehicleInspectionUrl: '/docs/inspection_01.pdf',
    status: 'pending',
  },
  {
    driverId: 'DRV-UG-2026-02',
    nationalIdNumber: 'CF7704129382AB',
    nationalIdDocumentUrl: '/docs/nin_02.pdf',
    driversLicenseUrl: '/docs/license_02.pdf',
    policeCheckCertificateUrl: '/docs/police_02.pdf',
    vehicleInspectionUrl: '/docs/inspection_02.pdf',
    status: 'verified',
    verifiedAt: '2026-02-15T09:00:00Z',
    verifiedBy: 'Ops Lead Kampala',
  },
  {
    driverId: 'DRV-UG-2026-03',
    nationalIdNumber: 'CM6610293847ZZ',
    nationalIdDocumentUrl: '/docs/nin_03.pdf',
    driversLicenseUrl: '/docs/license_03.pdf',
    policeCheckCertificateUrl: '/docs/police_03.pdf',
    vehicleInspectionUrl: '/docs/inspection_03.pdf',
    status: 'rejected',
    verifiedAt: '2026-02-20T14:30:00Z',
    verifiedBy: 'Safety Compliance Admin',
  },
];

const tone: Record<ComplianceStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-300 ring-amber-500/20',
  verified: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-300 ring-red-500/20',
  expired: 'bg-slate-500/10 text-slate-300 ring-slate-500/20',
};

export default function ComplianceVaultPage() {
  const [records, setRecords] = useState<DriverComplianceVault[]>(INITIAL_COMPLIANCE_RECORDS);
  const [statusFilter, setStatusFilter] = useState<'all' | ComplianceStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecords = useMemo(() => records.filter((rec) => {
    const matchesStatus = statusFilter === 'all' ? true : rec.status === statusFilter;
    const q = searchQuery.toLowerCase();
    return rec.driverId.toLowerCase().includes(q) || rec.nationalIdNumber.toLowerCase().includes(q) && matchesStatus;
  }), [records, searchQuery, statusFilter]);

  const handleUpdateStatus = (driverId: string, newStatus: ComplianceStatus) => {
    setRecords((prev) => prev.map((rec) => (rec.driverId === driverId ? {
      ...rec,
      status: newStatus,
      verifiedAt: newStatus !== 'pending' ? new Date().toISOString() : undefined,
      verifiedBy: newStatus !== 'pending' ? 'Dispatcher / Admin' : undefined,
    } : rec)));
  };

  const summary = useMemo(() => ({
    verified: records.filter((r) => r.status === 'verified').length,
    pending: records.filter((r) => r.status === 'pending').length,
    rejected: records.filter((r) => r.status === 'rejected').length,
  }), [records]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-purple-300"><ShieldCheck className="h-3.5 w-3.5" /> Driver compliance vault</div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Driver verification & compliance vault</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Audit national ID scans, driver licenses, police background checks, and vehicle inspection certificates.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="glass rounded-2xl px-4 py-3"><div className="text-xs text-slate-400">Verified</div><div className="mt-1 text-xl font-semibold text-emerald-300">{summary.verified}</div></div>
              <div className="glass rounded-2xl px-4 py-3"><div className="text-xs text-slate-400">Pending</div><div className="mt-1 text-xl font-semibold text-amber-300">{summary.pending}</div></div>
              <div className="glass rounded-2xl px-4 py-3"><div className="text-xs text-slate-400">Rejected</div><div className="mt-1 text-xl font-semibold text-red-300">{summary.rejected}</div></div>
              <div className="glass rounded-2xl px-4 py-3"><div className="text-xs text-slate-400">Security</div><div className="mt-1 text-xl font-semibold text-white">Strict vault</div></div>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="glass-strong rounded-3xl p-6 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-4 border-b border-white/5 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Compliance records</h2>
              <p className="mt-1 text-sm text-slate-400">Search driver IDs and NINs, then approve or reject from the vault.</p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2"><Search className="h-4 w-4 text-slate-500" /><input type="text" placeholder="Search Driver ID or NIN..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-transparent text-sm text-slate-200 outline-none" /></div>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300"><Filter className="h-4 w-4 text-purple-300" /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="bg-transparent outline-none"><option value="all">All Vault Records</option><option value="pending">Pending Audit</option><option value="verified">Verified & Approved</option><option value="rejected">Rejected</option><option value="expired">Expired</option></select></div>
            </div>
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/8">
            <table className="min-w-full divide-y divide-white/8 text-left text-sm">
              <thead className="bg-white/[0.04] text-slate-400"><tr><th className="px-4 py-3 font-medium">Driver ID</th><th className="px-4 py-3 font-medium">National ID (NIN)</th><th className="px-4 py-3 font-medium">Required Documents</th><th className="px-4 py-3 font-medium">Vault Status</th><th className="px-4 py-3 font-medium">Audit Metadata</th><th className="px-4 py-3 font-medium text-right">Compliance Actions</th></tr></thead>
              <tbody className="divide-y divide-white/8 bg-slate-950/50">
                {filteredRecords.length === 0 ? <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No compliance records matching filter criteria.</td></tr> : filteredRecords.map((rec) => (
                  <tr key={rec.driverId} className="text-slate-300">
                    <td className="px-4 py-4 font-medium text-white">{rec.driverId}</td>
                    <td className="px-4 py-4 text-slate-300">{rec.nationalIdNumber}</td>
                    <td className="px-4 py-4"><div className="flex items-center gap-2 text-slate-400"><FileText className="h-4 w-4 text-purple-400" /><span>NIN, License, Police, Inspection</span></div></td>
                    <td className="px-4 py-4"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ring-1 ${tone[rec.status]}`}>{rec.status === 'verified' && <CheckCircle2 className="h-3 w-3" />}{rec.status === 'pending' && <Clock className="h-3 w-3" />}{rec.status === 'rejected' && <XCircle className="h-3 w-3" />}{rec.status === 'expired' && <AlertTriangle className="h-3 w-3" />}{rec.status}</span></td>
                    <td className="px-4 py-4 text-slate-500">{rec.verifiedAt ? <><p className="text-slate-300">{rec.verifiedBy}</p><p>{new Date(rec.verifiedAt).toLocaleDateString()}</p></> : <span>Awaiting Review</span>}</td>
                    <td className="px-4 py-4 text-right space-x-2">{rec.status !== 'verified' && <button type="button" onClick={() => handleUpdateStatus(rec.driverId, 'verified')} className="rounded bg-emerald-700 px-2.5 py-1 font-bold text-white transition hover:bg-emerald-600">Approve</button>}{rec.status !== 'rejected' && <button type="button" onClick={() => handleUpdateStatus(rec.driverId, 'rejected')} className="rounded bg-red-800 px-2.5 py-1 font-bold text-white transition hover:bg-red-700">Reject</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="glass rounded-2xl p-4 text-sm text-slate-300"><div className="flex items-center gap-2 text-white"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> Approved vehicles</div><div className="mt-2 text-slate-400">Only verified drivers should remain available for route assignment.</div></div>
          <div className="glass rounded-2xl p-4 text-sm text-slate-300"><div className="flex items-center gap-2 text-white"><Clock className="h-4 w-4 text-amber-300" /> Pending audits</div><div className="mt-2 text-slate-400">Keep unverified records from active school transport routes.</div></div>
          <div className="glass rounded-2xl p-4 text-sm text-slate-300"><div className="flex items-center gap-2 text-white"><AlertTriangle className="h-4 w-4 text-red-300" /> Rejected compliance</div><div className="mt-2 text-slate-400">Flag incomplete or invalid records until re-submitted by operators.</div></div>
        </div>
      </section>
    </main>
  );
}
