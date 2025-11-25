import { query } from '../config/database';

export async function up() {
  await query(`
    CREATE TABLE IF NOT EXISTS static_builds (
      id VARCHAR(36) PRIMARY KEY,
      status ENUM('pending', 'building', 'completed', 'failed') DEFAULT 'pending',
      build_type VARCHAR(50) DEFAULT 'full',
      file_path VARCHAR(255),
      file_size BIGINT,
      pages_count INT DEFAULT 0,
      build_duration INT,
      error_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP NULL,
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('✅ static_builds table created');
}

export async function down() {
  await query('DROP TABLE IF EXISTS static_builds');
  console.log('✅ static_builds table dropped');
}
