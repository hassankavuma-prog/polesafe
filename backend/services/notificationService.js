// PoleSafe — Multi-Channel Notification Service
// Handles all outgoing notifications via WhatsApp, SMS, and Email
// Parents choose their preferred channel — defaults to WhatsApp

const config = require('../config');
const https = require('https');
const nodemailer = require('nodemailer');  // For email receipts

class NotificationService {

  /**
   * Send a notification to a parent via their preferred channel(s)
   * 
   * @param {object} params
   * @param {string} params.userId - Parent's user ID
   * @param {string} params.phone - Phone number
   * @param {string} params.email - Email address (optional)
   * @param {string} params.preferredChannel - 'whatsapp' | 'sms' | 'email' | 'app_push'
   * @param {string} params.template - Template name for the message
   * @param {object} params.data - Data to fill the template
   * @param {string} params.type - 'receipt' | 'alert' | 'broadcast'
   */
  async send({ userId, phone, email, preferredChannel = 'whatsapp', template, data, type = 'alert' }) {
    const results = {};

    // Determine which channels to use
    let channels = [preferredChannel];

    // For alerts, send to ALL available channels
    if (type === 'alert' || type === 'broadcast') {
      channels = ['whatsapp', 'sms'];
      if (email) channels.push('email');
    }

    // For receipts, send to preferred channel + email if available
    if (type === 'receipt') {
      channels = [preferredChannel];
      if (email && preferredChannel !== 'email') {
        channels.push('email');
      }
    }

    // Send through each channel
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'whatsapp':
            results.whatsapp = await this.sendWhatsApp(phone, template, data);
            break;
          case 'sms':
            results.sms = await this.sendSMS(phone, template, data);
            break;
          case 'email':
            if (email) {
              results.email = await this.sendEmail(email, template, data);
            }
            break;
          case 'app_push':
            if (userId) {
              results.app_push = await this.sendPush(userId, data);
            } else {
              console.warn('[Notifications] app_push skipped: no userId');
              results.app_push = { success: false, error: 'No userId for push' };
            }
            break;
        }
      } catch (err) {
        console.warn(`[Notifications] ${channel} failed for ${phone}: ${err.message}`);
        results[channel] = { success: false, error: err.message };
      }
    }

    return results;
  }

  // ============================================================
  // WHATSAPP — Via WATI / WhatsApp Business API
  // ============================================================

  /**
   * Send a WhatsApp message using template
   * WhatsApp templates must be pre-approved by Meta
   */
  async sendWhatsApp(phone, template, data) {
    const message = this.buildMessage(template, data);

    try {
      // WATI API integration
      if (config.WHATSAPP.PROVIDER === 'wati') {
        return await this.sendViaWati(phone, message);
      }

      // Africa's Talking WhatsApp
      if (config.WHATSAPP.PROVIDER === 'africastalking') {
        return await this.sendViaAfricasTalkingWhatsApp(phone, message);
      }

      // Fallback: console log
      console.log(`📱 [WhatsApp] To: ${phone} | ${message.substring(0, 80)}...`);
      return { success: true, channel: 'whatsapp', phone, message };
    } catch (err) {
      throw err;
    }
  }

  /**
   * Send via WATI API
   * WATI is popular in Africa for WhatsApp Business
   */
  sendViaWati(phone, message) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        phone: phone.replace('+', ''),
        body: message,
        msgType: 'text',
      });

      const options = {
        hostname: 'live-mt.wati.io',
        port: 443,
        path: '/api/v1/sendMessage',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.WHATSAPP.API_KEY}`,
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ success: true, channel: 'whatsapp', response: data }));
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  /**
   * Send via Africa's Talking WhatsApp
   */
  sendViaAfricasTalkingWhatsApp(phone, message) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        username: config.SMS.USERNAME,
        to: phone,
        message,
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
        res.on('end', () => resolve({ success: true, channel: 'whatsapp', response: data }));
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  // ============================================================
  // SMS
  // ============================================================

  async sendSMS(phone, template, data) {
    const message = this.buildMessage(template, data);
    const truncated = message.length > 160 ? message.substring(0, 157) + '...' : message;

    try {
      // Africa's Talking
      if (config.SMS.PROVIDER === 'africastalking') {
        return await this.sendSMSViaAfricasTalking(phone, truncated);
      }

      console.log(`📱 [SMS] To: ${phone} | ${truncated.substring(0, 60)}...`);
      return { success: true, channel: 'sms', phone, message: truncated };
    } catch (err) {
      throw err;
    }
  }

  sendSMSViaAfricasTalking(phone, message) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        username: config.SMS.USERNAME,
        to: phone,
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
        res.on('end', () => resolve({ success: true, channel: 'sms' }));
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  // ============================================================
  // EMAIL — For formal receipts and weekly summaries
  // ============================================================

  /**
   * Send an email receipt to a parent
   * 
   * @param {string} email - Parent's email address
   * @param {string} template - Template name
   * @param {object} data - Template data
   */
  async sendEmail(email, template, data) {
    try {
      const subject = this.getEmailSubject(template, data);
      const htmlBody = this.buildEmailHtml(template, data);

      // Use nodemailer for SMTP
      if (config.EMAIL.PROVIDER === 'smtp') {
        return await this.sendViaSMTP(email, subject, htmlBody);
      }

      // SendGrid / Mailgun fallback
      if (config.EMAIL.PROVIDER === 'sendgrid') {
        return await this.sendViaSendGrid(email, subject, htmlBody);
      }

      // Fallback: console log
      console.log(`📧 [Email] To: ${email} | Subject: ${subject}`);
      return { success: true, channel: 'email', email, subject };
    } catch (err) {
      throw err;
    }
  }

  /**
   * Send email via SMTP using nodemailer
   */
  async sendViaSMTP(email, subject, htmlBody) {
    try {
      const transporter = nodemailer.createTransport({
        host: config.EMAIL.SMTP.HOST,
        port: config.EMAIL.SMTP.PORT,
        secure: false,
        auth: {
          user: config.EMAIL.SMTP.USER,
          pass: config.EMAIL.SMTP.PASS,
        },
      });

      const info = await transporter.sendMail({
        from: `"${config.EMAIL.FROM_NAME}" <${config.EMAIL.FROM}>`,
        to: email,
        subject,
        html: htmlBody,
      });

      console.log(`📧 Email sent to ${email}: ${info.messageId}`);
      return { success: true, channel: 'email', messageId: info.messageId };
    } catch (err) {
      console.error('SMTP send failed:', err.message);
      throw err;
    }
  }

  /**
   * Send via SendGrid API
   */
  sendViaSendGrid(email, subject, htmlBody) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: config.EMAIL.FROM, name: config.EMAIL.FROM_NAME },
        subject,
        content: [{ type: 'text/html', value: htmlBody }],
      });

      const options = {
        hostname: 'api.sendgrid.com',
        port: 443,
        path: '/v3/mail/send',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.EMAIL.API_KEY}`,
        },
      };

      const req = https.request(options, (res) => {
        resolve({ success: true, channel: 'email', statusCode: res.statusCode });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  // ============================================================
  // MESSAGE BUILDING
  // ============================================================

  /**
   * Build a plain text message from a template
   */
  buildMessage(template, data) {
    const templates = {
      // Receipts
      booking_receipt: (d) =>
        `✅ PoleSafe Booking Confirmed!\n\nKid: ${d.childName}\nSchool: ${d.schoolName}\nSchedule: ${d.daysOfWeek} at ${d.pickupTime}\nTotal: ${d.amount} UGX\nDriver: ${d.driverName}\n\nFrom Home to School. And Beyond. 🚸`,

      payment_receipt: (d) =>
        `💰 PoleSafe Payment Received!\n\nAmount: ${d.amount} UGX\nMethod: ${d.method}\nPeriod: ${d.period}\nReceipt: ${d.receiptNo}\n\nThank you for riding with PoleSafe 🚸`,

      ride_receipt: (d) =>
        `🚸 Ride Complete!\n\nKid: ${d.childName}\nFrom: ${d.pickupAddress}\nTo: ${d.dropoffAddress}\nDriver: ${d.driverName}\nTime: ${d.time}\nAmount: ${d.amount} UGX\n\nRate your ride: polesafe.ug/rate`,

      credit_notice: (d) =>
        `💰 PoleSafe Credit Issued!\n\nReason: ${d.reason}\nAmount: ${d.amount} UGX\nBalance: ${d.balance} UGX\n\nUse credits for next term or PoleSafe Ride trips.`,

      weekly_summary: (d) =>
        `📊 PoleSafe Weekly Summary\n\nKid: ${d.childName}\nRides this week: ${d.completedTrips}\nMissed: ${d.missedTrips}\nTotal spent: ${d.totalSpent} UGX\nCredits available: ${d.credits} UGX\n\nNext week's schedule: polesafe.ug/schedule`,

      // Alerts
      kid_sick_alert: (d) =>
        `🩺 ${d.childName} is unwell at ${d.schoolName}\nCondition: ${d.condition}\n\nOptions:\n1. Pick up yourself (credit issued)\n2. PoleSafe brings them home\n3. Keep at school until normal time\n\nReply or open app to choose.`,

      driver_en_route: (d) =>
        `🚗 ${d.driverName} is on the way!\n\nKid: ${d.childName}\nETA: ${d.eta} minutes\n\nTrack live: polesafe.ug/track/${d.rideId}`,

      school_announcement: (d) =>
        `📢 ${d.schoolName}\n\n${d.message}\n\n${d.newPickupTime ? `🕐 Pickup time changed to: ${d.newPickupTime}` : ''}\n\n-PoleSafe`,

      emergency: (d) =>
        `🚨 ${d.schoolName} — EMERGENCY\n\n${d.message}\n\nPlease check on your child. PoleSafe team is responding.`,

      default: (d) => `${d.message || 'PoleSafe notification'}`,
    };

    const fn = templates[template] || templates.default;
    return fn(data);
  }

  /**
   * Get the email subject line for a given template
   */
  getEmailSubject(template, data) {
    const subjects = {
      booking_receipt: `✅ PoleSafe Booking Confirmed — ${data.childName}`,
      payment_receipt: `💰 Payment Receipt — ${data.amount} UGX`,
      ride_receipt: `🚸 Ride Complete — ${data.childName}`,
      credit_notice: `💰 PoleSafe Credit — ${data.amount} UGX`,
      weekly_summary: `📊 Weekly Ride Summary — ${data.childName}`,
      kid_sick_alert: `🩺 ${data.childName} is unwell at school`,
      school_announcement: `📢 ${data.schoolName} Announcement`,
      emergency: `🚨 EMERGENCY — ${data.schoolName}`,
    };
    return subjects[template] || 'PoleSafe Notification';
  }

  /**
   * Build HTML email body for receipts
   * Professional looking receipt template
   */
  buildEmailHtml(template, data) {
    const childName = data.childName || 'Your Child';
    const amount = data.amount || '';
    const schoolName = data.schoolName || '';
    const driverName = data.driverName || '';

    const receiptHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #2E7D32; font-size: 24px; margin: 0;">🚸 PoleSafe</h1>
          <p style="color: #666; font-size: 12px;">From Home to School. And Beyond.</p>
        </div>
        <hr style="border: none; border-top: 1px solid #e0e0e0;">
        ${this.getEmailBody(template, data)}
        <hr style="border: none; border-top: 1px solid #e0e0e0;">
        <div style="text-align: center; color: #999; font-size: 11px; margin-top: 20px;">
          <p>PoleSafe — School Transport. Done Right.</p>
          <p>Need help? WhatsApp: +256700000000 | polesafe.ug</p>
        </div>
      </div>
    `;

    return receiptHtml;
  }

  /**
   * Get the HTML body content for a specific template
   */
  getEmailBody(template, data) {
    switch (template) {
      case 'booking_receipt':
        return `
          <h2 style="color: #2E7D32;">✅ Booking Confirmed</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #666;">Child:</td><td style="padding: 8px 0; font-weight: 600;">${data.childName}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">School:</td><td style="padding: 8px 0;">${data.schoolName}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Schedule:</td><td style="padding: 8px 0;">${data.daysOfWeek} at ${data.pickupTime}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Driver:</td><td style="padding: 8px 0;">${data.driverName}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Total:</td><td style="padding: 8px 0; font-size: 18px; font-weight: 700; color: #2E7D32;">${data.amount} UGX</td></tr>
          </table>
        `;

      case 'payment_receipt':
        return `
          <h2 style="color: #2E7D32;">💰 Payment Received</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #666;">Amount:</td><td style="padding: 8px 0; font-size: 18px; font-weight: 700; color: #2E7D32;">${data.amount} UGX</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Method:</td><td style="padding: 8px 0;">${data.method}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Period:</td><td style="padding: 8px 0;">${data.period}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Receipt No:</td><td style="padding: 8px 0;">${data.receiptNo}</td></tr>
          </table>
        `;

      case 'weekly_summary':
        return `
          <h2 style="color: #2E7D32;">📊 Weekly Ride Summary</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #666;">Child:</td><td style="padding: 8px 0; font-weight: 600;">${data.childName}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Completed Rides:</td><td style="padding: 8px 0; color: #2E7D32; font-weight: 600;">${data.completedTrips}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Missed:</td><td style="padding: 8px 0; color: #E65100;">${data.missedTrips}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Total Spent:</td><td style="padding: 8px 0; font-weight: 600;">${data.totalSpent} UGX</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Credits Available:</td><td style="padding: 8px 0; color: #2E7D32;">${data.credits} UGX</td></tr>
          </table>
        `;

      default:
        return `<p>${data.message || 'PoleSafe notification'}</p>`;
    }
  }

  // ============================================================
  // PUSH — FCM / Expo push notifications
  // ============================================================

  /**
   * Send a push notification to a user via their registered device
   */
  async sendPush(userId, notificationData) {
    try {
      const User = require('mongoose').model('User');
      const user = await User.findById(userId).select('deviceToken devicePlatform');

      if (!user || !user.deviceToken) {
        console.log(`[Push] No device token for user ${userId}`);
        return { success: false, error: 'No device token' };
      }

      const fcmService = require('./fcmService');

      const result = await fcmService.sendPush({
        token: user.deviceToken,
        platform: user.devicePlatform || 'android',
        title: notificationData.title || 'PoleSafe',
        body: notificationData.body || notificationData.message || '',
        data: {
          type: notificationData.type || 'general',
          rideId: notificationData.rideId || '',
          tripId: notificationData.tripId || '',
          childId: notificationData.childId || '',
          bookingId: notificationData.bookingId || '',
          ...(notificationData.data || {}),
        },
      });

      return { success: true, result, channel: 'app_push' };
    } catch (err) {
      console.error(`[Push] Error sending to user ${userId}:`, err.message);
      return { success: false, error: err.message };
    }
  }
}

module.exports = new NotificationService();
