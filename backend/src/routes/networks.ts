import { Router, Request, Response } from 'express';
import { query, queryOne, insert } from '../config/database';
import { generateId } from '../utils/id-generator';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/networks
 * Get all affiliate networks
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, active_only } = req.query;

    let sql = 'SELECT * FROM affiliate_networks WHERE 1=1';
    const params: any[] = [];

    if (type) {
      sql += ' AND network_type = ?';
      params.push(type);
    }

    if (active_only === 'true') {
      sql += ' AND is_active = TRUE';
    }

    sql += ' ORDER BY network_type, network_name';

    const networks = await query(sql, params);

    res.json({
      networks,
      total: networks.length,
    });
  } catch (error) {
    await logger.error('Networks', 'Failed to fetch networks', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      error: 'Failed to fetch affiliate networks',
    });
  }
});

/**
 * GET /api/networks/:id
 * Get single affiliate network
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const network = await queryOne(
      'SELECT * FROM affiliate_networks WHERE id = ? OR network_slug = ?',
      [req.params.id, req.params.id]
    );

    if (!network) {
      return res.status(404).json({ error: 'Network not found' });
    }

    // Get network stats
    const stats = await queryOne(
      `SELECT
        COUNT(*) as total_offers,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_offers,
        AVG(epc) as avg_epc,
        AVG(conversion_rate) as avg_conversion_rate
       FROM offers
       WHERE network_id = ?`,
      [network.id]
    );

    res.json({
      ...network,
      stats,
    });
  } catch (error) {
    await logger.error('Networks', 'Failed to fetch network', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      error: 'Failed to fetch network',
    });
  }
});

/**
 * POST /api/networks
 * Create new affiliate network
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      network_name,
      network_slug,
      network_type,
      description,
      default_commission_type,
      default_commission_value,
      has_recurring,
      recurring_percentage,
      cookie_duration_days,
      tracking_url_template,
      requires_approval,
      payment_threshold,
      payment_schedule,
      affiliate_dashboard_url,
      contact_email,
    } = req.body;

    // Validate required fields
    if (!network_name || !network_slug) {
      return res.status(400).json({
        error: 'network_name and network_slug are required',
      });
    }

    // Check if slug already exists
    const existing = await queryOne(
      'SELECT id FROM affiliate_networks WHERE network_slug = ?',
      [network_slug]
    );

    if (existing) {
      return res.status(400).json({
        error: 'Network with this slug already exists',
      });
    }

    const networkId = generateId('network');

    await insert(
      `INSERT INTO affiliate_networks (
        id, network_name, network_slug, network_type, description,
        default_commission_type, default_commission_value, has_recurring, recurring_percentage,
        cookie_duration_days, tracking_url_template, requires_approval,
        payment_threshold, payment_schedule, affiliate_dashboard_url, contact_email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        networkId,
        network_name,
        network_slug,
        network_type || 'other',
        description,
        default_commission_type || 'fixed',
        default_commission_value,
        has_recurring || false,
        recurring_percentage,
        cookie_duration_days || 30,
        tracking_url_template,
        requires_approval !== false,
        payment_threshold || 100,
        payment_schedule || 'monthly',
        affiliate_dashboard_url,
        contact_email,
      ]
    );

    const network = await queryOne(
      'SELECT * FROM affiliate_networks WHERE id = ?',
      [networkId]
    );

    await logger.info('Networks', 'Network created', { networkId, network_name });

    res.status(201).json(network);
  } catch (error) {
    await logger.error('Networks', 'Failed to create network', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      error: 'Failed to create network',
    });
  }
});

/**
 * PUT /api/networks/:id
 * Update affiliate network
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const {
      network_name,
      network_type,
      description,
      default_commission_type,
      default_commission_value,
      has_recurring,
      recurring_percentage,
      cookie_duration_days,
      tracking_url_template,
      requires_approval,
      payment_threshold,
      payment_schedule,
      affiliate_dashboard_url,
      contact_email,
      is_active,
    } = req.body;

    await query(
      `UPDATE affiliate_networks SET
        network_name = COALESCE(?, network_name),
        network_type = COALESCE(?, network_type),
        description = COALESCE(?, description),
        default_commission_type = COALESCE(?, default_commission_type),
        default_commission_value = COALESCE(?, default_commission_value),
        has_recurring = COALESCE(?, has_recurring),
        recurring_percentage = COALESCE(?, recurring_percentage),
        cookie_duration_days = COALESCE(?, cookie_duration_days),
        tracking_url_template = COALESCE(?, tracking_url_template),
        requires_approval = COALESCE(?, requires_approval),
        payment_threshold = COALESCE(?, payment_threshold),
        payment_schedule = COALESCE(?, payment_schedule),
        affiliate_dashboard_url = COALESCE(?, affiliate_dashboard_url),
        contact_email = COALESCE(?, contact_email),
        is_active = COALESCE(?, is_active),
        updated_at = NOW()
       WHERE id = ?`,
      [
        network_name,
        network_type,
        description,
        default_commission_type,
        default_commission_value,
        has_recurring,
        recurring_percentage,
        cookie_duration_days,
        tracking_url_template,
        requires_approval,
        payment_threshold,
        payment_schedule,
        affiliate_dashboard_url,
        contact_email,
        is_active,
        req.params.id,
      ]
    );

    const network = await queryOne(
      'SELECT * FROM affiliate_networks WHERE id = ?',
      [req.params.id]
    );

    await logger.info('Networks', 'Network updated', { networkId: req.params.id });

    res.json(network);
  } catch (error) {
    await logger.error('Networks', 'Failed to update network', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      error: 'Failed to update network',
    });
  }
});

/**
 * DELETE /api/networks/:id
 * Delete affiliate network
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // Check if network has offers
    const offerCount = await queryOne(
      'SELECT COUNT(*) as count FROM offers WHERE network_id = ?',
      [req.params.id]
    );

    if (offerCount && offerCount.count > 0) {
      return res.status(400).json({
        error: 'Cannot delete network with existing offers. Delete offers first or disable the network.',
      });
    }

    await query('DELETE FROM affiliate_networks WHERE id = ?', [req.params.id]);

    await logger.info('Networks', 'Network deleted', { networkId: req.params.id });

    res.json({ success: true });
  } catch (error) {
    await logger.error('Networks', 'Failed to delete network', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      error: 'Failed to delete network',
    });
  }
});

export default router;
