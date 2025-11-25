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
  // Handle external URLs (Unsplash, etc)
  if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
    return originalUrl;
  }

  const lastSlashIndex = originalUrl.lastIndexOf('/');
  const filename = originalUrl.substring(lastSlashIndex + 1);
  const path = originalUrl.substring(0, lastSlashIndex + 1);

  return path + getResizedFilename(filename, sizeName);
}
