import { query } from '../config/database';

export const up = async (): Promise<void> => {
  // Blog Posts table
  await query(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id VARCHAR(36) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      content LONGTEXT NOT NULL,
      excerpt VARCHAR(500),
      featured_image VARCHAR(500),

      -- Publishing
      published_at TIMESTAMP NULL,
      publish_date_override TIMESTAMP NULL,

      -- Author
      author_id VARCHAR(36) NOT NULL,

      -- SEO Fields (Yoast-style)
      seo_title VARCHAR(60),
      seo_description VARCHAR(160),
      focus_keyword VARCHAR(100),
      canonical_url VARCHAR(500),

      -- Open Graph
      og_title VARCHAR(60),
      og_description VARCHAR(160),
      og_image VARCHAR(500),

      -- Twitter Card
      twitter_title VARCHAR(60),
      twitter_description VARCHAR(160),
      twitter_image VARCHAR(500),

      -- Meta Robots
      meta_robots_noindex BOOLEAN DEFAULT FALSE,
      meta_robots_nofollow BOOLEAN DEFAULT FALSE,

      -- Hierarchical structure
      parent_id VARCHAR(36),
      \`order\` INT DEFAULT 0,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      INDEX idx_slug (slug),
      INDEX idx_published_at (published_at),
      INDEX idx_author_id (author_id),
      INDEX idx_parent_id (parent_id),
      INDEX idx_order (\`order\`),
      FOREIGN KEY (parent_id) REFERENCES blog_posts(id) ON DELETE CASCADE
    )
  `);

  // Tags table
  await query(`
    CREATE TABLE IF NOT EXISTS tags (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL,
      slug VARCHAR(50) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      INDEX idx_slug (slug),
      INDEX idx_name (name)
    )
  `);

  // Blog Post Tags junction table
  await query(`
    CREATE TABLE IF NOT EXISTS blog_post_tags (
      id VARCHAR(36) PRIMARY KEY,
      post_id VARCHAR(36) NOT NULL,
      tag_id VARCHAR(36) NOT NULL,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      UNIQUE KEY unique_post_tag (post_id, tag_id),
      INDEX idx_post_id (post_id),
      INDEX idx_tag_id (tag_id),
      FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ Blog system migration completed');
};

export const down = async (): Promise<void> => {
  await query(`DROP TABLE IF EXISTS blog_post_tags`);
  await query(`DROP TABLE IF EXISTS tags`);
  await query(`DROP TABLE IF EXISTS blog_posts`);

  console.log('✅ Blog system migration rolled back');
};
