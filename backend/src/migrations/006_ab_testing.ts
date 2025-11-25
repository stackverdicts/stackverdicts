import { query } from '../config/database';

/**
 * Migration: Create A/B testing tables
 */
export async function up(): Promise<void> {
  // A/B tests table
  await query(`
    CREATE TABLE IF NOT EXISTS ab_tests (
      id VARCHAR(36) PRIMARY KEY,
      test_name VARCHAR(255) NOT NULL,
      test_type ENUM('landing_page', 'email_subject', 'email_content') NOT NULL,
      status ENUM('draft', 'running', 'paused', 'completed') DEFAULT 'draft',
      start_date TIMESTAMP NULL,
      end_date TIMESTAMP NULL,
      winning_variant_id VARCHAR(36) NULL,
      statistical_confidence DECIMAL(5,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status),
      INDEX idx_test_type (test_type)
    )
  `);

  console.log('✅ Created ab_tests table');

  // A/B test variants table
  await query(`
    CREATE TABLE IF NOT EXISTS ab_test_variants (
      id VARCHAR(36) PRIMARY KEY,
      test_id VARCHAR(36) NOT NULL,
      variant_name VARCHAR(100) NOT NULL,
      variant_type ENUM('control', 'variant_a', 'variant_b', 'variant_c') NOT NULL,
      traffic_percentage INT DEFAULT 50,
      landing_page_id VARCHAR(36) NULL,
      email_subject VARCHAR(500) NULL,
      email_content TEXT NULL,
      impressions INT DEFAULT 0,
      conversions INT DEFAULT 0,
      conversion_rate DECIMAL(5,2) DEFAULT 0.00,
      revenue_generated DECIMAL(10,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (test_id) REFERENCES ab_tests(id) ON DELETE CASCADE,
      FOREIGN KEY (landing_page_id) REFERENCES landing_pages(id) ON DELETE SET NULL,
      INDEX idx_test_id (test_id),
      INDEX idx_landing_page_id (landing_page_id)
    )
  `);

  console.log('✅ Created ab_test_variants table');

  // A/B test events table (impressions and conversions)
  await query(`
    CREATE TABLE IF NOT EXISTS ab_test_events (
      id VARCHAR(36) PRIMARY KEY,
      test_id VARCHAR(36) NOT NULL,
      variant_id VARCHAR(36) NOT NULL,
      event_type ENUM('impression', 'conversion') NOT NULL,
      user_identifier VARCHAR(255),
      ip_address VARCHAR(45),
      user_agent TEXT,
      referrer VARCHAR(500),
      conversion_value DECIMAL(10,2) DEFAULT 0.00,
      metadata JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (test_id) REFERENCES ab_tests(id) ON DELETE CASCADE,
      FOREIGN KEY (variant_id) REFERENCES ab_test_variants(id) ON DELETE CASCADE,
      INDEX idx_test_id (test_id),
      INDEX idx_variant_id (variant_id),
      INDEX idx_event_type (event_type),
      INDEX idx_created_at (created_at)
    )
  `);

  console.log('✅ Created ab_test_events table');

  // A/B test results summary table
  await query(`
    CREATE TABLE IF NOT EXISTS ab_test_results (
      id VARCHAR(36) PRIMARY KEY,
      test_id VARCHAR(36) NOT NULL,
      snapshot_date DATE NOT NULL,
      variant_id VARCHAR(36) NOT NULL,
      impressions INT DEFAULT 0,
      conversions INT DEFAULT 0,
      conversion_rate DECIMAL(5,2) DEFAULT 0.00,
      revenue DECIMAL(10,2) DEFAULT 0.00,
      average_order_value DECIMAL(10,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (test_id) REFERENCES ab_tests(id) ON DELETE CASCADE,
      FOREIGN KEY (variant_id) REFERENCES ab_test_variants(id) ON DELETE CASCADE,
      UNIQUE KEY unique_test_variant_date (test_id, variant_id, snapshot_date),
      INDEX idx_test_id (test_id),
      INDEX idx_snapshot_date (snapshot_date)
    )
  `);

  console.log('✅ Created ab_test_results table');
}

/**
 * Rollback migration
 */
export async function down(): Promise<void> {
  await query('DROP TABLE IF EXISTS ab_test_results');
  await query('DROP TABLE IF EXISTS ab_test_events');
  await query('DROP TABLE IF EXISTS ab_test_variants');
  await query('DROP TABLE IF EXISTS ab_tests');

  console.log('✅ Dropped all A/B testing tables');
}
