import Anthropic from '@anthropic-ai/sdk';
import { query, insert } from '../config/database';
import { logger } from '../utils/logger';
import { settingsService } from './settings';
import { blogService } from './blog';
import { v4 as uuidv4 } from 'uuid';

type GenerationType = 'full' | 'blog_only' | 'video_only' | 'tags_only';

interface GenerateContentOptions {
  keywords: string;
  type?: GenerationType;
  saveBlogPost?: boolean; // Whether to create blog post in blog_posts table
}

interface GeneratedContentResult {
  aiContentId: string;
  blogPost?: {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    tags: string[];
  };
  videoScript?: {
    title: string;
    intro: string;
    mainContent: string;
    outro: string;
    fullScript: string;
  };
  tags?: string[];
}

class ContentGeneratorService {
  private model = 'claude-3-5-sonnet-20241022';

  /**
   * Generate content based on keywords and type
   */
  async generateContent(options: GenerateContentOptions): Promise<GeneratedContentResult> {
    const { keywords, type = 'full', saveBlogPost = true } = options;
    const startTime = Date.now();

    try {
      // Get API key from settings
      const apiKey = await settingsService.getSetting('anthropic_api_key');

      if (!apiKey) {
        throw new Error('Anthropic API key not configured. Please add it in Settings > AI');
      }

      const anthropic = new Anthropic({ apiKey });
      const aiContentId = uuidv4();

      let result: GeneratedContentResult = { aiContentId };
      let blogPostData: any = null;
      let videoScriptData: any = null;
      let tagsData: string[] = [];

      // Generate based on type
      switch (type) {
        case 'full':
          [blogPostData, videoScriptData] = await Promise.all([
            this.generateBlogPost(anthropic, keywords),
            this.generateVideoScript(anthropic, keywords),
          ]);
          tagsData = blogPostData.tags || [];
          break;

        case 'blog_only':
          blogPostData = await this.generateBlogPost(anthropic, keywords);
          tagsData = blogPostData.tags || [];
          break;

        case 'video_only':
          videoScriptData = await this.generateVideoScript(anthropic, keywords);
          break;

        case 'tags_only':
          tagsData = await this.generateTags(anthropic, keywords);
          break;
      }

      // Save to ai_generated_content table
      const generationTimeMs = Date.now() - startTime;
      await this.saveAIGeneratedContent({
        id: aiContentId,
        keywords,
        generationType: type,
        blogPostData,
        videoScriptData,
        tagsData,
        generationTimeMs,
      });

      // Optionally save blog post to blog_posts table
      if (blogPostData && saveBlogPost) {
        const savedBlogPost = await this.saveBlogPost(blogPostData, aiContentId);
        result.blogPost = savedBlogPost;
      } else if (blogPostData) {
        result.blogPost = {
          id: '',
          title: blogPostData.title,
          slug: '',
          content: blogPostData.content,
          excerpt: blogPostData.excerpt,
          tags: blogPostData.tags,
        };
      }

      if (videoScriptData) {
        result.videoScript = {
          title: videoScriptData.title,
          intro: videoScriptData.intro,
          mainContent: videoScriptData.mainContent,
          outro: videoScriptData.outro,
          fullScript: `${videoScriptData.intro}\n\n${videoScriptData.mainContent}\n\n${videoScriptData.outro}`,
        };
      }

      if (type === 'tags_only') {
        result.tags = tagsData;
      }

      return result;
    } catch (error) {
      await logger.error('ContentGenerator', 'Failed to generate content', {
        error: error instanceof Error ? error.message : 'Unknown error',
        keywords,
        type,
      });
      throw error;
    }
  }

