export type HamnahRole = 'parent_booking' | 'driver_compliance' | 'school_gate' | 'dispatcher_sos' | 'finance_reconciliation' | 'sms_ussd';
export type HamnahChannel = 'db' | 'sms' | 'ussd' | 'webhook' | 'mobile';
export type UgxAmount = number & { readonly __brand: 'UGX' };
export interface HamnahContext { tenantId: string; actorRole?: string; actorId?: string; schoolId?: string; parentId?: string; driverId?: string; childId?: string; tripId?: string; bookingId?: string; transactionId?: string; source: HamnahChannel; requestId?: string; timestamp?: string; metadata?: Record<string, unknown>; }
export interface HamnahStateEnvelope<T = unknown> { role: HamnahRole; tenantId: string; state: T; version: number; updatedAt: string; source: HamnahChannel; idempotencyKey?: string; }
export interface NormalizedUssdSmsEvent { tenantId?: string; from: string; transport: 'sms' | 'ussd'; text: string; parsedCommand: string; args: string[]; gateway?: string; sessionId?: string; requestId?: string; }
export interface MoneyReconciliationEvent { provider: 'mtn_momo' | 'airtel_money'; currency: 'UGX'; reference: string; amount: UgxAmount; status: 'pending' | 'successful' | 'failed' | 'reversed'; externalId?: string; raw?: Record<string, unknown>; }
export interface SecurityBoundary<TQuery = unknown> { tenantScopedQuery: TQuery; executedBy: 'repository' | 'service'; constraints: string[]; }
export interface HamnahAction<T = unknown> { route: 'parent.booking' | 'driver.compliance' | 'school.gate_checkin' | 'dispatcher.sos' | 'finance.reconcile' | 'fallback.triage'; payload: T; context: HamnahContext; }
export interface HamnahBridgePlan<T = unknown> { route: HamnahAction<T>['route']; query: Record<string, unknown>; state: T; constraints: string[]; }
const VALID_ROUTE_PREFIXES: Record<HamnahRole, string> = { parent_booking: 'parent.booking', driver_compliance: 'driver.compliance', school_gate: 'school.gate_checkin', dispatcher_sos: 'dispatcher.sos', finance_reconciliation: 'finance.reconcile', sms_ussd: 'fallback.triage' };
export function normalizeUgx(amount: number): UgxAmount { if (!Number.isFinite(amount) || amount < 0) throw new Error('Invalid UGX amount'); if (!Number.isInteger(amount)) throw new Error('UGX amounts must be whole numbers'); return amount as UgxAmount; }
export function buildSecurityBoundary<TQuery>(tenantScopedQuery: TQuery, constraints: string[]): SecurityBoundary<TQuery> { return { tenantScopedQuery, executedBy: 'repository', constraints }; }
export function routeAction<T>(action: HamnahAction<T>): string { const prefix = VALID_ROUTE_PREFIXES[action.context.actorRole as HamnahRole] || action.route; return `${prefix}:${action.context.tenantId}`; }
export function syncEnvelope<T>(envelope: HamnahStateEnvelope<T>): HamnahStateEnvelope<T> { return { ...envelope, updatedAt: envelope.updatedAt || new Date().toISOString(), version: Math.max(1, envelope.version || 1) }; }
export function parseFallbackTransport(input: string, source: 'sms' | 'ussd', meta: Partial<NormalizedUssdSmsEvent> = {}): NormalizedUssdSmsEvent { const cleaned = input.trim(); const [command = '', ...args] = cleaned.split(/\s+/); return { from: meta.from || '', transport: source, text: cleaned, parsedCommand: command.toUpperCase(), args, tenantId: meta.tenantId, gateway: meta.gateway, sessionId: meta.sessionId, requestId: meta.requestId }; }
export function reconcileMobileMoney(input: MoneyReconciliationEvent) { if (input.currency !== 'UGX') throw new Error('Only UGX reconciliation is allowed'); const amount = normalizeUgx(Number(input.amount)); return { provider: input.provider, currency: 'UGX' as const, reference: input.reference, amount, status: input.status, externalId: input.externalId, reconciledAt: new Date().toISOString() }; }
export function hamnahTriage(input: NormalizedUssdSmsEvent) { const routeMap: Record<string, HamnahRole> = { BOOK: 'parent_booking', CANCEL: 'parent_booking', WHERE: 'parent_booking', SICK: 'parent_booking', HELP: 'dispatcher_sos', SOS: 'dispatcher_sos', ARRIVED: 'school_gate', DROPPED: 'school_gate', PICKED: 'school_gate', COMPLY: 'driver_compliance', PAY: 'finance_reconciliation', MTN: 'finance_reconciliation', AIRTEL: 'finance_reconciliation' }; const role = routeMap[input.parsedCommand] || 'sms_ussd'; return { role, route: VALID_ROUTE_PREFIXES[role], state: { command: input.parsedCommand, args: input.args, transport: input.transport, from: input.from, sessionId: input.sessionId, gateway: input.gateway, requestId: input.requestId } }; }
export function buildHamnahBridgePlan<T>(action: HamnahAction<T>, query: Record<string, unknown>, constraints: string[]): HamnahBridgePlan<T> { return { route: action.route, query, state: action.payload, constraints }; }

export function createTenantScopedQuery(base: Record<string, unknown>, tenantId: string) { return { ...base, tenantId }; }

export function createTenantScopedAdapter<TQuery extends Record<string, unknown>>(base: TQuery, tenantId: string, constraints: string[] = []) {
  return buildSecurityBoundary(createTenantScopedQuery(base, tenantId), constraints.length ? constraints : ['tenant-scoped', 'repository-execution']);
}

export function validateTenantScopedQuery<TSchema>(schema: { parse: (input: unknown) => TSchema }, input: unknown, tenantId: string, constraints: string[] = []) {
  const parsed = schema.parse(input) as Record<string, unknown>;
  return createTenantScopedAdapter(parsed, tenantId, constraints);
}
