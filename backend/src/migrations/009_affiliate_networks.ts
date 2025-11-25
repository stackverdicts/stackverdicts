import { query } from '../config/database';

export async function up(): Promise<void> {
  // Create affiliate_networks table
  await query(`
    CREATE TABLE IF NOT EXISTS affiliate_networks (
      id VARCHAR(36) PRIMARY KEY,
      network_name VARCHAR(100) NOT NULL,
      network_slug VARCHAR(50) UNIQUE NOT NULL,
      network_type ENUM('hosting', 'saas', 'marketplace', 'course', 'developer_tools', 'other') DEFAULT 'other',
      description TEXT,

      -- Commission structure
      default_commission_type ENUM('fixed', 'percentage', 'recurring', 'tiered') DEFAULT 'fixed',
      default_commission_value DECIMAL(10, 2),
      has_recurring BOOLEAN DEFAULT FALSE,
      recurring_percentage DECIMAL(5, 2),
      cookie_duration_days INT DEFAULT 30,

      -- Tracking configuration
      tracking_url_template TEXT,
      requires_approval BOOLEAN DEFAULT TRUE,
      payment_threshold DECIMAL(10, 2) DEFAULT 100.00,
      payment_schedule VARCHAR(50) DEFAULT 'monthly',

      -- API integration (if available)
      has_api BOOLEAN DEFAULT FALSE,
      api_endpoint VARCHAR(255),
      api_key_encrypted TEXT,

      -- Contact & resources
      affiliate_dashboard_url VARCHAR(255),
      contact_email VARCHAR(100),
      support_url VARCHAR(255),
      terms_url VARCHAR(255),

      -- Stats
      total_offers INT DEFAULT 0,
      average_epc DECIMAL(10, 2) DEFAULT 0.00,

      -- Status
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      INDEX idx_network_type (network_type),
      INDEX idx_network_slug (network_slug),
      INDEX idx_is_active (is_active)
    )
  `);

  // Update offers table to support multiple networks
  await query(`
    ALTER TABLE offers
    ADD COLUMN IF NOT EXISTS network_id VARCHAR(36),
    ADD COLUMN IF NOT EXISTS offer_source ENUM('api', 'manual') DEFAULT 'api',
    ADD COLUMN IF NOT EXISTS commission_type ENUM('fixed', 'percentage', 'recurring', 'tiered') DEFAULT 'fixed',
    ADD COLUMN IF NOT EXISTS commission_value DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS recurring_commission DECIMAL(5, 2),
    ADD COLUMN IF NOT EXISTS custom_tracking_params JSON,
    ADD COLUMN IF NOT EXISTS affiliate_link_template TEXT,
    ADD COLUMN IF NOT EXISTS epc DECIMAL(10, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS conversion_rate DECIMAL(5, 2) DEFAULT 0.00,
    ADD INDEX idx_network_id (network_id),
    ADD INDEX idx_offer_source (offer_source)
  `);

  // Insert pre-configured affiliate networks
  await query(`
    INSERT INTO affiliate_networks (
      id, network_name, network_slug, network_type, description,
      default_commission_type, default_commission_value, has_recurring, recurring_percentage,
      cookie_duration_days, requires_approval, affiliate_dashboard_url, is_active
    ) VALUES
    (
      'net_kinsta',
      'Kinsta',
      'kinsta',
      'hosting',
      'Premium managed WordPress hosting with excellent affiliate program. $50-$500 per sale + 10% recurring commissions.',
      'tiered',
      150.00,
      TRUE,
      10.00,
      60,
      TRUE,
      'https://kinsta.com/affiliates/',
      TRUE
    ),
    (
      'net_wpengine',
      'WP Engine',
      'wpengine',
      'hosting',
      'Enterprise WordPress hosting. $200+ per sale with high conversion rates for premium customers.',
      'fixed',
      200.00,
      FALSE,
      NULL,
      180,
      TRUE,
      'https://wpengine.com/affiliate-program/',
      TRUE
    ),
    (
      'net_siteground',
      'SiteGround',
      'siteground',
      'hosting',
      'Popular shared and cloud hosting. $50-$100 per sale, great for beginner tutorials.',
      'tiered',
      50.00,
      FALSE,
      NULL,
      60,
      TRUE,
      'https://www.siteground.com/affiliates',
      TRUE
    ),
    (
      'net_cloudways',
      'Cloudways',
      'cloudways',
      'hosting',
      'Cloud hosting platform. $50-$125 per sale + 7% recurring commissions.',
      'tiered',
      75.00,
      TRUE,
      7.00,
      90,
      TRUE,
      'https://www.cloudways.com/en/affiliates.php',
      TRUE
    ),
    (
      'net_digitalocean',
      'DigitalOcean',
      'digitalocean',
      'hosting',
      'Developer-focused cloud infrastructure. $25 per qualified referral.',
      'fixed',
      25.00,
      FALSE,
      NULL,
      60,
      FALSE,
      'https://www.digitalocean.com/partners/referral-program',
      TRUE
    ),
    (
      'net_vercel',
      'Vercel',
      'vercel',
      'hosting',
      'Frontend cloud platform. $25 per paying customer for Pro plans.',
      'fixed',
      25.00,
      FALSE,
      NULL,
      90,
      TRUE,
      'https://vercel.com/partners',
      TRUE
    ),
    (
      'net_mongodb',
      'MongoDB Atlas',
      'mongodb',
      'saas',
      'Database as a service. $300 per qualified enterprise lead.',
      'fixed',
      300.00,
      FALSE,
      NULL,
      90,
      TRUE,
      'https://www.mongodb.com/partners/become-a-partner',
      TRUE
    ),
    (
      'net_tailwindui',
      'Tailwind UI',
      'tailwindui',
      'developer_tools',
      'Premium Tailwind CSS components. 25% recurring commission.',
      'percentage',
      25.00,
      TRUE,
      25.00,
      60,
      TRUE,
      'https://tailwindui.com/affiliates',
      TRUE
    ),
    (
      'net_amazon',
      'Amazon Associates',
      'amazon',
      'marketplace',
      'Amazon affiliate program. 1-10% commission on tech products, books, and gear.',
      'percentage',
      4.00,
      FALSE,
      NULL,
      24,
      TRUE,
      'https://affiliate-program.amazon.com/',
      TRUE
    ),
    (
      'net_impact',
      'Impact Radius',
      'impact',
      'marketplace',
      'Affiliate network with SaaS tools like Shopify, BigCommerce, and more.',
      'tiered',
      50.00,
      FALSE,
      NULL,
      30,
      TRUE,
      'https://impact.com/',
      TRUE
    ),
    (
      'net_maxbounty',
      'MaxBounty',
      'maxbounty',
      'marketplace',
      'CPA network with various offers. Generally lower payouts for developer audience.',
      'fixed',
      3.00,
      FALSE,
      NULL,
      30,
      TRUE,
      'https://www.maxbounty.com/',
      FALSE
    )
  `);

  console.log('✅ Migration 009: Affiliate networks table created and networks added');
}

export async function down(): Promise<void> {
  // Remove columns from offers table
  await query(`
    ALTER TABLE offers
    DROP COLUMN IF EXISTS network_id,
    DROP COLUMN IF EXISTS offer_source,
    DROP COLUMN IF EXISTS commission_type,
    DROP COLUMN IF EXISTS commission_value,
    DROP COLUMN IF EXISTS recurring_commission,
    DROP COLUMN IF EXISTS custom_tracking_params,
    DROP COLUMN IF EXISTS affiliate_link_template,
    DROP COLUMN IF EXISTS epc,
    DROP COLUMN IF EXISTS conversion_rate
  `);

  // Drop affiliate_networks table
  await query('DROP TABLE IF EXISTS affiliate_networks');

  console.log('✅ Migration 009: Rolled back affiliate networks changes');
}
