// PoleSafe — Audit Trail Service
// Logs sensitive actions (payouts, PIN changes, account updates, cancellations)

const { AuditLog } = require('../database/schema');

class AuditService {
  /**
   * Log an action to the audit trail
   */
  async log(action, options = {}) {
    try {
      const entry = await AuditLog.create({
        action,
        userId: options.userId || null,
        userRole: options.userRole || null,
        userName: options.userName || null,
        resourceType: options.resourceType || null,
        resourceId: options.resourceId ? String(options.resourceId) : null,
        details: options.details || {},
        ipAddress: options.ipAddress || null,
        metadata: options.metadata || {},
      });
      return entry;
    } catch (err) {
      console.error('[Audit] Failed to log:', action, err.message);
      return null;
    }
  }

  /**
   * Query audit trail
   */
  async query(filters = {}, options = {}) {
    const query = {};
    if (filters.action) query.action = filters.action;
    if (filters.userId) query.userId = filters.userId;
    if (filters.resourceType) query.resourceType = filters.resourceType;
    if (filters.resourceId) query.resourceId = filters.resourceId;
    if (filters.userRole) query.userRole = filters.userRole;

    const limit = Math.min(options.limit || 50, 200);
    const skip = options.skip || 0;
    const sort = options.sort || { createdAt: -1 };

    const [entries, total] = await Promise.all([
      AuditLog.find(query).sort(sort).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(query),
    ]);

    return { entries, total, limit, skip };
  }
}

// Singleton
const auditService = new AuditService();
module.exports = auditService;
