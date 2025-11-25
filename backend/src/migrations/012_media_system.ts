import { query } from '../config/database';

export const up = async (): Promise<void> => {
  // Media table - central repository for all uploaded files
  await query(`
    CREATE TABLE IF NOT EXISTS media (
      id VARCHAR(36) PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      title VARCHAR(255),
      alt_text VARCHAR(255),
      caption TEXT,
      mime_type VARCHAR(100) NOT NULL,
      file_size INT NOT NULL,
      width INT,
      height INT,
      uploaded_by VARCHAR(36) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      INDEX idx_uploaded_by (uploaded_by),
      INDEX idx_mime_type (mime_type),
      INDEX idx_created_at (created_at)
    )
  `);

  // Media variants table - stores different sizes/crops of the same media
  await query(`
    CREATE TABLE IF NOT EXISTS media_variants (
      id VARCHAR(36) PRIMARY KEY,
      media_id VARCHAR(36) NOT NULL,
      name VARCHAR(50) NOT NULL,
      url VARCHAR(500) NOT NULL,
      width INT,
      height INT,
      file_size INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      UNIQUE KEY unique_media_variant (media_id, name),
      INDEX idx_media_id (media_id),
      FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ Media system migration completed');
};

export const down = async (): Promise<void> => {
  await query(`DROP TABLE IF EXISTS media_variants`);
  await query(`DROP TABLE IF EXISTS media`);

  console.log('✅ Media system migration rolled back');
};
