// PoleSafe — Africa's Talking SMS Inbound Webhook
// Receives incoming SMS from feature phone parents
// Africa's Talking forwards SMS to this endpoint when a parent texts
// Mounted at: POST /api/sms/incoming

const express = require('express');
const router = express.Router();
const smsHandler = require('../services/smsHandler');
const smsService = require('../services/smsService');
const { parseFallbackTransport, hamnahTriage } = require('../../lib/engine/hamnah-core.ts');

// ============================================================
// POST /api/sms/incoming — Africa's Talking SMS callback
// ============================================================
router.post('/incoming', async (req, res) => {
  try {
    // Africa's Talking sends SMS in this format:
    // { "from": "256771234567", "text": "BOOK Faith 7AM", "id": "atMsgId123", "date": "2024-01-15T07:30:00Z" }
    const { from, text, id, date } = req.body;

    console.log(`[SMS Inbound] From: ${from} — Text: "${text}" — ID: ${id}`);

    if (!from || !text) {
      return res.status(400).json({ error: 'Missing from or text field' });
    }

    // Sanitize phone number (remove leading +, ensure 256 format)
    const phone = from.replace(/^\+/, '').trim();

    const normalized = parseFallbackTransport(text, 'sms', {
      from: phone,
      requestId: id || `sms-${Date.now()}`,
      tenantId: req.body?.tenantId,
      gateway: 'africas_talking',
    });
    const triage = hamnahTriage(normalized);
    req.hamnah = { normalized, triage };

    // Process the SMS command through the existing handler
    const result = await smsHandler.handleIncomingSms({
      phone,
      message: text.trim(),
      messageId: id || `sms-${Date.now()}`,
      receivedAt: date ? new Date(date) : new Date(),
      hamnah: triage,
    });

    console.log(`[SMS Inbound] Handled: ${result.status || 'ok'}`);

    // Africa's Talking expects a 200 response with "Accepted" to acknowledge receipt
    res.status(200).type('text/plain').send('Accepted');
  } catch (err) {
    console.error('[SMS Inbound] Error:', err.message);
    // Always respond 200 to AT (they'll retry otherwise)
    res.status(200).type('text/plain').send('Accepted');
  }
});

// ============================================================
// POST /api/sms/dlr — Delivery receipt callback
// Africa's Talking sends delivery reports here
// ============================================================
router.post('/dlr', async (req, res) => {
  try {
    const { id, status, phoneNumber, networkCode, failureReason } = req.body;
    
    console.log(`[SMS DLR] ID: ${id} — Status: ${status} — To: ${phoneNumber}`);

    // Log delivery status — can be used for notification tracking
    const { DriverNotification } = require('../database/schema');
    if (id) {
      await DriverNotification.findOneAndUpdate(
        { _id: id },
        {
          delivered: status === 'Success',
          deliveryError: status !== 'Success' ? (failureReason || 'Delivery failed') : undefined,
        }
      ).catch(() => {}); // Don't crash if notification not found
    }

    res.status(200).type('text/plain').send('Accepted');
  } catch (err) {
    console.error('[SMS DLR] Error:', err.message);
    res.status(200).type('text/plain').send('Accepted');
  }
});

// ============================================================
// GET /api/sms/status — Check SMS service status
// ============================================================
router.get('/status', async (req, res) => {
  try {
    const balance = await smsService.getBalance().catch(() => 'Unknown');
    res.json({
      service: 'Africa\'s Talking',
      status: 'active',
      balance,
      webhook: '/api/sms/incoming',
      dlrWebhook: '/api/sms/dlr',
    });
  } catch (err) {
    res.json({ service: 'Africa\'s Talking', status: 'unknown', error: err.message });
  }
});

module.exports = router;
