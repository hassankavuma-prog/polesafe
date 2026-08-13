export type HamnahRole = 'parent_booking' | 'driver_compliance' | 'school_gate' | 'dispatcher_sos' | 'finance_reconciliation' | 'sms_ussd';
export type HamnahChannel = 'db' | 'sms' | 'ussd' | 'webhook' | 'mobile';
export type UgxAmount = number & { readonly __brand: 'UGX' };
export type UgandaVehicleClass = 'car' | 'boda_boda';
export type UgandaBookingCadence = 'single' | 'recurring' | 'termly';
export type UgandaMobileMoneyProvider = 'mtn_momo' | 'airtel_money';
export type UgandaTrustDocType = 'nin' | 'driving_permit' | 'riding_permit' | 'proof_of_ownership' | 'motorcycle_plate' | 'lc1_letter' | 'stage_chairman_letter';

export interface UgandaTrustVerification {
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  checkedAt?: string;
  checkedBy?: string;
  note?: string;
  documents?: Array<{ type: UgandaTrustDocType; reference?: string; url?: string; status?: 'pending' | 'verified' | 'rejected' | 'expired'; aiGenerated?: boolean; aiConfidence?: number; attentionRequired?: boolean; attentionReason?: string }>;
}

export interface UgandaBookingInput {
  tenantId: string;
  parentId: string;
  childId?: string;
  vehicleClass: UgandaVehicleClass;
  cadence: UgandaBookingCadence;
  paymentProvider: UgandaMobileMoneyProvider;
  pickupLocation: string;
  dropoffLocation: string;
  schoolTermReference?: string;
  recurringDays?: string[];
  vehicleTrust?: UgandaTrustVerification;
  driverTrust?: UgandaTrustVerification;
}

export interface HamnahContext { tenantId: string; actorRole?: string; actorId?: string; schoolId?: string; parentId?: string; driverId?: string; childId?: string; tripId?: string; bookingId?: string; transactionId?: string; source: HamnahChannel; requestId?: string; timestamp?: string; metadata?: Record<string, unknown>; }
export interface HamnahStateEnvelope<T = unknown> { role: HamnahRole; tenantId: string; state: T; version: number; updatedAt: string; source: HamnahChannel; idempotencyKey?: string; }
export interface NormalizedUssdSmsEvent { tenantId?: string; from: string; transport: 'sms' | 'ussd'; text: string; parsedCommand: string; args: string[]; gateway?: string; sessionId?: string; requestId?: string; }
export interface MoneyReconciliationEvent { provider: 'mtn_momo' | 'airtel_money'; currency: 'UGX'; reference: string; amount: UgxAmount; status: 'pending' | 'successful' | 'failed' | 'reversed'; externalId?: string; raw?: Record<string, unknown>; }
export interface SecurityBoundary<TQuery = unknown> { tenantScopedQuery: TQuery; executedBy: 'repository' | 'service'; constraints: string[]; }
export interface HamnahAction<T = unknown> { route: 'parent.booking' | 'driver.compliance' | 'school.gate_checkin' | 'dispatcher.sos' | 'finance.reconcile' | 'fallback.triage'; payload: T; context: HamnahContext; }
export interface HamnahBridgePlan<T = unknown> { route: HamnahAction<T>['route']; query: Record<string, unknown>; state: T; constraints: string[]; }

export type IncidentLifecycle = 'active' | 'acknowledged' | 'investigating' | 'driver_contacted' | 'parent_contacted' | 'school_contacted' | 'police_contacted' | 'resolved' | 'false_alarm';
export type JourneyRiskBand = 'green' | 'amber' | 'red' | 'critical';

const VALID_ROUTE_PREFIXES: Record<HamnahRole, string> = { parent_booking: 'parent.booking', driver_compliance: 'driver.compliance', school_gate: 'school.gate_checkin', dispatcher_sos: 'dispatcher.sos', finance_reconciliation: 'finance.reconcile', sms_ussd: 'fallback.triage' };

export function normalizeUgx(amount: number): UgxAmount { if (!Number.isFinite(amount) || amount < 0) throw new Error('Invalid UGX amount'); if (!Number.isInteger(amount)) throw new Error('UGX amounts must be whole numbers'); return amount as UgxAmount; }
export function buildSecurityBoundary<TQuery>(tenantScopedQuery: TQuery, constraints: string[]): SecurityBoundary<TQuery> { return { tenantScopedQuery, executedBy: 'repository', constraints }; }
export function routeAction<T>(action: HamnahAction<T>): string { const prefix = VALID_ROUTE_PREFIXES[action.context.actorRole as HamnahRole] || action.route; return `${prefix}:${action.context.tenantId}`; }
export function syncEnvelope<T>(envelope: HamnahStateEnvelope<T>): HamnahStateEnvelope<T> { return { ...envelope, updatedAt: envelope.updatedAt || new Date().toISOString(), version: Math.max(1, envelope.version || 1) }; }
export function parseFallbackTransport(input: string, source: 'sms' | 'ussd', meta: Partial<NormalizedUssdSmsEvent> = {}): NormalizedUssdSmsEvent { const cleaned = input.trim(); const [command = '', ...args] = cleaned.split(/\s+/); return { from: meta.from || '', transport: source, text: cleaned, parsedCommand: command.toUpperCase(), args, tenantId: meta.tenantId, gateway: meta.gateway, sessionId: meta.sessionId, requestId: meta.requestId }; }
export function reconcileMobileMoney(input: MoneyReconciliationEvent) { if (input.currency !== 'UGX') throw new Error('Only UGX reconciliation is allowed'); const amount = normalizeUgx(Number(input.amount)); return { provider: input.provider, currency: 'UGX' as const, reference: input.reference, amount, status: input.status, externalId: input.externalId, reconciledAt: new Date().toISOString() }; }

