import { query, queryOne, insert } from '../config/database';
import { generateId } from '../utils/id-generator';
import { logger } from '../utils/logger';
import sharp from 'sharp';
import { IMAGE_SIZES, getResizedFilename } from '../utils/image-sizes';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';

interface MediaData {
  filename: string;
  title?: string;
  altText?: string;
  caption?: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  uploadedBy: string;
}

interface MediaVariantData {
  mediaId: string;
  name: string;
  url: string;
  width?: number;
  height?: number;
  fileSize: number;
}

class MediaService {
  private uploadDir = path.join(process.cwd(), '../frontend/public/uploads/media');

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      logger.error('Media', 'Failed to create upload directory', { error });
      throw error;
    }
  }

  /**
   * Upload media file and generate variants
   */
  async uploadMedia(
    file: Express.Multer.File,
    userId: string,
    metadata?: { title?: string; altText?: string; caption?: string }
  ): Promise<any> {
    await this.ensureUploadDir();

    const buffer = file.buffer;

    // Get image metadata using Sharp
    const imageMetadata = await sharp(buffer).metadata();
    const { width, height, format } = imageMetadata;

    // Generate unique filename
    const fileId = randomUUID();
    const ext = format || 'jpg';
    const filename = `${fileId}.${ext}`;
    const filepath = path.join(this.uploadDir, filename);

    // Save original file
    await sharp(buffer)
      .jpeg({ quality: 90 })
      .png({ quality: 90 })
      .webp({ quality: 90 })
      .toFile(filepath);

    const fileStats = await fs.stat(filepath);

    // Create media record
    const mediaId = generateId('media');
    await insert(
      `INSERT INTO media (
        id, filename, title, alt_text, caption, mime_type,
        file_size, width, height, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        mediaId,
        file.originalname,
        metadata?.title || file.originalname,
        metadata?.altText || null,
        metadata?.caption || null,
        file.mimetype,
        fileStats.size,
        width || null,
        height || null,
        userId,
      ]
    );

    // Generate "full" variant (original)
    const fullVariantId = generateId('variant');
    await insert(
      `INSERT INTO media_variants (id, media_id, name, url, width, height, file_size)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        fullVariantId,
        mediaId,
        'full',
        `/uploads/media/${filename}`,
        width || null,
        height || null,
        fileStats.size,
      ]
    );

    // Generate size variants
    const variants = ['thumbnail', 'medium', 'large', 'hero', 'card'];
    for (const sizeName of variants) {
      const size = IMAGE_SIZES.find(s => s.name === sizeName);
      if (!size) continue;

      try {
        const variantFilename = getResizedFilename(filename, sizeName);
        const variantPath = path.join(this.uploadDir, variantFilename);

        const resized = await sharp(buffer)
          .resize(size.width, size.height, { fit: size.fit })
          .jpeg({ quality: 85 })
          .png({ quality: 85 })
          .webp({ quality: 85 })
          .toFile(variantPath);

        const variantId = generateId('variant');
        await insert(
          `INSERT INTO media_variants (id, media_id, name, url, width, height, file_size)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            variantId,
            mediaId,
            sizeName,
            `/uploads/media/${variantFilename}`,
            resized.width,
            resized.height,
            resized.size,
          ]
        );
      } catch (error) {
        logger.error('Media', `Failed to generate ${sizeName} variant`, { error, mediaId });
      }
    }

    await logger.info('Media', 'File uploaded with variants', { mediaId, filename });

    return this.getMediaById(mediaId);
  }

  /**
   * Get all media with pagination and search
   */
  async getAllMedia(options: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<{ media: any[]; pagination: any }> {
    const { page = 1, limit = 24, search = '' } = options;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: any[] = [];

    if (search) {
      whereClause = `WHERE m.filename LIKE ? OR m.title LIKE ? OR m.alt_text LIKE ?`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Get media with variants
    const media = await query(
      `SELECT
        m.*,
        COUNT(DISTINCT mv.id) as variant_count
      FROM media m
      LEFT JOIN media_variants mv ON m.id = mv.media_id
      ${whereClause}
      GROUP BY m.id
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Get total count
    const countResult = await queryOne(
      `SELECT COUNT(*) as total FROM media m ${whereClause}`,
      params
    );
    const total = countResult?.total || 0;

    // Fetch variants for each media item
    for (const item of media) {
      item.variants = await this.getMediaVariants(item.id);
    }

    return {
      media,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get media by ID
   */
  async getMediaById(id: string): Promise<any | null> {
    const media = await queryOne('SELECT * FROM media WHERE id = ?', [id]);
    if (!media) return null;

    media.variants = await this.getMediaVariants(id);
    return media;
  }

  /**
   * Get all variants for a media item
   */
  async getMediaVariants(mediaId: string): Promise<any[]> {
    return query(
      'SELECT * FROM media_variants WHERE media_id = ? ORDER BY name',
      [mediaId]
    );
  }

  /**
   * Update media metadata
   */
  async updateMedia(
    id: string,
    data: { title?: string; altText?: string; caption?: string }
  ): Promise<any> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      values.push(data.title);
    }
    if (data.altText !== undefined) {
      updates.push('alt_text = ?');
      values.push(data.altText);
    }
    if (data.caption !== undefined) {
      updates.push('caption = ?');
      values.push(data.caption);
    }

    if (updates.length === 0) {
      return this.getMediaById(id);
    }

    values.push(id);

    await query(
      `UPDATE media SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    await logger.info('Media', 'Media metadata updated', { mediaId: id });

    return this.getMediaById(id);
  }

  /**
   * Delete media and all variants (files and database records)
   */
  async deleteMedia(id: string): Promise<void> {
    const media = await this.getMediaById(id);
    if (!media) {
      throw new Error('Media not found');
    }

    // Delete physical files
    for (const variant of media.variants) {
      const filePath = path.join(
        process.cwd(),
        '../frontend/public',
        variant.url
      );
      try {
        await fs.unlink(filePath);
      } catch (error) {
        logger.error('Media', 'Failed to delete variant file', {
          error,
          variantId: variant.id,
          path: filePath
        });
      }
    }

    // Delete database records (variants will cascade delete)
    await query('DELETE FROM media WHERE id = ?', [id]);

    await logger.info('Media', 'Media deleted', { mediaId: id });
  }

  /**
   * Get variant URL by size name
   */
  async getVariantUrl(mediaId: string, sizeName: string): Promise<string | null> {
    const variant = await queryOne(
      'SELECT url FROM media_variants WHERE media_id = ? AND name = ?',
      [mediaId, sizeName]
    );

    return variant?.url || null;
  }
}

export const mediaService = new MediaService();
