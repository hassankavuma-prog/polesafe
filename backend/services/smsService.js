// PoleSafe — SMS Gateway Service
// Sends and receives SMS via Africa's Talking or similar provider
// Powers the basic phone feature for parents who don't have smartphones

const config = require('../config');
const https = require('https');

class SmsService {

  /**
   * Send an SMS message
   * 
   * @param {object} params
   * @param {string} params.to - Phone number (e.g., "+256701234567")
   * @param {string} params.message - Message content
   * @returns {object} Send result
   */
  async send({ to, message }) {
    // Truncate long messages to fit SMS limits
    const truncated = message.length > 160 ? message.substring(0, 157) + '...' : message;

    try {
      // Africa's Talking API integration
      if (config.SMS.PROVIDER === 'africastalking') {
        return await this.sendViaAfricasTalking(to, truncated);
      }

      // Fallback: log to console (development mode)
      console.log(`📱 SMS to ${to}: ${truncated}`);
      return { success: true, to, message: truncated, provider: 'console' };
    } catch (err) {
      console.error(`SMS send failed to ${to}:`, err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Send via Africa's Talking API
   */
  sendViaAfricasTalking(to, message) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        username: config.SMS.USERNAME,
        to,
        message,
        from: config.SMS.SHORTCODE,
      });

      const options = {
        hostname: 'api.africastalking.com',
        port: 443,
        path: '/version1/messaging',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ApiKey': config.SMS.API_KEY,
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ success: true, response: JSON.parse(data) });
          } catch {
            resolve({ success: true, rawResponse: data });
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  /**
   * Send batch SMS to multiple recipients
   */
  async sendBatch(recipients) {
    const results = [];
    // Send in batches of 100 to avoid provider limits
    const batchSize = 100;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(r => this.send(r))
      );
      results.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : r.reason));
    }
    return results;
  }

  // ============================================================
  // INCOMING SMS HANDLING
  // ============================================================

  /**
   * Parse an incoming SMS command from a parent
   * Supported commands:
   *   BOOK <name> <class> <school> <time>
   *   CANCEL <name>
   *   WHERE <name>
   *   HELP <name>
   *   SICK <name> [days]
   *   RESTORE <name>
   *   CONFIRM / CHANGE
   */
  parseCommand(from, text) {
    const parts = text.trim().split(/\s+/);
    const command = parts[0].toUpperCase();

    return {
      from,
      command,
      args: parts.slice(1),
      raw: text,
    };
  }

  /**
   * Generate an SMS reply based on what the user requested
   */
  generateReply({ command, args, user, child, rides }) {
    const templates = {
      BOOK: (name) =>
        `✅ ${name} booked! Pickup ${rides?.pickupTime || '7AM'} from ${rides?.pickupAddress || 'home'}. Reply WHERE ${name} to track. -PoleSafe`,

      CANCEL: (name) =>
        `✅ ${name}'s ride cancelled. No charge. Reply BOOK ${name} to rebook. -PoleSafe`,

      WHERE: (name, status) =>
        `${name} — ${status || 'Driver is on the way 🚗'}. ETA: ${rides?.eta || '5 min'}. -PoleSafe`,

      SICK: (name, daysLeft) =>
        `✅ ${name}'s ride cancelled (sick). No charge. Sick days left this term: ${daysLeft}. Reply RESTORE ${name} to undo. -PoleSafe`,

      HELP: (name) =>
        `PoleSafe: BOOK <name> <class> <school> <time> to book. CANCEL <name> to cancel. WHERE <name> to track. SICK <name> for sick day. HELP for help. -PoleSafe`,

      CONFIRM: () =>
        `✅ Confirmed! Your PoleSafe ride is set. -PoleSafe`,

      RESTORE: (name) =>
        `✅ ${name}'s ride restored. Regular schedule continues. -PoleSafe`,
    };

    const replyFn = templates[command];
    if (!replyFn) {
      return `PoleSafe: Unknown command. Reply HELP for options. -PoleSafe`;
    }

    return replyFn(...args);
  }
}

module.exports = new SmsService();
