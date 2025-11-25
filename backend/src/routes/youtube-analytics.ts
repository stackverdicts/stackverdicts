import { Router, Request, Response } from 'express';
import { query, queryOne } from '../config/database';
import { youtubeAnalyticsService } from '../services/youtube-analytics';
import { youtubeService } from '../services/youtube';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Add YouTube video to tracking
 * POST /api/youtube-analytics/videos
 */
router.post('/videos', async (req: Request, res: Response) => {
  try {
    const {
      scriptId,
      youtubeVideoId,
      title,
      description,
      thumbnailUrl,
      publishedAt,
      duration,
      categoryId,
      tags,
      affiliateLinks,
    } = req.body;

    if (!youtubeVideoId || !title || !publishedAt) {
      return res.status(400).json({
        error: 'youtubeVideoId, title, and publishedAt are required',
      });
    }

    const video = await youtubeAnalyticsService.addVideo({
      scriptId,
      youtubeVideoId,
      title,
      description,
      thumbnailUrl,
      publishedAt: new Date(publishedAt),
      duration,
      categoryId,
      tags,
      affiliateLinks,
    });

    res.json({ video });
  } catch (error) {
    await logger.error('YouTubeAnalyticsAPI', 'Failed to add video', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to add video',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get all tracked videos
 * GET /api/youtube-analytics/videos
 */
router.get('/videos', async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const videos = await query(
      `SELECT
        v.*,
        ys.title as script_title,
        (SELECT views FROM youtube_video_analytics
         WHERE video_id = v.id
         ORDER BY snapshot_date DESC LIMIT 1) as latest_views,
        (SELECT engagement_rate FROM youtube_video_analytics
         WHERE video_id = v.id
         ORDER BY snapshot_date DESC LIMIT 1) as latest_engagement_rate
       FROM youtube_videos v
       LEFT JOIN youtube_scripts ys ON v.script_id = ys.id
       ORDER BY v.published_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit as string), parseInt(offset as string)]
    );

    res.json({ videos });
  } catch (error) {
    await logger.error('YouTubeAnalyticsAPI', 'Failed to fetch videos', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

/**
 * Get video by ID
 * GET /api/youtube-analytics/videos/:id
 */
router.get('/videos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const performance = await youtubeAnalyticsService.getVideoPerformance(id);

    res.json(performance);
  } catch (error) {
    await logger.error('YouTubeAnalyticsAPI', 'Failed to fetch video', {
      error: error instanceof Error ? error.message : 'Unknown error',
      videoId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to fetch video',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Record analytics for a video
 * POST /api/youtube-analytics/videos/:id/analytics
 */
router.post('/videos/:id/analytics', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      snapshotDate,
      views,
      likes,
      comments,
      shares,
      watchTimeMinutes,
      averageViewDuration,
      subscribersGained,
      impressions,
      clickThroughRate,
    } = req.body;

    await youtubeAnalyticsService.recordAnalytics({
      videoId: id,
      snapshotDate: snapshotDate ? new Date(snapshotDate) : new Date(),
      views,
      likes,
      comments,
      shares,
      watchTimeMinutes,
      averageViewDuration,
      subscribersGained,
      impressions,
      clickThroughRate,
    });

    res.json({ success: true });
  } catch (error) {
    await logger.error('YouTubeAnalyticsAPI', 'Failed to record analytics', {
      error: error instanceof Error ? error.message : 'Unknown error',
      videoId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to record analytics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Track affiliate conversion from video
 * POST /api/youtube-analytics/conversions
 */
router.post('/conversions', async (req: Request, res: Response) => {
  try {
    const {
      videoId,
      offerId,
      trackingLink,
      clickDate,
      conversionDate,
      conversionStatus,
      payout,
      revenue,
    } = req.body;

    if (!videoId || !offerId || !trackingLink || !clickDate) {
      return res.status(400).json({
        error: 'videoId, offerId, trackingLink, and clickDate are required',
      });
    }

    const conversion = await youtubeAnalyticsService.trackConversion({
      videoId,
      offerId,
      trackingLink,
      clickDate: new Date(clickDate),
      conversionDate: conversionDate ? new Date(conversionDate) : undefined,
      conversionStatus: conversionStatus || 'clicked',
      payout,
      revenue,
    });

    res.json({ conversion });
  } catch (error) {
    await logger.error('YouTubeAnalyticsAPI', 'Failed to track conversion', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to track conversion',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get channel overview
 * GET /api/youtube-analytics/overview
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const overview = await youtubeAnalyticsService.getChannelOverview();

    res.json(overview);
  } catch (error) {
    await logger.error('YouTubeAnalyticsAPI', 'Failed to get overview', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({ error: 'Failed to get channel overview' });
  }
});

/**
 * Get revenue attribution
 * GET /api/youtube-analytics/attribution?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/attribution', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days ago

    const end = endDate ? new Date(endDate as string) : new Date();

    const attribution = await youtubeAnalyticsService.getRevenueAttribution(start, end);

    res.json({ attribution });
  } catch (error) {
    await logger.error('YouTubeAnalyticsAPI', 'Failed to get attribution', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({ error: 'Failed to get revenue attribution' });
  }
});

/**
 * Get video analytics history
 * GET /api/youtube-analytics/videos/:id/history?days=30
 */
router.get('/videos/:id/history', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;

    const history = await query(
      `SELECT * FROM youtube_video_analytics
       WHERE video_id = ?
       AND snapshot_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       ORDER BY snapshot_date ASC`,
      [id, parseInt(days as string)]
    );

    res.json({ history });
  } catch (error) {
    await logger.error('YouTubeAnalyticsAPI', 'Failed to fetch history', {
      error: error instanceof Error ? error.message : 'Unknown error',
      videoId: req.params.id,
    });

    res.status(500).json({ error: 'Failed to fetch analytics history' });
  }
});

/**
 * Get video conversions
 * GET /api/youtube-analytics/videos/:id/conversions
 */
router.get('/videos/:id/conversions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const conversions = await query(
      `SELECT c.*, o.name as offer_name, o.payout as offer_payout
       FROM youtube_affiliate_conversions c
       JOIN offers o ON c.offer_id = o.id
       WHERE c.video_id = ?
       ORDER BY c.click_date DESC
       LIMIT ? OFFSET ?`,
      [id, parseInt(limit as string), parseInt(offset as string)]
    );

    res.json({ conversions });
  } catch (error) {
    await logger.error('YouTubeAnalyticsAPI', 'Failed to fetch conversions', {
      error: error instanceof Error ? error.message : 'Unknown error',
      videoId: req.params.id,
    });

    res.status(500).json({ error: 'Failed to fetch conversions' });
  }
});

/**
 * Sync YouTube channel videos
 * POST /api/youtube-analytics/sync
 */
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const { channelId, maxVideos = 50 } = req.body;

    if (!channelId) {
      return res.status(400).json({
        error: 'channelId is required',
      });
    }

    await logger.info('YouTubeAnalyticsAPI', 'Starting channel sync', {
      channelId,
      maxVideos,
    });

    // Step 1: Fetch videos from YouTube
    const uploadsPlaylistId = await youtubeService.getUploadsPlaylistId(channelId);
    const videoIds = await youtubeService.getVideoIdsFromPlaylist(uploadsPlaylistId, maxVideos);
    const videos = await youtubeService.getVideoDetails(videoIds);

    // Step 2: Import videos into database
    let imported = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const video of videos) {
      try {
        const formattedVideo = youtubeService.formatVideoForDatabase(video);

        // Check if video already exists
        const existing = await queryOne(
          'SELECT id FROM youtube_videos WHERE youtube_video_id = ?',
          [formattedVideo.youtubeVideoId]
        );

        if (existing) {
          // Video exists, record current analytics
          await youtubeAnalyticsService.recordAnalytics({
            videoId: existing.id,
            snapshotDate: new Date(),
            views: formattedVideo.statistics.views,
            likes: formattedVideo.statistics.likes,
            comments: formattedVideo.statistics.comments,
          });
          updated++;
        } else {
          // New video, add it
          const addedVideo = await youtubeAnalyticsService.addVideo({
            youtubeVideoId: formattedVideo.youtubeVideoId,
            title: formattedVideo.title,
            description: formattedVideo.description,
            thumbnailUrl: formattedVideo.thumbnailUrl,
            publishedAt: formattedVideo.publishedAt,
            duration: formattedVideo.duration,
            categoryId: formattedVideo.categoryId,
            tags: formattedVideo.tags,
          });

          // Record initial analytics
          await youtubeAnalyticsService.recordAnalytics({
            videoId: addedVideo.id,
            snapshotDate: new Date(),
            views: formattedVideo.statistics.views,
            likes: formattedVideo.statistics.likes,
            comments: formattedVideo.statistics.comments,
          });

          imported++;
        }
      } catch (error) {
        const errorMsg = `Failed to import video ${video.snippet.title}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`;
        errors.push(errorMsg);
        await logger.error('YouTubeAnalyticsAPI', errorMsg, {
          videoId: video.id,
        });
      }
    }

    await logger.info('YouTubeAnalyticsAPI', 'Channel sync completed', {
      channelId,
      fetched: videos.length,
      imported,
      updated,
      errors: errors.length,
    });

    res.json({
      success: true,
      fetched: videos.length,
      imported,
      updated,
      errors,
    });
  } catch (error) {
    await logger.error('YouTubeAnalyticsAPI', 'Channel sync failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      channelId: req.body.channelId,
    });

    res.status(500).json({
      error: 'Failed to sync channel',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
