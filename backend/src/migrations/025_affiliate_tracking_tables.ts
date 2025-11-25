import { query } from '../config/database';

/**
 * Migration: Create affiliate tracking tables (offers, clicks, conversions)
 */
export async function up(): Promise<void> {
  // Offers table is created by migration 009, so we skip creating it here
  // Just verify it exists
  const tableExists = await query<any>(`
    SELECT COUNT(*) as count
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
    AND table_name = 'offers'
  `);

  if (tableExists[0]?.count === 0) {
    // Create offers table only if it doesn't exist
    await query(`
      CREATE TABLE offers (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        network_id VARCHAR(36),
        offer_url TEXT NOT NULL,
        payout DECIMAL(10, 2) DEFAULT 0.00,
        commission_type ENUM('fixed', 'percentage', 'recurring', 'tiered') DEFAULT 'fixed',
        commission_value DECIMAL(10, 2),
        currency VARCHAR(3) DEFAULT 'USD',
        category VARCHAR(100),
        status ENUM('active', 'paused', 'expired') DEFAULT 'active',
        thumbnail_url VARCHAR(500),
        epc DECIMAL(10, 2) DEFAULT 0.00,
        conversion_rate DECIMAL(5, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_network_id (network_id),
        INDEX idx_status (status),
        INDEX idx_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  // Create clicks table
  await query(`
    CREATE TABLE IF NOT EXISTS clicks (
      id VARCHAR(36) PRIMARY KEY,
      offer_id VARCHAR(36) NOT NULL,
      click_id VARCHAR(100) UNIQUE,
      ip_address VARCHAR(45),
      user_agent TEXT,
      referrer_url TEXT,
      landing_page_url TEXT,
      source VARCHAR(100),
      medium VARCHAR(100),
      campaign VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_offer_id (offer_id),
      INDEX idx_click_id (click_id),
      INDEX idx_created_at (created_at),
      INDEX idx_source (source),
      FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Create conversions table
  await query(`
    CREATE TABLE IF NOT EXISTS conversions (
      id VARCHAR(36) PRIMARY KEY,
      offer_id VARCHAR(36) NOT NULL,
      click_id VARCHAR(36),
      transaction_id VARCHAR(100),
      payout DECIMAL(10, 2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'USD',
      status ENUM('pending', 'approved', 'rejected', 'reversed') DEFAULT 'pending',
      conversion_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      approval_date TIMESTAMP NULL,
      ip_address VARCHAR(45),
      user_agent TEXT,
      referrer_url TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_offer_id (offer_id),
      INDEX idx_click_id (click_id),
      INDEX idx_status (status),
      INDEX idx_conversion_date (conversion_date),
      INDEX idx_transaction_id (transaction_id),
      FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
      FOREIGN KEY (click_id) REFERENCES clicks(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Create youtube_affiliate_conversions table
  await query(`
    CREATE TABLE IF NOT EXISTS youtube_affiliate_conversions (
      id VARCHAR(36) PRIMARY KEY,
      video_id VARCHAR(36),
      offer_id VARCHAR(36),
      transaction_id VARCHAR(100),
      revenue DECIMAL(10, 2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'USD',
      conversion_status ENUM('pending', 'approved', 'rejected', 'reversed') DEFAULT 'pending',
      conversion_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      approval_date TIMESTAMP NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_video_id (video_id),
      INDEX idx_offer_id (offer_id),
      INDEX idx_conversion_status (conversion_status),
      INDEX idx_conversion_date (conversion_date),
      FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log('✅ Created affiliate tracking tables: offers, clicks, conversions, youtube_affiliate_conversions');
}

/**
 * Rollback migration
 */
export async function down(): Promise<void> {
  await query('DROP TABLE IF EXISTS youtube_affiliate_conversions');
  await query('DROP TABLE IF EXISTS conversions');
  await query('DROP TABLE IF EXISTS clicks');
  await query('DROP TABLE IF EXISTS offers');

  console.log('✅ Removed affiliate tracking tables');
}
