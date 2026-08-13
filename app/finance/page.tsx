import { LedgerPanel } from '../../components/finance/ledger-panel';

const INITIAL_TRANSACTIONS = [
  { transactionId: 'TXN-UG-98214', organizationId: 'ORG-KAMPALA-01', parentId: 'PAR-88392', amountUgx: 150000, paymentMethod: 'mtn_momo', status: 'success', termReference: 'Term 1 2026', createdAt: '2026-03-01T08:30:00Z', confidence: 'confirmed', confidenceNote: 'Callback matched to term invoice', confidenceSource: 'payment_webhook', paymentMatchStatus: 'matched', paymentProvider: 'mtn_momo' },
  { transactionId: 'TXN-UG-98215', organizationId: 'ORG-KAMPALA-01', parentId: 'PAR-44210', amountUgx: 150000, paymentMethod: 'airtel_money', status: 'pending', termReference: 'Term 1 2026', createdAt: '2026-03-02T10:15:00Z', confidence: 'delayed', confidenceNote: 'Awaiting Airtel callback', confidenceSource: 'payment_webhook', paymentMatchStatus: 'pending', paymentProvider: 'airtel_money' },
  { transactionId: 'TXN-UG-98216', organizationId: 'ORG-KAMPALA-01', parentId: 'PAR-11293', amountUgx: 150000, paymentMethod: 'mtn_momo', status: 'failed', termReference: 'Term 1 2026', createdAt: '2026-03-02T11:00:00Z', confidence: 'offline-received', confidenceNote: 'Payment event recovered from queue replay', confidenceSource: 'queue_replay', paymentMatchStatus: 'failed', paymentProvider: 'mtn_momo' },
] as const;

export default function FinancialLedgerPage() {
  return <LedgerPanel initialTransactions={[...INITIAL_TRANSACTIONS]} activeTermLabel="Term 1 2026" regionLabel="Kampala Region" />;
}
