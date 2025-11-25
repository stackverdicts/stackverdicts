import { query } from '../config/database';

/**
 * Migration: Move anthropic_api_key from 'ai' category to 'integrations' category
 */
export async function up(): Promise<void> {
  await query(`
    UPDATE settings
    SET category = 'integrations'
    WHERE setting_key = 'anthropic_api_key'
  `);

  console.log('✅ Moved anthropic_api_key to integrations category');
}

/**
 * Rollback migration
 */
export async function down(): Promise<void> {
  await query(`
    UPDATE settings
    SET category = 'ai'
    WHERE setting_key = 'anthropic_api_key'
  `);

  console.log('✅ Moved anthropic_api_key back to ai category');
}
