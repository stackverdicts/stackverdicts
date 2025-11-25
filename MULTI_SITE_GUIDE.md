# Multi-Site Management Guide

## Overview

The Automated Affiliate Hub now supports managing multiple branded affiliate sites from a single dashboard. This is perfect for creating separate sites for different offer categories (e.g., autoinsurance.com, mortgagedeals.com, healthquotes.com).

## Features

### ✅ What You Can Do

1. **Create Multiple Sites**
   - Each site has its own branding (name, domain, colors, logo)
   - Assign specific offer verticals to each site
   - Manage SEO settings per site

2. **Assign Offers to Sites**
   - Control which offers appear on which site
   - Feature specific offers on each site
   - Customize offer display order

3. **Track Performance Per Site**
   - View clicks, conversions, and revenue by site
   - Compare performance across different sites
   - See conversion rates for each branded domain

4. **Customize Branding**
   - Set primary and secondary colors
   - Upload logo (future feature)
   - Configure meta tags for SEO

## How to Use

### 1. Access Site Management

From the dashboard, click the **"🌐 Manage Sites"** button in the header.

**URL**: http://localhost:3000/dashboard/sites

### 2. Create Your First Site

Click "Create New Site" and fill in:

- **Site Name**: The brand name (e.g., "Auto Insurance Deals")
- **Domain**:
  - For local dev: `localhost:3000` or `autoinsurance.local`
  - For VPS: `autoinsurance.com` (your actual domain)
- **Description**: Brief description of the site
- **Vertical**: Main category (e.g., Insurance, Finance, Health)
- **Primary Color**: Main brand color
- **Secondary Color**: Accent color

### 3. Assign Offers to a Site

After creating a site, click "Manage" on the site card. Then:

```bash
# Via API:
curl -X POST http://localhost:3001/api/sites/{site_id}/offers \
  -H "Content-Type: application/json" \
  -d '{
    "offer_ids": ["offer_abc123", "offer_xyz789"]
  }'
```

Or use the frontend interface (coming soon).

### 4. Deploy to VPS

When ready for production:

1. **Update Domain**: Edit the site and change domain from `localhost:3000` to your actual domain
2. **Configure DNS**: Point your domain to your VPS IP
3. **Set Status to Active**: Change site status from "draft" to "active"
4. **Deploy**: The landing pages will automatically work on the new domain

## Database Schema

### Sites Table

```sql
CREATE TABLE sites (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,

    -- Branding
    logo_url VARCHAR(500),
    primary_color VARCHAR(7) DEFAULT '#3B82F6',
    secondary_color VARCHAR(7) DEFAULT '#10B981',

    -- Configuration
    vertical VARCHAR(100),
    allowed_verticals JSON,
    site_type ENUM('single_vertical', 'multi_vertical') DEFAULT 'single_vertical',

    -- Status
    status ENUM('active', 'draft', 'inactive') DEFAULT 'draft',
    is_default BOOLEAN DEFAULT false,

    -- Analytics
    google_analytics_id VARCHAR(50),
    google_ads_conversion_id VARCHAR(50),
    facebook_pixel_id VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Site-Offer Assignment

```sql
CREATE TABLE site_offers (
    id VARCHAR(50) PRIMARY KEY,
    site_id VARCHAR(50) NOT NULL,
    offer_id VARCHAR(50) NOT NULL,
    display_order INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    custom_headline VARCHAR(255),
    custom_description TEXT,
    status ENUM('active', 'paused') DEFAULT 'active',

    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_site_offer (site_id, offer_id)
);
```

## API Endpoints

### Get All Sites
```
GET /api/sites
```

### Get Single Site
```
GET /api/sites/{id}
```

### Create Site
```
POST /api/sites
Content-Type: application/json

{
  "name": "Auto Insurance Deals",
  "domain": "autoinsurance.com",
  "description": "Find the best auto insurance rates",
  "vertical": "Insurance",
  "primary_color": "#FF6B35",
  "secondary_color": "#004E89"
}
```

### Update Site
```
PUT /api/sites/{id}
Content-Type: application/json

{
  "status": "active",
  "logo_url": "https://cdn.example.com/logo.png"
}
```

### Delete Site
```
DELETE /api/sites/{id}
```

### Get Site Performance
```
GET /api/sites/{id}/performance

