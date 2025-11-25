import { Router, Request, Response } from 'express';
import { schedulerService } from '../services/scheduler';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Get all cron jobs with their status
 * GET /api/cron-jobs
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const jobs = await schedulerService.getJobsStatus();

    res.json({ jobs });
  } catch (error) {
    await logger.error('CronJobsAPI', 'Failed to get jobs', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to retrieve cron jobs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get job execution history
 * GET /api/cron-jobs/:name/history
 */
router.get('/:name/history', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const history = await schedulerService.getJobHistory(name, limit);

    res.json({ history });
  } catch (error) {
    await logger.error('CronJobsAPI', 'Failed to get job history', {
      job: req.params.name,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to retrieve job history',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Enable a cron job
 * POST /api/cron-jobs/:name/enable
 */
router.post('/:name/enable', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;

    await schedulerService.enableJob(name);

    res.json({
      success: true,
      message: `Job ${name} enabled successfully`,
    });
  } catch (error) {
    await logger.error('CronJobsAPI', 'Failed to enable job', {
      job: req.params.name,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to enable job',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Disable a cron job
 * POST /api/cron-jobs/:name/disable
 */
router.post('/:name/disable', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;

    await schedulerService.disableJob(name);

    res.json({
      success: true,
      message: `Job ${name} disabled successfully`,
    });
  } catch (error) {
    await logger.error('CronJobsAPI', 'Failed to disable job', {
      job: req.params.name,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to disable job',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Manually trigger a job execution
 * POST /api/cron-jobs/:name/trigger
 */
router.post('/:name/trigger', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;

    // Don't wait for completion, trigger async
    schedulerService.triggerJob(name).catch(async (error) => {
      await logger.error('CronJobsAPI', 'Job execution failed', {
        job: name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    });

    res.json({
      success: true,
      message: `Job ${name} triggered successfully`,
    });
  } catch (error) {
    await logger.error('CronJobsAPI', 'Failed to trigger job', {
      job: req.params.name,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to trigger job',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
