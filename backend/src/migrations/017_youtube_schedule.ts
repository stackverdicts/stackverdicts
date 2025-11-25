import { query } from '../config/database';

export async function up(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS youtube_schedule (
      id VARCHAR(36) PRIMARY KEY,
      post_id VARCHAR(36) NOT NULL,
      scheduled_date DATE NOT NULL,
      scheduled_time TIME DEFAULT '10:00:00',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
      INDEX idx_scheduled_date (scheduled_date),
      INDEX idx_post_id (post_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log('✅ Created youtube_schedule table');
}

export async function down(): Promise<void> {
  await query('DROP TABLE IF EXISTS youtube_schedule');
  console.log('✅ Dropped youtube_schedule table');
}
