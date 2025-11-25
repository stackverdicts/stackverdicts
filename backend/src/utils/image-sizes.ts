export interface ImageSize {
  name: string;
  width: number;
  height: number;
  fit: 'cover' | 'contain' | 'inside' | 'outside';
  description: string;
}

// Predefined image sizes for responsive images
export const IMAGE_SIZES: ImageSize[] = [
  // Thumbnails (square)
  {
    name: 'thumb-sm',
    width: 250,
    height: 250,
    fit: 'cover',
    description: 'Small thumbnail (250x250)',
  },
  {
    name: 'thumb-md',
    width: 500,
    height: 500,
    fit: 'cover',
    description: 'Medium thumbnail (500x500)',
  },
  {
    name: 'thumb-lg',
    width: 1000,
    height: 1000,
    fit: 'cover',
    description: 'Large thumbnail (1000x1000)',
  },

  // Cards (3:2 landscape ratio)
  {
    name: 'card-sm',
    width: 600,
    height: 400,
    fit: 'cover',
    description: 'Small card (600x400)',
  },
  {
    name: 'card-md',
    width: 900,
    height: 600,
    fit: 'cover',
    description: 'Medium card (900x600)',
  },

  // Hero/Banner images (16:9 landscape ratio)
  {
    name: 'hero-mobile',
    width: 640,
    height: 360,
    fit: 'cover',
    description: 'Mobile hero (640x360)',
  },
  {
    name: 'hero-tablet',
    width: 1024,
    height: 576,
    fit: 'cover',
    description: 'Tablet hero (1024x576)',
  },
  {
    name: 'hero-desktop',
    width: 1920,
    height: 1080,
    fit: 'cover',
    description: 'Desktop hero (1920x1080)',
  },
  {
    name: 'hero-xl',
    width: 2500,
    height: 1406,
    fit: 'inside',
    description: 'Extra large hero (2500x1406)',
  },

  // Media library variants
  {
    name: 'thumbnail',
    width: 150,
    height: 150,
    fit: 'cover',
    description: 'Library thumbnail',
  },
  {
    name: 'medium',
    width: 300,
    height: 300,
    fit: 'inside',
    description: 'Medium size',
  },
  {
    name: 'large',
    width: 1024,
    height: 1024,
    fit: 'inside',
    description: 'Large size',
  },
  {
    name: 'hero',
    width: 1920,
    height: 1080,
    fit: 'cover',
    description: 'Hero banner',
  },
  {
    name: 'card',
    width: 800,
    height: 600,
    fit: 'cover',
    description: 'Card image',
  },
];

/**
 * Get image size configuration by name
 */
export function getImageSize(name: string): ImageSize | undefined {
  return IMAGE_SIZES.find((size) => size.name === name);
}

/**
 * Generate resized filename from original filename and size name
 * Example: "photo.jpg" + "hero-desktop" => "photo-hero-desktop.jpg"
 */
export function getResizedFilename(originalFilename: string, sizeName: string): string {
  const lastDotIndex = originalFilename.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return `${originalFilename}-${sizeName}`;
  }

  const name = originalFilename.substring(0, lastDotIndex);
  const ext = originalFilename.substring(lastDotIndex);

  return `${name}-${sizeName}${ext}`;
}

/**
 * Get public URL for a resized image variant
 * Example: "/uploads/media/abc123.jpg" + "hero-desktop" => "/uploads/media/abc123-hero-desktop.jpg"
 */
export function getResizedImageUrl(originalUrl: string, sizeName: string): string {
  const lastSlashIndex = originalUrl.lastIndexOf('/');
  const filename = originalUrl.substring(lastSlashIndex + 1);
  const path = originalUrl.substring(0, lastSlashIndex + 1);

  return path + getResizedFilename(filename, sizeName);
}
