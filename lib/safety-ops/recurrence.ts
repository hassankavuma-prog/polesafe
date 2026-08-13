import type { ComplianceAttentionEvent } from './types';
import type { RideVehicleKind } from '../../types/polesafe';

export type RecurringIncidentKind = 'route_deviation' | 'long_stop' | 'sos' | 'late_pickup' | 'payment_exception';

export interface RecurringIncidentPattern {
  patternId: string;
  kind: RecurringIncidentKind;
  routeName: string;
  vehicleKind?: RideVehicleKind;
  driverId?: string;
  schoolId?: string;
  count: number;
  threshold: number;
  windowDays: number;
  lastOccurredAt: string;
  maskedSummary: string;
  attentionRequired: boolean;
}

export function detectRecurringIncidentPattern(input: {
  kind: RecurringIncidentKind;
  routeName: string;
  vehicleKind?: RideVehicleKind;
  driverId?: string;
  schoolId?: string;
  occurrences: Array<{ occurredAt: string; severity?: 'low' | 'medium' | 'high' | 'critical' }>;
  windowDays?: number;
  threshold?: number;
}) {
  const threshold = input.threshold ?? 3;
  const count = input.occurrences.length;
  const latest = [...input.occurrences].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))[0];
  const attentionRequired = count >= threshold;
  return {
    patternId: `rec_${input.kind}_${input.routeName.replace(/\s+/g, '_').toLowerCase()}`,
    kind: input.kind,
    routeName: input.routeName,
    vehicleKind: input.vehicleKind,
    driverId: input.driverId,
    schoolId: input.schoolId,
    count,
    threshold,
    windowDays: input.windowDays ?? 30,
    lastOccurredAt: latest?.occurredAt ?? new Date().toISOString(),
    maskedSummary: `${input.routeName}: ${count} ${input.kind} events in the last ${input.windowDays ?? 30} days`,
    attentionRequired,
  } satisfies RecurringIncidentPattern;
}

export function buildRecurringIncidentAlert(pattern: RecurringIncidentPattern): ComplianceAttentionEvent {
  return {
    id: `cmp_${pattern.patternId}`,
    targetType: pattern.driverId ? 'driver' : pattern.schoolId ? 'booking' : 'vehicle',
    targetId: pattern.driverId ?? pattern.schoolId ?? pattern.routeName,
    reason: `Recurring ${pattern.kind} detected on ${pattern.routeName}`,
    severity: pattern.count >= pattern.threshold + 2 ? 'critical' : pattern.count >= pattern.threshold ? 'high' : 'medium',
    maskedSummary: pattern.maskedSummary,
    attentionRequired: pattern.attentionRequired,
    aiGeneratedRisk: false,
    aiGeneratedRiskScore: 0,
    createdAt: new Date().toISOString(),
  };
}
