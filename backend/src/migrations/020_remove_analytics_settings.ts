import { query } from '../config/database';

/**
 * Migration: Remove analytics category settings
 */
export async function up(): Promise<void> {
  await query(`
    DELETE FROM settings
    WHERE category = 'analytics'
  `);

  console.log('✅ Removed analytics settings');
}

/**
 * Rollback migration
 */
export async function down(): Promise<void> {
  await query(`
    INSERT INTO settings (id, setting_key, setting_value, setting_type, category, description)
    VALUES
      (UUID(), 'enable_analytics_tracking', 'true', 'boolean', 'analytics', 'Enable analytics tracking')
    ON DUPLICATE KEY UPDATE setting_key = setting_key
  `);

  console.log('✅ Restored analytics settings');
}
