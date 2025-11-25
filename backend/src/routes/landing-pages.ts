import { Router, Request, Response } from 'express';
import { query, queryOne } from '../config/database';
import { landingPageService } from '../services/landing-page';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Generate new landing page
 * POST /api/landing-pages/generate
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const {
      offerId,
      siteId,
      templateType,
      pageName,
      targetKeywords,
      includeLeadCapture,
      includeVideoEmbed,
      tone,
    } = req.body;

    if (!offerId || !templateType || !pageName) {
      return res.status(400).json({
        error: 'offerId, templateType, and pageName are required',
      });
    }

    const validTemplates = ['review', 'comparison', 'listicle', 'educational', 'squeeze'];
    if (!validTemplates.includes(templateType)) {
      return res.status(400).json({
        error: `templateType must be one of: ${validTemplates.join(', ')}`,
      });
    }

    const page = await landingPageService.generateLandingPage({
      offerId,
      siteId,
      templateType,
      pageName,
      targetKeywords,
      includeLeadCapture: includeLeadCapture ?? true,
      includeVideoEmbed: includeVideoEmbed ?? false,
      tone: tone || 'professional',
    });

    res.json({ page });
  } catch (error) {
    await logger.error('LandingPagesAPI', 'Failed to generate landing page', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to generate landing page',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get all landing pages
 * GET /api/landing-pages?status=published&offerId=xxx
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, offerId, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT
        lp.*,
        o.name as offer_name,
        o.payout,
        o.vertical,
        COUNT(DISTINCT lpv.id) as variant_count,
        COUNT(DISTINCT lpl.id) as lead_count
      FROM landing_pages lp
      LEFT JOIN offers o ON lp.offer_id = o.id
      LEFT JOIN landing_page_variants lpv ON lp.id = lpv.page_id
      LEFT JOIN landing_page_leads lpl ON lp.id = lpl.page_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      sql += ' AND lp.status = ?';
      params.push(status);
    }

    if (offerId) {
      sql += ' AND lp.offer_id = ?';
      params.push(offerId);
    }

    sql += ' GROUP BY lp.id ORDER BY lp.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const pages = await query(sql, params);

    res.json({ pages });
  } catch (error) {
    await logger.error('LandingPagesAPI', 'Failed to fetch landing pages', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to fetch landing pages',
    });
  }
});

/**
 * Get landing page by ID
 * GET /api/landing-pages/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const page = await queryOne(
      `SELECT
        lp.*,
        o.name as offer_name,
        o.payout,
        o.vertical
       FROM landing_pages lp
       LEFT JOIN offers o ON lp.offer_id = o.id
       WHERE lp.id = ?`,
      [id]
    );

    if (!page) {
      return res.status(404).json({ error: 'Landing page not found' });
    }

    // Get variants
    const variants = await query(
      'SELECT * FROM landing_page_variants WHERE page_id = ? ORDER BY is_control DESC, created_at',
      [id]
    );

    // Get recent leads
    const leads = await query(
      'SELECT * FROM landing_page_leads WHERE page_id = ? ORDER BY created_at DESC LIMIT 100',
      [id]
    );

    // Get analytics summary
    const analytics = await queryOne(
      `SELECT
        SUM(views) as total_views,
        SUM(unique_visitors) as total_visitors,
        SUM(form_submissions) as total_submissions,
        AVG(form_conversion_rate) as avg_conversion_rate,
        AVG(bounce_rate) as avg_bounce_rate
       FROM landing_page_analytics
       WHERE page_id = ?`,
      [id]
    );

    res.json({
      page: {
        ...page,
        variants,
        leads,
        analytics,
      },
    });
  } catch (error) {
    await logger.error('LandingPagesAPI', 'Failed to fetch landing page', {
      error: error instanceof Error ? error.message : 'Unknown error',
      pageId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to fetch landing page',
    });
  }
});

/**
 * Get landing page by slug (public endpoint)
 * GET /api/landing-pages/public/:slug
 */
router.get('/public/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { variantId } = req.query;

    const page = await landingPageService.getPageBySlug(slug);

    // Track page view
    await landingPageService.trackPageView(page.id, variantId as string);

    res.json({ page });
  } catch (error) {
    await logger.error('LandingPagesAPI', 'Failed to fetch public page', {
      error: error instanceof Error ? error.message : 'Unknown error',
      slug: req.params.slug,
    });

    res.status(404).json({
      error: 'Page not found',
    });
  }
});

/**
 * Update landing page
 * PATCH /api/landing-pages/:id
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = [
      'page_name',
      'seo_title',
      'seo_description',
      'seo_keywords',
      'hero_section',
      'sections',
      'header_config',
      'footer_config',
      'tracking_pixels',
      'custom_css',
      'custom_js',
    ];

    const updateFields: string[] = [];
    const params: any[] = [];

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        // Stringify JSON fields
        if (['seo_keywords', 'hero_section', 'sections', 'header_config', 'footer_config', 'tracking_pixels'].includes(key)) {
          params.push(JSON.stringify(updates[key]));
        } else {
          params.push(updates[key]);
        }
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateFields.push('last_edited_at = NOW()');
    updateFields.push('updated_at = NOW()');
    params.push(id);

    await query(
      `UPDATE landing_pages SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    const page = await queryOne('SELECT * FROM landing_pages WHERE id = ?', [id]);

    res.json({ page });
  } catch (error) {
    await logger.error('LandingPagesAPI', 'Failed to update landing page', {
      error: error instanceof Error ? error.message : 'Unknown error',
      pageId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to update landing page',
    });
  }
});

/**
 * Publish landing page
 * POST /api/landing-pages/:id/publish
 */
