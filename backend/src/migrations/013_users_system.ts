import { query } from '../config/database';

export const up = async (): Promise<void> => {
  // Users table
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      role ENUM('admin', 'editor', 'viewer') DEFAULT 'viewer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      last_login_at TIMESTAMP NULL,
      INDEX idx_email (email),
      INDEX idx_role (role)
    )
  `);

  console.log('✓ Created users table');
};

export const down = async (): Promise<void> => {
  await query('DROP TABLE IF EXISTS users');
};
