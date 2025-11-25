import { query } from '../config/database';

/**
 * Migration: Remove landing pages tables (feature removed from admin)
 */
export async function up(): Promise<void> {
  // Drop tables in correct order (child tables first)
  await query('DROP TABLE IF EXISTS landing_page_analytics');
  await query('DROP TABLE IF EXISTS landing_page_leads');
  await query('DROP TABLE IF EXISTS landing_page_variants');
  await query('DROP TABLE IF EXISTS landing_page_views');
  await query('DROP TABLE IF EXISTS landing_pages');

  console.log('✅ Removed landing pages tables');
}

/**
 * Rollback migration
 */
export async function down(): Promise<void> {
  // Recreate landing_pages table
  await query(`
    CREATE TABLE IF NOT EXISTS landing_pages (
      id VARCHAR(36) PRIMARY KEY,
      page_name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Recreate landing_page_views table
  await query(`
    CREATE TABLE IF NOT EXISTS landing_page_views (
      id VARCHAR(36) PRIMARY KEY,
      page_id VARCHAR(36) NOT NULL,
      ip_address VARCHAR(45),
      user_agent TEXT,
      referrer_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (page_id) REFERENCES landing_pages(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Recreate landing_page_leads table
  await query(`
    CREATE TABLE IF NOT EXISTS landing_page_leads (
      id VARCHAR(36) PRIMARY KEY,
      page_id VARCHAR(36) NOT NULL,
      email VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      phone VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (page_id) REFERENCES landing_pages(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log('✅ Restored landing pages tables');
}
