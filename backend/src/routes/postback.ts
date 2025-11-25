import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { insert, query } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Impact.com Postback Webhook
 * Receives conversion notifications from Impact.com affiliate network
 *
 * Example URL: https://yourdomain.com/api/postback/impact
 *
 * Query Parameters from Impact.com:
 * - ActionId: Unique conversion ID
 * - CampaignId: Brand/offer ID
 * - CampaignName: Brand name
 * - Status: APPROVED, PENDING, REVERSED, REJECTED
 * - Payout: Commission amount
 * - Amount: Customer purchase amount
 * - Currency: Currency code (USD, EUR, etc.)
 * - EventDate: When conversion occurred
 * - SharedId: Custom tracking parameter (your click_id)
 */
router.get('/impact', async (req: Request, res: Response) => {
  try {
    const {
      ActionId,
      CampaignId,
      CampaignName,
      Status,
      Payout,
      Amount,
      Currency,
      EventDate,
      SharedId,
      StatusDetail,
    } = req.query;

    // Log the incoming postback
    await logger.info('PostbackWebhook', 'Received Impact.com postback', {
      actionId: ActionId,
      campaignId: CampaignId,
      status: Status,
      payout: Payout,
    });

    // Validate required parameters
    if (!ActionId || !CampaignId || !Status || !Payout) {
      await logger.error('PostbackWebhook', 'Missing required parameters', { query: req.query });
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['ActionId', 'CampaignId', 'Status', 'Payout'],
      });
    }

    // Map Impact.com status to our system
    const statusMap: Record<string, 'pending' | 'approved' | 'rejected' | 'reversed'> = {
      'APPROVED': 'approved',
      'PENDING': 'pending',
      'REVERSED': 'reversed',
      'REJECTED': 'rejected',
    };

    const mappedStatus = statusMap[Status as string] || 'pending';

    // Check if conversion already exists (prevent duplicates)
    const existing = await query(
      'SELECT id FROM conversions WHERE transaction_id = ?',
      [ActionId]
    );

    if (existing.length > 0) {
      // Update existing conversion if status changed
      await query(
        `UPDATE conversions
         SET status = ?,
             payout = ?,
             approval_date = ?,
             notes = ?,
             updated_at = NOW()
         WHERE transaction_id = ?`,
        [
          mappedStatus,
          parseFloat(Payout as string) || 0,
          mappedStatus === 'approved' ? new Date() : null,
          StatusDetail || null,
          ActionId,
        ]
      );

      await logger.info('PostbackWebhook', 'Updated existing conversion', { transactionId: ActionId });

      return res.status(200).json({
        success: true,
        message: 'Conversion updated',
        conversionId: existing[0].id,
      });
    }

    // Create new conversion
    const conversionId = uuidv4();
    const conversionDate = EventDate ? new Date(EventDate as string) : new Date();
    const approvalDate = mappedStatus === 'approved' ? new Date() : null;

    await insert(
      `INSERT INTO conversions (
        id, offer_id, click_id, transaction_id, payout, currency, status,
        conversion_date, approval_date, ip_address, user_agent, referrer_url, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        conversionId,
        CampaignId as string,
        SharedId as string || null,
        ActionId as string,
        parseFloat(Payout as string) || 0,
        Currency as string || 'USD',
        mappedStatus,
        conversionDate,
        approvalDate,
        req.ip || null,
        req.get('user-agent') || null,
        req.get('referer') || null,
        StatusDetail as string || `Campaign: ${CampaignName || 'Unknown'}, Amount: ${Amount || 'N/A'}`,
      ]
    );

    await logger.info('PostbackWebhook', 'Created new conversion', { conversionId, transactionId: ActionId });

    // Return 200 OK to Impact.com
    return res.status(200).json({
      success: true,
      message: 'Conversion tracked successfully',
      conversionId,
    });

  } catch (error) {
    await logger.error('PostbackWebhook', 'Failed to process postback', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Still return 200 to prevent Impact.com from retrying invalid data
    return res.status(200).json({
      success: false,
      error: 'Failed to process postback',
    });
  }
});

/**
 * POST endpoint for Impact.com postbacks (JSON format)
 */
router.post('/impact', async (req: Request, res: Response) => {
  try {
    const {
      actionId,
      campaignId,
      campaignName,
      status,
      payout,
      amount,
      currency,
      eventDate,
      sharedId,
      statusDetail,
    } = req.body;

    await logger.info('PostbackWebhook', 'Received Impact.com POST postback', {
      actionId,
      campaignId,
      status,
      payout,
    });

    if (!actionId || !campaignId || !status || !payout) {
      await logger.error('PostbackWebhook', 'Missing required parameters in POST', { body: req.body });
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['actionId', 'campaignId', 'status', 'payout'],
      });
    }

    const statusMap: Record<string, 'pending' | 'approved' | 'rejected' | 'reversed'> = {
      'APPROVED': 'approved',
      'PENDING': 'pending',
      'REVERSED': 'reversed',
      'REJECTED': 'rejected',
    };

    const mappedStatus = statusMap[status] || 'pending';

    const existing = await query(
      'SELECT id FROM conversions WHERE transaction_id = ?',
      [actionId]
    );

    if (existing.length > 0) {
      await query(
        `UPDATE conversions
         SET status = ?,
             payout = ?,
             approval_date = ?,
             notes = ?,
             updated_at = NOW()
         WHERE transaction_id = ?`,
        [
          mappedStatus,
          parseFloat(payout) || 0,
          mappedStatus === 'approved' ? new Date() : null,
          statusDetail || null,
          actionId,
        ]
      );

      return res.status(200).json({
        success: true,
        message: 'Conversion updated',
        conversionId: existing[0].id,
      });
    }

    const conversionId = uuidv4();
    const conversionDate = eventDate ? new Date(eventDate) : new Date();
    const approvalDate = mappedStatus === 'approved' ? new Date() : null;

    await insert(
      `INSERT INTO conversions (
        id, offer_id, click_id, transaction_id, payout, currency, status,
        conversion_date, approval_date, ip_address, user_agent, referrer_url, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        conversionId,
        campaignId,
        sharedId || null,
        actionId,
        parseFloat(payout) || 0,
        currency || 'USD',
        mappedStatus,
        conversionDate,
        approvalDate,
        req.ip || null,
        req.get('user-agent') || null,
        req.get('referer') || null,
        statusDetail || `Campaign: ${campaignName || 'Unknown'}, Amount: ${amount || 'N/A'}`,
      ]
    );

    await logger.info('PostbackWebhook', 'Created new conversion from POST', { conversionId, transactionId: actionId });

    return res.status(200).json({
      success: true,
      message: 'Conversion tracked successfully',
      conversionId,
    });

  } catch (error) {
    await logger.error('PostbackWebhook', 'Failed to process POST postback', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return res.status(200).json({
      success: false,
      error: 'Failed to process postback',
    });
  }
});

export default router;
