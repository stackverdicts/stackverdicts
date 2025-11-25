import { query } from '../config/database';

/**
 * Migration: Remove YouTube API Key setting
 * YouTube Data API doesn't offer postback/conversion tracking for sales
 */
export async function up(): Promise<void> {
  await query(`
    DELETE FROM settings
    WHERE setting_key = 'youtube_api_key'
  `);

  console.log('✅ Removed youtube_api_key setting');
}

/**
 * Rollback migration
 */
export async function down(): Promise<void> {
  await query(`
    INSERT INTO settings (id, setting_key, setting_value, setting_type, category, description)
    VALUES
      (UUID(), 'youtube_api_key', '', 'string', 'integrations', 'YouTube Data API Key')
    ON DUPLICATE KEY UPDATE setting_key = setting_key
  `);

  console.log('✅ Restored youtube_api_key setting');
}
