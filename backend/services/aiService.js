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

  /**
   * Moderate community content for the Safety Board, Blog, and comments
   * Detects abuse, hate speech, spam, off-topic content
   * Supports Luganda, Swahili, English, and other East African languages
   *
   * @param {object|string} content - The content to moderate (string or { title, body, role })
   * @param {string} type - The type of content: 'post', 'comment', or 'blog'
   * @returns {object} { status: 'approved'|'rejected'|'pending'|'flagged', reason, category }
   */
  async moderateCommunityContent(content, type = 'post') {
    const text = typeof content === 'string' ? content : `${content.title || ''} ${content.body || content.description || ''}`;
    const role = content.role || 'unknown';

    const systemPrompt = `You are Hamna, PoleSafe's AI community moderator in Uganda. You review content posted by parents, teachers, drivers, and community members.

Your job: Check if the content is safe, constructive, and on-topic. Content may be in English, Luganda, Swahili, or other Ugandan/East African languages.

MODERATION RULES:
1. BLOCK (rejected): Hate speech, personal attacks, threats, harassment, explicit content, spam, phishing
2. FLAG (flagged): Heated/potentially toxic tone, targeting specific individuals indirectly, off-topic but not malicious
3. APPROVE (approved): Constructive discussion, safety concerns, questions, suggestions, positive content

CATEGORIZE the content type:
- "route_safety" — Road safety, traffic, driver routes
- "driver_behavior" — Driver conduct, professionalism
- "school_policy" — School rules, admin decisions
- "pickup_delay" — Late pickups, scheduling issues
- "general" — General discussion
- "parenting" — Parenting tips, child advice
- "safety_tips" — Safety advice and recommendations
- "teaching" — Teaching-related content
- "polesafe_updates" — About PoleSafe platform
- "community_voices" — Personal stories, community topics
- "other" — Anything else

Return ONLY valid JSON:
{
  "status": "approved|rejected|flagged|pending",
  "reason": "Brief explanation in English",
  "category": "category_id",
  "confidence": 0.0-1.0,
  "language": "en|lg|sw|other",
  "containsAbuse": false,
  "offensiveTermsFound": []
}

For content you're uncertain about (rare language, ambiguous tone), return status "pending" for manual review.

Content role: ${role}
Content type: ${type}`;

    return await this._callLLM(systemPrompt, text);
  }

  /**
   * Detect the language of a text
   * Used for blog posts and community content
   *
   * @param {string} text - Text to analyze
   * @returns {object} { language: 'en'|'lg'|'sw'|'other', confidence }
   */
  async detectLanguage(text) {
    const systemPrompt = `Detect the primary language of the following text. Return ONLY valid JSON:
{
  "language": "en|lg|sw|run|ach|teo|lug|other",
  "confidence": 0.0-1.0,
  "languageName": "English|Luganda|Swahili|Runyankole|Acholi|Ateso|Lugbara|Other"
}

Language codes:
- en: English
- lg: Luganda
- sw: Swahili
- run: Runyankole/Rukiga
- ach: Acholi
- teo: Ateso
- lug: Lugbara`;

    return await this._callLLM(systemPrompt, text);
  }

  /**
   * Analyze a feature suggestion and provide insight
   *
   * @param {object} suggestion - { title, description }
   * @returns {string} - Hamna's analysis text
   */
  async analyzeFeatureSuggestion(suggestion) {
    const systemPrompt = `You are Hamna, PoleSafe's product analyst. You evaluate feature suggestions from the community.

Given a feature suggestion, provide a brief analysis covering:
1. Value to the community (parents, drivers, schools, riders)
2. Estimated complexity (simple/moderate/complex)
3. Any similar features already in PoleSafe
4. Potential impact on safety

Keep your analysis to 2-3 sentences. Be constructive and direct.`;

    const result = await this._callLLM(systemPrompt, 
      `Title: ${suggestion.title}\nDescription: ${suggestion.description}`);
    
    return result.analysis || result.response || '';
  }

  /**
   * Get trending topics from recent Safety Board discussions
   *
   * @param {Array} recentPosts - Array of { title, body, category } from last 24h
   * @returns {object} { trends: [{ topic, urgency, mentions }], alert: boolean }
   */
  async detectTrends(recentPosts) {
    if (!recentPosts || recentPosts.length === 0) {
      return { trends: [], alert: false };
    }

    const systemPrompt = `You are Hamna, PoleSafe's community trend analyst. Review recent Safety Board posts and detect:
1. Emerging safety concerns that need immediate attention
2. Repeated mentions of the same issue (e.g., multiple parents complaining about the same driver)
3. Topics gaining momentum

Return ONLY valid JSON:
{
  "trends": [
    {
      "topic": "Brief topic description",
      "urgency": "low|medium|high",
      "mentions": number,
      "summary": "One-line summary"
    }
  ],
  "alert": true/false,
  "alertReason": "If alert is true, why"
}`;

    const postsText = recentPosts.map((p, i) => 
      `[${i + 1}] Category: ${p.category}\nTitle: ${p.title}\nBody: ${p.body.substring(0, 200)}`
    ).join('\n---\n');

    return await this._callLLM(systemPrompt, postsText);
  }

  /**
   * Generate a summary of a long discussion thread
   */
  async summarizeThread(posts) {
    const systemPrompt = `Summarize the following Safety Board discussion into 2-3 key points. Be concise and neutral. Return ONLY valid JSON:
{
  "summary": "2-3 sentence summary",
  "keyPoints": ["point 1", "point 2"],
  "sentiment": "positive|negative|neutral|mixed",
  "resolution": "resolved|ongoing|escalated"
}`;

    const threadText = posts.map(p => `[${p.role || 'User'}]: ${p.body?.substring(0, 300) || ''}`).join('\n');
    return await this._callLLM(systemPrompt, threadText);
  }

  /**
   * Suggest a blog post topic based on recent Safety Board discussions
   */
  async suggestBlogTopic(recentDiscussions) {
    const systemPrompt = `Based on recent Safety Board discussions, suggest a blog post topic that would help the PoleSafe community. Return ONLY valid JSON:
{
  "title": "Suggested blog title",
  "category": "parenting|safety_tips|teaching|community_voices",
  "rationale": "Why this topic matters now",
  "suggestedTags": ["tag1", "tag2"]
}`;

    const discussions = recentDiscussions.map(d => d.title || d.body?.substring(0, 100)).filter(Boolean).join(', ');
    return await this._callLLM(systemPrompt, discussions || 'No recent discussions');
  }
}

module.exports = new AiService();
