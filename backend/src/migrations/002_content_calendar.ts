import { query } from '../config/database';

/**
 * Migration: Create content_calendar table
 */
export async function up(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS content_calendar (
      id VARCHAR(36) PRIMARY KEY,
      script_id VARCHAR(36),
      scheduled_publish_date DATE NOT NULL,
      actual_publish_date DATE,
      production_status ENUM('idea', 'scripted', 'recording', 'editing', 'thumbnail', 'scheduled', 'published') DEFAULT 'idea',
      priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
      notes TEXT,
      recording_date DATE,
      thumbnail_status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
      thumbnail_url VARCHAR(255),
      editor_assigned VARCHAR(100),
      publish_time TIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (script_id) REFERENCES youtube_scripts(id) ON DELETE SET NULL,
      INDEX idx_scheduled_date (scheduled_publish_date),
      INDEX idx_status (production_status)
    )
  `);

  console.log('✅ Created content_calendar table');
}

/**
 * Rollback migration
 */
export async function down(): Promise<void> {
  await query('DROP TABLE IF EXISTS content_calendar');
  console.log('✅ Dropped content_calendar table');
}
