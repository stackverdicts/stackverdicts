import { query } from '../config/database';

/**
 * Migration: Remove automation category settings
 */
export async function up(): Promise<void> {
  await query(`
    DELETE FROM settings
    WHERE category = 'automation'
  `);

  console.log('✅ Removed automation settings');
}

/**
 * Rollback migration
 */
export async function down(): Promise<void> {
  await query(`
    INSERT INTO settings (id, setting_key, setting_value, setting_type, category, description)
    VALUES
      (UUID(), 'auto_publish_scripts', 'false', 'boolean', 'automation', 'Auto-publish generated scripts'),
      (UUID(), 'auto_publish_pages', 'false', 'boolean', 'automation', 'Auto-publish generated pages')
    ON DUPLICATE KEY UPDATE setting_key = setting_key
  `);

  console.log('✅ Restored automation settings');
}
