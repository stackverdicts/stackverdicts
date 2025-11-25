/**
 * Script to generate image crops for existing images
 * Run with: npx tsx scripts/generate-image-crops.ts
 */

import { readdir, stat } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { IMAGE_SIZES } from '../src/config/image-sizes.js';

// Paths to scan for images
const IMAGE_DIRECTORIES = [
  path.join(process.cwd(), '../frontend/public/uploads/media'),
  path.join(process.cwd(), '../frontend/public/media/blog'),
];

async function isImageFile(filename: string): Promise<boolean> {
  const ext = path.extname(filename).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
}

async function isAlreadyResized(filename: string): Promise<boolean> {
  // Check if filename contains any of our size names
  return IMAGE_SIZES.some(size => filename.includes(`-${size.name}`));
}

async function generateCropsForImage(
  imagePath: string,
  filename: string,
  directory: string
): Promise<void> {
  console.log(`\nProcessing: ${filename}`);

  const ext = path.extname(filename);
  const nameWithoutExt = path.basename(filename, ext);

  // Read the original image
  const imageBuffer = await sharp(imagePath).toBuffer();

  // Generate each size variant
  for (const size of IMAGE_SIZES) {
    const resizedFilename = `${nameWithoutExt}-${size.name}${ext}`;
    const resizedPath = path.join(directory, resizedFilename);

    try {
      // Check if this size already exists
      try {
        await stat(resizedPath);
        console.log(
          `  ✓ ${size.name} (${size.width}x${size.height}) - already exists, skipping`
        );
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

      console.log(`  ✓ ${size.name} (${size.width}x${size.height}) - generated`);
    } catch (error: any) {
      console.error(`  ✗ ${size.name} - error: ${error.message}`);
    }
  }
}

async function processDirectory(directory: string): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Scanning directory: ${directory}`);
  console.log('='.repeat(60));

  try {
    // Check if directory exists
    try {
      await stat(directory);
    } catch {
      console.log(`Directory does not exist, skipping: ${directory}`);
      return;
    }

    const files = await readdir(directory);
    const imageFiles = [];

    // Filter to only original images (not already resized)
    for (const file of files) {
      if ((await isImageFile(file)) && !(await isAlreadyResized(file))) {
        imageFiles.push(file);
      }
    }

    console.log(`\nFound ${imageFiles.length} original image(s) to process`);

    if (imageFiles.length === 0) {
      console.log('No images to process in this directory.');
      return;
    }

    // Process each image
    for (const file of imageFiles) {
      const imagePath = path.join(directory, file);
      await generateCropsForImage(imagePath, file, directory);
    }
  } catch (error: any) {
    console.error(`\n✗ Error processing directory: ${error.message}`);
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('Image Crop Generator');
  console.log('='.repeat(60));
  console.log(`\nImage sizes to generate: ${IMAGE_SIZES.length}`);
  console.log(`Directories to scan: ${IMAGE_DIRECTORIES.length}`);

  // Process each directory
  for (const directory of IMAGE_DIRECTORIES) {
    await processDirectory(directory);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✓ All directories processed!');
  console.log('='.repeat(60));
  console.log('');
}

main().catch((error) => {
  console.error('\n✗ Fatal error:', error.message);
  process.exit(1);
});
