# Image Crop & Resize System

This project now includes an automated image processing system that generates multiple responsive image sizes for optimal display across all devices.

## Overview

When images are uploaded, the system automatically generates 9 optimized variants:
- **Thumbnails** (square): 250px, 500px, 1000px
- **Cards** (3:2 landscape): 600x400px, 900x600px
- **Hero images** (16:9 landscape): 640x360px (mobile), 1024x576px (tablet), 1920x1080px (desktop), 2560x1440px (XL)

All variants are generated with optimized quality settings (85% quality, mozjpeg/webp compression) for fast loading.

## Features

✅ **Automatic resize on upload** - All size variants generated automatically
✅ **Responsive images** - Proper sizes for mobile, tablet, and desktop
✅ **Sharp processing** - High-quality, fast image processing with Sharp
✅ **Existing image support** - Script to generate crops for existing images
✅ **External URL support** - Unsplash and other external images work seamlessly

## Image Sizes Configuration

Image sizes are defined in `/backend/src/config/image-sizes.ts`:

```typescript
{
  name: 'hero-desktop',
  width: 1920,
  height: 1080,
  fit: 'cover',
  description: 'Desktop hero image'
}
```

## Usage

### 1. Uploading New Images

**Via API:**
```bash
POST /api/upload
Content-Type: multipart/form-data

file: [image file]
```

**Response:**
```json
{
  "success": true,
  "url": "/uploads/media/image-1234567890.jpg",
  "variants": {
    "thumb-sm": "/uploads/media/image-1234567890-thumb-sm.jpg",
    "hero-desktop": "/uploads/media/image-1234567890-hero-desktop.jpg",
    ...
  }
}
```

### 2. Using Images in Frontend

The frontend includes a utility function that automatically selects the correct image variant:

```tsx
import { getResizedImageUrl } from '../utils/image-utils';

// In your component
<picture>
  <source
    media="(min-width: 1920px)"
    srcSet={getResizedImageUrl(post.featured_image, 'hero-xl')}
  />
  <source
    media="(min-width: 1024px)"
    srcSet={getResizedImageUrl(post.featured_image, 'hero-desktop')}
  />
  <source
    media="(min-width: 640px)"
    srcSet={getResizedImageUrl(post.featured_image, 'hero-tablet')}
  />
  <img
    src={getResizedImageUrl(post.featured_image, 'hero-mobile')}
    alt={post.title}
  />
</picture>
```

### 3. Generating Crops for Existing Images

Run the script to process existing images:

```bash
cd backend
npx tsx scripts/generate-image-crops.ts
```

This will scan:
- `/frontend/public/uploads/media`
- `/frontend/public/media/blog`

And generate all missing size variants.

## Blog Hero Images

Blog post hero images now use responsive picture elements with proper crop sizes:

- **Mobile** (< 640px): 640x360px
- **Tablet** (640px - 1024px): 1024x576px
- **Desktop** (1024px - 1920px): 1920x1080px
- **XL Displays** (> 1920px): 2560x1440px

This ensures:
- ✅ No blurry or distorted images
- ✅ Fast loading on all devices
- ✅ Proper aspect ratios (16:9 for heroes, 3:2 for cards)
- ✅ Automatic optimization

## Image Quality

All images are processed with:
- **JPEG**: 85% quality with mozjpeg compression
- **PNG**: 85% quality with level 8 compression
- **WebP**: 85% quality
- **Fit mode**: 'cover' (fills dimensions, crops if needed)
- **Position**: 'center' (centers the crop)

## File Structure

```
backend/
├── src/
│   ├── config/
│   │   └── image-sizes.ts          # Size configurations
│   ├── services/
│   │   └── image.ts                # Image processing service
│   └── routes/
│       └── upload.ts               # Upload endpoint
└── scripts/
    └── generate-image-crops.ts     # Bulk crop generator

frontend/
├── app/
│   └── utils/
│       └── image-utils.ts          # Frontend helper functions
└── public/
    └── uploads/
        └── media/                  # Uploaded images & variants
```

## API Endpoints

### Upload Image
```
POST /api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

### Regenerate Crops (Admin only)
```
POST /api/upload/regenerate-crops
Authorization: Bearer <token>
Content-Type: application/json

{
  "imagePath": "/full/path/to/image.jpg"
}
```

## External Images (Unsplash, etc.)

The system automatically handles external images. When an image URL starts with `http://` or `https://`, the utility functions return the original URL without modification.

Current blog posts use Unsplash images, which display correctly without requiring local processing.

## Browser Support

The `<picture>` element with responsive sources is supported in all modern browsers:
- Chrome 38+
- Firefox 38+
- Safari 9.1+
- Edge 13+

## Performance Impact

- Original upload: ~2-3 seconds for all 9 variants
- Zero impact on page load (images served statically)
- Smaller file sizes = faster page loads
- Better Core Web Vitals scores

## Future Images

When you upload new blog post featured images through the admin panel, they will automatically get all variants generated. Use the image upload endpoint and store the returned URL in the database.

## Troubleshooting

**Issue**: Crops not generating
**Solution**: Ensure Sharp is installed: `npm install sharp`

**Issue**: Old images showing blurry
**Solution**: Run `npx tsx scripts/generate-image-crops.ts`

**Issue**: External images not loading
**Solution**: Check CORS settings for external domains

## Related Files

- Blog post display: `/frontend/app/blog/[slug]/page.tsx`
- Blog list cards: `/frontend/app/blog/page.tsx`
- Image utilities: `/frontend/app/utils/image-utils.ts`
- Upload service: `/backend/src/services/image.ts`
