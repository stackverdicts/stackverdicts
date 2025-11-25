import { Router, Request, Response } from 'express';
import { query, queryOne } from '../config/database';
import { emailMarketingService } from '../services/email-marketing';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Generate email template with AI
 * POST /api/email/templates/generate
 */
router.post('/templates/generate', async (req: Request, res: Response) => {
  try {
    const {
      templateType,
      offerName,
      offerId,
      purpose,
      tone,
      includeOffer,
      targetAudience,
    } = req.body;

    if (!purpose) {
      return res.status(400).json({ error: 'purpose is required' });
    }

    const template = await emailMarketingService.generateEmailTemplate({
      templateType: templateType || 'custom',
      offerName,
      offerId,
      purpose,
      tone,
      includeOffer,
      targetAudience,
    });

    res.json({ template });
  } catch (error) {
    await logger.error('EmailAPI', 'Failed to generate template', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to generate email template',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get all email templates
 * GET /api/email/templates
 */
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const { templateType, limit = 50, offset = 0 } = req.query;

    let sql = 'SELECT * FROM email_templates WHERE 1=1';
    const params: any[] = [];

    if (templateType) {
      sql += ' AND template_type = ?';
      params.push(templateType);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const templates = await query(sql, params);

    res.json({ templates });
  } catch (error) {
    await logger.error('EmailAPI', 'Failed to fetch templates', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

/**
 * Get template by ID
 * GET /api/email/templates/:id
 */
router.get('/templates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const template = await queryOne(
      'SELECT * FROM email_templates WHERE id = ?',
      [id]
    );

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ template });
  } catch (error) {
    await logger.error('EmailAPI', 'Failed to fetch template', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

/**
 * Generate email sequence with AI
 * POST /api/email/sequences/generate
 */
router.post('/sequences/generate', async (req: Request, res: Response) => {
  try {
    const {
      sequenceName,
      offerName,
      offerId,
      purpose,
      numberOfEmails,
      daysBetweenEmails,
      tone,
    } = req.body;

    if (!sequenceName || !offerName || !purpose || !numberOfEmails) {
      return res.status(400).json({
        error: 'sequenceName, offerName, purpose, and numberOfEmails are required',
      });
    }

    const sequence = await emailMarketingService.generateEmailSequence({
      sequenceName,
      offerName,
      offerId,
      purpose,
      numberOfEmails: parseInt(numberOfEmails),
      daysBetweenEmails: parseInt(daysBetweenEmails) || 3,
      tone,
    });

    res.json({ sequence });
  } catch (error) {
    await logger.error('EmailAPI', 'Failed to generate sequence', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to generate email sequence',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get all email sequences
 * GET /api/email/sequences
 */
router.get('/sequences', async (req: Request, res: Response) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let sql = 'SELECT * FROM email_sequences WHERE 1=1';
    const params: any[] = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const sequences = await query(sql, params);

    res.json({ sequences });
  } catch (error) {
    await logger.error('EmailAPI', 'Failed to fetch sequences', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({ error: 'Failed to fetch sequences' });
  }
});

/**
 * Get sequence by ID with steps
 * GET /api/email/sequences/:id
 */
router.get('/sequences/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const sequence = await queryOne(
      'SELECT * FROM email_sequences WHERE id = ?',
      [id]
    );

    if (!sequence) {
      return res.status(404).json({ error: 'Sequence not found' });
    }

    const steps = await query(
      'SELECT * FROM email_sequence_steps WHERE sequence_id = ? ORDER BY step_number',
      [id]
    );

    const enrollments = await query(
      `SELECT e.*, s.email, s.first_name, s.last_name
       FROM email_sequence_enrollments e
       JOIN email_subscribers s ON e.subscriber_id = s.id
       WHERE e.sequence_id = ?
       ORDER BY e.created_at DESC
       LIMIT 100`,
      [id]
    );

    res.json({
      sequence: {
        ...sequence,
        steps,
        enrollments,
      },
    });
  } catch (error) {
    await logger.error('EmailAPI', 'Failed to fetch sequence', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({ error: 'Failed to fetch sequence' });
  }
});

/**
 * Update sequence status
 * PATCH /api/email/sequences/:id/status
 */
router.patch('/sequences/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'paused', 'draft'].includes(status)) {
      return res.status(400).json({
        error: 'status must be active, paused, or draft',
      });
    }

    await query(
      'UPDATE email_sequences SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );

    const sequence = await queryOne(
      'SELECT * FROM email_sequences WHERE id = ?',
      [id]
    );

    res.json({ sequence });
  } catch (error) {
    await logger.error('EmailAPI', 'Failed to update sequence status', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({ error: 'Failed to update sequence status' });
  }
});

/**
 * Create email campaign
 * POST /api/email/campaigns
 */
router.post('/campaigns', async (req: Request, res: Response) => {
  try {
    const campaign = await emailMarketingService.createCampaign(req.body);

    res.json({ campaign });
  } catch (error) {
    await logger.error('EmailAPI', 'Failed to create campaign', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to create campaign',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get all campaigns
 * GET /api/email/campaigns
 */
router.get('/campaigns', async (req: Request, res: Response) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let sql = 'SELECT * FROM email_campaigns WHERE 1=1';
    const params: any[] = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const campaigns = await query(sql, params);

    res.json({ campaigns });
  } catch (error) {
    await logger.error('EmailAPI', 'Failed to fetch campaigns', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

/**
 * Get campaign by ID
 * GET /api/email/campaigns/:id
 */
router.get('/campaigns/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const campaign = await queryOne(
      'SELECT * FROM email_campaigns WHERE id = ?',
      [id]
    );

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get campaign sends
    const sends = await query(
      `SELECT s.*, sub.email, sub.first_name, sub.last_name
       FROM email_sends s
       JOIN email_subscribers sub ON s.subscriber_id = sub.id
       WHERE s.campaign_id = ?
       ORDER BY s.created_at DESC
       LIMIT 100`,
      [id]
    );

    res.json({
      campaign: {
        ...campaign,
        sends,
      },
    });
  } catch (error) {
    await logger.error('EmailAPI', 'Failed to fetch campaign', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

/**
 * Add/Update subscriber
 * POST /api/email/subscribers
 */
router.post('/subscribers', async (req: Request, res: Response) => {
  try {
    const subscriber = await emailMarketingService.upsertSubscriber(req.body);

    res.json({ subscriber });
  } catch (error) {
    await logger.error('EmailAPI', 'Failed to add subscriber', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to add subscriber',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get all subscribers
 * GET /api/email/subscribers
 */
router.get('/subscribers', async (req: Request, res: Response) => {
  try {
    const { status, limit = 100, offset = 0 } = req.query;

    let sql = 'SELECT * FROM email_subscribers WHERE 1=1';
    const params: any[] = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const subscribers = await query(sql, params);

    // Get total count
    const countResult = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM email_subscribers',
      []
    );

    res.json({
      subscribers,
      total: countResult?.count || 0,
    });
  } catch (error) {
    await logger.error('EmailAPI', 'Failed to fetch subscribers', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

/**
 * Get subscriber by ID
 * GET /api/email/subscribers/:id
 */
router.get('/subscribers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const subscriber = await queryOne(
      'SELECT * FROM email_subscribers WHERE id = ?',
      [id]
    );

    if (!subscriber) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }

    // Get subscriber's enrollments
    const enrollments = await query(
      `SELECT e.*, seq.sequence_name
       FROM email_sequence_enrollments e
       JOIN email_sequences seq ON e.sequence_id = seq.id
       WHERE e.subscriber_id = ?
       ORDER BY e.created_at DESC`,
      [id]
    );

    // Get subscriber's email history
    const emailHistory = await query(
      `SELECT * FROM email_sends
       WHERE subscriber_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [id]
    );

    res.json({
      subscriber: {
        ...subscriber,
        enrollments,
        emailHistory,
      },
    });
  } catch (error) {
    await logger.error('EmailAPI', 'Failed to fetch subscriber', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({ error: 'Failed to fetch subscriber' });
  }
});

/**
 * Enroll subscriber in sequence
 * POST /api/email/sequences/:id/enroll
 */
router.post('/sequences/:id/enroll', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { subscriberId } = req.body;

    if (!subscriberId) {
      return res.status(400).json({ error: 'subscriberId is required' });
    }

    const enrollment = await emailMarketingService.enrollInSequence(
      id,
      subscriberId
    );

    res.json({ enrollment });
  } catch (error) {
    await logger.error('EmailAPI', 'Failed to enroll subscriber', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to enroll subscriber',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Unsubscribe
 * POST /api/email/unsubscribe
 */
router.post('/unsubscribe', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    await emailMarketingService.unsubscribe(email);

    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    await logger.error('EmailAPI', 'Failed to unsubscribe', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

/**
 * Get email analytics/stats
 * GET /api/email/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Get overall stats
    const subscriberStats = await queryOne(
      `SELECT
        COUNT(*) as total_subscribers,
        SUM(CASE WHEN status = 'subscribed' THEN 1 ELSE 0 END) as active_subscribers,
        SUM(CASE WHEN status = 'unsubscribed' THEN 1 ELSE 0 END) as unsubscribed,
        AVG(engagement_score) as avg_engagement_score
       FROM email_subscribers`
    );

    const campaignStats = await queryOne(
      `SELECT
        COUNT(*) as total_campaigns,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_campaigns,
        SUM(sent_count) as total_emails_sent,
        AVG(open_rate) as avg_open_rate,
        AVG(click_rate) as avg_click_rate
       FROM email_campaigns`
    );

    const sequenceStats = await queryOne(
      `SELECT
        COUNT(*) as total_sequences,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_sequences,
        SUM(total_enrolled) as total_enrollments,
        AVG(avg_completion_rate) as avg_completion_rate
       FROM email_sequences`
    );

    res.json({
      subscribers: subscriberStats,
      campaigns: campaignStats,
      sequences: sequenceStats,
    });
  } catch (error) {
    await logger.error('EmailAPI', 'Failed to fetch email stats', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({ error: 'Failed to fetch email stats' });
  }
});

export default router;
