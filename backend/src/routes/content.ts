import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { GeneratedContent, Offer } from '../models/types';
import { logger } from '../utils/logger';
import { contentGeneratorService } from '../services/content-generator';

const router = Router();

/**
 * Get all generated content with offer names
 * GET /api/content
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { offerId, isActive, limit = 100, offset = 0 } = req.query;

    let sql = `
      SELECT
        gc.*,
        o.name as offer_name
      FROM generated_content gc
      LEFT JOIN offers o ON gc.offer_id = o.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (offerId) {
      sql += ' AND gc.offer_id = ?';
      params.push(offerId);
    }

    if (isActive !== undefined) {
      sql += ' AND gc.is_active = ?';
      params.push(isActive === 'true' ? 1 : 0);
    }

    sql += ' ORDER BY gc.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const content = await query(sql, params);

    // Parse JSON fields
    const parsedContent = content.map((item: any) => ({
      ...item,
      bullet_points: typeof item.bullet_points === 'string'
        ? JSON.parse(item.bullet_points)
        : item.bullet_points,
      google_ad_headlines: typeof item.google_ad_headlines === 'string'
        ? JSON.parse(item.google_ad_headlines)
        : item.google_ad_headlines,
      google_ad_descriptions: typeof item.google_ad_descriptions === 'string'
        ? JSON.parse(item.google_ad_descriptions)
        : item.google_ad_descriptions,
      additional_content: typeof item.additional_content === 'string'
        ? JSON.parse(item.additional_content)
        : item.additional_content,
      keywords: typeof item.keywords === 'string'
        ? JSON.parse(item.keywords)
        : item.keywords,
    }));

    res.json({
      content: parsedContent,
      total: parsedContent.length,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    await logger.error('Content', 'Failed to fetch generated content', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to fetch generated content',
    });
  }
});

/**
 * Get single generated content by ID
 * GET /api/content/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const content = await query(
      `SELECT
        gc.*,
        o.name as offer_name,
        o.tracking_link
      FROM generated_content gc
      LEFT JOIN offers o ON gc.offer_id = o.id
      WHERE gc.id = ?`,
      [id]
    );

    if (!content[0]) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Parse JSON fields
    const item = content[0];
    const parsedContent = {
      ...item,
      bullet_points: typeof item.bullet_points === 'string'
        ? JSON.parse(item.bullet_points)
        : item.bullet_points,
      google_ad_headlines: typeof item.google_ad_headlines === 'string'
        ? JSON.parse(item.google_ad_headlines)
        : item.google_ad_headlines,
      google_ad_descriptions: typeof item.google_ad_descriptions === 'string'
        ? JSON.parse(item.google_ad_descriptions)
        : item.google_ad_descriptions,
      additional_content: typeof item.additional_content === 'string'
        ? JSON.parse(item.additional_content)
        : item.additional_content,
    };

    res.json({ content: parsedContent });
  } catch (error) {
    await logger.error('Content', 'Failed to fetch content', {
      error: error instanceof Error ? error.message : 'Unknown error',
      contentId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to fetch content',
    });
  }
});

/**
 * Update generated content
 * PATCH /api/content/:id
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { is_active, performance_score } = req.body;

    const updates: string[] = [];
    const params: any[] = [];

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (performance_score !== undefined) {
      updates.push('performance_score = ?');
      params.push(performance_score);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await query(
      `UPDATE generated_content SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ message: 'Content updated successfully' });
  } catch (error) {
    await logger.error('Content', 'Failed to update content', {
      error: error instanceof Error ? error.message : 'Unknown error',
      contentId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to update content',
    });
  }
});

/**
 * Delete generated content
 * DELETE /api/content/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM generated_content WHERE id = ?', [id]);

    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    await logger.error('Content', 'Failed to delete content', {
      error: error instanceof Error ? error.message : 'Unknown error',
      contentId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to delete content',
    });
  }
});

/**
 * Generate new content from keywords
 * POST /api/content/generate
 * Body: { keywords: string, type?: 'full' | 'blog_only' | 'video_only' | 'tags_only', saveBlogPost?: boolean }
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { keywords, type = 'full', saveBlogPost = true } = req.body;

    if (!keywords || typeof keywords !== 'string' || !keywords.trim()) {
      return res.status(400).json({
        error: 'Keywords are required',
      });
    }

    const validTypes = ['full', 'blog_only', 'video_only', 'tags_only'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid generation type. Must be: full, blog_only, video_only, or tags_only',
      });
    }

    await logger.info('ContentGenerator', 'Starting content generation', {
      keywords: keywords.trim(),
      type,
      saveBlogPost,
    });

    const result = await contentGeneratorService.generateContent({
      keywords: keywords.trim(),
      type,
      saveBlogPost,
    });

    await logger.info('ContentGenerator', 'Content generation completed', {
      aiContentId: result.aiContentId,
      blogPostId: result.blogPost?.id,
      blogPostTitle: result.blogPost?.title,
      type,
    });

    res.json({
      success: true,
      message: 'Content generated successfully',
      data: result,
    });
  } catch (error) {
    await logger.error('ContentGenerator', 'Failed to generate content', {
      error: error instanceof Error ? error.message : 'Unknown error',
      keywords: req.body.keywords,
      type: req.body.type,
    });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate content',
    });
  }
});

/**
 * Get AI generated content by ID
 * GET /api/content/ai/:id
 */
router.get('/ai/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const content = await contentGeneratorService.getAIContent(id);

    if (!content) {
      return res.status(404).json({ error: 'AI content not found' });
    }

    res.json({ content });
  } catch (error) {
    await logger.error('ContentGenerator', 'Failed to fetch AI content', {
      error: error instanceof Error ? error.message : 'Unknown error',
      id: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to fetch AI content',
    });
  }
});

/**
 * List all AI generated content
 * GET /api/content/ai
 */
router.get('/ai', async (req: Request, res: Response) => {
  try {
    const { limit, offset, type } = req.query;

    const options: any = {};
    if (limit) options.limit = parseInt(limit as string);
    if (offset) options.offset = parseInt(offset as string);
    if (type) options.type = type as string;

    const content = await contentGeneratorService.listAIContent(options);

    res.json({
      content,
      total: content.length,
    });
  } catch (error) {
    await logger.error('ContentGenerator', 'Failed to list AI content', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to list AI content',
    });
  }
});

export default router;
