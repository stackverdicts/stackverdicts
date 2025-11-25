import cron from 'node-cron';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { query } from '../config/database';
import { generateId } from '../utils/id-generator';
import { emailMarketingService } from './email-marketing';
import { abTestingService } from './ab-testing';

/**
 * Scheduler Service
 * Manages all cron jobs for automated tasks
 */
class SchedulerService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private jobExecutions: Map<string, string> = new Map(); // Track current execution IDs

  /**
   * Start all scheduled jobs
   */
  async start(): Promise<void> {
    // Load active jobs from database
    const activeJobs = await this.getActiveJobs();

    for (const job of activeJobs) {
      await this.startJob(job.name, job.schedule);
    }

    await logger.info('Scheduler', 'All cron jobs started', {
      jobCount: this.jobs.size,
    });
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info('Scheduler', `Stopped cron job: ${name}`);
    });
    this.jobs.clear();
  }

  /**
   * Get active jobs from database
   */
  private async getActiveJobs(): Promise<Array<{ name: string; schedule: string }>> {
    try {
      const rows = await query<Array<{ name: string; schedule: string }>>(
        'SELECT name, schedule FROM cron_jobs WHERE is_active = TRUE'
      );
      return rows;
    } catch (error) {
      await logger.error('Scheduler', 'Failed to load active jobs', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Start a specific job by name
   */
  private async startJob(name: string, schedule: string): Promise<void> {
    const taskMap: { [key: string]: () => Promise<any> } = {
      'youtube-analytics': () => this.runYouTubeAnalytics(),
      'email-sequences': () => this.runEmailSequences(),
      'ab-test-calculations': () => this.runABTestCalculations(),
      'analytics-aggregation': () => this.runAnalyticsAggregation(),
    };

    const task = taskMap[name];
    if (!task) {
      await logger.warning('Scheduler', `Unknown job: ${name}`);
      return;
    }

    const job = cron.schedule(schedule, async () => {
      await this.executeJob(name, task);
    });

    this.jobs.set(name, job);
    await logger.info('Scheduler', `Started job: ${name}`, { schedule });
  }

  /**
   * Execute a job with tracking
   */
  private async executeJob(jobName: string, task: () => Promise<any>): Promise<void> {
    const executionId = generateId('exec');
    this.jobExecutions.set(jobName, executionId);

    const startTime = Date.now();

    try {
      // Get job ID from database
      const jobRows = await query<Array<{ id: string }>>(
        'SELECT id FROM cron_jobs WHERE name = ?',
        [jobName]
      );

      if (jobRows.length === 0) {
        throw new Error(`Job not found in database: ${jobName}`);
      }

      const jobId = jobRows[0].id;

      // Record execution start
      await query(
        `INSERT INTO cron_job_history (id, job_id, started_at, status)
         VALUES (?, ?, NOW(), 'running')`,
        [executionId, jobId]
      );

      await logger.info('Scheduler', `Running job: ${jobName}`);

      // Execute the task
      const result = await task();

      const executionTime = Date.now() - startTime;

      // Record success
      await query(
        `UPDATE cron_job_history
         SET completed_at = NOW(), status = 'success', execution_time_ms = ?, metadata = ?
         WHERE id = ?`,
        [executionTime, JSON.stringify(result || {}), executionId]
      );

      await query(
        `UPDATE cron_jobs
         SET last_run = NOW(), last_status = 'success', run_count = run_count + 1
         WHERE id = ?`,
        [jobId]
      );

      await logger.success('Scheduler', `Completed job: ${jobName}`, {
        executionTime: `${executionTime}ms`,
      });
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Record error
      await query(
        `UPDATE cron_job_history
         SET completed_at = NOW(), status = 'error', error_message = ?, execution_time_ms = ?
         WHERE id = ?`,
        [errorMessage, executionTime, executionId]
      );

      const jobRows = await query<Array<{ id: string }>>(
        'SELECT id FROM cron_jobs WHERE name = ?',
        [jobName]
      );

      if (jobRows.length > 0) {
        await query(
          `UPDATE cron_jobs
           SET last_run = NOW(), last_status = 'error', last_error = ?
           WHERE id = ?`,
          [errorMessage, jobRows[0].id]
        );
      }

      await logger.error('Scheduler', `Job failed: ${jobName}`, {
        error: errorMessage,
        executionTime: `${executionTime}ms`,
      });
    } finally {
      this.jobExecutions.delete(jobName);
    }
  }

  /**
   * Job: Collect YouTube analytics
   */
  private async runYouTubeAnalytics(): Promise<any> {
    // This would integrate with YouTube API to fetch latest analytics
    // For now, return placeholder
    return { message: 'YouTube analytics collection not yet implemented' };
  }

  /**
   * Job: Process email sequences
   */
  private async runEmailSequences(): Promise<any> {
    await emailMarketingService.processSequences();
    return { message: 'Email sequences processed successfully' };
  }

  /**
   * Job: Calculate A/B test statistics
   */
  private async runABTestCalculations(): Promise<any> {
    // Get all running tests
    const tests = await query<Array<{ id: string }>>(
      'SELECT id FROM ab_tests WHERE status = ?',
      ['running']
    );

    for (const test of tests) {
      await abTestingService.calculateResults(test.id);
    }

    return { testsProcessed: tests.length };
  }

  /**
   * Job: Aggregate analytics data
   */
  private async runAnalyticsAggregation(): Promise<any> {
    // This would aggregate various analytics into summary tables
    // For now, return placeholder
    return { message: 'Analytics aggregation not yet implemented' };
  }

  /**
   * Add a custom cron job
   */
  addJob(name: string, schedule: string, task: () => Promise<void>): void {
    if (this.jobs.has(name)) {
      logger.warning('Scheduler', `Job ${name} already exists, replacing it`);
      this.jobs.get(name)?.stop();
    }

    const job = cron.schedule(schedule, async () => {
      try {
        await logger.info('Scheduler', `Running job: ${name}`);
        await task();
        await logger.success('Scheduler', `Completed job: ${name}`);
      } catch (error) {
        await logger.error('Scheduler', `Job failed: ${name}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    this.jobs.set(name, job);
    logger.info('Scheduler', `Added cron job: ${name}`, { schedule });
  }

  /**
   * Remove a cron job
   */
  removeJob(name: string): boolean {
    const job = this.jobs.get(name);
    if (job) {
      job.stop();
      this.jobs.delete(name);
      logger.info('Scheduler', `Removed cron job: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * Get status of all jobs from database
   */
  async getJobsStatus(): Promise<any[]> {
    try {
      const rows = await query<any[]>(`
        SELECT
          id,
          name,
          description,
          schedule,
          is_active,
          last_run,
          last_status,
          last_error,
          run_count
        FROM cron_jobs
        ORDER BY name
      `);
      return rows;
    } catch (error) {
      await logger.error('Scheduler', 'Failed to get jobs status', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Get job execution history
   */
  async getJobHistory(jobName: string, limit: number = 50): Promise<any[]> {
    try {
      const rows = await query<any[]>(
        `SELECT
          h.id,
          h.started_at,
          h.completed_at,
          h.status,
          h.error_message,
          h.execution_time_ms,
          h.metadata
        FROM cron_job_history h
        JOIN cron_jobs j ON h.job_id = j.id
        WHERE j.name = ?
        ORDER BY h.started_at DESC
        LIMIT ?`,
        [jobName, limit]
      );
      return rows;
    } catch (error) {
      await logger.error('Scheduler', 'Failed to get job history', {
        jobName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Enable a job
   */
  async enableJob(jobName: string): Promise<void> {
    try {
      await query(
        'UPDATE cron_jobs SET is_active = TRUE WHERE name = ?',
        [jobName]
      );

      // Get schedule and start the job
      const rows = await query<Array<{ schedule: string }>>(
        'SELECT schedule FROM cron_jobs WHERE name = ?',
        [jobName]
      );

      if (rows.length > 0) {
        await this.startJob(jobName, rows[0].schedule);
      }

      await logger.info('Scheduler', `Enabled job: ${jobName}`);
    } catch (error) {
      await logger.error('Scheduler', 'Failed to enable job', {
        jobName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Disable a job
   */
  async disableJob(jobName: string): Promise<void> {
    try {
      await query(
        'UPDATE cron_jobs SET is_active = FALSE WHERE name = ?',
        [jobName]
      );

      // Stop the running job
      const job = this.jobs.get(jobName);
      if (job) {
        job.stop();
        this.jobs.delete(jobName);
      }

      await logger.info('Scheduler', `Disabled job: ${jobName}`);
    } catch (error) {
      await logger.error('Scheduler', 'Failed to disable job', {
        jobName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Manually trigger a job execution
   */
  async triggerJob(jobName: string): Promise<void> {
    const taskMap: { [key: string]: () => Promise<any> } = {
      'youtube-analytics': () => this.runYouTubeAnalytics(),
      'email-sequences': () => this.runEmailSequences(),
      'ab-test-calculations': () => this.runABTestCalculations(),
      'analytics-aggregation': () => this.runAnalyticsAggregation(),
    };

    const task = taskMap[jobName];
    if (!task) {
      throw new Error(`Unknown job: ${jobName}`);
    }

    await logger.info('Scheduler', `Manually triggering job: ${jobName}`);
    await this.executeJob(jobName, task);
  }
}

export const schedulerService = new SchedulerService();
