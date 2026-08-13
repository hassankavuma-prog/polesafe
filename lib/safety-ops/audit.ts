export type AuditActor = {
  actorId: string;
  role: string;
};

export type AuditEntry = {
  actorId: string;
  role: string;
  action: string;
  timestamp: string;
  note?: string;
  targetId?: string;
  targetType?: string;
};

const ledger: AuditEntry[] = [];

export function appendAuditEntry(entry: Omit<AuditEntry, 'timestamp'> & { timestamp?: string }) {
  const normalized: AuditEntry = { ...entry, timestamp: entry.timestamp || new Date().toISOString() };
  ledger.push(normalized);
  return normalized;
}

export function listAuditEntries() {
  return [...ledger];
}

export function buildAuditEntry(actor: AuditActor, action: string, extras: Partial<Omit<AuditEntry, 'actorId' | 'role' | 'action' | 'timestamp'>> = {}) {
  return appendAuditEntry({ actorId: actor.actorId, role: actor.role, action, ...extras });
}
