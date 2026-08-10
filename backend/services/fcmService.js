// PoleSafe — Firebase Cloud Messaging (FCM) Push Notification Service
// Sends push notifications to parents, drivers, and school admins via FCM
// Supports Expo push tokens (for Expo/React Native) and raw FCM tokens

const https = require('https');

class FCMService {
  constructor() {
    this.fcmServerKey = process.env.FCM_SERVER_KEY;
    this.expoPushUrl = 'https://exp.host/--/api/v2/push/send';
    this.useExpo = !!process.env.EXPO_ACCESS_TOKEN || !this.fcmServerKey;
  }

  /**
   * Send a push notification to a device
   * 
   * @param {object} params
   * @param {string} params.token - FCM or Expo push token
   * @param {string} params.platform - 'ios' | 'android' | 'web' | 'expo'
   * @param {string} params.title - Notification title
   * @param {string} params.body - Notification body text
   * @param {object} params.data - Custom data payload (deep link info)
   * @returns {Promise<object>} Send result
   */
  async sendPush({ token, platform, title, body, data = {} }) {
    if (!token) {
      throw new Error('No push token provided');
    }

    // Expo push tokens start with "ExponentPushToken"
    if (token.startsWith('ExponentPushToken') || this.useExpo) {
      return await this._sendViaExpo({ token, title, body, data });
    }

    return await this._sendViaFCM({ token, platform, title, body, data });
  }

  /**
   * Send via Expo Push API (for Expo/React Native apps)
   */
  async _sendViaExpo({ token, title, body, data }) {
    const payload = {
      to: token,
      title,
      body,
      data,
      sound: 'default',
      priority: 'high',
      _displayInForeground: true,
    };

    return new Promise((resolve, reject) => {
      const req = https.request(this.expoPushUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(process.env.EXPO_ACCESS_TOKEN
            ? { 'Authorization': `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
            : {}),
        },
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve({ sent: true, response: JSON.parse(body), channel: 'expo' });
          } catch {
            resolve({ sent: true, response: body, channel: 'expo' });
          }
        });
      });

      req.on('error', reject);
      req.write(JSON.stringify(payload));
      req.end();
    });
  }

  /**
   * Send via Google FCM HTTP v1 API
   */
  async _sendViaFCM({ token, platform, title, body, data }) {
    if (!this.fcmServerKey) {
      console.warn('[FCM] No FCM_SERVER_KEY configured — push not sent');
      return { sent: false, error: 'FCM_SERVER_KEY not configured', channel: 'fcm' };
    }

    const payload = {
      to: token,
      notification: { title, body },
      data: {
        ...data,
        title,
        body,
        click_action: data.type || 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        priority: 'high',
        notification: { channelId: 'polesafe_default', priority: 'high' },
      },
      apns: {
        payload: { aps: { sound: 'default', badge: 1, 'content-available': 1 } },
      },
    };

    return new Promise((resolve, reject) => {
      const req = https.request('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=${this.fcmServerKey}`,
        },
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve({ sent: true, response: JSON.parse(body), channel: 'fcm' });
          } catch {
            resolve({ sent: true, response: body, channel: 'fcm' });
          }
        });
      });

      req.on('error', reject);
      req.write(JSON.stringify(payload));
      req.end();
    });
  }

  /**
   * Send push to multiple devices
   */
  async sendBatch(tokens, { title, body, data, platform } = {}) {
    const results = [];
    for (const token of tokens) {
      try {
        const result = await this.sendPush({ token, title, body, data, platform });
        results.push(result);
      } catch (err) {
        results.push({ sent: false, error: err.message, token });
      }
    }
    return { sent: results.filter(r => r.sent).length, failed: results.filter(r => !r.sent).length, results };
  }
}

module.exports = new FCMService();
