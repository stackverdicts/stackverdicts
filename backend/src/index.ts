import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { logger } from './utils/logger';
import { schedulerService } from './services/scheduler';

// Import routes
import authRouter from './routes/auth';
import productsRouter from './routes/products';
import contentRouter from './routes/content';
import youtubeRouter from './routes/youtube';
import calendarRouter from './routes/calendar';
import landingPagesRouter from './routes/landing-pages';
import emailRouter from './routes/email';
import youtubeAnalyticsRouter from './routes/youtube-analytics';
import unifiedAnalyticsRouter from './routes/unified-analytics';
import abTestingRouter from './routes/ab-testing';
import bulkOperationsRouter from './routes/bulk-operations';
import settingsRouter from './routes/settings';
import cronJobsRouter from './routes/cron-jobs';
import networksRouter from './routes/networks';
import blogRouter from './routes/blog';
import mediaRouter from './routes/media';
import marketingPopupsRouter from './routes/marketing-popups';
import uploadRouter from './routes/upload';
import youtubeKeywordResearchRouter from './routes/youtube-keyword-research';
import youtubeScheduleRouter from './routes/youtube-schedule';
import postbackRouter from './routes/postback';
import conversionsRouter from './routes/conversions';

const app: Application = express();
const PORT = parseInt(env.PORT);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Too many requests from this IP, please try again later.',
    });
  },
});

// Apply rate limiting to API routes
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/content', contentRouter);
app.use('/api/youtube', youtubeRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/landing-pages', landingPagesRouter);
app.use('/api/email', emailRouter);
app.use('/api/youtube-analytics', youtubeAnalyticsRouter);
app.use('/api/unified-analytics', unifiedAnalyticsRouter);
app.use('/api/ab-testing', abTestingRouter);
app.use('/api/bulk-operations', bulkOperationsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/cron-jobs', cronJobsRouter);
app.use('/api/networks', networksRouter);
app.use('/api/blog', blogRouter);
app.use('/api/media', mediaRouter);
app.use('/api/marketing-popups', marketingPopupsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/youtube-keyword-research', youtubeKeywordResearchRouter);
app.use('/api/youtube-schedule', youtubeScheduleRouter);
app.use('/api/postback', postbackRouter);
app.use('/api/conversions', conversionsRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'StackVerdicts API',
    version: '1.0.0',
    status: 'running',
    description: 'YouTube Affiliate Marketing for Developer Tools & Hosting',
    endpoints: {
      health: '/health',
      products: '/api/products',
      content: '/api/content',
      youtube: '/api/youtube',
      calendar: '/api/calendar',
      landingPages: '/api/landing-pages',
      email: '/api/email',
      youtubeAnalytics: '/api/youtube-analytics',
      unifiedAnalytics: '/api/unified-analytics',
      abTesting: '/api/ab-testing',
      bulkOperations: '/api/bulk-operations',
      settings: '/api/settings',
      cronJobs: '/api/cron-jobs',
      networks: '/api/networks',
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Express', 'Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: env.NODE_ENV === 'development' ? err.message : 'An error occurred',
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀  StackVerdicts API                                      ║
║   📺  YouTube Affiliate Marketing for Dev Tools & Hosting    ║
║                                                               ║
║   Environment: ${env.NODE_ENV.padEnd(44)}   ║
║   Port:        ${PORT.toString().padEnd(44)}   ║
║   URL:         http://localhost:${PORT}${' '.repeat(30)}   ║
║                                                               ║
║   📚  API Docs:  http://localhost:${PORT}/${' '.repeat(28)}   ║
║   💚  Health:    http://localhost:${PORT}/health${' '.repeat(23)}   ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);

  logger.info('Server', 'API server started', {
    port: PORT,
    environment: env.NODE_ENV,
  });

  // Start cron jobs
  schedulerService.start();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');

  schedulerService.stop();

  server.close(() => {
    console.log('HTTP server closed');
    logger.info('Server', 'Server shut down gracefully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');

  schedulerService.stop();

  server.close(() => {
    console.log('HTTP server closed');
    logger.info('Server', 'Server shut down gracefully');
    process.exit(0);
  });
});

export default app;
