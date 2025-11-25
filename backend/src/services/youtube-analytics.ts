import { query, queryOne, insert } from '../config/database';
import { generateId } from '../utils/id-generator';
import { logger } from '../utils/logger';

interface VideoCreationData {
  scriptId?: string;
  youtubeVideoId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  publishedAt: Date;
  duration?: number;
  categoryId?: string;
  tags?: string[];
  affiliateLinks?: Array<{ offerId: string; trackingLink: string }>;
}

interface AnalyticsData {
  videoId: string;
  snapshotDate: Date;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  watchTimeMinutes?: number;
  averageViewDuration?: number;
  subscribersGained?: number;
  impressions?: number;
  clickThroughRate?: number;
}

interface ConversionData {
  videoId: string;
  offerId: string;
  trackingLink: string;
  clickDate: Date;
  conversionDate?: Date;
  conversionStatus: 'clicked' | 'pending' | 'approved' | 'rejected';
  payout?: number;
  revenue?: number;
}

class YouTubeAnalyticsService {
  /**
   * Add YouTube video to tracking
   */
  async addVideo(data: VideoCreationData): Promise<any> {
    try {
      const videoId = generateId('video');

      await insert(
        `INSERT INTO youtube_videos (
          id, script_id, youtube_video_id, title, description,
          thumbnail_url, published_at, duration, category_id, tags,
          affiliate_links, privacy_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'public')`,
        [
          videoId,
          data.scriptId || null,
          data.youtubeVideoId,
          data.title,
          data.description || null,
          data.thumbnailUrl || null,
          data.publishedAt,
          data.duration || null,
          data.categoryId || null,
          JSON.stringify(data.tags || []),
          JSON.stringify(data.affiliateLinks || []),
        ]
      );

      const video = await queryOne(
        'SELECT * FROM youtube_videos WHERE id = ?',
        [videoId]
      );

      await logger.info('YouTubeAnalytics', 'Video added to tracking', {
        videoId,
        youtubeVideoId: data.youtubeVideoId,
      });

      return video;
    } catch (error) {
      await logger.error('YouTubeAnalytics', 'Failed to add video', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Record analytics snapshot for a video
   */
  async recordAnalytics(data: AnalyticsData): Promise<any> {
    try {
      const snapshotId = generateId('snapshot');
      const snapshotDate = data.snapshotDate.toISOString().split('T')[0];

      // Calculate engagement rate
      const engagementRate = data.views && data.views > 0
        ? ((((data.likes || 0) + (data.comments || 0) + (data.shares || 0)) / data.views) * 100)
        : 0;

      // Calculate average view percentage
      const averageViewPercentage = data.duration && data.averageViewDuration
        ? (data.averageViewDuration / data.duration) * 100
        : 0;

      await insert(
        `INSERT INTO youtube_video_analytics (
          id, video_id, snapshot_date, views, likes, comments, shares,
          watch_time_minutes, average_view_duration, average_view_percentage,
          subscribers_gained, impressions, click_through_rate, engagement_rate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          views = VALUES(views),
          likes = VALUES(likes),
          comments = VALUES(comments),
          shares = VALUES(shares),
          watch_time_minutes = VALUES(watch_time_minutes),
          average_view_duration = VALUES(average_view_duration),
          average_view_percentage = VALUES(average_view_percentage),
          subscribers_gained = VALUES(subscribers_gained),
          impressions = VALUES(impressions),
          click_through_rate = VALUES(click_through_rate),
          engagement_rate = VALUES(engagement_rate)`,
        [
          snapshotId,
          data.videoId,
          snapshotDate,
          data.views || 0,
          data.likes || 0,
          data.comments || 0,
          data.shares || 0,
          data.watchTimeMinutes || 0,
          data.averageViewDuration || 0,
          averageViewPercentage,
          data.subscribersGained || 0,
          data.impressions || 0,
          data.clickThroughRate || 0,
          engagementRate,
        ]
      );

      await logger.debug('YouTubeAnalytics', 'Analytics recorded', {
        videoId: data.videoId,
        snapshotDate,
      });

      return { success: true };
    } catch (error) {
      await logger.error('YouTubeAnalytics', 'Failed to record analytics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Track affiliate conversion from YouTube video
   */
  async trackConversion(data: ConversionData): Promise<any> {
    try {
      const conversionId = generateId('conversion');

      await insert(
        `INSERT INTO youtube_affiliate_conversions (
          id, video_id, offer_id, tracking_link, click_date,
          conversion_date, conversion_status, payout, revenue
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          conversionId,
          data.videoId,
          data.offerId,
          data.trackingLink,
          data.clickDate,
          data.conversionDate || null,
          data.conversionStatus,
          data.payout || 0,
          data.revenue || 0,
        ]
      );

      const conversion = await queryOne(
        'SELECT * FROM youtube_affiliate_conversions WHERE id = ?',
        [conversionId]
      );

      await logger.info('YouTubeAnalytics', 'Conversion tracked', {
        conversionId,
        videoId: data.videoId,
        offerId: data.offerId,
        status: data.conversionStatus,
      });

      return conversion;
    } catch (error) {
      await logger.error('YouTubeAnalytics', 'Failed to track conversion', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get video performance summary
   */
  async getVideoPerformance(videoId: string): Promise<any> {
    try {
      // Get video details
      const video = await queryOne(
        'SELECT * FROM youtube_videos WHERE id = ?',
        [videoId]
      );

      if (!video) {
        throw new Error('Video not found');
      }

      // Get latest analytics
      const latestAnalytics = await queryOne(
        `SELECT * FROM youtube_video_analytics
         WHERE video_id = ?
         ORDER BY snapshot_date DESC
         LIMIT 1`,
        [videoId]
      );

      // Get analytics history (last 30 days)
      const analyticsHistory = await query(
        `SELECT * FROM youtube_video_analytics
         WHERE video_id = ?
         AND snapshot_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
         ORDER BY snapshot_date ASC`,
        [videoId]
      );

      // Get affiliate conversions summary
      const conversionsSummary = await queryOne(
        `SELECT
          COUNT(*) as total_clicks,
          SUM(CASE WHEN conversion_status = 'approved' THEN 1 ELSE 0 END) as total_conversions,
          SUM(CASE WHEN conversion_status = 'approved' THEN revenue ELSE 0 END) as total_revenue,
          SUM(CASE WHEN conversion_status = 'approved' THEN payout ELSE 0 END) as total_payout
         FROM youtube_affiliate_conversions
         WHERE video_id = ?`,
        [videoId]
      );

      return {
        video,
        currentStats: latestAnalytics,
        history: analyticsHistory,
        conversions: conversionsSummary,
      };
    } catch (error) {
      await logger.error('YouTubeAnalytics', 'Failed to get video performance', {
        error: error instanceof Error ? error.message : 'Unknown error',
        videoId,
      });
      throw error;
    }
  }

  /**
   * Get channel overview
   */
  async getChannelOverview(): Promise<any> {
    try {
      // Get total videos count
      const videoCount = await queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM youtube_videos',
        []
      );

      // Get total views across all videos
      const totalStats = await queryOne(
        `SELECT
          SUM(va.views) as total_views,
          SUM(va.likes) as total_likes,
          SUM(va.comments) as total_comments,
          SUM(va.watch_time_minutes) as total_watch_time,
          AVG(va.engagement_rate) as avg_engagement_rate
         FROM youtube_video_analytics va
         INNER JOIN (
           SELECT video_id, MAX(snapshot_date) as latest_date
           FROM youtube_video_analytics
           GROUP BY video_id
         ) latest ON va.video_id = latest.video_id AND va.snapshot_date = latest.latest_date`,
        []
      );

      // Get conversion stats
      const conversionStats = await queryOne(
        `SELECT
          COUNT(*) as total_clicks,
          SUM(CASE WHEN conversion_status = 'approved' THEN 1 ELSE 0 END) as total_conversions,
          SUM(CASE WHEN conversion_status = 'approved' THEN revenue ELSE 0 END) as total_revenue
         FROM youtube_affiliate_conversions`,
        []
      );

      // Get top performing videos
      const topVideos = await query(
        `SELECT
          v.id,
          v.youtube_video_id,
          v.title,
          v.thumbnail_url,
          v.published_at,
          va.views,
          va.likes,
          va.engagement_rate,
          (SELECT COUNT(*) FROM youtube_affiliate_conversions
           WHERE video_id = v.id AND conversion_status = 'approved') as conversions
         FROM youtube_videos v
         LEFT JOIN (
           SELECT video_id, views, likes, engagement_rate
           FROM youtube_video_analytics
           WHERE (video_id, snapshot_date) IN (
             SELECT video_id, MAX(snapshot_date)
             FROM youtube_video_analytics
             GROUP BY video_id
           )
         ) va ON v.id = va.video_id
         ORDER BY va.views DESC
         LIMIT 10`,
        []
      );

      return {
        totalVideos: videoCount?.count || 0,
        totalViews: totalStats?.total_views || 0,
        totalLikes: totalStats?.total_likes || 0,
        totalComments: totalStats?.total_comments || 0,
        totalWatchTime: totalStats?.total_watch_time || 0,
        avgEngagementRate: totalStats?.avg_engagement_rate || 0,
        totalClicks: conversionStats?.total_clicks || 0,
        totalConversions: conversionStats?.total_conversions || 0,
        totalRevenue: conversionStats?.total_revenue || 0,
        topVideos,
      };
    } catch (error) {
      await logger.error('YouTubeAnalytics', 'Failed to get channel overview', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get revenue attribution (which videos drove which conversions)
   */
  async getRevenueAttribution(startDate: Date, endDate: Date): Promise<any> {
    try {
      const attribution = await query(
        `SELECT
          v.id as video_id,
          v.youtube_video_id,
          v.title,
          o.id as offer_id,
          o.name as offer_name,
          COUNT(*) as total_clicks,
          SUM(CASE WHEN c.conversion_status = 'approved' THEN 1 ELSE 0 END) as conversions,
          SUM(CASE WHEN c.conversion_status = 'approved' THEN c.revenue ELSE 0 END) as revenue,
          SUM(CASE WHEN c.conversion_status = 'approved' THEN c.payout ELSE 0 END) as payout
         FROM youtube_affiliate_conversions c
         JOIN youtube_videos v ON c.video_id = v.id
         JOIN offers o ON c.offer_id = o.id
         WHERE c.click_date BETWEEN ? AND ?
         GROUP BY v.id, o.id
         ORDER BY revenue DESC`,
        [startDate, endDate]
      );

      return attribution;
    } catch (error) {
      await logger.error('YouTubeAnalytics', 'Failed to get revenue attribution', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

// Export singleton instance
export const youtubeAnalyticsService = new YouTubeAnalyticsService();
