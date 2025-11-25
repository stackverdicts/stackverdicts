# StackVerdicts

YouTube Affiliate Marketing Platform for Developer Tools & Hosting

## Overview

StackVerdicts is a comprehensive content creation and analytics platform designed for YouTube-based affiliate marketing focused on developer tools and hosting services. The system helps you plan, create, publish, and optimize video content while tracking performance across multiple channels.

## Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Database**: MySQL (MAMP local development)
- **Frontend**: Next.js 14 + React + TypeScript + Tailwind CSS
- **AI**: Anthropic Claude API
- **Email**: Resend
- **Scheduling**: Node-cron

## Project Structure

```
├── backend/           # Express API server
│   ├── src/
│   │   ├── routes/    # API endpoints
│   │   ├── services/  # Business logic
│   │   ├── models/    # TypeScript types
│   │   └── config/    # Configuration
├── frontend/          # Next.js application
│   ├── app/           # Next.js 14 app router
│   │   └── dashboard/ # Dashboard pages
│   └── components/    # React components
└── database/          # SQL schemas
```

## Key Features

### Content Creation
- **AI Content Generator**: Generate video scripts and landing pages using Claude AI
- **YouTube Calendar**: Plan and schedule your content releases
- **Landing Pages**: Create and manage product landing pages
- **Email Marketing**: Build campaigns and automated sequences

### Analytics & Reporting
- **YouTube Analytics**: Track video performance metrics
- **A/B Testing**: Optimize thumbnails, titles, and descriptions
- **Unified Analytics**: Complete overview of all marketing channels
- **Affiliate Networks**: Manage and track multiple affiliate programs

### Operations
- **Bulk Operations**: Manage content at scale
- **Cron Jobs**: Automated scheduled tasks
- **Multi-Site Support**: Manage multiple branded sites
- **Settings Management**: Centralized configuration

## Setup Instructions

### Prerequisites
- Node.js 18+
- MAMP (for local MySQL)
- Anthropic API key (for AI content generation)

### Environment Variables

**Backend (.env)**
```
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=8889
DATABASE_USER=root
DATABASE_PASSWORD=root
DATABASE_NAME=automated_affiliate_hub

# API Keys
ANTHROPIC_API_KEY=your_anthropic_key
RESEND_API_KEY=your_resend_key
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Installation

1. **Start MAMP and create database:**
   - Open MAMP and start servers
   - Create database named `automated_affiliate_hub`
   - Import schema from `database/schema.sql`

2. **Install backend dependencies:**
```bash
cd backend
npm install
```

3. **Install frontend dependencies:**
```bash
cd frontend
npm install
```

4. **Start development servers:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Health Check: http://localhost:3001/health

## API Endpoints

### Core Services
- `GET /health` - Health check
- `GET /` - API documentation

### Content & Creation
- `/api/sites` - Manage tracked sites
- `/api/content` - AI content generation
- `/api/youtube` - YouTube video management
- `/api/calendar` - Content calendar
- `/api/landing-pages` - Landing page management
- `/api/email` - Email campaigns and sequences

### Analytics & Optimization
- `/api/youtube-analytics` - YouTube metrics
- `/api/unified-analytics` - Cross-channel analytics
- `/api/ab-testing` - A/B test management
- `/api/networks` - Affiliate network management

### Operations
- `/api/bulk-operations` - Batch operations
- `/api/cron-jobs` - Scheduled task management
- `/api/settings` - System configuration

## Database Schema

Key tables:
- `sites` - Tracked websites/brands
- `youtube_videos` - Video content and metadata
- `landing_pages` - Product landing pages
- `email_subscribers` - Email list management
- `email_sequences` - Automated email campaigns
- `ab_tests` - A/B test configurations
- `affiliate_networks` - Network tracking
- `cron_jobs` - Scheduled tasks
- `system_logs` - System activity logs

## Development Workflow

1. **Plan Content**: Use YouTube Calendar to plan upcoming videos
2. **Generate Content**: Use AI Content Generator to create scripts and pages
3. **Create Landing Pages**: Build product-specific landing pages
4. **Publish Video**: Upload to YouTube and track in the system
5. **Monitor Performance**: Check YouTube Analytics dashboard
6. **Optimize**: Run A/B tests on thumbnails and titles
7. **Email Marketing**: Follow up with email sequences

## Project Status

**Active Development**

Current focus:
- YouTube-first content strategy
- Developer tools and hosting niche
- AI-powered content generation
- Multi-site management

## License

MIT
