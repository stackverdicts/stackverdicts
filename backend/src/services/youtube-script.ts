import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import { query, queryOne, insert } from '../config/database';
import { Offer } from '../models/types';
import { generateId } from '../utils/id-generator';
import { logger } from '../utils/logger';

/**
 * YouTube Script Service
 * Handles AI-powered video script generation for YouTube affiliate marketing
 */

// ========== INTERFACES ==========

export interface ScriptGenerationRequest {
  offerId: string;
  videoType: 'review' | 'comparison' | 'educational' | 'personal';
  targetLength: number; // in minutes (8-15 recommended)
  tone?: 'professional' | 'casual' | 'enthusiastic' | 'educational';
  targetAudience?: string;
  personalExperience?: string;
  includeCompetitors?: boolean;
  competitorProducts?: string[];
}

export interface ScriptSection {
  section_title: string;
  content: string;
  estimated_duration: number; // seconds
  visual_suggestions: string;
  b_roll_ideas?: string[];
}

export interface ThumbnailConcept {
  main_text: string;
  subtext?: string;
  visual_style: string;
  color_scheme: string;
  emotion: string;
}

export interface GeneratedScript {
  id: string;
  offer_id: string;
  video_type: string;
  title: string;
  seo_title: string;
  hook: string;
  intro: string;
  main_sections: ScriptSection[];
  cta: string;
  outro: string;
  thumbnail_concepts: ThumbnailConcept[];
  description: string;
  tags: string[];
  timestamps: { time: string; label: string }[];
  keywords: string[];
  estimated_length: number;
  tone: string;
  target_audience: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface VideoTypeMix {
  review?: number;
  comparison?: number;
  educational?: number;
  personal?: number;
}

export interface ScriptFilters {
  status?: string;
  videoType?: string;
  offerId?: string;
  limit?: number;
  offset?: number;
}

// ========== SERVICE CLASS ==========

class YouTubeScriptService {
  private client: Anthropic;
  private model: string;