Response:
{
  "site_id": "site_abc123",
  "site_name": "Auto Insurance Deals",
  "domain": "autoinsurance.com",
  "total_offers": 15,
  "total_clicks": 1250,
  "total_conversions": 48,
  "total_revenue": 1440.00,
  "conversion_rate": 3.84
}
```

### Get Site Offers
```
GET /api/sites/{id}/offers
```

### Assign Offers to Site
```
POST /api/sites/{id}/offers
Content-Type: application/json

{
  "offer_ids": ["offer_1", "offer_2", "offer_3"]
}
```

### Remove Offer from Site
```
DELETE /api/sites/{id}/offers/{offer_id}
```

## VPS Deployment Strategy

### Option 1: Single VPS, Multiple Domains

1. **Setup Nginx** with multiple server blocks:

```nginx
# /etc/nginx/sites-available/autoinsurance.com
server {
    listen 80;
    server_name autoinsurance.com www.autoinsurance.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# /etc/nginx/sites-available/mortgagedeals.com
server {
    listen 80;
    server_name mortgagedeals.com www.mortgagedeals.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

2. **Dynamic Routing**: The frontend checks the hostname and loads the appropriate site configuration.

3. **Shared Backend**: All sites share the same backend API at `localhost:3001`.

### Option 2: Subdirectory Routing

If you want all sites under one main domain:

```
yourdomain.com/auto-insurance
yourdomain.com/mortgage-deals
yourdomain.com/health-insurance
```

## Example Use Cases

### Use Case 1: Insurance Network

Create 3 separate branded sites:

1. **autoinsurance.com** - Auto insurance offers only
2. **healthinsurance.com** - Health insurance offers only
3. **homeinsurance.com** - Home insurance offers only

Each site:
- Has its own branding and colors
- Shows only relevant offers
- Tracks performance separately
- Has unique Google Ads campaigns

### Use Case 2: Finance Portal

Create 1 multi-vertical site:

1. **financialdeals.com** - All finance-related offers
   - Mortgages
   - Personal loans
   - Credit cards
   - Investment apps

### Use Case 3: Testing Different Brands

Create 2 versions of the same vertical:

1. **quickautoinsurance.com** - Budget-focused branding
2. **premiumautoprotection.com** - Luxury-focused branding

Test which branding performs better with the same offers.

## Local Development Workflow

### 1. Create Test Sites

```bash
# Create first site
curl -X POST http://localhost:3001/api/sites \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Auto Insurance Test",
    "domain": "localhost:3000",
    "vertical": "Insurance"
  }'

# Create second site
curl -X POST http://localhost:3001/api/sites \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Health Insurance Test",
    "domain": "localhost:3001",
    "vertical": "Health"
  }'
```

### 2. Assign Offers

Filter offers by vertical and assign to appropriate sites.

### 3. Test Locally

Access sites at:
- http://localhost:3000 (Auto Insurance)
- http://localhost:3001 (Health Insurance)

### 4. Deploy to VPS

When ready:
1. Update domains to real domains
2. Set status to "active"
3. Configure DNS
4. Deploy to VPS

## Next Steps

### Immediate Enhancements (Planned):

1. **Site Detail Page**: Full management interface for each site
2. **Bulk Offer Assignment**: Assign all offers from a vertical at once
3. **Site Preview**: Preview how the site looks before going live
4. **Logo Upload**: Upload and manage site logos
5. **Custom CSS**: Add custom styling per site
6. **Analytics Integration**: Auto-configure GA4 and Facebook Pixel

### Future Features:

1. **A/B Testing**: Test different variations of each site
2. **White Label**: Complete white-label solution for affiliates
3. **Site Templates**: Pre-built site templates for different verticals
4. **Multi-Language**: Support for multiple languages per site

## Troubleshooting

### Site Not Loading

Check:
1. Site status is "active"
2. Domain is correctly configured
3. DNS points to your VPS IP
4. Nginx configuration is correct

### Offers Not Showing

Check:
1. Offers are assigned to the site via `site_offers` table
2. Offers have status "active" or "paused" (not "deleted")
3. Site vertical matches offer vertical (if filtered)

### Performance Not Tracking

Check:
1. `site_id` is being set on clicks and conversions
2. Tracking links include site identifier
3. Site performance view is working: `SELECT * FROM site_performance`

---

## Support

For issues or questions:
- Check backend logs: System logs table tracks all site operations
- Review API responses for error messages
- Verify database schema is properly applied

**You now have full multi-site management! 🚀**
