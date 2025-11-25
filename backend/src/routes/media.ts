import { Router, Request, Response } from 'express';
import multer from 'multer';
import { mediaService } from '../services/media';
import { logger } from '../utils/logger';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

/**
 * GET /api/media - List all media (admin only)
 */
router.get('/', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 24;
    const search = (req.query.search as string) || '';

    const result = await mediaService.getAllMedia({ page, limit, search });

    res.json(result);
  } catch (error) {
    await logger.error('MediaAPI', 'Failed to fetch media', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

/**
 * GET /api/media/:id - Get single media item (admin only)
 */
router.get('/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const media = await mediaService.getMediaById(id);

    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    res.json({ media });
  } catch (error) {
    await logger.error('MediaAPI', 'Failed to fetch media', {
      error: error instanceof Error ? error.message : 'Unknown error',
      mediaId: req.params.id,
    });
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

/**
 * POST /api/media - Upload new media (admin only)
 */
router.post(
  '/',
  authenticateAdmin,
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      // @ts-ignore - userId is added by authenticateAdmin middleware
      const userId = req.userId;

      const { title, altText, caption } = req.body;

      const media = await mediaService.uploadMedia(req.file, userId, {
        title,
        altText,
        caption,
      });

      res.status(201).json({ media });
    } catch (error) {
      await logger.error('MediaAPI', 'Failed to upload media', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      res.status(500).json({
        error: 'Failed to upload media',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/media/bulk - Upload multiple media files (admin only)
 */
router.post(
  '/bulk',
  authenticateAdmin,
  upload.array('files', 10),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files provided' });
      }

      // @ts-ignore - userId is added by authenticateAdmin middleware
      const userId = req.userId;

      const uploadedMedia = [];

      for (const file of files) {
        try {
          const media = await mediaService.uploadMedia(file, userId);
          uploadedMedia.push(media);
        } catch (error) {
          await logger.error('MediaAPI', 'Failed to upload file in bulk upload', {
            error: error instanceof Error ? error.message : 'Unknown error',
            filename: file.originalname,
          });
        }
      }

      res.status(201).json({
        media: uploadedMedia,
        uploaded: uploadedMedia.length,
        total: files.length,
      });
    } catch (error) {
      await logger.error('MediaAPI', 'Failed to bulk upload media', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      res.status(500).json({ error: 'Failed to bulk upload media' });
    }
  }
);

/**
 * PATCH /api/media/:id - Update media metadata (admin only)
 */
router.patch('/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, altText, caption } = req.body;

    const media = await mediaService.updateMedia(id, {
      title,
      altText,
      caption,
    });

    res.json({ media });
  } catch (error) {
    await logger.error('MediaAPI', 'Failed to update media', {
      error: error instanceof Error ? error.message : 'Unknown error',
      mediaId: req.params.id,
    });
    res.status(500).json({ error: 'Failed to update media' });
  }
});

/**
 * DELETE /api/media/:id - Delete media (admin only)
 */
router.delete('/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await mediaService.deleteMedia(id);

    res.json({ success: true });
  } catch (error) {
    await logger.error('MediaAPI', 'Failed to delete media', {
      error: error instanceof Error ? error.message : 'Unknown error',
      mediaId: req.params.id,
    });
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

export default router;
