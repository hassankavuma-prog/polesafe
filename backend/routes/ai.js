// Hamna — PoleSafe AI Assistant Routes
// Chat endpoints for app, web, and SMS integration

const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const aiService = require('../services/aiService');
const hamnaAnalysisService = require('../services/hamnaAnalysisService');
const User = require('mongoose').model('User');
const Child = require('mongoose').model('Child');
const { z } = require('zod');
const { validateTenantScopedQuery } = require('../../lib/engine/hamnah-core.ts');

// ============================================================
// POST /api/hamna/chat — Chat with Hamna (app + web)
// ============================================================
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length < 1) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Gather user context for Hamna
    const user = await User.findById(req.userId).select('name role phone');
    const kids = await Child.find({ parentId: req.userId }).select('name class schoolId');

    const context = {
      userId: req.userId,
      role: user?.role || 'parent',
      name: user?.name || 'User',
      kids: kids.map(k => ({ name: k.name, class: k.class })),
      source: 'chat',
    };

    const result = await aiService.chat(message.trim(), context);

    res.json({
      response: result.response || 'Sorry, Hamna could not understand that.',
      action: result.action || 'none',
      data: result.data || {},
    });
  } catch (err) {
    console.error('[Hamna] Chat error:', err.message);
    res.status(500).json({ error: 'Hamna is having trouble right now. Please try again.' });
  }
});

// ============================================================
// POST /api/hamna/sms-parse — Parse SMS text (for SMS gateway)
// ============================================================
router.post('/sms-parse', async (req, res) => {
  try {
    const { text, phone } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Look up user by phone to get context
    const smsLookupSchema = z.object({ phone: z.string().min(7) }).strict();
    const smsScope = phone ? validateTenantScopedQuery(smsLookupSchema, { phone }, phone, ['ai:sms-parse']) : null;
    const user = phone ? await User.findOne(smsScope.tenantScopedQuery) : null;
    const kids = user ? await Child.find({ parentId: user._id }).select('name class') : [];

    const context = {
      name: user?.name || 'Unknown',
      kids: kids.map(k => ({ name: k.name, class: k.class })),
    };

    const result = await aiService.parseSms(text.trim(), context);

    res.json({
      intent: result.intent || 'unknown',
      entities: result.entities || {},
      confidence: result.confidence || 0,
      response: result.response || 'Sorry, Hamna could not understand that.',
    });
  } catch (err) {
    console.error('[Hamna] SMS parse error:', err.message);
    res.status(500).json({ error: 'Hamna is having trouble right now.' });
  }
});

// ============================================================
// POST /api/hamna/support — Escalate to Hamna support
// ============================================================
router.post('/support', authMiddleware, async (req, res) => {
  try {
    const { issue } = req.body;

    if (!issue) {
      return res.status(400).json({ error: 'Please describe your issue' });
    }

    const user = await User.findById(req.userId).select('name role phone');
    const kids = await Child.find({ parentId: req.userId }).select('name');

    const result = await aiService.handleSupport(req.userId, issue, {
      name: user?.name,
      role: user?.role,
      phone: user?.phone,
      kids: kids.map(k => k.name),
      source: 'chat',
    });

    res.json(result);
  } catch (err) {
    console.error('[Hamna] Support error:', err.message);
    res.status(500).json({ error: 'Failed to process support request.' });
  }
});

// ============================================================
// GET /api/hamna/health — Check if Hamna is alive
// ============================================================
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'Hamna',
    version: '1.0.0',
    model: process.env.HAMNA_MODEL || 'openai/gpt-4o-mini',
    configured: !!process.env.OPENROUTER_API_KEY,
  });
});

// ============================================================
// GET /api/hamna/analyze-driver/:id — Hamna analyzes driver documents
// ============================================================
router.get('/analyze-driver/:id', authMiddleware, async (req, res) => {
  try {
    const driverSchema = z.object({ id: z.string().min(1) }).strict();
    validateTenantScopedQuery(driverSchema, { id: req.params.id }, req.userId, ['ai:driver-analysis']);
    const analysis = await hamnaAnalysisService.analyzeDriverDocuments(req.params.id);
    res.json({ analysis });
  } catch (err) {
    console.error('[Hamna] Analysis error:', err.message);
    res.status(500).json({ error: 'Hamna could not analyze this driver right now.' });
  }
});

// ============================================================
// GET /api/hamna/system-anomalies — Hamna checks entire system
// ============================================================
router.get('/system-anomalies', authMiddleware, async (req, res) => {
  try {
    const anomalies = await hamnaAnalysisService.checkSystemAnomalies();
    res.json({ anomalies });
  } catch (err) {
    console.error('[Hamna] System anomaly check error:', err.message);
    res.status(500).json({ error: 'Hamna system check failed.' });
  }
});

module.exports = router;