router.post('/:id/publish', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await landingPageService.publishPage(id);

    const page = await queryOne('SELECT * FROM landing_pages WHERE id = ?', [id]);

    res.json({ page });
  } catch (error) {
    await logger.error('LandingPagesAPI', 'Failed to publish landing page', {
      error: error instanceof Error ? error.message : 'Unknown error',
      pageId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to publish landing page',
    });
  }
});

/**
 * Delete landing page
 * DELETE /api/landing-pages/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM landing_pages WHERE id = ?', [id]);

    res.json({ message: 'Landing page deleted successfully' });
  } catch (error) {
    await logger.error('LandingPagesAPI', 'Failed to delete landing page', {
      error: error instanceof Error ? error.message : 'Unknown error',
      pageId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to delete landing page',
    });
  }
});

/**
 * Create A/B test variant
 * POST /api/landing-pages/:id/variants
 */
router.post('/:id/variants', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      variantName,
      heroHeadline,
      heroSubheadline,
      ctaButtonText,
      ctaButtonColor,
      sectionsOverride,
      trafficAllocation,
    } = req.body;

    if (!variantName || !heroHeadline || !heroSubheadline || !ctaButtonText) {
      return res.status(400).json({
        error: 'variantName, heroHeadline, heroSubheadline, and ctaButtonText are required',
      });
    }

    const variant = await landingPageService.createVariant({
      pageId: id,
      variantName,
      heroHeadline,
      heroSubheadline,
      ctaButtonText,
      ctaButtonColor,
      sectionsOverride,
      trafficAllocation,
    });

    res.json({ variant });
  } catch (error) {
    await logger.error('LandingPagesAPI', 'Failed to create variant', {
      error: error instanceof Error ? error.message : 'Unknown error',
      pageId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to create variant',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Capture lead from landing page
 * POST /api/landing-pages/:id/leads
 */
router.post('/:id/leads', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      variantId,
      email,
      firstName,
      lastName,
      phone,
      additionalFields,
      utmParams,
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const lead = await landingPageService.captureLead({
      pageId: id,
      variantId,
      email,
      firstName,
      lastName,
      phone,
      additionalFields,
      sourceUrl: req.headers.referer,
      referrer: req.headers.referer,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress,
      utmParams,
    });

    res.json({ lead });
  } catch (error) {
    await logger.error('LandingPagesAPI', 'Failed to capture lead', {
      error: error instanceof Error ? error.message : 'Unknown error',
      pageId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to capture lead',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get leads for a page
 * GET /api/landing-pages/:id/leads
 */
router.get('/:id/leads', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, limit = 100, offset = 0 } = req.query;

    let sql = 'SELECT * FROM landing_page_leads WHERE page_id = ?';
    const params: any[] = [id];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const leads = await query(sql, params);

    // Get total count
    const countResult = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM landing_page_leads WHERE page_id = ?',
      [id]
    );

    res.json({
      leads,
      total: countResult?.count || 0,
    });
  } catch (error) {
    await logger.error('LandingPagesAPI', 'Failed to fetch leads', {
      error: error instanceof Error ? error.message : 'Unknown error',
      pageId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to fetch leads',
    });
  }
});

/**
 * Get analytics for a page
 * GET /api/landing-pages/:id/analytics
 */
router.get('/:id/analytics', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, variantId } = req.query;

    let sql = `
      SELECT * FROM landing_page_analytics
      WHERE page_id = ?
    `;
    const params: any[] = [id];

    if (startDate) {
      sql += ' AND date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND date <= ?';
      params.push(endDate);
    }

    if (variantId) {
      sql += ' AND variant_id = ?';
      params.push(variantId);
    }

    sql += ' ORDER BY date DESC';

    const analytics = await query(sql, params);

    // Get summary
    const summary = await queryOne(
      `SELECT
        SUM(views) as total_views,
        SUM(unique_visitors) as total_visitors,
        SUM(form_submissions) as total_submissions,
        AVG(form_conversion_rate) as avg_conversion_rate,
        AVG(bounce_rate) as avg_bounce_rate,
        AVG(avg_time_on_page) as avg_time_on_page
       FROM landing_page_analytics
       WHERE page_id = ?${variantId ? ' AND variant_id = ?' : ''}`,
      variantId ? [id, variantId] : [id]
    );

    res.json({
      analytics,
      summary,
    });
  } catch (error) {
    await logger.error('LandingPagesAPI', 'Failed to fetch analytics', {
      error: error instanceof Error ? error.message : 'Unknown error',
      pageId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to fetch analytics',
    });
  }
});

export default router;
