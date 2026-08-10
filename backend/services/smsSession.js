// PoleSafe — SMS Session Manager
// Tracks multi-step SMS conversations for basic phone parents
// In production, use Redis instead of in-memory map

const sessions = new Map();

const SESSION_TTL = 30 * 60 * 1000; // 30 minutes

class SmsSession {

  /**
   * Get or create a session for a phone number
   */
  async getOrCreate(phone, type) {
    if (sessions.has(phone)) {
      const existing = sessions.get(phone);
      if (Date.now() - existing.lastActivity < SESSION_TTL) {
        return existing;
      }
    }

    const session = {
      phone,
      type,
      step: 'start',
      context: {},
      completed: false,
      createdAt: new Date(),
      lastActivity: Date.now(),
    };

    sessions.set(phone, session);
    return session;
  }

  /**
   * Get existing session (returns null if expired or missing)
   */
  async get(phone) {
    if (!sessions.has(phone)) return null;
    const session = sessions.get(phone);
    if (Date.now() - session.lastActivity > SESSION_TTL) {
      sessions.delete(phone);
      return null;
    }
    return session;
  }

  /**
   * Update a session's step and context
   */
  async update(phone, update) {
    if (!sessions.has(phone)) return null;
    const session = sessions.get(phone);
    if (update.step) session.step = update.step;
    if (update.context) session.context = { ...session.context, ...update.context };
    if (update.completed !== undefined) session.completed = update.completed;
    session.lastActivity = Date.now();
    return session;
  }

  /**
   * Clear/remove a session
   */
  async clear(phone) {
    sessions.delete(phone);
  }

  /**
   * Get active session count (for monitoring)
   */
  getActiveCount() {
    const now = Date.now();
    let count = 0;
    for (const [phone, session] of sessions.entries()) {
      if (now - session.lastActivity > SESSION_TTL) {
        sessions.delete(phone);
      } else {
        count++;
      }
    }
    return count;
  }
}

module.exports = new SmsSession();
