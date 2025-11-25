import { query, queryOne } from '../config/database';
import { logger } from '../utils/logger';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface UnifiedMetrics {
  overview: {
    totalRevenue: number;
    totalConversions: number;
    totalClicks: number;
    conversionRate: number;
    averageRevenuePerConversion: number;
  };
  affiliateMarketing: {
    revenue: number;
    conversions: number;
    clicks: number;
    topOffers: Array<{
      offer_id: string;
      offer_name: string;
      conversions: number;
      revenue: number;
    }>;
  };
  youtube: {
    totalVideos: number;
    totalViews: number;
    totalWatchTime: number;
    avgEngagementRate: number;
    affiliateRevenue: number;
    affiliateConversions: number;
    topVideos: Array<{
      video_id: string;
      title: string;
      views: number;
      conversions: number;
      revenue: number;
    }>;
  };
  emailMarketing: {
    totalSubscribers: number;
    activeSequences: number;
    emailsSent: number;
    avgOpenRate: number;
    avgClickRate: number;
    campaigns: Array<{
      campaign_id: string;
      campaign_name: string;
      sent_count: number;
      open_rate: number;
      click_rate: number;
    }>;
  };
  trends: {
    daily: Array<{
      date: string;
      revenue: number;
      conversions: number;
      clicks: number;
      youtube_views: number;
      email_opens: number;
    }>;
  };
}

