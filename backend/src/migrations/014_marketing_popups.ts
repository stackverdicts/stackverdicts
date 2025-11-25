import { query } from '../config/database';

export const up = async (): Promise<void> => {
  // Marketing popups table - stores popup configurations
  await query(`
    CREATE TABLE IF NOT EXISTS marketing_popups (
      id VARCHAR(36) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      image_url VARCHAR(500),
      button_text VARCHAR(100),
      button_url VARCHAR(500),
      display_frequency ENUM('once_per_session', 'every_page_view', 'once_per_day', 'once_per_week') DEFAULT 'once_per_session',
      is_active BOOLEAN DEFAULT FALSE,
      delay_seconds INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      INDEX idx_is_active (is_active),
      INDEX idx_created_at (created_at)
    )
  `);

  console.log('✅ Marketing popups migration completed');
};

export const down = async (): Promise<void> => {
  await query(`DROP TABLE IF EXISTS marketing_popups`);

  console.log('✅ Marketing popups migration rolled back');
};
