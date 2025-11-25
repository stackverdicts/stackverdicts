import { query } from '../config/database';

/**
 * Migration: Create settings table
 */
export async function up(): Promise<void> {
  // Settings table for storing application configuration
  await query(`
    CREATE TABLE IF NOT EXISTS settings (
      id VARCHAR(36) PRIMARY KEY,
      setting_key VARCHAR(100) UNIQUE NOT NULL,
      setting_value TEXT,
      setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
      category VARCHAR(50) NOT NULL,
      is_encrypted BOOLEAN DEFAULT FALSE,
      description VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_category (category),
      INDEX idx_setting_key (setting_key)
    )
  `);

  console.log('✅ Created settings table');

  // Insert default settings
  await query(`
    INSERT INTO settings (id, setting_key, setting_value, setting_type, category, description)
    VALUES
      (UUID(), 'maxbounty_api_key', '', 'string', 'integrations', 'MaxBounty API Key'),
      (UUID(), 'maxbounty_affiliate_id', '', 'string', 'integrations', 'MaxBounty Affiliate ID'),
      (UUID(), 'anthropic_api_key', '', 'string', 'ai', 'Anthropic Claude API Key'),
      (UUID(), 'youtube_api_key', '', 'string', 'integrations', 'YouTube Data API Key'),
      (UUID(), 'smtp_host', 'smtp.gmail.com', 'string', 'email', 'SMTP Server Host'),
      (UUID(), 'smtp_port', '587', 'number', 'email', 'SMTP Server Port'),
      (UUID(), 'smtp_username', '', 'string', 'email', 'SMTP Username'),
      (UUID(), 'smtp_password', '', 'string', 'email', 'SMTP Password'),
      (UUID(), 'from_email', '', 'string', 'email', 'Default From Email'),
      (UUID(), 'from_name', 'Automated Affiliate Hub', 'string', 'email', 'Default From Name'),
      (UUID(), 'site_url', 'http://localhost:3000', 'string', 'general', 'Main Site URL'),
      (UUID(), 'site_name', 'Automated Affiliate Hub', 'string', 'general', 'Site Name'),
      (UUID(), 'timezone', 'UTC', 'string', 'general', 'Default Timezone'),
      (UUID(), 'auto_publish_scripts', 'false', 'boolean', 'automation', 'Auto-publish generated scripts'),
      (UUID(), 'auto_publish_pages', 'false', 'boolean', 'automation', 'Auto-publish generated pages'),
      (UUID(), 'enable_analytics_tracking', 'true', 'boolean', 'analytics', 'Enable analytics tracking')
    ON DUPLICATE KEY UPDATE setting_key = setting_key
  `);

  console.log('✅ Inserted default settings');
}

/**
 * Rollback migration
 */
export async function down(): Promise<void> {
  await query('DROP TABLE IF EXISTS settings');

  console.log('✅ Dropped settings table');
}
