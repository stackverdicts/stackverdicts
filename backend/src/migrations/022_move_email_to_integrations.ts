import { query } from '../config/database';

/**
 * Migration: Move email settings from 'email' category to 'integrations' category
 * This consolidates all API/integration settings in one place
 */
export async function up(): Promise<void> {
  await query(`
    UPDATE settings
    SET category = 'integrations'
    WHERE category = 'email'
  `);

  console.log('✅ Moved email settings to integrations category');
}

/**
 * Rollback migration
 */
export async function down(): Promise<void> {
  await query(`
    UPDATE settings
    SET category = 'email'
    WHERE setting_key IN (
      'smtp_host',
      'smtp_port',
      'smtp_username',
      'smtp_password',
      'from_email',
      'from_name'
    )
  `);

  console.log('✅ Moved email settings back to email category');
}
