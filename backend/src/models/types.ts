// Type definitions for database models

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: 'hosting' | 'saas' | 'developer_tools' | 'courses';
  network_id: string | null;
  affiliate_url: string;
  commission_type: 'percentage' | 'fixed' | 'hybrid';
  commission_value: number | null;
  recurring_commission: boolean;
  recurring_percentage: number | null;
  pricing_info: Record<string, any> | null;
  features: string[] | null;
  target_audience: string | null;
  is_active: boolean;
  priority: number;
  created_at: Date;
  updated_at: Date;
}

export interface Site {
  id: string;
  site_name: string;
  domain: string;
  description: string | null;
  tracking_domain: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SystemLog {
  id: string;
  log_type: 'info' | 'warning' | 'error' | 'success';
  category: string;
  message: string;
  details: Record<string, any> | null;
  created_at: Date;
}

export interface CronJob {
  id: string;
  name: string;
  description: string | null;
  schedule: string;
  is_active: boolean;
  last_run_at: Date | null;
  last_status: 'success' | 'failed' | null;
  last_error: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CronJobExecution {
  id: string;
  job_id: string;
  execution_id: string;
  status: 'running' | 'success' | 'failed';
  started_at: Date;
  completed_at: Date | null;
  duration_ms: number | null;
  error_message: string | null;
  details: Record<string, any> | null;
}

// YouTube-related types
export interface YouTubeVideo {
  id: string;
  site_id: string;
  video_title: string;
  video_id: string;
  description: string | null;
  tags: string[] | null;
  category: string | null;
  thumbnail_url: string | null;
  status: 'draft' | 'scheduled' | 'published';
  scheduled_at: Date | null;
  published_at: Date | null;
  views: number;
  likes: number;
  comments: number;
  watch_time_minutes: number;
  created_at: Date;
  updated_at: Date;
}

// Email marketing types
export interface EmailSubscriber {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: 'active' | 'unsubscribed' | 'bounced';
  subscribed_at: Date;
  unsubscribed_at: Date | null;
  source: string | null;
  tags: string[] | null;
  created_at: Date;
  updated_at: Date;
}

export interface EmailSequence {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Landing page types
export interface LandingPage {
  id: string;
  site_id: string;
  page_title: string;
  slug: string;
  template: string;
  content: Record<string, any>;
  seo_title: string | null;
  seo_description: string | null;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
}

// A/B Testing types
export interface ABTest {
  id: string;
  test_name: string;
  test_type: 'landing_page' | 'email' | 'youtube_thumbnail';
  variant_a_id: string;
  variant_b_id: string;
  status: 'draft' | 'running' | 'completed' | 'paused';
  traffic_split: number;
  started_at: Date | null;
  ended_at: Date | null;
  winner: 'a' | 'b' | null;
  created_at: Date;
  updated_at: Date;
}

// Network types
export interface AffiliateNetwork {
  id: string;
  network_name: string;
  network_slug: string;
  network_type: string | null;
  description: string | null;
  default_commission_type: string | null;
  default_commission_value: number | null;
  has_recurring: boolean;
  recurring_percentage: number | null;
  cookie_duration_days: number | null;
  tracking_url_template: string | null;
  requires_approval: boolean;
  payment_threshold: number | null;
  payment_schedule: string | null;
  affiliate_dashboard_url: string | null;
  contact_email: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Settings types
export interface Setting {
  id: string;
  category: string;
  key: string;
  value: string;
  description: string | null;
  is_encrypted: boolean;
  created_at: Date;
  updated_at: Date;
}
