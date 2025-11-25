import { PoolConnection } from 'mysql2/promise';

/**
 * Migration: Remove MaxBounty References
 * Renames MaxBounty-specific columns to be generic
 */

export async function up(connection: PoolConnection): Promise<void> {
  await connection.query(`
    -- Rename maxbounty_offer_id to external_offer_id (keep for backward compatibility)
    ALTER TABLE offers
      CHANGE COLUMN maxbounty_offer_id external_offer_id INT NULL
      COMMENT 'Legacy external offer ID (previously MaxBounty ID)';
  `);

  await connection.query(`
    -- Rename maxbounty_transaction_id to external_transaction_id
    ALTER TABLE conversions
      CHANGE COLUMN maxbounty_transaction_id external_transaction_id VARCHAR(255) NULL
      COMMENT 'External transaction ID from affiliate network';
  `);

  await connection.query(`
    -- Ensure all offers have a network_id (set to manual if null)
    UPDATE offers
    SET network_id = 'net_manual'
    WHERE network_id IS NULL OR network_id = '';
  `);

  await connection.query(`
    -- Disable the offer-sync cron job (MaxBounty specific)
    UPDATE cron_jobs
    SET is_active = FALSE,
        description = CONCAT(description, ' (DEPRECATED - MaxBounty no longer used)')
    WHERE name = 'offer-sync';
  `);

  console.log('✅ Migration 010: Removed MaxBounty references');
}

export async function down(connection: PoolConnection): Promise<void> {
  await connection.query(`
    ALTER TABLE offers
      CHANGE COLUMN external_offer_id maxbounty_offer_id INT NULL;
  `);

  await connection.query(`
    ALTER TABLE conversions
      CHANGE COLUMN external_transaction_id maxbounty_transaction_id VARCHAR(255) NULL;
  `);

  await connection.query(`
    UPDATE cron_jobs
    SET is_active = TRUE,
        description = REPLACE(description, ' (DEPRECATED - MaxBounty no longer used)', '')
    WHERE name = 'offer-sync';
  `);

  console.log('✅ Rollback 010: Restored MaxBounty references');
}