export function buildUgandaBookingPayload(input: UgandaBookingInput) {
  if (input.vehicleClass !== 'car' && input.vehicleClass !== 'boda_boda') throw new Error('Vehicle class must be Car or Boda Boda');
  if (input.paymentProvider !== 'mtn_momo' && input.paymentProvider !== 'airtel_money') throw new Error('Payment provider must be MTN MoMo or Airtel Money');
  if (input.cadence !== 'single' && input.cadence !== 'recurring' && input.cadence !== 'termly') throw new Error('Invalid booking cadence');
  return {
    tenantId: input.tenantId,
    parentId: input.parentId,
    childId: input.childId,
    vehicleClass: input.vehicleClass,
    cadence: input.cadence,
    paymentProvider: input.paymentProvider,
    pickupLocation: input.pickupLocation,
    dropoffLocation: input.dropoffLocation,
    schoolTermReference: input.schoolTermReference,
    recurringDays: input.recurringDays ?? [],
    vehicleTrust: input.vehicleTrust ?? { status: 'pending' as const },
    driverTrust: input.driverTrust ?? { status: 'pending' as const },
    updatedAt: new Date().toISOString(),
  };
}

export function vehicleTrustChecklist(vehicleClass: UgandaVehicleClass) {
  return vehicleClass === 'car'
    ? ['NIN / National ID', 'valid driving permit', 'proof of ownership', 'LC1 verification letter']
    : ['NIN / National ID', 'valid riding permit', 'proof of ownership', 'stage chairman verification letter'];
}

export function detectAiGeneratedDocumentRisk(document: { aiGenerated?: boolean; aiConfidence?: number; attentionRequired?: boolean; attentionReason?: string }) {
  const riskScore = document.aiConfidence ?? (document.aiGenerated ? 0.9 : document.attentionRequired ? 0.7 : 0.1);
  const flagged = Boolean(document.aiGenerated || document.attentionRequired || riskScore >= 0.7);
  return { flagged, riskScore, reason: document.attentionReason || (document.aiGenerated ? 'Possible AI-generated or forged document' : document.attentionRequired ? 'Document requires review' : 'No AI risk detected') };
}

export function buildHamnahDocumentAttention(label: string, record: { status: string; checkedAt?: string; checkedBy?: string; notes?: string; trustDocuments?: Array<{ type: UgandaTrustDocType; reference?: string; url?: string; status?: string; aiGenerated?: boolean; aiConfidence?: number; attentionRequired?: boolean; attentionReason?: string }> }) {
  const suspicious = record.trustDocuments?.find((doc) => detectAiGeneratedDocumentRisk(doc).flagged);
  return {
    id: `${label.toLowerCase()}-${Date.now()}`,
    targetType: 'document' as const,
    targetId: label.toLowerCase(),
    reason: suspicious ? suspicious.attentionReason || 'Suspicious trust document' : `${label} verification needs review`,
    severity: suspicious ? 'critical' as const : 'high' as const,
    maskedSummary: suspicious ? `${label} document quarantine triggered` : `${label} document attention queued`,
    attentionRequired: true,
    aiGeneratedRisk: Boolean(suspicious),
    aiGeneratedRiskScore: suspicious ? detectAiGeneratedDocumentRisk(suspicious).riskScore : 0,
    createdAt: new Date().toISOString(),
  };
}

export function buildHamnahComplianceAlert(label: string, record: { status: string; checkedAt?: string; checkedBy?: string; notes?: string; trustDocuments?: Array<{ type: UgandaTrustDocType; reference?: string; url?: string; status?: string; aiGenerated?: boolean; aiConfidence?: number; attentionRequired?: boolean; attentionReason?: string }> }) {
  return {
    id: `${label.toLowerCase()}-alert-${Date.now()}`,
    targetType: 'booking' as const,
    targetId: label.toLowerCase(),
    reason: `${label} compliance quarantine`,
    severity: 'critical' as const,
    maskedSummary: `${label} booking quarantined pending review`,
    attentionRequired: true,
    aiGeneratedRisk: Boolean(record.trustDocuments?.some((doc) => detectAiGeneratedDocumentRisk(doc).flagged)),
    aiGeneratedRiskScore: record.trustDocuments?.reduce((max, doc) => Math.max(max, detectAiGeneratedDocumentRisk(doc).riskScore), 0) ?? 0,
    createdAt: new Date().toISOString(),
  };
}

