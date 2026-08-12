'use server';

import { createSosInputSchema, dispatcherDashboardResponseSchema, incidentActionInputSchema, maskIncidentInputSchema, resolveIncidentInputSchema } from './schemas';
import type { CreateSosInput, IncidentActionInput, ResolveIncidentInput } from './types';

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; issues?: unknown };
const allowedAdminRoles = new Set(['polesafe_admin', 'school_admin']);
const incidentNumber = () => `INC-${Date.now().toString(36).toUpperCase()}`;
function requireRole(userRole: string) { if (!allowedAdminRoles.has(userRole)) throw new Error('Forbidden'); }

export async function createSosAction(input: unknown): Promise<ActionResult<{ incidentNumber: string }>> {
  const parsed = createSosInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid SOS input', issues: parsed.error.flatten() };
  const _data: CreateSosInput = parsed.data;
  return { ok: true, data: { incidentNumber: incidentNumber() } };
}

export async function fetchActiveIncidentsAction(): Promise<ActionResult<unknown[]>> {
  return { ok: true, data: [] };
}

export async function fetchDispatcherDashboardAction(): Promise<ActionResult<unknown>> {
  return { ok: true, data: dispatcherDashboardResponseSchema.parse({ stats: { active: 0, triaged: 0, resolved: 0 }, incidents: [], privacyMode: 'masked', allowedActions: ['acknowledge', 'assign', 'escalate', 'resolve', 'mark_false_alarm'] }) };
}

export async function acknowledgeIncidentAction(input: unknown): Promise<ActionResult<{ success: true }>> {
  const parsed = incidentActionInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid acknowledge payload', issues: parsed.error.flatten() };
  requireRole(parsed.data.userRole);
  const _data: IncidentActionInput = parsed.data;
  return { ok: true, data: { success: true } };
}

export async function assignIncidentAction(input: unknown): Promise<ActionResult<{ success: true }>> {
  const parsed = incidentActionInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid assign payload', issues: parsed.error.flatten() };
  requireRole(parsed.data.userRole);
  const _data: IncidentActionInput = parsed.data;
  return { ok: true, data: { success: true } };
}

export async function escalateIncidentAction(input: unknown): Promise<ActionResult<{ success: true }>> {
  const parsed = incidentActionInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid escalate payload', issues: parsed.error.flatten() };
  requireRole(parsed.data.userRole);
  const _data: IncidentActionInput = parsed.data;
  return { ok: true, data: { success: true } };
}

export async function resolveIncidentAction(input: unknown): Promise<ActionResult<{ success: true }>> {
  const parsed = resolveIncidentInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid resolve payload', issues: parsed.error.flatten() };
  requireRole(parsed.data.userRole);
  const _data: ResolveIncidentInput = parsed.data;
  return { ok: true, data: { success: true } };
}

export async function maskIncidentAction(input: unknown): Promise<ActionResult<{ success: true }>> {
  const parsed = maskIncidentInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid mask payload', issues: parsed.error.flatten() };
  requireRole(parsed.data.userRole);
  return { ok: true, data: { success: true } };
}
