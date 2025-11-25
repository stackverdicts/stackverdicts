import { query } from '../config/database';

/**
 * Migration: Create cron job tracking tables
 */
export async function up(): Promise<void> {
  // Cron jobs table for tracking scheduled jobs
  await query(`
    CREATE TABLE IF NOT EXISTS cron_jobs (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      description VARCHAR(500),
      schedule VARCHAR(50) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      last_run TIMESTAMP NULL,
      last_status ENUM('success', 'error', 'running') NULL,
      last_error TEXT NULL,
      run_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_name (name),
      INDEX idx_is_active (is_active)
    )
  `);

  console.log('✅ Created cron_jobs table');

  // Job execution history
  await query(`
    CREATE TABLE IF NOT EXISTS cron_job_history (
      id VARCHAR(36) PRIMARY KEY,
      job_id VARCHAR(36) NOT NULL,
      started_at TIMESTAMP NOT NULL,
      completed_at TIMESTAMP NULL,
      status ENUM('success', 'error', 'running') DEFAULT 'running',
      error_message TEXT NULL,
      execution_time_ms INT NULL,
      metadata JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES cron_jobs(id) ON DELETE CASCADE,
      INDEX idx_job_id (job_id),
      INDEX idx_status (status),
      INDEX idx_started_at (started_at)
    )
  `);

  console.log('✅ Created cron_job_history table');

  // Insert default jobs
  await query(`
    INSERT INTO cron_jobs (id, name, description, schedule, is_active)
    VALUES
      (UUID(), 'offer-sync', 'Sync offers from MaxBounty API', '0 2 * * *', TRUE),
      (UUID(), 'youtube-analytics', 'Collect YouTube video analytics', '0 3 * * *', TRUE),
      (UUID(), 'email-sequences', 'Process email sequence steps', '*/15 * * * *', TRUE),
      (UUID(), 'ab-test-calculations', 'Calculate A/B test statistics', '0 */6 * * *', TRUE),
      (UUID(), 'analytics-aggregation', 'Aggregate daily analytics data', '0 4 * * *', TRUE)
    ON DUPLICATE KEY UPDATE name = name
  `);

  console.log('✅ Inserted default cron jobs');
}

/**
 * Rollback migration
 */
export async function down(): Promise<void> {
  await query('DROP TABLE IF EXISTS cron_job_history');
  await query('DROP TABLE IF EXISTS cron_jobs');

  console.log('✅ Dropped cron job tables');
}