  /**
   * Generate blog post content
   */
  private async generateBlogPost(anthropic: Anthropic, keywords: string) {
    const prompt = `You are an expert content writer for a tech and hosting affiliate marketing blog. Generate a comprehensive, SEO-optimized blog post based on these keywords: "${keywords}"

Requirements:
1. Create an engaging, click-worthy title (50-60 characters)
2. Write a compelling excerpt/meta description (150-160 characters)
3. Generate a full blog post (1500-2000 words) with:
   - Introduction that hooks the reader
   - Well-structured sections with H2 and H3 headings
   - Practical tips and actionable advice
   - Comparisons where relevant
   - Conclusion with a call-to-action
4. Use HTML formatting (p, h2, h3, ul, li, strong, em tags)
5. Naturally mention 2-3 hosting/tech products that could be promoted as affiliates
6. Include 5-7 relevant tags for categorization

Format your response as a JSON object with this structure:
{
  "title": "Blog post title",
  "excerpt": "Meta description",
  "content": "Full HTML content of the blog post",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "seoTitle": "SEO-optimized title (can be different from title)",
  "seoDescription": "SEO meta description"
}`;

    const response = await anthropic.messages.create({
      model: this.model,
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse blog post JSON from Claude response');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Generate video script
   */
  private async generateVideoScript(anthropic: Anthropic, keywords: string) {
    const prompt = `You are an expert YouTube script writer for tech and hosting content. Create a compelling video script based on these keywords: "${keywords}"

Requirements:
1. Create an engaging video title that works well for YouTube SEO
2. Write a script with three sections:
   - INTRO: Hook viewers in the first 10 seconds (30-45 seconds total)
   - MAIN CONTENT: Detailed, valuable information (7-10 minutes worth)
   - OUTRO: Call-to-action and conclusion (30-45 seconds)
3. Include timestamps and cues for the presenter
4. Write in a conversational, engaging tone
5. Include moments to showcase products/services (for affiliate mentions)
6. Add suggestions for stock video footage

Format your response as a JSON object with this structure:
{
  "title": "YouTube video title",
  "intro": "Introduction script",
  "mainContent": "Main content script with timestamps",
  "outro": "Outro script",
  "estimatedDuration": "10-12 minutes"
}`;

    const response = await anthropic.messages.create({
      model: this.model,
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse video script JSON from Claude response');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Generate tags only
   */
  private async generateTags(anthropic: Anthropic, keywords: string): Promise<string[]> {
    const prompt = `You are an SEO expert. Generate 5-7 relevant tags for content about: "${keywords}"

The tags should be:
- Relevant to the keywords
- Good for SEO and categorization
- Concise (1-3 words each)
- Suitable for a tech/hosting affiliate blog

Format your response as a JSON array:
["tag1", "tag2", "tag3", "tag4", "tag5"]`;

    const response = await anthropic.messages.create({
      model: this.model,
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse JSON response
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not parse tags JSON from Claude response');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Save AI generated content to ai_generated_content table
   */
  private async saveAIGeneratedContent(data: {
    id: string;
    keywords: string;
    generationType: GenerationType;
    blogPostData: any;
    videoScriptData: any;
    tagsData: string[];
    generationTimeMs: number;
  }) {
    const {
      id,
      keywords,
      generationType,
      blogPostData,
      videoScriptData,
      tagsData,
      generationTimeMs,
    } = data;

    await insert('ai_generated_content', {
      id,
      keywords,
      generation_type: generationType,

      // Blog content
      raw_blog_title: blogPostData?.title || null,
      raw_blog_content: blogPostData?.content || null,
      raw_blog_excerpt: blogPostData?.excerpt || null,
      raw_blog_tags: JSON.stringify(blogPostData?.tags || tagsData || []),

      // Video script
      video_script_title: videoScriptData?.title || null,
      video_script_intro: videoScriptData?.intro || null,
      video_script_main: videoScriptData?.mainContent || null,
      video_script_outro: videoScriptData?.outro || null,
      video_script_full: videoScriptData ?
        `${videoScriptData.intro}\n\n${videoScriptData.mainContent}\n\n${videoScriptData.outro}` : null,

      // Metadata
      model_used: this.model,
      generation_time_ms: generationTimeMs,
    });

    await logger.info('ContentGenerator', 'AI content saved', {
      id,
      keywords,
      generationType,
    });
  }

  /**
   * Save blog post to blog_posts table and link to AI content
   */
  private async saveBlogPost(blogData: any, aiContentId: string) {
    // Create slug from title
    const slug = blogData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Save blog post as draft
    const postData = {
      title: blogData.title,
      slug,
      content: blogData.content,
      excerpt: blogData.excerpt,
      seoTitle: blogData.seoTitle,
      seoDescription: blogData.seoDescription,
      status: 'draft',
      tags: blogData.tags,
    };

    const postId = await blogService.createPost(postData);

    // Link AI content to blog post
    await query(
      'UPDATE ai_generated_content SET blog_post_id = ?, blog_post_published = ? WHERE id = ?',
      [postId, false, aiContentId]
    );

    return {
      id: postId,
      title: blogData.title,
      slug,
      content: blogData.content,
      excerpt: blogData.excerpt,
      tags: blogData.tags,
    };
  }

  /**
   * Get AI generated content by ID
   */
  async getAIContent(id: string) {
    const result = await query(
      'SELECT * FROM ai_generated_content WHERE id = ?',
      [id]
    );

    if (!result[0]) {
      return null;
    }

    const content = result[0];

    // Parse JSON fields
    if (typeof content.raw_blog_tags === 'string') {
      content.raw_blog_tags = JSON.parse(content.raw_blog_tags);
    }

    return content;
  }

  /**
   * List all AI generated content
   */
  async listAIContent(options: { limit?: number; offset?: number; type?: GenerationType } = {}) {
    const { limit = 50, offset = 0, type } = options;

    let sql = `
      SELECT
        ai.*,
        bp.title as blog_post_title,
        bp.slug as blog_post_slug,
        bp.published_at
      FROM ai_generated_content ai
      LEFT JOIN blog_posts bp ON ai.blog_post_id = bp.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (type) {
      sql += ' AND ai.generation_type = ?';
      params.push(type);
    }

    sql += ' ORDER BY ai.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const results = await query(sql, params);

    // Parse JSON fields
    return results.map((item: any) => ({
      ...item,
      raw_blog_tags: typeof item.raw_blog_tags === 'string'
        ? JSON.parse(item.raw_blog_tags)
        : item.raw_blog_tags,
    }));
  }
}

export const contentGeneratorService = new ContentGeneratorService();
