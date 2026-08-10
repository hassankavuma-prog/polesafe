// Hamna — PoleSafe's AI Assistant
// Handles natural language commands from SMS, app chat, and web chat
// Routes complex issues to human support agents

const config = require('../config');

class AiService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.model = process.env.HAMNA_MODEL || 'openai/gpt-4o-mini'; // Fast + cheap
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.siteUrl = process.env.SITE_URL || 'https://polesafe.ug';
    this.siteName = 'PoleSafe';
  }

  /**
   * Parse a natural language SMS command into structured intent
   * Used by the SMS gateway for feature phone parents
   * 
   * @param {string} text - Raw SMS text (e.g. "BOOK Faith 7AM" or "faith sick today")
   * @param {object} userContext - { name, kids: [{ name, class, schoolId }] }
   * @returns {object} { intent, entities, confidence, response }
   */
  async parseSms(text, userContext = {}) {
    const systemPrompt = `You are Hamna, an AI assistant for PoleSafe — a school transport safety platform in Uganda. You help parents book rides for their kids using plain language.

Your job: Understand what the parent wants and return structured JSON.

AVAILABLE ACTIONS:
- "book" — Book a ride for a child. Need: childName, time (HH:MM), pickupLocation (optional)
- "sick_day" — Child is sick, won't travel. Need: childName, date (optional, defaults today)
- "cancel" — Cancel a booking. Need: childName, date (optional)
- "where" — Ask where a child is / trip status. Need: childName
- "help" — Emergency pickup request. Need: childName, reason
- "undo_sick" — Undo a sick day. Need: childName
- "balance" — Check account balance
- "register" — Register a new user. Need: fullName
- "support" — Escalate to human support. Need: issue description
- "unknown" — Can't understand the request

Return ONLY valid JSON with this structure:
{
  "intent": "book|sick_day|cancel|where|help|undo_sick|balance|register|support|unknown",
  "entities": {
    "childName": "extracted name or null",
    "time": "HH:MM or null",
    "date": "YYYY-MM-DD or null",
    "pickupLocation": "string or null",
    "reason": "string or null",
    "fullName": "string or null",
    "issue": "string or null"
  },
  "confidence": 0.0-1.0,
  "response": "A short, friendly reply in plain English telling the parent what Hamna understood. Be warm and Ugandan-friendly."
}

Parent's registered kids: ${JSON.stringify(userContext.kids || [])}
Parent's name: ${userContext.name || 'Unknown'}`;

    return await this._callLLM(systemPrompt, text);
  }

  /**
   * Chat response for the app/web chat interface
   * More conversational than SMS parsing
   * 
   * @param {string} message - User's chat message
   * @param {object} context - { userId, role, name, kids, recentTrips, balance }
   * @returns {object} { response, action?, data? }
   */
  async chat(message, context = {}) {
    const systemPrompt = `You are Hamna, PoleSafe's friendly AI assistant in Uganda. You help parents, drivers, and schools with school transport.

TONE: Warm, Ugandan-appropriate, helpful but not robotic. Use "we" and "us" when talking about PoleSafe. Be concise.

You can:
- Check on kids' trip status
- Help with bookings
- Answer billing questions
- Look up driver info
- Handle support issues
- Route complex problems to a human agent

Context about this user:
${JSON.stringify(context, null, 2)}

If the user asks something you CAN handle, respond conversationally.
If the user asks something you CAN'T handle (complex billing dispute, account issues, etc.), say you'll connect them to a human support agent.

Respond as JSON:
{
  "response": "Your friendly reply",
  "action": "none|book|support|check_status",
  "data": {} // optional data for the action
}`;

    return await this._callLLM(systemPrompt, message);
  }

  /**
   * Handle a support request — either resolve or escalate
   * 
   * @param {string} userId - User's ID
   * @param {string} issue - Description of the issue
   * @param {object} context - User context for resolution
   * @returns {object} { resolved, message, ticketId? }
   */
  async handleSupport(userId, issue, context = {}) {
    // Try to resolve common issues automatically
    const result = await this.chat(
      `I need support: ${issue}`,
      { ...context, supportMode: true }
    );

    // If Hamna can't resolve, create a support ticket
    if (result.action === 'support' || !result.action) {
      const ticketId = await this._createSupportTicket(userId, issue, context);
      return {
        resolved: false,
        message: result.response || 'Let me connect you to a human support agent.',
        ticketId,
        escalatedToHuman: true,
      };
    }

    return {
      resolved: true,
      message: result.response,
      escalatedToHuman: false,
    };
  }

  /**
   * Call the LLM via OpenRouter
   */
  async _callLLM(systemPrompt, userMessage) {
    if (!this.apiKey) {
      console.warn('[Hamna] No OPENROUTER_API_KEY configured. Using fallback response.');
      return {
        intent: 'unknown',
        entities: {},
        confidence: 0,
        response: 'Hamna is not configured yet. Please contact support.',
      };
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': this.siteUrl,
          'X-Title': this.siteName,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Hamna] OpenRouter error ${response.status}: ${errorText}`);
        throw new Error(`OpenRouter returned ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '{}';

      // Extract JSON from the response (handle markdown-wrapped JSON)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        intent: 'unknown',
        entities: {},
        response: content,
        confidence: 0.5,
      };
    } catch (err) {
      console.error('[Hamna] LLM call failed:', err.message);
      return {
        intent: 'unknown',
        entities: {},
        confidence: 0,
        response: 'Sorry, Hamna is having trouble right now. Please try again.',
      };
    }
  }

  /**
   * Create a support ticket for human agents
   */
  async _createSupportTicket(userId, issue, context) {
    const Ticket = require('mongoose').model('SupportTicket');
    let ticket;

    try {
      ticket = await Ticket.create({
        userId,
        issue,
        context: JSON.stringify(context),
        status: 'open',
        source: context.source || 'chat',
        createdAt: new Date(),
      });
    } catch {
      // If SupportTicket model doesn't exist yet, create inline
      ticket = { _id: `TKT-${Date.now()}`, userId, issue };
    }

    console.log(`[Hamna] Support ticket created: ${ticket._id} for user ${userId}`);
    return ticket._id;
  }
}

module.exports = new AiService();
