import { Router, Request, Response } from 'express';
import { abTestingService } from '../services/ab-testing';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Create a new A/B test
 * POST /api/ab-testing
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { testName, testType, variants } = req.body;

    if (!testName || !testType || !variants || variants.length < 2) {
      return res.status(400).json({
        error: 'testName, testType, and at least 2 variants are required',
      });
    }

    const test = await abTestingService.createTest({
      testName,
      testType,
      variants,
    });

    res.json({ test });
  } catch (error) {
    await logger.error('ABTestingAPI', 'Failed to create test', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to create A/B test',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get all A/B tests
 * GET /api/ab-testing?status=running&testType=landing_page&limit=50&offset=0
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, testType, limit = 50, offset = 0 } = req.query;

    const tests = await abTestingService.getAllTests({
      status: status as string,
      testType: testType as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json({ tests });
  } catch (error) {
    await logger.error('ABTestingAPI', 'Failed to get tests', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to get A/B tests',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get test by ID
 * GET /api/ab-testing/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const test = await abTestingService.getTestById(id);

    res.json({ test });
  } catch (error) {
    await logger.error('ABTestingAPI', 'Failed to get test', {
      error: error instanceof Error ? error.message : 'Unknown error',
      testId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to get test',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Start a test
 * POST /api/ab-testing/:id/start
 */
router.post('/:id/start', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await abTestingService.startTest(id);

    res.json({ success: true, message: 'Test started successfully' });
  } catch (error) {
    await logger.error('ABTestingAPI', 'Failed to start test', {
      error: error instanceof Error ? error.message : 'Unknown error',
      testId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to start test',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Pause a test
 * POST /api/ab-testing/:id/pause
 */
router.post('/:id/pause', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await abTestingService.pauseTest(id);

    res.json({ success: true, message: 'Test paused successfully' });
  } catch (error) {
    await logger.error('ABTestingAPI', 'Failed to pause test', {
      error: error instanceof Error ? error.message : 'Unknown error',
      testId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to pause test',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Complete a test
 * POST /api/ab-testing/:id/complete
 */
router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { winningVariantId } = req.body;

    await abTestingService.completeTest(id, winningVariantId);

    res.json({ success: true, message: 'Test completed successfully' });
  } catch (error) {
    await logger.error('ABTestingAPI', 'Failed to complete test', {
      error: error instanceof Error ? error.message : 'Unknown error',
      testId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to complete test',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Delete a test
 * DELETE /api/ab-testing/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await abTestingService.deleteTest(id);

    res.json({ success: true, message: 'Test deleted successfully' });
  } catch (error) {
    await logger.error('ABTestingAPI', 'Failed to delete test', {
      error: error instanceof Error ? error.message : 'Unknown error',
      testId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to delete test',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Record an event (impression or conversion)
 * POST /api/ab-testing/:id/event
 */
router.post('/:id/event', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      variantId,
      eventType,
      userIdentifier,
      conversionValue,
      metadata,
    } = req.body;

    if (!variantId || !eventType) {
      return res.status(400).json({
        error: 'variantId and eventType are required',
      });
    }

    await abTestingService.recordEvent({
      testId: id,
      variantId,
      eventType,
      userIdentifier,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      referrer: req.get('referer'),
      conversionValue,
      metadata,
    });

    res.json({ success: true });
  } catch (error) {
    await logger.error('ABTestingAPI', 'Failed to record event', {
      error: error instanceof Error ? error.message : 'Unknown error',
      testId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to record event',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get variant to serve for a user
 * GET /api/ab-testing/:id/variant?userIdentifier=abc123
 */
router.get('/:id/variant', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userIdentifier } = req.query;

    const variant = await abTestingService.getVariantForUser(
      id,
      userIdentifier as string
    );

    if (!variant) {
      return res.status(404).json({
        error: 'No variant available',
        message: 'Test is not running or has no variants',
      });
    }

    res.json({ variant });
  } catch (error) {
    await logger.error('ABTestingAPI', 'Failed to get variant', {
      error: error instanceof Error ? error.message : 'Unknown error',
      testId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to get variant',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get test results with statistical analysis
 * GET /api/ab-testing/:id/results
 */
router.get('/:id/results', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const results = await abTestingService.getTestResults(id);

    res.json(results);
  } catch (error) {
    await logger.error('ABTestingAPI', 'Failed to get test results', {
      error: error instanceof Error ? error.message : 'Unknown error',
      testId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to get test results',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
