import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { insert, query } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Get all conversions
 * GET /api/conversions
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, startDate, endDate, limit = 100, offset = 0 } = req.query;

    let sql = `
      SELECT c.*
      FROM conversions c
      WHERE 1=1
    `;
    const params: any[] = [];

    // Filter by status
    if (status && status !== 'all') {
      sql += ' AND c.status = ?';
      params.push(status);
    }

    // Filter by date range
    if (startDate) {
      sql += ' AND c.conversion_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND c.conversion_date <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY c.conversion_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const conversions = await query(sql, params);

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM conversions c WHERE 1=1';
    const countParams: any[] = [];

    if (status && status !== 'all') {
      countSql += ' AND c.status = ?';
      countParams.push(status);
    }

    if (startDate) {
      countSql += ' AND c.conversion_date >= ?';
      countParams.push(startDate);
    }

    if (endDate) {
      countSql += ' AND c.conversion_date <= ?';
      countParams.push(endDate);
    }

    const [countResult] = await query(countSql, countParams);

    res.json({
      conversions,
      total: countResult.total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

  } catch (error) {
    await logger.error('ConversionsAPI', 'Failed to get conversions', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to get conversions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get conversion statistics
 * GET /api/conversions/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    let sql = `
      SELECT
        COUNT(*) as total_conversions,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN status = 'reversed' THEN 1 ELSE 0 END) as reversed_count,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN payout ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN status = 'approved' THEN payout ELSE NULL END), 0) as average_payout
      FROM conversions
      WHERE 1=1
    `;
    const params: any[] = [];

    if (startDate) {
      sql += ' AND conversion_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND conversion_date <= ?';
      params.push(endDate);
    }

    const [stats] = await query(sql, params);

    res.json(stats);

  } catch (error) {
    await logger.error('ConversionsAPI', 'Failed to get conversion stats', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to get conversion stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Create a test/mock conversion
 * POST /api/conversions/test
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    const {
      offer_id,
      payout,
      status = 'pending',
      currency = 'USD',
      notes,
    } = req.body;

    if (!offer_id || !payout) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['offer_id', 'payout'],
      });
    }

    const conversionId = uuidv4();
    const transactionId = `TEST-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const conversionDate = new Date();
    const approvalDate = status === 'approved' ? new Date() : null;

    await insert(
      `INSERT INTO conversions (
        id, offer_id, click_id, transaction_id, payout, currency, status,
        conversion_date, approval_date, ip_address, user_agent, referrer_url, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        conversionId,
        offer_id,
        null,
        transactionId,
        parseFloat(payout),
        currency,
        status,
        conversionDate,
        approvalDate,
        req.ip || null,
        req.get('user-agent') || null,
        req.get('referer') || null,
        notes || 'Test conversion created from admin panel',
      ]
    );

    await logger.info('ConversionsAPI', 'Created test conversion', { conversionId, transactionId });

    res.status(201).json({
      success: true,
      message: 'Test conversion created successfully',
      conversion: {
        id: conversionId,
        transaction_id: transactionId,
        offer_id,
        payout,
        status,
        currency,
      },
    });

  } catch (error) {
    await logger.error('ConversionsAPI', 'Failed to create test conversion', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to create test conversion',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Simulate Impact.com postback (for testing)
 * POST /api/conversions/simulate-postback
 */
router.post('/simulate-postback', async (req: Request, res: Response) => {
  try {
    const {
      campaignId,
      campaignName = 'Test Campaign',
      payout = '50.00',
      amount = '100.00',
      status = 'APPROVED',
    } = req.body;

    if (!campaignId) {
      return res.status(400).json({
        error: 'Missing required field: campaignId',
      });
    }

    // Generate mock postback data
    const actionId = `SIM-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const sharedId = `CLICK-${Math.random().toString(36).substring(7)}`;

    // Make request to our own postback endpoint
    const postbackUrl = `http://localhost:3001/api/postback/impact`;
    const params = new URLSearchParams({
      ActionId: actionId,
      CampaignId: campaignId,
      CampaignName: campaignName,
      Status: status,
      Payout: payout,
      Amount: amount,
      Currency: 'USD',
      EventDate: new Date().toISOString(),
      SharedId: sharedId,
      StatusDetail: 'Simulated conversion from admin panel',
    });

    const response = await fetch(`${postbackUrl}?${params.toString()}`);
    const result = await response.json();

    await logger.info('ConversionsAPI', 'Simulated Impact.com postback', { actionId, result });

    res.json({
      success: true,
      message: 'Postback simulated successfully',
      postbackData: {
        ActionId: actionId,
        CampaignId: campaignId,
        CampaignName: campaignName,
        Status: status,
        Payout: payout,
        SharedId: sharedId,
      },
      result,
    });

  } catch (error) {
    await logger.error('ConversionsAPI', 'Failed to simulate postback', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to simulate postback',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Delete a conversion
 * DELETE /api/conversions/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM conversions WHERE id = ?', [id]);

    await logger.info('ConversionsAPI', 'Deleted conversion', { conversionId: id });

    res.json({
      success: true,
      message: 'Conversion deleted successfully',
    });

  } catch (error) {
    await logger.error('ConversionsAPI', 'Failed to delete conversion', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to delete conversion',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
