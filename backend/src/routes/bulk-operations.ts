import { Router, Request, Response } from 'express';
import { bulkOperationsService } from '../services/bulk-operations';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Bulk generate YouTube scripts
 * POST /api/bulk-operations/scripts
 */
router.post('/scripts', async (req: Request, res: Response) => {
  try {
    const { offerIds, scriptType, tone, duration } = req.body;

    if (!offerIds || !Array.isArray(offerIds) || offerIds.length === 0) {
      return res.status(400).json({
        error: 'offerIds array is required and must not be empty',
      });
    }

    const result = await bulkOperationsService.bulkGenerateScripts({
      offerIds,
      scriptType: scriptType || 'tutorial',
      tone: tone || 'professional',
      duration: duration || 10,
    });

    res.json(result);
  } catch (error) {
    await logger.error('BulkOperationsAPI', 'Failed to bulk generate scripts', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to bulk generate scripts',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Bulk generate landing pages
 * POST /api/bulk-operations/landing-pages
 */
router.post('/landing-pages', async (req: Request, res: Response) => {
  try {
    const { offerIds, templateType, tone, includeLeadCapture } = req.body;

    if (!offerIds || !Array.isArray(offerIds) || offerIds.length === 0) {
      return res.status(400).json({
        error: 'offerIds array is required and must not be empty',
      });
    }

    const result = await bulkOperationsService.bulkGenerateLandingPages({
      offerIds,
      templateType: templateType || 'review',
      tone: tone || 'professional',
      includeLeadCapture: includeLeadCapture !== false,
    });

    res.json(result);
  } catch (error) {
    await logger.error('BulkOperationsAPI', 'Failed to bulk generate landing pages', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to bulk generate landing pages',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Bulk publish/unpublish pages
 * POST /api/bulk-operations/publish
 */
router.post('/publish', async (req: Request, res: Response) => {
  try {
    const { pageIds, action } = req.body;

    if (!pageIds || !Array.isArray(pageIds) || pageIds.length === 0) {
      return res.status(400).json({
        error: 'pageIds array is required and must not be empty',
      });
    }

    if (action !== 'publish' && action !== 'unpublish') {
      return res.status(400).json({
        error: 'action must be either "publish" or "unpublish"',
      });
    }

    const result = await bulkOperationsService.bulkPublishPages({
      pageIds,
      action,
    });

    res.json(result);
  } catch (error) {
    await logger.error('BulkOperationsAPI', 'Failed to bulk publish pages', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to bulk publish pages',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Bulk update offer statuses
 * POST /api/bulk-operations/offers/status
 */
router.post('/offers/status', async (req: Request, res: Response) => {
  try {
    const { offerIds, status } = req.body;

    if (!offerIds || !Array.isArray(offerIds) || offerIds.length === 0) {
      return res.status(400).json({
        error: 'offerIds array is required and must not be empty',
      });
    }

    if (status !== 'active' && status !== 'inactive') {
      return res.status(400).json({
        error: 'status must be either "active" or "inactive"',
      });
    }

    const result = await bulkOperationsService.bulkUpdateOfferStatus(
      offerIds,
      status
    );

    res.json(result);
  } catch (error) {
    await logger.error('BulkOperationsAPI', 'Failed to bulk update offer status', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to bulk update offer status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Bulk delete items
 * POST /api/bulk-operations/delete
 */
router.post('/delete', async (req: Request, res: Response) => {
  try {
    const { itemIds, itemType } = req.body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({
        error: 'itemIds array is required and must not be empty',
      });
    }

    const validTypes = ['scripts', 'pages', 'campaigns', 'tests'];
    if (!validTypes.includes(itemType)) {
      return res.status(400).json({
        error: `itemType must be one of: ${validTypes.join(', ')}`,
      });
    }

    const result = await bulkOperationsService.bulkDelete(itemIds, itemType);

    res.json(result);
  } catch (error) {
    await logger.error('BulkOperationsAPI', 'Failed to bulk delete', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to bulk delete',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Bulk enroll subscribers in sequence
 * POST /api/bulk-operations/enroll
 */
router.post('/enroll', async (req: Request, res: Response) => {
  try {
    const { subscriberIds, sequenceId } = req.body;

    if (!subscriberIds || !Array.isArray(subscriberIds) || subscriberIds.length === 0) {
      return res.status(400).json({
        error: 'subscriberIds array is required and must not be empty',
      });
    }

    if (!sequenceId) {
      return res.status(400).json({
        error: 'sequenceId is required',
      });
    }

    const result = await bulkOperationsService.bulkEnrollInSequence(
      subscriberIds,
      sequenceId
    );

    res.json(result);
  } catch (error) {
    await logger.error('BulkOperationsAPI', 'Failed to bulk enroll', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to bulk enroll subscribers',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get bulk operation statistics
 * GET /api/bulk-operations/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await bulkOperationsService.getBulkOperationStats();

    res.json(stats);
  } catch (error) {
    await logger.error('BulkOperationsAPI', 'Failed to get stats', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to get bulk operation statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