class UnifiedAnalyticsService {
  /**
   * Get comprehensive analytics across all systems
   */
  async getUnifiedMetrics(dateRange: DateRange): Promise<UnifiedMetrics> {
    try {
      const [
        overview,
        affiliate,
        youtube,
        email,
        trends,
      ] = await Promise.all([
        this.getOverviewMetrics(dateRange),
        this.getAffiliateMetrics(dateRange),
        this.getYouTubeMetrics(dateRange),
        this.getEmailMetrics(dateRange),
        this.getTrendsData(dateRange),
      ]);

      return {
        overview,
        affiliateMarketing: affiliate,
        youtube,
        emailMarketing: email,
        trends,
      };
    } catch (error) {
      await logger.error('UnifiedAnalytics', 'Failed to get unified metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get overview metrics combining all systems
   */
  private async getOverviewMetrics(dateRange: DateRange): Promise<UnifiedMetrics['overview']> {
    try {
      // Get affiliate conversions and revenue
      const affiliateMetrics = await queryOne<{
        total_conversions: number;
        total_revenue: number;
        total_clicks: number;
      }>(
        `SELECT
          COUNT(*) as total_conversions,
          COALESCE(SUM(payout), 0) as total_revenue,
          (SELECT COUNT(*) FROM clicks WHERE created_at BETWEEN ? AND ?) as total_clicks
         FROM conversions
         WHERE conversion_date BETWEEN ? AND ?
         AND status = 'approved'`,
        [dateRange.startDate, dateRange.endDate, dateRange.startDate, dateRange.endDate]
      );

      // Get YouTube affiliate revenue
      const youtubeRevenue = await queryOne<{ youtube_revenue: number }>(
        `SELECT COALESCE(SUM(revenue), 0) as youtube_revenue
         FROM youtube_affiliate_conversions
         WHERE conversion_date BETWEEN ? AND ?
         AND conversion_status = 'approved'`,
        [dateRange.startDate, dateRange.endDate]
      );

      const totalRevenue = (affiliateMetrics?.total_revenue || 0) + (youtubeRevenue?.youtube_revenue || 0);
      const totalConversions = affiliateMetrics?.total_conversions || 0;
      const totalClicks = affiliateMetrics?.total_clicks || 0;
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
      const averageRevenuePerConversion = totalConversions > 0 ? totalRevenue / totalConversions : 0;

      return {
        totalRevenue,
        totalConversions,
        totalClicks,
        conversionRate,
        averageRevenuePerConversion,
      };
    } catch (error) {
      await logger.error('UnifiedAnalytics', 'Failed to get overview metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get affiliate marketing metrics
   */
  private async getAffiliateMetrics(dateRange: DateRange): Promise<UnifiedMetrics['affiliateMarketing']> {
    try {
      // Get aggregate metrics
      const metrics = await queryOne<{
        conversions: number;
        revenue: number;
        clicks: number;
      }>(
        `SELECT
          COUNT(*) as conversions,
          COALESCE(SUM(payout), 0) as revenue,
          (SELECT COUNT(*) FROM clicks WHERE created_at BETWEEN ? AND ?) as clicks
         FROM conversions
         WHERE conversion_date BETWEEN ? AND ?
         AND status = 'approved'`,
        [dateRange.startDate, dateRange.endDate, dateRange.startDate, dateRange.endDate]
      );

      // Get top offers
      const topOffers = await query<{
        offer_id: string;
        offer_name: string;
        conversions: number;
        revenue: number;
      }>(
        `SELECT
          c.offer_id,
          o.name as offer_name,
          COUNT(*) as conversions,
          COALESCE(SUM(c.payout), 0) as revenue
         FROM conversions c
         JOIN offers o ON c.offer_id = o.id
         WHERE c.conversion_date BETWEEN ? AND ?
         AND c.status = 'approved'
         GROUP BY c.offer_id, o.name
         ORDER BY revenue DESC
         LIMIT 10`,
        [dateRange.startDate, dateRange.endDate]
      );

      return {
        revenue: metrics?.revenue || 0,
        conversions: metrics?.conversions || 0,
        clicks: metrics?.clicks || 0,
        topOffers: topOffers || [],
      };
    } catch (error) {
      await logger.error('UnifiedAnalytics', 'Failed to get affiliate metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get YouTube metrics
   */
  private async getYouTubeMetrics(dateRange: DateRange): Promise<UnifiedMetrics['youtube']> {
    try {
      // Get video count
      const videoCount = await queryOne<{ total_videos: number }>(
        'SELECT COUNT(*) as total_videos FROM youtube_videos',
        []
      );

      // Get latest analytics for all videos
      const analyticsMetrics = await queryOne<{
        total_views: number;
        total_watch_time: number;
        avg_engagement: number;
      }>(
        `SELECT
          SUM(va.views) as total_views,
          SUM(va.watch_time_minutes) as total_watch_time,
          AVG(va.engagement_rate) as avg_engagement
         FROM youtube_video_analytics va
         INNER JOIN (
           SELECT video_id, MAX(snapshot_date) as latest_date
           FROM youtube_video_analytics
           WHERE snapshot_date BETWEEN ? AND ?
           GROUP BY video_id
         ) latest ON va.video_id = latest.video_id AND va.snapshot_date = latest.latest_date`,
        [dateRange.startDate, dateRange.endDate]
      );

      // Get affiliate conversions from YouTube
      const youtubeAffiliate = await queryOne<{
        conversions: number;
        revenue: number;
      }>(
        `SELECT
          COUNT(*) as conversions,
          COALESCE(SUM(revenue), 0) as revenue
         FROM youtube_affiliate_conversions
         WHERE conversion_date BETWEEN ? AND ?
         AND conversion_status = 'approved'`,
        [dateRange.startDate, dateRange.endDate]
      );

      // Get top performing videos
      const topVideos = await query<{
        video_id: string;
        title: string;
        views: number;
        conversions: number;
        revenue: number;
      }>(
        `SELECT
          v.id as video_id,
          v.title,
          COALESCE(va.views, 0) as views,
          (SELECT COUNT(*) FROM youtube_affiliate_conversions
           WHERE video_id = v.id
           AND conversion_date BETWEEN ? AND ?
           AND conversion_status = 'approved') as conversions,
          (SELECT COALESCE(SUM(revenue), 0) FROM youtube_affiliate_conversions
           WHERE video_id = v.id
           AND conversion_date BETWEEN ? AND ?
           AND conversion_status = 'approved') as revenue
         FROM youtube_videos v
         LEFT JOIN (
           SELECT video_id, views
           FROM youtube_video_analytics
           WHERE (video_id, snapshot_date) IN (
             SELECT video_id, MAX(snapshot_date)
             FROM youtube_video_analytics
             WHERE snapshot_date BETWEEN ? AND ?
             GROUP BY video_id
           )
         ) va ON v.id = va.video_id
         ORDER BY revenue DESC, views DESC
         LIMIT 10`,
        [
          dateRange.startDate, dateRange.endDate,
          dateRange.startDate, dateRange.endDate,
          dateRange.startDate, dateRange.endDate,
        ]
      );

      return {
        totalVideos: videoCount?.total_videos || 0,
        totalViews: analyticsMetrics?.total_views || 0,
        totalWatchTime: analyticsMetrics?.total_watch_time || 0,
        avgEngagementRate: analyticsMetrics?.avg_engagement || 0,
        affiliateRevenue: youtubeAffiliate?.revenue || 0,
        affiliateConversions: youtubeAffiliate?.conversions || 0,
        topVideos: topVideos || [],
      };
    } catch (error) {
      await logger.error('UnifiedAnalytics', 'Failed to get YouTube metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get email marketing metrics
   */
  private async getEmailMetrics(dateRange: DateRange): Promise<UnifiedMetrics['emailMarketing']> {
    try {
      // Get subscriber count
      const subscriberCount = await queryOne<{ total_subscribers: number }>(
        'SELECT COUNT(*) as total_subscribers FROM email_subscribers WHERE status = "subscribed"',
        []
      );

      // Get active sequences count
      const sequenceCount = await queryOne<{ active_sequences: number }>(
        'SELECT COUNT(*) as active_sequences FROM email_sequences WHERE status = "active"',
        []
      );

      // Get email campaign metrics
      const campaignMetrics = await queryOne<{
        emails_sent: number;
        avg_open_rate: number;
        avg_click_rate: number;
      }>(
        `SELECT
          COALESCE(SUM(sent_count), 0) as emails_sent,
          AVG(open_rate) as avg_open_rate,
          AVG(click_rate) as avg_click_rate
         FROM email_campaigns
         WHERE sent_at BETWEEN ? AND ?`,
        [dateRange.startDate, dateRange.endDate]
      );

      // Get recent campaigns
      const campaigns = await query<{
        campaign_id: string;
        campaign_name: string;
        sent_count: number;
        open_rate: number;
        click_rate: number;
      }>(
        `SELECT
          id as campaign_id,
          campaign_name,
          sent_count,
          open_rate,
          click_rate
         FROM email_campaigns
         WHERE sent_at BETWEEN ? AND ?
         ORDER BY sent_at DESC
         LIMIT 10`,
        [dateRange.startDate, dateRange.endDate]
      );

      return {
        totalSubscribers: subscriberCount?.total_subscribers || 0,
        activeSequences: sequenceCount?.active_sequences || 0,
        emailsSent: campaignMetrics?.emails_sent || 0,
        avgOpenRate: campaignMetrics?.avg_open_rate || 0,
        avgClickRate: campaignMetrics?.avg_click_rate || 0,
        campaigns: campaigns || [],
      };
    } catch (error) {
      await logger.error('UnifiedAnalytics', 'Failed to get email metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }


  /**
   * Get daily trends data
   */
  private async getTrendsData(dateRange: DateRange): Promise<UnifiedMetrics['trends']> {
    try {
      const daily = await query<{
        date: string;
        revenue: number;
        conversions: number;
        clicks: number;
        youtube_views: number;
        email_opens: number;
      }>(
        `SELECT
          DATE(date_val) as date,
          COALESCE((SELECT SUM(payout) FROM conversions WHERE DATE(conversion_date) = DATE(date_val) AND status = 'approved'), 0) as revenue,
          COALESCE((SELECT COUNT(*) FROM conversions WHERE DATE(conversion_date) = DATE(date_val) AND status = 'approved'), 0) as conversions,
          COALESCE((SELECT COUNT(*) FROM clicks WHERE DATE(created_at) = DATE(date_val)), 0) as clicks,
          COALESCE((SELECT SUM(views) FROM youtube_video_analytics WHERE snapshot_date = DATE(date_val)), 0) as youtube_views,
          COALESCE((SELECT COUNT(*) FROM email_tracking_events WHERE DATE(event_timestamp) = DATE(date_val) AND event_type = 'opened'), 0) as email_opens
         FROM (
           SELECT DATE(?) + INTERVAL seq DAY as date_val
           FROM (
             SELECT 0 as seq UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL
             SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL
             SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL
             SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL
             SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24 UNION ALL
             SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29 UNION ALL SELECT 30
           ) seq
         ) dates
         WHERE date_val BETWEEN ? AND ?
         ORDER BY date`,
        [dateRange.startDate, dateRange.startDate, dateRange.endDate]
      );

      return {
        daily: daily || [],
      };
    } catch (error) {
      await logger.error('UnifiedAnalytics', 'Failed to get trends data', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get revenue breakdown by source
   */
  async getRevenueBreakdown(dateRange: DateRange): Promise<Array<{
    source: string;
    revenue: number;
    conversions: number;
    percentage: number;
  }>> {
    try {
      // Get affiliate revenue
      const affiliateRevenue = await queryOne<{ revenue: number; conversions: number }>(
        `SELECT
          COALESCE(SUM(payout), 0) as revenue,
          COUNT(*) as conversions
         FROM conversions
         WHERE conversion_date BETWEEN ? AND ?
         AND status = 'approved'`,
        [dateRange.startDate, dateRange.endDate]
      );

      // Get YouTube affiliate revenue
      const youtubeRevenue = await queryOne<{ revenue: number; conversions: number }>(
        `SELECT
          COALESCE(SUM(revenue), 0) as revenue,
          COUNT(*) as conversions
         FROM youtube_affiliate_conversions
         WHERE conversion_date BETWEEN ? AND ?
         AND conversion_status = 'approved'`,
        [dateRange.startDate, dateRange.endDate]
      );

      const totalRevenue = (affiliateRevenue?.revenue || 0) + (youtubeRevenue?.revenue || 0);

      const breakdown = [
        {
          source: 'Direct Affiliate',
          revenue: affiliateRevenue?.revenue || 0,
          conversions: affiliateRevenue?.conversions || 0,
          percentage: totalRevenue > 0 ? ((affiliateRevenue?.revenue || 0) / totalRevenue) * 100 : 0,
        },
        {
          source: 'YouTube',
          revenue: youtubeRevenue?.revenue || 0,
          conversions: youtubeRevenue?.conversions || 0,
          percentage: totalRevenue > 0 ? ((youtubeRevenue?.revenue || 0) / totalRevenue) * 100 : 0,
        },
      ];

      return breakdown;
    } catch (error) {
      await logger.error('UnifiedAnalytics', 'Failed to get revenue breakdown', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

// Export singleton instance
export const unifiedAnalyticsService = new UnifiedAnalyticsService();