  constructor() {
    this.client = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    });
    this.model = env.ANTHROPIC_MODEL;
  }

  /**
   * Generate a single YouTube script
   */
  async generateScript(request: ScriptGenerationRequest): Promise<GeneratedScript> {
    const startTime = Date.now();

    try {
      // Fetch offer details
      const offer = await queryOne<Offer>(
        'SELECT * FROM offers WHERE id = ?',
        [request.offerId]
      );

      if (!offer) {
        throw new Error(`Offer ${request.offerId} not found`);
      }

      await logger.info('YouTubeScript', 'Generating video script', {
        offerId: request.offerId,
        offerName: offer.name,
        videoType: request.videoType,
      });

      // Build the prompt
      const prompt = this.buildScriptPrompt(offer, request);

      // Call Claude API
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const generationTime = Date.now() - startTime;

      // Parse response
      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const parsedScript = this.parseClaudeResponse(content.text);

      // Save to database
      const scriptId = generateId('script');

      await insert(
        `INSERT INTO youtube_scripts (
          id, offer_id, video_type, title, seo_title, hook, intro,
          main_content, cta, outro, thumbnail_text, description, tags,
          timestamps, keywords, estimated_length, target_audience, tone, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          scriptId,
          request.offerId,
          request.videoType,
          parsedScript.title,
          parsedScript.seo_title,
          parsedScript.hook,
          parsedScript.intro,
          JSON.stringify(parsedScript.main_sections),
          parsedScript.cta,
          parsedScript.outro,
          parsedScript.thumbnail_concepts[0]?.main_text || null,
          parsedScript.description,
          JSON.stringify(parsedScript.tags),
          JSON.stringify(parsedScript.timestamps),
          JSON.stringify(parsedScript.keywords),
          request.targetLength,
          request.targetAudience || 'general',
          request.tone || 'casual',
          'draft'
        ]
      );

      await logger.success('YouTubeScript', 'Script generated successfully', {
        scriptId,
        offerId: request.offerId,
        generationTime,
      });

      return {
        id: scriptId,
        offer_id: request.offerId,
        video_type: request.videoType,
        ...parsedScript,
        tone: request.tone || 'casual',
        target_audience: request.targetAudience || 'general',
        status: 'draft',
        estimated_length: request.targetLength,
        created_at: new Date(),
        updated_at: new Date(),
      };
    } catch (error) {
      await logger.error('YouTubeScript', 'Script generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        offerId: request.offerId,
      });
      throw error;
    }
  }

  /**
   * Bulk generate multiple scripts
   */
  async bulkGenerate(
    offerId: string,
    count: number,
    mix: VideoTypeMix
  ): Promise<GeneratedScript[]> {
    const scripts: GeneratedScript[] = [];

    // Calculate how many of each type
    const videoTypes: Array<'review' | 'comparison' | 'educational' | 'personal'> = [];

    if (mix.review) {
      const reviewCount = Math.round(count * mix.review);
      for (let i = 0; i < reviewCount; i++) {
        videoTypes.push('review');
      }
    }

    if (mix.comparison) {
      const comparisonCount = Math.round(count * mix.comparison);
      for (let i = 0; i < comparisonCount; i++) {
        videoTypes.push('comparison');
      }
    }

    if (mix.educational) {
      const educationalCount = Math.round(count * mix.educational);
      for (let i = 0; i < educationalCount; i++) {
        videoTypes.push('educational');
      }
    }

    if (mix.personal) {
      const personalCount = Math.round(count * mix.personal);
      for (let i = 0; i < personalCount; i++) {
        videoTypes.push('personal');
      }
    }

    // Fill remaining with reviews if needed
    while (videoTypes.length < count) {
      videoTypes.push('review');
    }

    // Generate each script
    for (const videoType of videoTypes.slice(0, count)) {
      try {
        const script = await this.generateScript({
          offerId,
          videoType,
          targetLength: 10,
        });
        scripts.push(script);
      } catch (error) {
        console.error(`Failed to generate ${videoType} script:`, error);
      }
    }

    return scripts;
  }

  /**
   * Regenerate a specific section
   */
  async regenerateSection(scriptId: string, section: string): Promise<string> {
    const script = await this.getScript(scriptId);
    if (!script) {
      throw new Error('Script not found');
    }

    const offer = await queryOne<Offer>(
      'SELECT * FROM offers WHERE id = ?',
      [script.offer_id]
    );

    if (!offer) {
      throw new Error('Offer not found');
    }

    const prompt = this.buildSectionRegeneratePrompt(offer, script, section);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Update the specific section in database
    await query(
      `UPDATE youtube_scripts SET ${section} = ?, updated_at = NOW() WHERE id = ?`,
      [content.text, scriptId]
    );

    return content.text;
  }

  /**
   * Get a single script by ID
   */
  async getScript(scriptId: string): Promise<GeneratedScript | null> {
    const result = await queryOne<any>(
      'SELECT * FROM youtube_scripts WHERE id = ?',
      [scriptId]
    );

    if (!result) {
      return null;
    }

    return this.parseDBScript(result);
  }

  /**
   * Get all scripts with filters
   */
  async getAllScripts(filters?: ScriptFilters): Promise<GeneratedScript[]> {
    let sql = 'SELECT * FROM youtube_scripts WHERE 1=1';
    const params: any[] = [];

    if (filters?.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters?.videoType) {
      sql += ' AND video_type = ?';
      params.push(filters.videoType);
    }

    if (filters?.offerId) {
      sql += ' AND offer_id = ?';
      params.push(filters.offerId);
    }

    sql += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters?.offset) {
      sql += ' OFFSET ?';
      params.push(filters.offset);
    }

    const results = await query<any>(sql, params);
    return results.map(r => this.parseDBScript(r));
  }

  /**
   * Update script status
   */
  async updateScriptStatus(scriptId: string, status: string): Promise<void> {
    await query(
      'UPDATE youtube_scripts SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, scriptId]
    );
  }

  /**
   * Delete a script
   */
  async deleteScript(scriptId: string): Promise<void> {
    await query('DELETE FROM youtube_scripts WHERE id = ?', [scriptId]);
  }

  // ========== PRIVATE HELPER METHODS ==========

  /**
   * Build the Claude AI prompt for script generation
   */
  private buildScriptPrompt(offer: Offer, request: ScriptGenerationRequest): string {
    const videoTypeInstructions = this.getVideoTypeInstructions(request.videoType);

    return `You are an expert YouTube scriptwriter specializing in affiliate product reviews and comparisons in the health/wellness/supplements space.

Your scripts are known for:
- High viewer retention (keep people watching)
- Natural, conversational tone (not salesy)
- Honest, balanced reviews (pros AND cons)
- Strong hooks that stop scrolling
- Clear value proposition
- Authentic personal touch
- FTC-compliant affiliate disclosures

OFFER DETAILS:
Product Name: ${offer.name}
Description: ${offer.description || 'Not provided'}
Payout: $${offer.payout}
Vertical: ${offer.vertical || 'General'}
Target Countries: ${offer.countries ? JSON.stringify(offer.countries) : 'Global'}

VIDEO PARAMETERS:
Type: ${request.videoType}
Target Length: ${request.targetLength} minutes
Tone: ${request.tone || 'casual'}
Target Audience: ${request.targetAudience || 'general'}
${request.personalExperience ? `Personal Experience Notes: ${request.personalExperience}` : ''}

${videoTypeInstructions}

CRITICAL REQUIREMENTS:
1. Hook must grab attention in first 5 seconds
2. Never make medical/health claims (say "may support" not "will cure")
3. Include FTC disclosure naturally in script
4. Provide genuine value, not just a sales pitch
5. Be conversational - write how people actually talk
6. Include natural pauses and transitions
7. Use "you" language to connect with viewer
8. Build trust through transparency and honesty
9. Include specific details and examples
10. End with clear but non-pushy call to action

STRUCTURE REQUIREMENTS:
- Hook: 15-20 seconds (critical for retention)
- Intro: 30-45 seconds (set expectations)
- Main Content: ${request.targetLength - 2} minutes (deliver value)
- CTA: 45-60 seconds (natural transition to offer)
- Outro: 15-20 seconds (subscribe reminder)

Return response as JSON with this exact structure:
{
  "title": "Engaging, keyword-rich title 50-70 chars",
  "seo_title": "Optimized version for YouTube search",
  "hook": "First 15-20 seconds script text",
  "intro": "Introduction script text",
  "main_sections": [
    {
      "section_title": "Section name for timestamps",
      "content": "Full script text for this section",
      "estimated_duration": 120,
      "visual_suggestions": "What to show on screen",
      "b_roll_ideas": ["idea 1", "idea 2"]
    }
  ],
  "cta": "Call to action script text with affiliate disclosure",
  "outro": "Ending script text",
  "thumbnail_concepts": [
    {
      "main_text": "3-5 words for thumbnail",
      "subtext": "Optional smaller text",
      "visual_style": "Description of visual",
      "color_scheme": "Color recommendations",
      "emotion": "Facial expression/mood"
    }
  ],
  "description": "Full YouTube description with timestamps, links, keywords",
  "tags": ["tag1", "tag2"],
  "timestamps": [
    {"time": "0:00", "label": "Intro"},
    {"time": "0:45", "label": "What is ${offer.name}"}
  ],
  "keywords": ["primary keyword", "secondary keyword"]
}`;
  }

  /**
   * Get video type specific instructions
   */
  private getVideoTypeInstructions(videoType: string): string {
    switch (videoType) {
      case 'review':
        return `VIDEO TYPE: PRODUCT REVIEW
- Focus on personal experience and results
- Include honest pros and cons
- Show before/after if applicable
- Address common questions
- Compare to alternatives briefly`;

      case 'comparison':
        return `VIDEO TYPE: PRODUCT COMPARISON
- Compare 3-5 similar products
- Use objective criteria
- Show pros/cons of each
- Recommend best for different use cases
- Be fair and balanced`;

      case 'educational':
        return `VIDEO TYPE: EDUCATIONAL CONTENT
- Teach something valuable first
- Build authority and trust
- Mention product naturally as solution
- Focus 80% education, 20% promotion
- Provide actionable takeaways`;

      case 'personal':
        return `VIDEO TYPE: PERSONAL STORY
- Share authentic journey
- Be vulnerable and real
- Show transformation
- Inspire and motivate
- Product as part of solution, not THE solution`;

      default:
        return '';
    }
  }

  /**
   * Build prompt for regenerating a specific section
   */
  private buildSectionRegeneratePrompt(
    offer: Offer,
    script: GeneratedScript,
    section: string
  ): string {
    return `Regenerate the ${section} section for this YouTube video script.

Product: ${offer.name}
Video Type: ${script.video_type}
Current ${section}: ${(script as any)[section]}

Generate a new version that is:
- More engaging
- Better at retention
- More natural and conversational
- Optimized for the target audience

Return only the new ${section} text, no JSON or other formatting.`;
  }

  /**
   * Parse Claude's JSON response
   */
  private parseClaudeResponse(text: string): any {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;

      return JSON.parse(jsonText);
    } catch (error) {
      throw new Error(`Failed to parse Claude response: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
    }
  }

  /**
   * Parse database result to GeneratedScript
   */
  private parseDBScript(dbRow: any): GeneratedScript {
    return {
      id: dbRow.id,
      offer_id: dbRow.offer_id,
      video_type: dbRow.video_type,
      title: dbRow.title,
      seo_title: dbRow.seo_title,
      hook: dbRow.hook,
      intro: dbRow.intro,
      main_sections: typeof dbRow.main_content === 'string'
        ? JSON.parse(dbRow.main_content)
        : dbRow.main_content,
      cta: dbRow.cta,
      outro: dbRow.outro,
      thumbnail_concepts: dbRow.thumbnail_text
        ? [{ main_text: dbRow.thumbnail_text, subtext: '', visual_style: '', color_scheme: '', emotion: '' }]
        : [],
      description: dbRow.description,
      tags: typeof dbRow.tags === 'string' ? JSON.parse(dbRow.tags) : dbRow.tags,
      timestamps: typeof dbRow.timestamps === 'string'
        ? JSON.parse(dbRow.timestamps)
        : dbRow.timestamps,
      keywords: typeof dbRow.keywords === 'string'
        ? JSON.parse(dbRow.keywords)
        : dbRow.keywords,
      estimated_length: dbRow.estimated_length,
      tone: dbRow.tone,
      target_audience: dbRow.target_audience,
      status: dbRow.status,
      created_at: dbRow.created_at,
      updated_at: dbRow.updated_at,
    };
  }
}

export const youtubeScriptService = new YouTubeScriptService();
