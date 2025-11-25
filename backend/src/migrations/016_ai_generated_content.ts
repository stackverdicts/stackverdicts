import { query } from '../config/database';

export const up = async (): Promise<void> => {
  // AI Generated Content table
  await query(`
    CREATE TABLE IF NOT EXISTS ai_generated_content (
      id VARCHAR(36) PRIMARY KEY,
      keywords TEXT NOT NULL,

      -- Content Generation Results
      blog_post_id VARCHAR(36),
      raw_blog_title VARCHAR(255),
      raw_blog_content LONGTEXT,
      raw_blog_excerpt VARCHAR(500),
      raw_blog_tags JSON,

      video_script_title VARCHAR(255),
      video_script_intro TEXT,
      video_script_main TEXT,
      video_script_outro TEXT,
      video_script_full LONGTEXT,

      -- Generation Metadata
      model_used VARCHAR(50),
      generation_type ENUM('full', 'blog_only', 'video_only', 'tags_only') DEFAULT 'full',
      tokens_used INT,
      generation_time_ms INT,

      -- Performance Tracking
      blog_post_published BOOLEAN DEFAULT FALSE,
      video_script_used BOOLEAN DEFAULT FALSE,
      performance_score DECIMAL(3,2),

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      INDEX idx_keywords (keywords(255)),
      INDEX idx_blog_post_id (blog_post_id),
      INDEX idx_generation_type (generation_type),
      INDEX idx_created_at (created_at),
      FOREIGN KEY (blog_post_id) REFERENCES blog_posts(id) ON DELETE SET NULL
    )
  `);

  console.log('✅ AI generated content migration completed');
};

export const down = async (): Promise<void> => {
  await query(`DROP TABLE IF EXISTS ai_generated_content`);
  console.log('✅ AI generated content migration rolled back');
};
