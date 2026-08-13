import type { ComplianceAttentionEvent } from './types';

export type PaymentRail = 'mtn_momo' | 'airtel_money' | 'card';
export type ReconciliationStatus = 'matched' | 'pending' | 'failed' | 'exception';

export interface PaymentReconciliationIssue {
  issueId: string;
  transactionId: string;
  organizationId: string;
  paymentRail: PaymentRail;
  status: ReconciliationStatus;
  reason: string;
  maskedSummary: string;
  createdAt: string;
  attentionRequired: boolean;
  paymentMatchStatus?: 'matched' | 'pending' | 'reconciled' | 'failed';
  callbackDelayMinutes?: number;
  termReference?: string;
}

export function detectPaymentReconciliationIssue(input: {
  transactionId: string;
  organizationId: string;
  paymentRail: PaymentRail;
  paymentStatus: 'success' | 'pending' | 'failed';
  paymentMatchStatus?: 'matched' | 'pending' | 'reconciled' | 'failed';
  callbackDelayMinutes?: number;
  termReference?: string;
}) {
  const delayed = (input.callbackDelayMinutes ?? 0) >= 30;
  const unmatched = input.paymentMatchStatus === 'pending' || input.paymentMatchStatus === 'failed';
  const failed = input.paymentStatus === 'failed';
  const attentionRequired = failed || unmatched || delayed;
  const status: ReconciliationStatus = failed ? 'failed' : unmatched || delayed ? 'exception' : 'matched';
  const reason = failed
    ? `${input.paymentRail} payment failed`
    : delayed
      ? `${input.paymentRail} callback delayed by ${input.callbackDelayMinutes} minutes`
      : unmatched
        ? `${input.paymentRail} transaction needs reconciliation`
        : `${input.paymentRail} payment matched`;

  return {
    issueId: `pay_${input.transactionId}`,
    transactionId: input.transactionId,
    organizationId: input.organizationId,
    paymentRail: input.paymentRail,
    status,
    reason,
    maskedSummary: `${input.termReference ?? 'term booking'} • ${reason}`,
    createdAt: new Date().toISOString(),
    attentionRequired,
    paymentMatchStatus: input.paymentMatchStatus,
    callbackDelayMinutes: input.callbackDelayMinutes,
    termReference: input.termReference,
  } satisfies PaymentReconciliationIssue;
}

export function buildPaymentReconciliationAlert(issue: PaymentReconciliationIssue): ComplianceAttentionEvent {
  return {
    id: `cmp_payment_${issue.issueId}`,
    targetType: 'booking',
    targetId: issue.transactionId,
    reason: issue.reason,
    severity: issue.status === 'failed' ? 'critical' : 'high',
    maskedSummary: issue.maskedSummary,
    attentionRequired: issue.attentionRequired,
    aiGeneratedRisk: false,
    aiGeneratedRiskScore: 0,
    createdAt: issue.createdAt,
  };
}
