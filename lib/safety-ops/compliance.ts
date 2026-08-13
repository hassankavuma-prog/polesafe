import type { ComplianceAttentionEvent, ComplianceSlaMetric, LocalVerificationRecord } from './types';

export function detectAiGeneratedDocumentRisk(record: LocalVerificationRecord) {
  const docs = record.trustDocuments ?? [];
  const aiGeneratedDocs = docs.filter((doc) => doc.aiGenerated);
  const aiScore = docs.reduce((score, doc) => score + (doc.aiConfidence ?? 0), 0);
  const normalizedScore = docs.length ? Math.min(1, aiScore / docs.length) : 0;
  const highRisk = aiGeneratedDocs.length > 0 || normalizedScore >= 0.7;
  return {
    aiGenerated: aiGeneratedDocs.length > 0,
    aiConfidence: normalizedScore,
    attentionRequired: highRisk,
    reason: highRisk ? 'Potential AI-generated or synthetic document markers detected' : 'No AI-generated risk detected',
  };
}

export function buildComplianceAttentionEvent(input: {
  id: string;
  targetType: 'driver' | 'vehicle' | 'document' | 'booking';
  targetId: string;
  reason: string;
  severity: ComplianceAttentionEvent['severity'];
  maskedSummary: string;
  aiGeneratedRisk?: boolean;
  aiGeneratedRiskScore?: number;
  createdBy?: string;
}): ComplianceAttentionEvent {
  return {
    ...input,
    aiGeneratedRisk: input.aiGeneratedRisk ?? false,
    attentionRequired: true,
    createdAt: new Date().toISOString(),
  };
}

export function detectHamnaDocumentAttention(record: LocalVerificationRecord) {
  const docs = record.trustDocuments ?? [];
  const expiredDocs = docs.filter((doc) => doc.status === 'expired');
  const soonToExpireDocs = docs.filter((doc) => doc.status !== 'expired' && doc.aiConfidence !== undefined && doc.aiConfidence >= 0.6);
  const aiRisk = detectAiGeneratedDocumentRisk(record);
  const attentionRequired = expiredDocs.length > 0 || soonToExpireDocs.length > 0 || aiRisk.attentionRequired || record.attentionRequired;

  return {
    attentionRequired,
    aiGeneratedRisk: aiRisk.aiGenerated,
    aiConfidence: aiRisk.aiConfidence,
    reason: record.attentionReason || aiRisk.reason || 'Document needs review',
    recipients: record.alertRecipients ?? ['dispatcher', 'owner', 'compliance'],
    expiredDocuments: expiredDocs.length,
    suspectedDocuments: soonToExpireDocs.length,
  };
}

export function buildHamnaDocumentAttention(input: {
  subjectId: string;
  subjectType: 'driver' | 'vehicle' | 'booking';
  record: LocalVerificationRecord;
  reviewedBy?: string;
}) {
  const attention = detectHamnaDocumentAttention(input.record);
  const summary = buildMaskedComplianceSummary({
    subject: `${input.subjectType}:${input.subjectId}`,
    reason: attention.reason,
    attentionRequired: attention.attentionRequired,
  });
  return buildComplianceAttentionEvent({
    id: `cmp_${input.subjectType}_${input.subjectId}_${Date.now()}`,
    targetType: input.subjectType,
    targetId: input.subjectId,
    reason: attention.reason,
    severity: attention.attentionRequired ? 'high' : 'low',
    maskedSummary: summary,
    aiGeneratedRisk: attention.aiGeneratedRisk,
    aiGeneratedRiskScore: attention.aiConfidence,
    createdBy: input.reviewedBy,
  });
}

export function buildHamnaComplianceAlert(input: {
  attention: ComplianceAttentionEvent;
  recipients?: Array<'dispatcher' | 'owner' | 'school' | 'compliance'>;
}) {
  const recipients = input.recipients ?? ['dispatcher', 'owner', 'compliance'];
  return {
    alertId: `hamna_${input.attention.id}`,
    recipients,
    summary: input.attention.maskedSummary,
    severity: input.attention.severity,
    attentionRequired: input.attention.attentionRequired,
    aiGeneratedRisk: input.attention.aiGeneratedRisk ?? false,
    aiGeneratedRiskScore: input.attention.aiGeneratedRiskScore ?? 0,
    createdAt: new Date().toISOString(),
  };
}

export function buildComplianceSlaMetric(input: {
  eventType: ComplianceSlaMetric['eventType'];
  startedAt: string;
  finishedAt?: string;
  actorId?: string;
  actorRole?: string;
  incidentId?: string;
}): ComplianceSlaMetric {
  const durationSeconds = input.finishedAt ? Math.max(0, Math.round((Date.parse(input.finishedAt) - Date.parse(input.startedAt)) / 1000)) : undefined;
  return {
    ...input,
    durationSeconds,
  };
}

export function buildMaskedComplianceSummary(input: {
  subject: string;
  reason: string;
  attentionRequired: boolean;
}) {
  return `${input.subject}: ${input.reason}${input.attentionRequired ? ' • attention required' : ''}`;
}
