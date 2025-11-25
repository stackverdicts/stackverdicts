# Static Site Builder - User Guide

## Overview

The Static Site Builder generates a production-ready, SEO-optimized static export of your StackVerdicts blog and landing pages. This allows you to host your public-facing site on cheap shared hosting or static hosting platforms while keeping the admin dashboard and backend on your local machine or a VPS.

## Features

✅ **SEO-Optimized Export**
- All blog posts with proper meta tags (title, description, OG, Twitter Card)
- Structured data (JSON-LD) for rich search results
- Automatic sitemap.xml generation
- robots.txt included
- Clean, semantic HTML

✅ **Full Site Assets**
- Optimized images
- Minified CSS and JavaScript
- All fonts and static files
- Responsive design maintained

✅ **Build Management**
- Track build history
- Download previous builds
- Monitor build progress
- Error reporting

## How to Use

### 1. Access the Build Page

Navigate to: **Admin Dashboard → Static Site Builder** (`/admin/static-build`)

### 2. Trigger a New Build

1. Click the **"Start New Build"** button
2. The system will:
   - Fetch all blog posts from your backend
   - Generate static HTML for each page
   - Create sitemap.xml and robots.txt
   - Optimize all images and assets
   - Package everything into a ZIP file

3. Build time varies based on content (typically 30-120 seconds)

### 3. Download Your Build

1. Once complete, the build appears in the "Build History" table
2. Click the **"Download"** button
3. Save the ZIP file (e.g., `stackverdicts-build-{id}.zip`)

### 4. Deploy to Hosting

#### Option A: Shared Hosting (cPanel, etc.)

1. Extract the ZIP file locally
2. Upload contents via FTP to your hosting's `public_html` or `www` folder
3. Ensure `.htaccess` file is uploaded (if included)
4. Your site is now live!

#### Option B: Static Hosting (Cloudflare Pages, Netlify, etc.)

1. Extract the ZIP file
2. Push contents to a Git repository
3. Connect repository to your hosting platform
4. Deploy automatically

#### Option C: Manual Server Upload

```bash
# Extract ZIP
unzip stackverdicts-build-abc123.zip -d site-files

# Upload via rsync
rsync -avz site-files/ user@yourserver.com:/var/www/html/

# Or via SCP
scp -r site-files/* user@yourserver.com:/var/www/html/
```

## SEO Configuration

### Pre-Build Checklist

Before building, ensure your content is SEO-ready:

- [ ] Blog posts have descriptive titles
- [ ] Featured images are set for all posts
- [ ] Meta descriptions are written (excerpts)
- [ ] Tags are properly assigned
- [ ] Slugs are URL-friendly
- [ ] Published dates are set

### What's Included in the Build

**Meta Tags:**
- Title tags (60 characters max)
- Meta descriptions (160 characters max)
- Open Graph tags (Facebook/LinkedIn)
- Twitter Card tags
- Canonical URLs

**Structured Data:**
- Article schema
- Organization schema
- BreadcrumbList schema

**Sitemaps:**
- XML sitemap with all pages
- Priority and change frequency set
- Last modified dates included

**Robots.txt:**
- Allows all crawlers
- References sitemap
- Blocks admin routes

## Build Status

### Status Types

- **Pending** - Build queued, waiting to start
- **Building** - Currently generating static files
- **Completed** - Build successful, ready to download
- **Failed** - Build encountered an error

### Auto-Polling

The page automatically polls for updates every 3 seconds when a build is in progress.

### Build Information

Each build tracks:
- **Pages Count** - Number of HTML pages generated
- **File Size** - Total ZIP file size
- **Duration** - Time taken to complete build
- **Created Date** - When build was triggered

## Troubleshooting

### Build Failed

**Common causes:**
1. Backend not running - Ensure API is accessible at `localhost:3001`
2. Database connection issues - Check MySQL is running
3. Missing content - Ensure you have published blog posts
4. Memory issues - Large image files may cause timeouts

**Solutions:**
- Check backend console for errors
- Verify database connection
- Optimize large images before building
- Restart backend if needed

### Missing Pages

If some pages don't appear in the build:

1. Check post status is "published" (not "draft")
2. Verify `published_at` date is not in the future
3. Ensure slugs are properly set
4. Check for special characters in slugs

### Images Not Loading

If images don't appear after deployment:

