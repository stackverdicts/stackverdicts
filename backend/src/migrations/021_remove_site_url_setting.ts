import { query } from '../config/database';

/**
 * Migration: Remove site_url setting from general category
 */
export async function up(): Promise<void> {
  await query(`
    DELETE FROM settings
    WHERE setting_key = 'site_url'
  `);

  console.log('✅ Removed site_url setting');
}

/**
 * Rollback migration
 */
export async function down(): Promise<void> {
  await query(`
    INSERT INTO settings (id, setting_key, setting_value, setting_type, category, description)
    VALUES
      (UUID(), 'site_url', 'http://localhost:3000', 'string', 'general', 'Main Site URL')
    ON DUPLICATE KEY UPDATE setting_key = setting_key
  `);

  console.log('✅ Restored site_url setting');
}