export function hamnahTriage(input: NormalizedUssdSmsEvent) {
  const routeMap: Record<string, HamnahRole> = { BOOK: 'parent_booking', CANCEL: 'parent_booking', WHERE: 'parent_booking', SICK: 'parent_booking', HELP: 'dispatcher_sos', SOS: 'dispatcher_sos', ARRIVED: 'school_gate', DROPPED: 'school_gate', PICKED: 'school_gate', COMPLY: 'driver_compliance', PAY: 'finance_reconciliation', MTN: 'finance_reconciliation', AIRTEL: 'finance_reconciliation' };
  const role = routeMap[input.parsedCommand] || 'sms_ussd';
  return { role, route: VALID_ROUTE_PREFIXES[role], state: { command: input.parsedCommand, args: input.args, transport: input.transport, from: input.from, sessionId: input.sessionId, gateway: input.gateway, requestId: input.requestId } };
}

export function buildHamnahBridgePlan<T>(action: HamnahAction<T>, query: Record<string, unknown>, constraints: string[]): HamnahBridgePlan<T> { return { route: action.route, query, state: action.payload, constraints }; }
export function createTenantScopedQuery(base: Record<string, unknown>, tenantId: string) { return { ...base, tenantId }; }
export function createTenantScopedAdapter<TQuery extends Record<string, unknown>>(base: TQuery, tenantId: string, constraints: string[] = []) { return buildSecurityBoundary(createTenantScopedQuery(base, tenantId), constraints.length ? constraints : ['tenant-scoped', 'repository-execution']); }
export function validateTenantScopedQuery<TSchema>(schema: { parse: (input: unknown) => TSchema }, input: unknown, tenantId: string, constraints: string[] = []) { const parsed = schema.parse(input) as Record<string, unknown>; return createTenantScopedAdapter(parsed, tenantId, constraints); }

export function evaluateJourneyRisk(input: { vehicleClass: UgandaVehicleClass; currentStopSeconds?: number; plannedStopSeconds?: number; currentZone?: 'home_gate' | 'route' | 'school_gate' | 'unknown'; speedKph?: number; routeToleranceMeters?: number; locationAccuracyMeters?: number; }): { riskBand: JourneyRiskBand; reason: string; escalationDelayMinutes: number } {
  const stopSeconds = input.currentStopSeconds ?? 0;
  const plannedStopSeconds = input.plannedStopSeconds ?? 180;
  const drift = input.routeToleranceMeters ?? 180;
  const accuracy = input.locationAccuracyMeters ?? 60;
  const longStop = stopSeconds > Math.max(plannedStopSeconds, input.vehicleClass === 'boda_boda' ? 120 : 240);
  const weakSignal = accuracy > 250;
  const zoneRisk = input.currentZone === 'unknown' ? 'amber' : input.currentZone === 'route' ? 'amber' : 'green';
  if (input.speedKph !== undefined && input.speedKph > (input.vehicleClass === 'boda_boda' ? 55 : 80)) return { riskBand: 'critical', reason: 'Overspeed above Uganda ride safety threshold', escalationDelayMinutes: 0 };
  if (longStop && input.vehicleClass === 'boda_boda') return { riskBand: 'critical', reason: 'Boda Boda stopped too long outside gate', escalationDelayMinutes: 0 };
  if (longStop) return { riskBand: 'red', reason: 'Extended stop outside expected handoff', escalationDelayMinutes: 2 };
  if (weakSignal && drift > 200) return { riskBand: 'amber', reason: 'Weak-signal corridor with route uncertainty', escalationDelayMinutes: 5 };
  if (zoneRisk === 'amber') return { riskBand: 'amber', reason: 'Vehicle still on route corridor', escalationDelayMinutes: 5 };
  return { riskBand: 'green', reason: 'Ride within expected Uganda operating window', escalationDelayMinutes: 0 };
}

export function buildIncidentLifecycleNotes(lifecycle: IncidentLifecycle) {
  const notes: Record<IncidentLifecycle, string> = {
    active: 'Incident active and awaiting dispatcher acknowledgement',
    acknowledged: 'Dispatcher acknowledged incident',
    investigating: 'Dispatcher is investigating the issue',
    driver_contacted: 'Driver contacted for status update',
    parent_contacted: 'Parent contacted with masked ride details',
    school_contacted: 'School gate or admin contacted',
    police_contacted: 'Police or emergency services contacted',
    resolved: 'Incident closed and resolved',
    false_alarm: 'Incident marked as false alarm after verification',
  };
  return notes[lifecycle];
}
