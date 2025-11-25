import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticateAdmin } from '../middleware/auth.js';
import { imageService } from '../services/image.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Configure multer to use memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  },
});

/**
 * POST /api/upload
 * Upload an image and automatically generate all size variants
 * Requires authentication
 */
router.post('/', authenticateAdmin, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate image
    const validation = imageService.validateImage(
      req.file.mimetype,
      req.file.size
    );

    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Process the upload and generate all variants
    const result = await imageService.processUpload(
      req.file.buffer,
      req.file.originalname
    );

    logger.info('File uploaded successfully', {
      userId: (req as any).user?.id,
      originalUrl: result.originalUrl,
      variants: Object.keys(result.resizedVariants).length
    });

    res.json({
      success: true,
      url: result.originalUrl,
      variants: result.resizedVariants,
    });
  } catch (error: any) {
    logger.error('Upload error', {
      error: error.message,
      userId: (req as any).user?.id
    });

    res.status(500).json({
      error: 'Failed to upload file',
      message: error.message,
    });
  }
});

/**
 * POST /api/upload/regenerate-crops
 * Regenerate image crops for existing images
 * Admin only
 */
router.post('/regenerate-crops', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { imagePath } = req.body;

    if (!imagePath) {
      return res.status(400).json({ error: 'Image path is required' });
    }

    // Check if user is admin
    const user = (req as any).user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const variants = await imageService.generateVariantsForExisting(imagePath);

    logger.info('Image crops regenerated', {
      userId: user.id,
      imagePath,
      variants: Object.keys(variants).length
    });

    res.json({
      success: true,
      variants,
    });
  } catch (error: any) {
    logger.error('Regenerate crops error', {
      error: error.message,
      userId: (req as any).user?.id
    });

    res.status(500).json({
      error: 'Failed to regenerate crops',
      message: error.message,
    });
  }
});

export default router;
