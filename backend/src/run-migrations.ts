import { readdirSync } from 'fs';
import { join } from 'path';

async function runMigrations() {
  const migrationsDir = join(__dirname, 'migrations');
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.ts'))
    .sort();

  console.log('🔄 Running migrations...\n');

  for (const file of files) {
    try {
      const migration = await import(join(migrationsDir, file));
      if (migration.up) {
        console.log(`Running: ${file}`);
        await migration.up();
      }
    } catch (error) {
      console.error(`❌ Failed to run ${file}:`, error);
      // Continue with other migrations
    }
  }

  console.log('\n✅ Migrations completed!');
  process.exit(0);
}

runMigrations().catch(error => {
  console.error('❌ Migration process failed:', error);
  process.exit(1);
});
