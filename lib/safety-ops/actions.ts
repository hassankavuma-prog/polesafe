'use server';

import { createSosInputSchema, dispatcherDashboardResponseSchema, incidentActionInputSchema, maskIncidentInputSchema, resolveIncidentInputSchema, unmaskIncidentInputSchema } from './schemas';
import type { CreateSosInput, IncidentActionInput, ResolveIncidentInput } from './types';

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; issues?: unknown };
const allowedAdminRoles = new Set(['polesafe_admin', 'school_admin', 'dispatcher', 'ops_dispatcher']);
const incidentNumber = () => `INC-${Date.now().toString(36).toUpperCase()}`;
function requireRole(userRole: string) { if (!allowedAdminRoles.has(userRole)) throw new Error('Forbidden'); }

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.API_BASE || '';

async function postJson(path: string, body: unknown) {
  if (!API_BASE) return null;
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || data?.message || 'Request failed');
  return data;
}

async function getJson(path: string) {
  if (!API_BASE) return null;
  const res = await fetch(`${API_BASE}${path}`, { cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || data?.message || 'Request failed');
  return data;
}

export async function createSosAction(input: unknown): Promise<ActionResult<{ incidentNumber: string }>> {
  const parsed = createSosInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid SOS input', issues: parsed.error.flatten() };
  const data: CreateSosInput = parsed.data;
  try {
    const response = await postJson('/api/safety/sos', data);
    if (response?.success && response?.incident?.incidentNumber) {
      return { ok: true, data: { incidentNumber: response.incident.incidentNumber } };
    }
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to create SOS' };
  }
  return { ok: true, data: { incidentNumber: incidentNumber() } };
}

export async function fetchActiveIncidentsAction(): Promise<ActionResult<unknown[]>> {
  try {
    const data = await getJson('/api/safety/sos/active');
    if (Array.isArray(data)) return { ok: true, data };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to load incidents' };
  }
  return { ok: true, data: [] };
}

export async function fetchDispatcherDashboardAction(): Promise<ActionResult<unknown>> {
  try {
    const data = await getJson('/api/safety/dispatcher/dashboard');
    if (data) return { ok: true, data: dispatcherDashboardResponseSchema.parse(data) };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to load dashboard' };
  }
  return { ok: true, data: dispatcherDashboardResponseSchema.parse({ stats: { active: 0, triaged: 0, resolved: 0 }, incidents: [], privacyMode: 'masked', allowedActions: ['acknowledge', 'assign', 'escalate', 'resolve', 'mark_false_alarm', 'unmask'] }) };
}

export async function acknowledgeIncidentAction(input: unknown): Promise<ActionResult<{ success: true }>> {
  const parsed = incidentActionInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid acknowledge payload', issues: parsed.error.flatten() };
  requireRole(parsed.data.userRole);
  try {
    const data = await postJson('/api/safety/sos/acknowledge', parsed.data);
    if (data?.success) return { ok: true, data: { success: true } };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to acknowledge incident' };
  }
  return { ok: true, data: { success: true } };
}

export async function assignIncidentAction(input: unknown): Promise<ActionResult<{ success: true }>> {
  const parsed = incidentActionInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid assign payload', issues: parsed.error.flatten() };
  requireRole(parsed.data.userRole);
  try {
    const data = await postJson(`/api/safety/incidents/${parsed.data.incidentId}/assign`, parsed.data);
    if (data?.success) return { ok: true, data: { success: true } };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to assign incident' };
  }
  return { ok: true, data: { success: true } };
}

export async function escalateIncidentAction(input: unknown): Promise<ActionResult<{ success: true }>> {
  const parsed = incidentActionInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid escalate payload', issues: parsed.error.flatten() };
  requireRole(parsed.data.userRole);
  try {
    const data = await postJson(`/api/safety/incidents/${parsed.data.incidentId}/escalate`, parsed.data);
    if (data?.success) return { ok: true, data: { success: true } };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to escalate incident' };
  }
  return { ok: true, data: { success: true } };
}

export async function resolveIncidentAction(input: unknown): Promise<ActionResult<{ success: true }>> {
  const parsed = resolveIncidentInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid resolve payload', issues: parsed.error.flatten() };
  requireRole(parsed.data.userRole);
  try {
    const data = await postJson('/api/safety/sos/resolve', parsed.data);
    if (data?.success) return { ok: true, data: { success: true } };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to resolve incident' };
  }
  return { ok: true, data: { success: true } };
}

export async function maskIncidentAction(input: unknown): Promise<ActionResult<{ success: true }>> {
  const parsed = maskIncidentInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid mask payload', issues: parsed.error.flatten() };
  requireRole(parsed.data.userRole);
  try {
    const data = await postJson(`/api/safety/incidents/${parsed.data.incidentId}/mask`, parsed.data);
    if (data?.success) return { ok: true, data: { success: true } };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to mask incident' };
  }
  return { ok: true, data: { success: true } };
}

export async function unmaskIncidentAction(input: unknown): Promise<ActionResult<{ success: true }>> {
  const parsed = unmaskIncidentInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid unmask payload', issues: parsed.error.flatten() };
  requireRole(parsed.data.userRole);
  if (!parsed.data.verified) return { ok: false, error: 'Verified dispatcher access required' };
  try {
    const data = await postJson(`/api/safety/incidents/${parsed.data.incidentId}/unmask`, parsed.data);
    if (data?.success) return { ok: true, data: { success: true } };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to unmask incident' };
  }
  return { ok: true, data: { success: true } };
}
