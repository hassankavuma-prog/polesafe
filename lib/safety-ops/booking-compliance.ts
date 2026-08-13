import { buildHamnahComplianceAlert, buildHamnahDocumentAttention, detectAiGeneratedDocumentRisk } from '../engine/hamnah-core';
import type { ComplianceAttentionEvent, DriverComplianceVault, LocalVerificationRecord } from '../../types/polesafe';

export type BookingComplianceState = 'clear' | 'attention_required' | 'blocked';

export interface BookingComplianceResult {
  state: BookingComplianceState;
  blocked: boolean;
  reason: string;
  attentionEvents: ComplianceAttentionEvent[];
}

function evaluateRecord(label: string, record?: LocalVerificationRecord): BookingComplianceResult {
  const attentionEvents: ComplianceAttentionEvent[] = [];
  const status = record?.status ?? 'pending';
  const docs = record?.trustDocuments ?? [];
  const suspicious = docs.some((doc) => detectAiGeneratedDocumentRisk(doc).flagged);

  if (!record || status === 'pending') {
    return { state: 'attention_required', blocked: false, reason: `${label} verification pending`, attentionEvents };
  }
  if (status === 'rejected' || status === 'expired') {
    const attention = buildHamnahDocumentAttention(label, record);
    attentionEvents.push(attention, buildHamnahComplianceAlert(label, record));
    return { state: 'blocked', blocked: true, reason: `${label} verification ${status}`, attentionEvents };
  }
  if (record.attentionRequired || record.aiGeneratedRisk || suspicious) {
    attentionEvents.push(buildHamnahDocumentAttention(label, record), buildHamnahComplianceAlert(label, record));
    return { state: 'attention_required', blocked: false, reason: `${label} verification needs review`, attentionEvents };
  }
  return { state: 'clear', blocked: false, reason: `${label} verification clear`, attentionEvents };
}

export function evaluateBookingCompliance(input: { driver?: DriverComplianceVault; vehicle?: DriverComplianceVault; bookingLabel?: string }): BookingComplianceResult {
  const driver = evaluateRecord('Driver', input.driver?.localTrustVerification);
  if (driver.blocked) return driver;
  const vehicle = evaluateRecord('Vehicle', input.vehicle?.localTrustVerification);
  if (vehicle.blocked) return vehicle;
  const attentionEvents = [...driver.attentionEvents, ...vehicle.attentionEvents];
  return { state: attentionEvents.length ? 'attention_required' : 'clear', blocked: false, reason: attentionEvents.length ? 'Booking has compliance attention' : 'Booking cleared for dispatch', attentionEvents };
}

export function summarizeBookingCompliance(result: BookingComplianceResult) {
  return { state: result.state, blocked: result.blocked, reason: result.reason, attentionCount: result.attentionEvents.length };
}
