import { Router, Request, Response } from 'express';
import { youtubeKeywordResearchService } from '../services/youtube-keyword-research';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Research YouTube keywords
 * POST /api/youtube-keyword-research
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.body;

    if (!keyword || typeof keyword !== 'string' || !keyword.trim()) {
      return res.status(400).json({
        error: 'Keyword is required',
      });
    }

    await logger.info('YouTubeKeywordResearch', 'Starting keyword research', {
      keyword: keyword.trim(),
    });

    const result = await youtubeKeywordResearchService.researchKeyword(keyword.trim());

    await logger.info('YouTubeKeywordResearch', 'Keyword research completed', {
      keyword: keyword.trim(),
      relatedKeywordsCount: result.relatedKeywords.length,
      topVideosCount: result.topPerformingVideos.length,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    await logger.error('YouTubeKeywordResearch', 'Failed to research keyword', {
      error: error instanceof Error ? error.message : 'Unknown error',
      keyword: req.body.keyword,
    });

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to research keyword',
    });
  }
});

/**
 * Get quota usage
 * GET /api/youtube-keyword-research/quota
 */
router.get('/quota', async (req: Request, res: Response) => {
  try {
    const usage = await youtubeKeywordResearchService.getQuotaUsage();

    res.json({
      success: true,
      data: usage,
    });
  } catch (error) {
    await logger.error('YouTubeKeywordResearch', 'Failed to get quota usage', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to get quota usage',
    });
  }
});

export default router;
