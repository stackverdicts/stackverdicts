import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import { query, queryOne, insert } from '../config/database';
import { generateId } from '../utils/id-generator';
import { logger } from '../utils/logger';

interface Offer {
  id: string;
  name: string;
  description: string | null;
  payout: number;
  vertical: string | null;
  countries: string[] | null;
}

interface PageGenerationRequest {
  offerId: string;
  siteId?: string;
  templateType: 'review' | 'comparison' | 'listicle' | 'educational' | 'squeeze';
  pageName: string;
  targetKeywords?: string[];
  includeLeadCapture?: boolean;
  includeVideoEmbed?: boolean;
  tone?: 'professional' | 'casual' | 'enthusiastic' | 'trustworthy';
}

interface GeneratedLandingPage {
  id: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  heroSection: {
    headline: string;
    subheadline: string;
    ctaButtonText: string;
    backgroundImage?: string;
  };
  sections: Array<{
    type: 'hero' | 'features' | 'benefits' | 'testimonials' | 'faq' | 'cta' | 'comparison' | 'pricing';
    title?: string;
    content: any;
  }>;
  leadCaptureForm?: {
    headline: string;
    subheadline: string;
    buttonText: string;
    fields: string[];
  };
}

interface VariantCreationRequest {
  pageId: string;
  variantName: string;
  heroHeadline: string;
  heroSubheadline: string;
  ctaButtonText: string;
  ctaButtonColor?: string;
  sectionsOverride?: any;
  trafficAllocation?: number;
}

interface LeadCaptureData {
  pageId: string;
  variantId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  additionalFields?: Record<string, any>;
  sourceUrl?: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  utmParams?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
}

class LandingPageService {
  private client: Anthropic;
  private model = 'claude-3-5-sonnet-20241022';

