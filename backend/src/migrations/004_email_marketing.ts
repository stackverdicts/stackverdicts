import { query } from '../config/database';

/**
 * Migration: Create email marketing tables
 */
export async function up(): Promise<void> {
  // Email campaigns
  await query(`
    CREATE TABLE IF NOT EXISTS email_campaigns (
      id VARCHAR(36) PRIMARY KEY,
      campaign_name VARCHAR(255) NOT NULL,
      campaign_type ENUM('one_time', 'drip', 'nurture', 'promotional') DEFAULT 'one_time',
      subject_line VARCHAR(255) NOT NULL,
      from_name VARCHAR(100) NOT NULL,
      from_email VARCHAR(255) NOT NULL,
      reply_to_email VARCHAR(255),
      preview_text VARCHAR(255),
      status ENUM('draft', 'scheduled', 'sending', 'sent', 'paused', 'completed') DEFAULT 'draft',
      send_date TIMESTAMP NULL,
      timezone VARCHAR(50) DEFAULT 'UTC',
      segment_criteria JSON,
      tags JSON,
      total_recipients INT DEFAULT 0,
      sent_count INT DEFAULT 0,
      delivered_count INT DEFAULT 0,
      opened_count INT DEFAULT 0,
      clicked_count INT DEFAULT 0,
      unsubscribed_count INT DEFAULT 0,
      bounced_count INT DEFAULT 0,
      open_rate DECIMAL(5,2) DEFAULT 0.00,
      click_rate DECIMAL(5,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status),
      INDEX idx_send_date (send_date)
    )
  `);

  console.log('✅ Created email_campaigns table');

  // Email templates
  await query(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id VARCHAR(36) PRIMARY KEY,
      template_name VARCHAR(255) NOT NULL,
      template_type ENUM('welcome', 'nurture', 'promotional', 'transactional', 'custom') DEFAULT 'custom',
      subject_line VARCHAR(255) NOT NULL,
      preview_text VARCHAR(255),
      html_content TEXT NOT NULL,
      plain_text_content TEXT,
      design_json JSON,
      variables JSON,
      thumbnail_url VARCHAR(255),
      is_default BOOLEAN DEFAULT false,
      usage_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_template_type (template_type)
    )
  `);

  console.log('✅ Created email_templates table');

  // Email sequences (drip campaigns)
  await query(`
    CREATE TABLE IF NOT EXISTS email_sequences (
      id VARCHAR(36) PRIMARY KEY,
      sequence_name VARCHAR(255) NOT NULL,
      description TEXT,
      trigger_type ENUM('lead_capture', 'tag_added', 'manual', 'purchase', 'abandoned_cart') DEFAULT 'manual',
      trigger_config JSON,
      status ENUM('active', 'paused', 'draft') DEFAULT 'draft',
      total_enrolled INT DEFAULT 0,
      total_completed INT DEFAULT 0,
      avg_completion_rate DECIMAL(5,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status),
      INDEX idx_trigger_type (trigger_type)
    )
  `);

  console.log('✅ Created email_sequences table');

  // Email sequence steps
  await query(`
    CREATE TABLE IF NOT EXISTS email_sequence_steps (
      id VARCHAR(36) PRIMARY KEY,
      sequence_id VARCHAR(36) NOT NULL,
      step_number INT NOT NULL,
      step_name VARCHAR(255) NOT NULL,
      template_id VARCHAR(36),
      subject_line VARCHAR(255) NOT NULL,
      html_content TEXT NOT NULL,
      plain_text_content TEXT,
      delay_value INT NOT NULL,
      delay_unit ENUM('minutes', 'hours', 'days', 'weeks') DEFAULT 'days',
      send_time TIME DEFAULT '09:00:00',
      conditions JSON,
      sent_count INT DEFAULT 0,
      opened_count INT DEFAULT 0,
      clicked_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (sequence_id) REFERENCES email_sequences(id) ON DELETE CASCADE,
      FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE SET NULL,
      INDEX idx_sequence_id (sequence_id),
      INDEX idx_step_number (step_number)
    )
  `);

  console.log('✅ Created email_sequence_steps table');

  // Email subscribers
  await query(`
    CREATE TABLE IF NOT EXISTS email_subscribers (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      phone VARCHAR(50),
      source VARCHAR(100),
      source_page_id VARCHAR(36),
      status ENUM('subscribed', 'unsubscribed', 'bounced', 'complained') DEFAULT 'subscribed',
      subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      unsubscribed_at TIMESTAMP NULL,
      last_sent_at TIMESTAMP NULL,
      last_opened_at TIMESTAMP NULL,
      last_clicked_at TIMESTAMP NULL,
      total_emails_sent INT DEFAULT 0,
      total_emails_opened INT DEFAULT 0,
      total_emails_clicked INT DEFAULT 0,
      engagement_score INT DEFAULT 0,
      tags JSON,
      custom_fields JSON,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (source_page_id) REFERENCES landing_pages(id) ON DELETE SET NULL,
      INDEX idx_email (email),
      INDEX idx_status (status),
      INDEX idx_engagement_score (engagement_score)
    )
  `);

  console.log('✅ Created email_subscribers table');

  // Email sequence enrollments
  await query(`
    CREATE TABLE IF NOT EXISTS email_sequence_enrollments (
      id VARCHAR(36) PRIMARY KEY,
      sequence_id VARCHAR(36) NOT NULL,
      subscriber_id VARCHAR(36) NOT NULL,
      current_step INT DEFAULT 0,
      status ENUM('active', 'paused', 'completed', 'exited') DEFAULT 'active',
      enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP NULL,
      next_send_at TIMESTAMP NULL,
      last_sent_step INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (sequence_id) REFERENCES email_sequences(id) ON DELETE CASCADE,
      FOREIGN KEY (subscriber_id) REFERENCES email_subscribers(id) ON DELETE CASCADE,
      UNIQUE KEY unique_enrollment (sequence_id, subscriber_id),
      INDEX idx_status (status),
      INDEX idx_next_send_at (next_send_at)
    )
  `);

  console.log('✅ Created email_sequence_enrollments table');

  // Email sends/logs
  await query(`
    CREATE TABLE IF NOT EXISTS email_sends (
      id VARCHAR(36) PRIMARY KEY,
      campaign_id VARCHAR(36),
      sequence_id VARCHAR(36),
      sequence_step_id VARCHAR(36),
      subscriber_id VARCHAR(36) NOT NULL,
      email VARCHAR(255) NOT NULL,
      subject_line VARCHAR(255) NOT NULL,
      from_email VARCHAR(255) NOT NULL,
      status ENUM('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed') DEFAULT 'queued',
      sent_at TIMESTAMP NULL,
      delivered_at TIMESTAMP NULL,
      opened_at TIMESTAMP NULL,
      first_clicked_at TIMESTAMP NULL,
      bounced_at TIMESTAMP NULL,
      bounce_reason TEXT,
      open_count INT DEFAULT 0,
      click_count INT DEFAULT 0,
      unique_clicks INT DEFAULT 0,
      provider_message_id VARCHAR(255),
      provider_response JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE CASCADE,
      FOREIGN KEY (sequence_id) REFERENCES email_sequences(id) ON DELETE CASCADE,
      FOREIGN KEY (sequence_step_id) REFERENCES email_sequence_steps(id) ON DELETE SET NULL,
      FOREIGN KEY (subscriber_id) REFERENCES email_subscribers(id) ON DELETE CASCADE,
      INDEX idx_campaign_id (campaign_id),
      INDEX idx_subscriber_id (subscriber_id),
      INDEX idx_status (status),
      INDEX idx_sent_at (sent_at)
    )
  `);

  console.log('✅ Created email_sends table');

  // Email link clicks
  await query(`
    CREATE TABLE IF NOT EXISTS email_link_clicks (
      id VARCHAR(36) PRIMARY KEY,
      send_id VARCHAR(36) NOT NULL,
      subscriber_id VARCHAR(36) NOT NULL,
      url VARCHAR(500) NOT NULL,
      link_text VARCHAR(255),
      clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (send_id) REFERENCES email_sends(id) ON DELETE CASCADE,
      FOREIGN KEY (subscriber_id) REFERENCES email_subscribers(id) ON DELETE CASCADE,
      INDEX idx_send_id (send_id),
      INDEX idx_subscriber_id (subscriber_id),
      INDEX idx_clicked_at (clicked_at)
    )
  `);

  console.log('✅ Created email_link_clicks table');
}

/**
 * Rollback migration
 */
export async function down(): Promise<void> {
  await query('DROP TABLE IF EXISTS email_link_clicks');
  await query('DROP TABLE IF EXISTS email_sends');
  await query('DROP TABLE IF EXISTS email_sequence_enrollments');
  await query('DROP TABLE IF EXISTS email_subscribers');
  await query('DROP TABLE IF EXISTS email_sequence_steps');
  await query('DROP TABLE IF EXISTS email_sequences');
  await query('DROP TABLE IF EXISTS email_templates');
  await query('DROP TABLE IF EXISTS email_campaigns');

  console.log('✅ Dropped all email marketing tables');
}
