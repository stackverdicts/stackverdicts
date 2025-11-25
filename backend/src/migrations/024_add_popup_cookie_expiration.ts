import { query } from '../config/database';

/**
 * Migration: Add cookie_expiration_days to marketing_popups table
 */
export async function up(): Promise<void> {
  await query(`
    ALTER TABLE marketing_popups
    ADD COLUMN cookie_expiration_days INT DEFAULT 7 AFTER delay_seconds
  `);

  console.log('✅ Added cookie_expiration_days to marketing_popups');
}

/**
 * Rollback migration
 */
export async function down(): Promise<void> {
  await query(`
    ALTER TABLE marketing_popups
    DROP COLUMN cookie_expiration_days
  `);

  console.log('✅ Removed cookie_expiration_days from marketing_popups');
}
