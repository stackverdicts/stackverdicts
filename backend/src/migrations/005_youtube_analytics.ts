import { query } from '../config/database';

/**
 * Migration: Create YouTube analytics tables
 */
export async function up(): Promise<void> {
  // YouTube videos table
  await query(`
    CREATE TABLE IF NOT EXISTS youtube_videos (
      id VARCHAR(36) PRIMARY KEY,
      script_id VARCHAR(36),
      youtube_video_id VARCHAR(50) UNIQUE NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      thumbnail_url VARCHAR(500),
      published_at TIMESTAMP NOT NULL,
      duration INT,
      category_id VARCHAR(10),
      tags JSON,
      privacy_status ENUM('public', 'unlisted', 'private') DEFAULT 'public',
      upload_status ENUM('uploaded', 'processed', 'failed') DEFAULT 'uploaded',
      affiliate_links JSON,
      tracking_links JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (script_id) REFERENCES youtube_scripts(id) ON DELETE SET NULL,
      INDEX idx_youtube_video_id (youtube_video_id),
      INDEX idx_published_at (published_at)
    )
  `);

  console.log('✅ Created youtube_videos table');

  // YouTube video analytics snapshots
  await query(`
    CREATE TABLE IF NOT EXISTS youtube_video_analytics (
      id VARCHAR(36) PRIMARY KEY,
      video_id VARCHAR(36) NOT NULL,
      snapshot_date DATE NOT NULL,
      views INT DEFAULT 0,
      likes INT DEFAULT 0,
      dislikes INT DEFAULT 0,
      comments INT DEFAULT 0,
      shares INT DEFAULT 0,
      watch_time_minutes INT DEFAULT 0,
      average_view_duration INT DEFAULT 0,
      average_view_percentage DECIMAL(5,2) DEFAULT 0.00,
      subscribers_gained INT DEFAULT 0,
      subscribers_lost INT DEFAULT 0,
      impressions INT DEFAULT 0,
      click_through_rate DECIMAL(5,2) DEFAULT 0.00,
      engagement_rate DECIMAL(5,2) DEFAULT 0.00,
      revenue_estimated DECIMAL(10,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (video_id) REFERENCES youtube_videos(id) ON DELETE CASCADE,
      UNIQUE KEY unique_video_date (video_id, snapshot_date),
      INDEX idx_video_id (video_id),
      INDEX idx_snapshot_date (snapshot_date)
    )
  `);

  console.log('✅ Created youtube_video_analytics table');

  // YouTube traffic sources
  await query(`
    CREATE TABLE IF NOT EXISTS youtube_traffic_sources (
      id VARCHAR(36) PRIMARY KEY,
      video_id VARCHAR(36) NOT NULL,
      snapshot_date DATE NOT NULL,
      source_type VARCHAR(50) NOT NULL,
      views INT DEFAULT 0,
      watch_time_minutes INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (video_id) REFERENCES youtube_videos(id) ON DELETE CASCADE,
      INDEX idx_video_id (video_id),
      INDEX idx_snapshot_date (snapshot_date)
    )
  `);

  console.log('✅ Created youtube_traffic_sources table');

  // YouTube affiliate conversions (link clicks from video descriptions)
  await query(`
    CREATE TABLE IF NOT EXISTS youtube_affiliate_conversions (
      id VARCHAR(36) PRIMARY KEY,
      video_id VARCHAR(36) NOT NULL,
      offer_id VARCHAR(36) NOT NULL,
      tracking_link VARCHAR(500) NOT NULL,
      click_date TIMESTAMP NOT NULL,
      conversion_date TIMESTAMP NULL,
      conversion_status ENUM('clicked', 'pending', 'approved', 'rejected') DEFAULT 'clicked',
      payout DECIMAL(10,2) DEFAULT 0.00,
      revenue DECIMAL(10,2) DEFAULT 0.00,
      referrer VARCHAR(500),
      user_agent TEXT,
      ip_address VARCHAR(45),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (video_id) REFERENCES youtube_videos(id) ON DELETE CASCADE,
      FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
      INDEX idx_video_id (video_id),
      INDEX idx_offer_id (offer_id),
      INDEX idx_click_date (click_date),
      INDEX idx_conversion_status (conversion_status)
    )
  `);

  console.log('✅ Created youtube_affiliate_conversions table');

  // YouTube channel analytics
  await query(`
    CREATE TABLE IF NOT EXISTS youtube_channel_analytics (
      id VARCHAR(36) PRIMARY KEY,
      snapshot_date DATE NOT NULL UNIQUE,
      total_views INT DEFAULT 0,
      total_subscribers INT DEFAULT 0,
      total_videos INT DEFAULT 0,
      subscribers_gained INT DEFAULT 0,
      subscribers_lost INT DEFAULT 0,
      total_watch_time_minutes INT DEFAULT 0,
      average_view_duration INT DEFAULT 0,
      estimated_revenue DECIMAL(10,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_snapshot_date (snapshot_date)
    )
  `);

  console.log('✅ Created youtube_channel_analytics table');
}

/**
 * Rollback migration
 */
export async function down(): Promise<void> {
  await query('DROP TABLE IF EXISTS youtube_channel_analytics');
  await query('DROP TABLE IF EXISTS youtube_affiliate_conversions');
  await query('DROP TABLE IF EXISTS youtube_traffic_sources');
  await query('DROP TABLE IF EXISTS youtube_video_analytics');
  await query('DROP TABLE IF EXISTS youtube_videos');

  console.log('✅ Dropped all YouTube analytics tables');
}
