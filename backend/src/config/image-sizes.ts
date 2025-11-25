/**
 * Image size configurations for responsive image generation
 *
 * These sizes are used throughout the site for generating optimized image variants.
 * When images are uploaded, copies are created for each size to ensure optimal
 * display across different devices and use cases.
 */

export interface ImageSize {
  name: string;
  width: number;
  height: number;
  fit: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  description: string;
}

export const IMAGE_SIZES: ImageSize[] = [
  // Thumbnail sizes (square)
  {
    name: 'thumb-sm',
    width: 250,
    height: 250,
    fit: 'cover',
    description: 'Small thumbnail for cards and previews'
  },
  {
    name: 'thumb-md',
    width: 500,
    height: 500,
    fit: 'cover',
    description: 'Medium square for grid layouts'
  },
  {
    name: 'thumb-lg',
    width: 1000,
    height: 1000,
    fit: 'cover',
    description: 'Large square for detailed previews'
  },

  // Card/Preview sizes (3:2 landscape)
  {
    name: 'card-sm',
    width: 600,
    height: 400,
    fit: 'cover',
    description: 'Small card preview'
  },
  {
    name: 'card-md',
    width: 900,
    height: 600,
    fit: 'cover',
    description: 'Medium card preview'
  },

  // Hero/Banner sizes (16:9 landscape - optimized for blog headers)
  {
    name: 'hero-mobile',
    width: 640,
    height: 360,
    fit: 'cover',
    description: 'Mobile hero image'
  },
  {
    name: 'hero-tablet',
    width: 1024,
    height: 576,
    fit: 'cover',
    description: 'Tablet hero image'
  },
  {
    name: 'hero-desktop',
    width: 1920,
    height: 1080,
    fit: 'cover',
    description: 'Desktop hero image'
  },
  {
    name: 'hero-xl',
    width: 2560,
    height: 1440,
    fit: 'cover',
    description: 'Extra large hero for high-res displays'
  },
];

/**
 * Get image size configuration by name
 */
export function getImageSize(name: string): ImageSize | undefined {
  return IMAGE_SIZES.find(size => size.name === name);
}

/**
 * Generate the filename for a specific size variant
 * Example: "blog-image.jpg" with size "hero-mobile" -> "blog-image-hero-mobile.jpg"
 */
export function getResizedFilename(originalFilename: string, sizeName: string): string {
  const lastDotIndex = originalFilename.lastIndexOf('.');
  const name = originalFilename.substring(0, lastDotIndex);
  const ext = originalFilename.substring(lastDotIndex);
  return `${name}-${sizeName}${ext}`;
}

/**
 * Get the public URL for a resized image variant
 */
export function getResizedImageUrl(originalUrl: string, sizeName: string): string {
  const urlParts = originalUrl.split('/');
  const filename = urlParts[urlParts.length - 1];
  const basePath = urlParts.slice(0, -1).join('/');

  // Extract the base name and extension
  const lastDotIndex = filename.lastIndexOf('.');
  const name = filename.substring(0, lastDotIndex);
  const ext = filename.substring(lastDotIndex);

  // Build the resized filename (format: basename-sizeName.ext)
  const resizedFilename = `${name}-${sizeName}${ext}`;
  return `${basePath}/${resizedFilename}`;
}
