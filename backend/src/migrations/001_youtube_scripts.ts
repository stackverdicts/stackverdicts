import { query } from '../config/database';

/**
 * Migration: Create youtube_scripts table
 */
export async function up(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS youtube_scripts (
      id VARCHAR(36) PRIMARY KEY,
      offer_id VARCHAR(36) NOT NULL,
      video_type ENUM('review', 'comparison', 'educational', 'personal') NOT NULL,
      title VARCHAR(255) NOT NULL,
      seo_title VARCHAR(100),
      hook TEXT NOT NULL,
      intro TEXT NOT NULL,
      main_content JSON NOT NULL,
      cta TEXT NOT NULL,
      outro TEXT NOT NULL,
      thumbnail_text VARCHAR(50),
      description TEXT,
      tags JSON,
      timestamps JSON,
      keywords JSON,
      estimated_length INT,
      target_audience VARCHAR(100),
      tone ENUM('professional', 'casual', 'enthusiastic', 'educational') DEFAULT 'casual',
      status ENUM('draft', 'recorded', 'editing', 'scheduled', 'published') DEFAULT 'draft',
      youtube_url VARCHAR(255),
      youtube_video_id VARCHAR(50),
      performance_metrics JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      published_at TIMESTAMP NULL,
      FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
      INDEX idx_video_type (video_type),
      INDEX idx_status (status),
      INDEX idx_published_at (published_at)
    )
  `);

  console.log('✅ Created youtube_scripts table');
}

/**
 * Rollback migration
 */
export async function down(): Promise<void> {
  await query('DROP TABLE IF EXISTS youtube_scripts');
  console.log('✅ Dropped youtube_scripts table');
}