1. Verify images were uploaded to backend before build
2. Check image URLs in posts are relative (not absolute)
3. Ensure hosting supports the image format (WebP, JPEG, PNG)

### SEO Issues

If pages don't rank well:

1. Verify meta tags using tools:
   - [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
   - [Twitter Card Validator](https://cards-dev.twitter.com/validator)
   - [Google Rich Results Test](https://search.google.com/test/rich-results)

2. Submit sitemap to search engines:
   - Google Search Console: `https://yourdomain.com/sitemap.xml`
   - Bing Webmaster Tools: Same URL

## Technical Details

### Build Process

1. **Frontend Build**
   - Next.js static export runs
   - Pages pre-rendered with data from backend
   - Assets optimized and hashed

2. **File Generation**
   - HTML files for all routes
   - JSON files for dynamic data
   - Static assets (CSS, JS, images)
   - Sitemap and robots.txt

3. **Compression**
   - All files packaged into ZIP
   - Maximum compression (level 9)
   - Maintains directory structure

### File Structure

```
out/
├── index.html           # Homepage
├── blog/
│   ├── index.html       # Blog listing
│   ├── post-slug-1/
│   │   └── index.html   # Individual post
│   └── tag/
│       └── tag-slug/
│           └── index.html
├── _next/               # Next.js assets
│   ├── static/
│   └── ...
├── assets/              # Your images/fonts
├── sitemap.xml
└── robots.txt
```

### Environment Variables

The build uses these environment variables:

- `NEXT_OUTPUT=export` - Enables static export mode
- `NODE_ENV=production` - Production optimizations
- `NEXT_PUBLIC_API_URL` - Backend API endpoint

## Performance Tips

### Faster Builds

1. **Optimize images before upload**
   - Compress images to <500KB
   - Use appropriate dimensions
   - Convert to WebP when possible

2. **Limit build frequency**
   - Only build when content changes
   - Don't rebuild for minor admin changes
   - Keep builds for rollback purposes

3. **Clean old builds**
   - Delete builds older than 30 days
   - Keep only 5-10 most recent builds

### Hosting Optimization

1. **Enable caching**
   - Set long cache times for static assets
   - Use CDN for global distribution

2. **Enable compression**
   - Gzip or Brotli compression
   - Reduces bandwidth usage

3. **SSL certificate**
   - Always use HTTPS
   - Get free certificate from Let's Encrypt

## Best Practices

### Content Updates

1. Write/edit posts in admin dashboard
2. Preview changes locally first
3. Publish when ready
4. Trigger new build
5. Download and deploy

### Version Control

1. Keep last 5-10 builds for rollback
2. Note what changed in each build (optional)
3. Test new builds before replacing production

### Monitoring

1. Check build status regularly
2. Monitor for failed builds
3. Set up uptime monitoring for your site
4. Track analytics post-deployment

## Cost Comparison

### Hosting Options

| Platform | Monthly Cost | Setup Time | Best For |
|----------|--------------|------------|----------|
| Cloudflare Pages | $0 | 5 min | Best value, fast CDN |
| Netlify Free | $0 | 5 min | Easy deployment |
| Shared Hosting | $3-5 | 15 min | Traditional approach |
| Vercel Free | $0 | 5 min | Next.js optimized |
| DigitalOcean Spaces | $5 | 10 min | Static hosting + CDN |

### Total Cost: $0-5/month

Compare to traditional hosting:
- Vercel Pro: $20/month
- WP Engine: $30/month
- VPS hosting: $10-20/month

## Support

### Need Help?

1. Check build logs in admin dashboard
2. Review backend console for errors
3. Verify database connectivity
4. Test with a small site first

### Common Questions

**Q: How often should I rebuild?**
A: Only when you publish new content or make changes to existing posts.

**Q: Can I schedule automatic builds?**
A: Not currently, but you can add this via cron jobs if needed.

**Q: What if my build is too large?**
A: Optimize images, remove unused assets, or split into multiple builds.

**Q: Can I customize the build process?**
A: Yes! Edit `/backend/src/services/staticBuildService.ts` to modify behavior.

## Conclusion

The Static Site Builder gives you the best of both worlds:
- **Admin Power**: Full-featured CMS with AI content generation
- **Public Performance**: Lightning-fast static site with perfect SEO
- **Cost Savings**: $0-5/month hosting vs $30-60/month for traditional stack

Start building your static site today! 🚀
