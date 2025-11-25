import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { IMAGE_SIZES, ImageSize } from '../config/image-sizes.js';
import { logger } from '../utils/logger.js';

export interface ImageUploadResult {
  originalUrl: string;
  resizedVariants: {
    [sizeName: string]: string;
  };
}

export class ImageService {
  private uploadDir: string;

  constructor(uploadDir: string = path.join(process.cwd(), '../frontend/public/uploads/media')) {
    this.uploadDir = uploadDir;
  }

  /**
   * Ensure the upload directory exists
   */
  async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Process and save an uploaded image with all size variants
   */
  async processUpload(
    buffer: Buffer,
    originalFilename: string
  ): Promise<ImageUploadResult> {
    await this.ensureUploadDir();

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = originalFilename.replace(/\s+/g, '-').toLowerCase();
    const extension = path.extname(sanitizedName);
    const nameWithoutExt = path.basename(sanitizedName, extension);
    const filename = `${nameWithoutExt}-${timestamp}${extension}`;

    // Save original image
    const originalPath = path.join(this.uploadDir, filename);
    await fs.writeFile(originalPath, buffer);

    const originalUrl = `/uploads/media/${filename}`;
    const resizedVariants: { [sizeName: string]: string } = {};

    // Generate all size variants
    try {
      await Promise.all(
        IMAGE_SIZES.map(async (size) => {
          const resizedFilename = `${nameWithoutExt}-${timestamp}-${size.name}${extension}`;
          const resizedPath = path.join(this.uploadDir, resizedFilename);

          await sharp(buffer)
            .resize(size.width, size.height, {
              fit: size.fit,
              position: 'center',
            })
            .jpeg({ quality: 85, mozjpeg: true })
            .png({ quality: 85, compressionLevel: 8 })
            .webp({ quality: 85 })
            .toFile(resizedPath);

          resizedVariants[size.name] = `/uploads/media/${resizedFilename}`;

          logger.info('Image variant generated', {
            size: size.name,
            dimensions: `${size.width}x${size.height}`,
            file: resizedFilename
          });
        })
      );

      logger.info('Image upload processed successfully', {
        originalFile: filename,
        variants: Object.keys(resizedVariants).length
      });
    } catch (error: any) {
      logger.error('Failed to generate image variants', {
        error: error.message,
        file: filename
      });
      throw new Error('Failed to generate image variants');
    }

    return {
      originalUrl,
      resizedVariants,
    };
  }

  /**
   * Generate resized variants for an existing image file
   */
  async generateVariantsForExisting(
    imagePath: string
  ): Promise<{ [sizeName: string]: string }> {
    const filename = path.basename(imagePath);
    const extension = path.extname(filename);
    const nameWithoutExt = path.basename(filename, extension);
    const dirPath = path.dirname(imagePath);

    // Read the original image
    const imageBuffer = await fs.readFile(imagePath);
    const resizedVariants: { [sizeName: string]: string } = {};

    // Generate each size variant
    for (const size of IMAGE_SIZES) {
      const resizedFilename = `${nameWithoutExt}-${size.name}${extension}`;
      const resizedPath = path.join(dirPath, resizedFilename);

      try {
        // Check if this size already exists
        try {
          await fs.access(resizedPath);
          logger.info(`Image variant already exists, skipping`, {
            size: size.name,
            file: resizedFilename
          });
          continue;
        } catch {
          // File doesn't exist, continue with generation
        }

        await sharp(imageBuffer)
          .resize(size.width, size.height, {
            fit: size.fit,
            position: 'center',
          })
          .jpeg({ quality: 85, mozjpeg: true })
          .png({ quality: 85, compressionLevel: 8 })
          .webp({ quality: 85 })
          .toFile(resizedPath);

        const relativePath = path.relative(
          path.join(process.cwd(), '../frontend/public'),
          resizedPath
        );
        resizedVariants[size.name] = `/${relativePath.replace(/\\/g, '/')}`;

        logger.info('Image variant generated', {
          size: size.name,
          dimensions: `${size.width}x${size.height}`,
          file: resizedFilename
        });
      } catch (error: any) {
        logger.error(`Failed to generate ${size.name} variant`, {
          error: error.message,
          file: filename
        });
      }
    }

    return resizedVariants;
  }

  /**
   * Validate uploaded image file
   */
  validateImage(
    mimetype: string,
    size: number,
    maxSize: number = 15 * 1024 * 1024 // 15MB default
  ): { valid: boolean; error?: string } {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (!allowedTypes.includes(mimetype)) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
      };
    }

    if (size > maxSize) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB.`,
      };
    }

    return { valid: true };
  }

  /**
   * Delete an image and all its variants
   */
  async deleteImage(imagePath: string): Promise<void> {
    const filename = path.basename(imagePath);
    const extension = path.extname(filename);
    const nameWithoutExt = path.basename(filename, extension);
    const dirPath = path.dirname(imagePath);

    // Delete original
    try {
      await fs.unlink(imagePath);
      logger.info('Deleted original image', { file: filename });
    } catch (error: any) {
      logger.error('Failed to delete original image', {
        error: error.message,
        file: filename
      });
    }

    // Delete all variants
    for (const size of IMAGE_SIZES) {
      const resizedFilename = `${nameWithoutExt}-${size.name}${extension}`;
      const resizedPath = path.join(dirPath, resizedFilename);

      try {
        await fs.unlink(resizedPath);
        logger.info('Deleted image variant', {
          size: size.name,
          file: resizedFilename
        });
      } catch (error: any) {
        // Variant might not exist, that's okay
      }
    }
  }
}

export const imageService = new ImageService();
