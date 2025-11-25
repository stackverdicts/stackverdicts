import { testConnection } from '../config/database';
import * as youtubescripts from '../migrations/001_youtube_scripts';
import * as contentcalendar from '../migrations/002_content_calendar';
import * as landingpages from '../migrations/003_landing_pages';
import * as emailmarketing from '../migrations/004_email_marketing';
import * as youtubeanalytics from '../migrations/005_youtube_analytics';
import * as abtesting from '../migrations/006_ab_testing';
import * as settings from '../migrations/007_settings';
import * as cronjobs from '../migrations/008_cron_jobs';

async function runMigrations() {
  console.log('🚀 Running database migrations...\n');

  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Database connection failed. Cannot run migrations.');
    process.exit(1);
  }

  try {
    // Run migrations
    await youtubescripts.up();
    await contentcalendar.up();
    await landingpages.up();
    await emailmarketing.up();
    await youtubeanalytics.up();
    await abtesting.up();
    await settings.up();
    await cronjobs.up();

    console.log('\n✅ All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
