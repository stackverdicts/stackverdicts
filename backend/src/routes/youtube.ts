import { Router, Request, Response } from 'express';
import { youtubeScriptService, ScriptGenerationRequest, ScriptFilters } from '../services/youtube-script';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Generate a single YouTube script
 * POST /api/youtube/scripts/generate
 */
router.post('/scripts/generate', async (req: Request, res: Response) => {
  try {
    const request: ScriptGenerationRequest = req.body;

    // Validation
    if (!request.offerId || !request.videoType || !request.targetLength) {
      return res.status(400).json({
        error: 'Missing required fields: offerId, videoType, targetLength',
      });
    }

    const script = await youtubeScriptService.generateScript(request);

    res.json({ script });
  } catch (error) {
    await logger.error('YouTubeAPI', 'Failed to generate script', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to generate script',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Bulk generate scripts
 * POST /api/youtube/scripts/bulk-generate
 */
router.post('/scripts/bulk-generate', async (req: Request, res: Response) => {
  try {
    const { offerId, count, mix } = req.body;

    if (!offerId || !count || !mix) {
      return res.status(400).json({
        error: 'Missing required fields: offerId, count, mix',
      });
    }

    const scripts = await youtubeScriptService.bulkGenerate(offerId, count, mix);

    res.json({
      scripts,
      generated: scripts.length,
    });
  } catch (error) {
    await logger.error('YouTubeAPI', 'Failed to bulk generate scripts', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to bulk generate scripts',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get all scripts
 * GET /api/youtube/scripts?status=draft&videoType=review&limit=50&offset=0
 */
router.get('/scripts', async (req: Request, res: Response) => {
  try {
    const { status, videoType, offerId, limit, offset } = req.query;

    const filters: ScriptFilters = {
      status: status as string,
      videoType: videoType as string,
      offerId: offerId as string,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    };

    const scripts = await youtubeScriptService.getAllScripts(filters);

    // Get total count
    const total = scripts.length; // TODO: implement proper count query

    res.json({
      scripts,
      total,
      limit: filters.limit,
      offset: filters.offset,
    });
  } catch (error) {
    await logger.error('YouTubeAPI', 'Failed to fetch scripts', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      error: 'Failed to fetch scripts',
    });
  }
});

/**
 * Get single script
 * GET /api/youtube/scripts/:id
 */
router.get('/scripts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const script = await youtubeScriptService.getScript(id);

    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }

    res.json({ script });
  } catch (error) {
    await logger.error('YouTubeAPI', 'Failed to fetch script', {
      error: error instanceof Error ? error.message : 'Unknown error',
      scriptId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to fetch script',
    });
  }
});

/**
 * Update script status
 * PATCH /api/youtube/scripts/:id/status
 */
router.patch('/scripts/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['draft', 'recorded', 'editing', 'scheduled', 'published'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    await youtubeScriptService.updateScriptStatus(id, status);

    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    await logger.error('YouTubeAPI', 'Failed to update script status', {
      error: error instanceof Error ? error.message : 'Unknown error',
      scriptId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to update script status',
    });
  }
});

/**
 * Update script content
 * PATCH /api/youtube/scripts/:id
 */
router.patch('/scripts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // TODO: Implement full update functionality
    // For now, just update status if provided
    if (updates.status) {
      await youtubeScriptService.updateScriptStatus(id, updates.status);
    }

    const script = await youtubeScriptService.getScript(id);

    res.json({ script });
  } catch (error) {
    await logger.error('YouTubeAPI', 'Failed to update script', {
      error: error instanceof Error ? error.message : 'Unknown error',
      scriptId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to update script',
    });
  }
});

/**
 * Delete script
 * DELETE /api/youtube/scripts/:id
 */
router.delete('/scripts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await youtubeScriptService.deleteScript(id);

    res.json({ message: 'Script deleted successfully' });
  } catch (error) {
    await logger.error('YouTubeAPI', 'Failed to delete script', {
      error: error instanceof Error ? error.message : 'Unknown error',
      scriptId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to delete script',
    });
  }
});

/**
 * Regenerate specific section
 * POST /api/youtube/scripts/:id/regenerate-section
 */
router.post('/scripts/:id/regenerate-section', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { section } = req.body;

    if (!section) {
      return res.status(400).json({ error: 'Section is required' });
    }

    const validSections = ['hook', 'intro', 'cta', 'outro'];
    if (!validSections.includes(section)) {
      return res.status(400).json({
        error: `Invalid section. Must be one of: ${validSections.join(', ')}`,
      });
    }

    const updatedSection = await youtubeScriptService.regenerateSection(id, section);

    res.json({
      section,
      content: updatedSection,
    });
  } catch (error) {
    await logger.error('YouTubeAPI', 'Failed to regenerate section', {
      error: error instanceof Error ? error.message : 'Unknown error',
      scriptId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to regenerate section',
    });
  }
});

/**
 * Get script analytics
 * GET /api/youtube/scripts/:id/analytics
 */
router.get('/scripts/:id/analytics', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Implement analytics fetching from youtube_analytics table
    // For now, return placeholder

    res.json({
      scriptId: id,
      views: 0,
      retention: 0,
      ctr: 0,
      conversions: 0,
      revenue: 0,
      message: 'Analytics not yet implemented',
    });
  } catch (error) {
    await logger.error('YouTubeAPI', 'Failed to fetch script analytics', {
      error: error instanceof Error ? error.message : 'Unknown error',
      scriptId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to fetch script analytics',
    });
  }
});

export default router;
