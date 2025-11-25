import { query } from '../config/database';

export async function up(): Promise<void> {
  // Create table for caching YouTube keyword research results
  await query(`
    CREATE TABLE IF NOT EXISTS youtube_keyword_cache (
      id CHAR(36) PRIMARY KEY,
      keyword VARCHAR(255) NOT NULL,
      research_data JSON NOT NULL,
      quota_used INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL,
      INDEX idx_keyword (keyword),
      INDEX idx_expires (expires_at)
    )
  `);

  // Create table for tracking daily YouTube API quota usage
  await query(`
    CREATE TABLE IF NOT EXISTS youtube_api_quota_usage (
      id CHAR(36) PRIMARY KEY,
      date DATE NOT NULL UNIQUE,
      quota_used INT NOT NULL DEFAULT 0,
      searches_performed INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_date (date)
    )
  `);
}

export async function down(): Promise<void> {
  await query('DROP TABLE IF EXISTS youtube_keyword_cache');
  await query('DROP TABLE IF EXISTS youtube_api_quota_usage');
}
