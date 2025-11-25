import { query } from '../config/database';

/**
 * Migration: Create landing pages tables
 */
export async function up(): Promise<void> {
  // Main landing pages table
  await query(`
    CREATE TABLE IF NOT EXISTS landing_pages (
      id VARCHAR(36) PRIMARY KEY,
      offer_id VARCHAR(36) NOT NULL,
      site_id VARCHAR(36),
      slug VARCHAR(255) UNIQUE NOT NULL,
      page_name VARCHAR(255) NOT NULL,
      template_type ENUM('review', 'comparison', 'listicle', 'educational', 'squeeze') DEFAULT 'review',
      seo_title VARCHAR(60),
      seo_description VARCHAR(160),
      seo_keywords JSON,
      header_config JSON,
      hero_section JSON,
      sections JSON NOT NULL,
      footer_config JSON,
      tracking_pixels JSON,
      custom_css TEXT,
      custom_js TEXT,
      status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
      published_at TIMESTAMP NULL,
      last_edited_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
      FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL,
      INDEX idx_slug (slug),
      INDEX idx_offer_id (offer_id),
      INDEX idx_status (status)
    )
  `);

  console.log('✅ Created landing_pages table');

  // Landing page variants (for A/B testing)
  await query(`
    CREATE TABLE IF NOT EXISTS landing_page_variants (
      id VARCHAR(36) PRIMARY KEY,
      page_id VARCHAR(36) NOT NULL,
      variant_name VARCHAR(100) NOT NULL,
      variant_letter CHAR(1) NOT NULL,
      hero_headline VARCHAR(255),
      hero_subheadline TEXT,
      cta_button_text VARCHAR(50),
      cta_button_color VARCHAR(20),
      sections_override JSON,
      traffic_allocation DECIMAL(5,2) DEFAULT 50.00,
      is_control BOOLEAN DEFAULT false,
      views INT DEFAULT 0,
      clicks INT DEFAULT 0,
      conversions INT DEFAULT 0,
      conversion_rate DECIMAL(5,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (page_id) REFERENCES landing_pages(id) ON DELETE CASCADE,
      INDEX idx_page_id (page_id),
      INDEX idx_is_control (is_control)
    )
  `);

  console.log('✅ Created landing_page_variants table');

  // Lead captures
  await query(`
    CREATE TABLE IF NOT EXISTS landing_page_leads (
      id VARCHAR(36) PRIMARY KEY,
      page_id VARCHAR(36) NOT NULL,
      variant_id VARCHAR(36),
      email VARCHAR(255) NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      phone VARCHAR(50),
      additional_fields JSON,
      source_url VARCHAR(500),
      referrer VARCHAR(500),
      user_agent TEXT,
      ip_address VARCHAR(45),
      country VARCHAR(2),
      city VARCHAR(100),
      utm_source VARCHAR(100),
      utm_medium VARCHAR(100),
      utm_campaign VARCHAR(100),
      utm_term VARCHAR(100),
      utm_content VARCHAR(100),
      is_verified BOOLEAN DEFAULT false,
      verification_sent_at TIMESTAMP NULL,
      verified_at TIMESTAMP NULL,
      status ENUM('new', 'contacted', 'converted', 'unsubscribed') DEFAULT 'new',
      tags JSON,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (page_id) REFERENCES landing_pages(id) ON DELETE CASCADE,
      FOREIGN KEY (variant_id) REFERENCES landing_page_variants(id) ON DELETE SET NULL,
      INDEX idx_page_id (page_id),
      INDEX idx_email (email),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    )
  `);

  console.log('✅ Created landing_page_leads table');

  // Landing page analytics snapshots
  await query(`
    CREATE TABLE IF NOT EXISTS landing_page_analytics (
      id VARCHAR(36) PRIMARY KEY,
      page_id VARCHAR(36) NOT NULL,
      variant_id VARCHAR(36),
      date DATE NOT NULL,
      views INT DEFAULT 0,
      unique_visitors INT DEFAULT 0,
      bounce_rate DECIMAL(5,2) DEFAULT 0.00,
      avg_time_on_page INT DEFAULT 0,
      form_submissions INT DEFAULT 0,
      form_conversion_rate DECIMAL(5,2) DEFAULT 0.00,
      cta_clicks INT DEFAULT 0,
      cta_click_rate DECIMAL(5,2) DEFAULT 0.00,
      scroll_depth_avg DECIMAL(5,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (page_id) REFERENCES landing_pages(id) ON DELETE CASCADE,
      FOREIGN KEY (variant_id) REFERENCES landing_page_variants(id) ON DELETE SET NULL,
      UNIQUE KEY unique_page_variant_date (page_id, variant_id, date),
      INDEX idx_page_id (page_id),
      INDEX idx_date (date)
    )
  `);

  console.log('✅ Created landing_page_analytics table');
}

/**
 * Rollback migration
 */
export async function down(): Promise<void> {
  await query('DROP TABLE IF EXISTS landing_page_analytics');
  await query('DROP TABLE IF EXISTS landing_page_leads');
  await query('DROP TABLE IF EXISTS landing_page_variants');
  await query('DROP TABLE IF EXISTS landing_pages');

  console.log('✅ Dropped all landing page tables');
}
