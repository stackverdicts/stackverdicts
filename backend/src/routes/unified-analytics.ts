import { Router, Request, Response } from 'express';
import { unifiedAnalyticsService } from '../services/unified-analytics';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Get unified analytics metrics
 * GET /api/unified-analytics?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Default to last 30 days
    const start = startDate
      ? new Date(startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const end = endDate ? new Date(endDate as string) : new Date();

    const metrics = await unifiedAnalyticsService.getUnifiedMetrics({
      startDate: start,
      endDate: end,
    });

    res.json(metrics);
  } catch (error) {
    await logger.error('UnifiedAnalyticsAPI', 'Failed to get unified metrics', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to get unified analytics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get revenue breakdown by source
 * GET /api/unified-analytics/revenue-breakdown?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/revenue-breakdown', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Default to last 30 days
    const start = startDate
      ? new Date(startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const end = endDate ? new Date(endDate as string) : new Date();

    const breakdown = await unifiedAnalyticsService.getRevenueBreakdown({
      startDate: start,
      endDate: end,
    });

    res.json({ breakdown });
  } catch (error) {
    await logger.error('UnifiedAnalyticsAPI', 'Failed to get revenue breakdown', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to get revenue breakdown',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