  constructor() {
    this.client = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Generate a complete landing page with Claude AI
   */
  async generateLandingPage(request: PageGenerationRequest): Promise<GeneratedLandingPage> {
    try {
      await logger.info('LandingPageService', 'Generating landing page', {
        offerId: request.offerId,
        templateType: request.templateType,
      });

      // Fetch offer details
      const offer = await queryOne<Offer>(
        'SELECT * FROM offers WHERE id = ?',
        [request.offerId]
      );

      if (!offer) {
        throw new Error('Offer not found');
      }

      // Build specialized prompt based on template type
      const prompt = this.buildPagePrompt(offer, request);

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

      // Parse response
      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const parsedPage = this.parseClaudeResponse(content.text);

      // Generate unique slug
      const baseSlug = request.pageName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const slug = await this.generateUniqueSlug(baseSlug);

      // Save to database
      const pageId = generateId('page');

      await insert(
        `INSERT INTO landing_pages (
          id, offer_id, site_id, slug, page_name, template_type,
          seo_title, seo_description, seo_keywords,
          hero_section, sections, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
        [
          pageId,
          request.offerId,
          request.siteId || null,
          slug,
          request.pageName,
          request.templateType,
          parsedPage.seoTitle,
          parsedPage.seoDescription,
          JSON.stringify(request.targetKeywords || []),
          JSON.stringify(parsedPage.heroSection),
          JSON.stringify(parsedPage.sections),
        ]
      );

      await logger.info('LandingPageService', 'Landing page generated successfully', {
        pageId,
        slug,
      });

      return {
        id: pageId,
        slug,
        ...parsedPage,
      };
    } catch (error) {
      await logger.error('LandingPageService', 'Failed to generate landing page', {
        error: error instanceof Error ? error.message : 'Unknown error',
        offerId: request.offerId,
      });
      throw error;
    }
  }

  /**
   * Create A/B test variant for a page
   */
  async createVariant(request: VariantCreationRequest): Promise<any> {
    try {
      // Check if page exists
      const page = await queryOne(
        'SELECT id FROM landing_pages WHERE id = ?',
        [request.pageId]
      );

      if (!page) {
        throw new Error('Landing page not found');
      }

      // Count existing variants
      const variantCount = await queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM landing_page_variants WHERE page_id = ?',
        [request.pageId]
      );

      const variantLetter = String.fromCharCode(65 + (variantCount?.count || 0)); // A, B, C, etc.

      const variantId = generateId('variant');

      await insert(
        `INSERT INTO landing_page_variants (
          id, page_id, variant_name, variant_letter,
          hero_headline, hero_subheadline, cta_button_text, cta_button_color,
          sections_override, traffic_allocation, is_control
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          variantId,
          request.pageId,
          request.variantName,
          variantLetter,
          request.heroHeadline,
          request.heroSubheadline,
          request.ctaButtonText,
          request.ctaButtonColor || '#3b82f6',
          JSON.stringify(request.sectionsOverride || {}),
          request.trafficAllocation || 50.0,
          variantCount?.count === 0, // First variant is control
        ]
      );

      const variant = await queryOne(
        'SELECT * FROM landing_page_variants WHERE id = ?',
        [variantId]
      );

      await logger.info('LandingPageService', 'Variant created', {
        variantId,
        pageId: request.pageId,
      });

      return variant;
    } catch (error) {
      await logger.error('LandingPageService', 'Failed to create variant', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Capture lead from landing page
   */
  async captureLead(data: LeadCaptureData): Promise<any> {
    try {
      // Check if page exists
      const page = await queryOne(
        'SELECT id FROM landing_pages WHERE id = ?',
        [data.pageId]
      );

      if (!page) {
        throw new Error('Landing page not found');
      }

      // Check for duplicate email on this page (within last 24 hours)
      const existingLead = await queryOne(
        `SELECT id FROM landing_page_leads
         WHERE page_id = ? AND email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
        [data.pageId, data.email]
      );

      if (existingLead) {
        throw new Error('Email already submitted recently');
      }

      const leadId = generateId('lead');

      await insert(
        `INSERT INTO landing_page_leads (
          id, page_id, variant_id, email, first_name, last_name, phone,
          additional_fields, source_url, referrer, user_agent, ip_address,
          utm_source, utm_medium, utm_campaign, utm_term, utm_content
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          leadId,
          data.pageId,
          data.variantId || null,
          data.email,
          data.firstName || null,
          data.lastName || null,
          data.phone || null,
          JSON.stringify(data.additionalFields || {}),
          data.sourceUrl || null,
          data.referrer || null,
          data.userAgent || null,
          data.ipAddress || null,
          data.utmParams?.source || null,
          data.utmParams?.medium || null,
          data.utmParams?.campaign || null,
          data.utmParams?.term || null,
          data.utmParams?.content || null,
        ]
      );

      // Update variant conversion count if variant provided
      if (data.variantId) {
        await query(
          `UPDATE landing_page_variants
           SET conversions = conversions + 1,
               conversion_rate = (conversions + 1) / GREATEST(views, 1) * 100
           WHERE id = ?`,
          [data.variantId]
        );
      }

      const lead = await queryOne(
        'SELECT * FROM landing_page_leads WHERE id = ?',
        [leadId]
      );

      await logger.info('LandingPageService', 'Lead captured', {
        leadId,
        pageId: data.pageId,
        email: data.email,
      });

      return lead;
    } catch (error) {
      await logger.error('LandingPageService', 'Failed to capture lead', {
        error: error instanceof Error ? error.message : 'Unknown error',
        pageId: data.pageId,
      });
      throw error;
    }
  }

  /**
   * Track page view and update analytics
   */
  async trackPageView(pageId: string, variantId?: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Update variant views if provided
      if (variantId) {
        await query(
          'UPDATE landing_page_variants SET views = views + 1 WHERE id = ?',
          [variantId]
        );
      }

      // Upsert analytics record
      await query(
        `INSERT INTO landing_page_analytics (id, page_id, variant_id, date, views, unique_visitors)
         VALUES (?, ?, ?, ?, 1, 1)
         ON DUPLICATE KEY UPDATE
           views = views + 1,
           unique_visitors = unique_visitors + 1`,
        [generateId('analytics'), pageId, variantId || null, today]
      );

      await logger.debug('LandingPageService', 'Page view tracked', {
        pageId,
        variantId,
      });
    } catch (error) {
      await logger.error('LandingPageService', 'Failed to track page view', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get page by slug
   */
  async getPageBySlug(slug: string): Promise<any> {
    const page = await queryOne(
      `SELECT lp.*, o.name as offer_name, o.payout
       FROM landing_pages lp
       LEFT JOIN offers o ON lp.offer_id = o.id
       WHERE lp.slug = ? AND lp.status = 'published'`,
      [slug]
    );

    if (!page) {
      throw new Error('Page not found or not published');
    }

    // Get active variants for A/B testing
    const variants = await query(
      'SELECT * FROM landing_page_variants WHERE page_id = ? ORDER BY is_control DESC',
      [page.id]
    );

    return {
      ...page,
      variants,
    };
  }

  /**
   * Publish landing page
   */
  async publishPage(pageId: string): Promise<void> {
    await query(
      `UPDATE landing_pages
       SET status = 'published', published_at = NOW()
       WHERE id = ?`,
      [pageId]
    );

    await logger.info('LandingPageService', 'Page published', { pageId });
  }

  /**
   * Build specialized prompt for Claude based on template type
   */
  private buildPagePrompt(offer: Offer, request: PageGenerationRequest): string {
    const basePrompt = `You are an expert conversion-focused landing page copywriter and designer.

OFFER DETAILS:
- Name: ${offer.name}
- Description: ${offer.description || 'Not provided'}
- Payout: $${offer.payout}
- Vertical: ${offer.vertical || 'General'}
- Countries: ${offer.countries?.join(', ') || 'Global'}

PAGE REQUIREMENTS:
- Template Type: ${request.templateType}
- Page Name: ${request.pageName}
- Tone: ${request.tone || 'professional'}
- Target Keywords: ${request.targetKeywords?.join(', ') || 'Not specified'}
- Include Lead Capture: ${request.includeLeadCapture ? 'Yes' : 'No'}
- Include Video Embed: ${request.includeVideoEmbed ? 'Yes' : 'No'}

TEMPLATE-SPECIFIC INSTRUCTIONS:`;

    const templateInstructions: Record<string, string> = {
      review: `
Create an in-depth review landing page that builds trust and credibility:
- Hero: Compelling headline with star rating and social proof
- Product Overview: Key features and benefits
- Detailed Review: Pros and cons, real user experience
- Comparison Table: Compare with alternatives
- FAQ Section: Address common objections
- Strong CTA: Clear call-to-action throughout`,

      comparison: `
Create a comparison landing page that positions this offer as the best choice:
- Hero: Headline highlighting key differentiator
- Comparison Table: Feature-by-feature comparison with 2-3 competitors
- Winner Callouts: Highlight where this offer wins
- Value Proposition: Why this is the best choice
- Social Proof: Testimonials and trust badges
- Clear CTA: Multiple conversion points`,

      listicle: `
Create an engaging listicle format landing page:
- Hero: Number-based headline (e.g., "7 Reasons Why...")
- Numbered List: Each point with headline, description, and visual
- Progressive Disclosure: Build excitement through the list
- Summary Section: Recap key points
- Strong Finale: Compelling conclusion and CTA`,

      educational: `
Create an educational landing page that teaches and converts:
- Hero: Promise of knowledge/transformation
- Problem Statement: Define the problem clearly
- Solution Overview: Introduce the offer as solution
- Educational Content: Step-by-step guide or tutorial
- Benefits Section: What they'll achieve
- Trust Builders: Credentials, testimonials
- Soft CTA: Educational tone in call-to-action`,

      squeeze: `
Create a high-converting squeeze page for lead capture:
- Hero: Ultra-compelling headline and benefit statement
- Bullet Points: 3-5 key benefits they'll receive
- Minimal Distractions: Focus entirely on email capture
- Social Proof: Number of subscribers or testimonial
- Privacy Assurance: "We hate spam too" type message
- Single CTA: One clear action - submit email`,
    };

    const fullPrompt = `${basePrompt}
${templateInstructions[request.templateType]}

CRITICAL REQUIREMENTS:
1. All copy must be persuasive, benefit-focused, and conversion-optimized
2. Use psychological triggers: scarcity, social proof, authority
3. SEO Title must be under 60 characters, compelling for search
4. SEO Description must be under 160 characters, include CTA
5. Headlines must be attention-grabbing and benefit-driven
6. Every section must drive toward the conversion goal
7. Include specific CTAs (don't use generic "Click Here")
8. Make content scannable with clear hierarchy
9. Include trust elements throughout
10. Never make false claims or exaggerated promises

RESPONSE FORMAT:
Return your response as a JSON object with this exact structure:
{
  "seoTitle": "Optimized SEO title under 60 chars",
  "seoDescription": "Compelling meta description under 160 chars",
  "heroSection": {
    "headline": "Powerful headline that hooks attention",
    "subheadline": "Supporting headline that explains the benefit",
    "ctaButtonText": "Action-oriented button text (3-5 words)",
    "backgroundImage": "Description of ideal hero image/background"
  },
  "sections": [
    {
      "type": "features|benefits|testimonials|faq|cta|comparison|pricing",
      "title": "Section title",
      "content": {
        // Section-specific content structure
      }
    }
  ]${request.includeLeadCapture ? `,
  "leadCaptureForm": {
    "headline": "Form headline",
    "subheadline": "Why they should give their email",
    "buttonText": "Submit button text",
    "fields": ["email", "firstName"]
  }` : ''}
}

Generate the complete landing page now:`;

    return fullPrompt;
  }

  /**
   * Parse Claude's JSON response
   */
  private parseClaudeResponse(response: string): any {
    try {
      // Try to parse as-is first
      return JSON.parse(response);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      throw new Error('Failed to parse Claude response as JSON');
    }
  }

  /**
   * Generate unique slug
   */
  private async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await queryOne(
        'SELECT id FROM landing_pages WHERE slug = ?',
        [slug]
      );

      if (!existing) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
}

// Export singleton instance
export const landingPageService = new LandingPageService();
