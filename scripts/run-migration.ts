import { sql } from '@vercel/postgres';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function runMigration() {
  console.log('Starting database migration...');

  try {
    // Read SQL file
    const sqlPath = path.join(process.cwd(), 'scripts', 'init-db.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    // Execute the entire SQL file as one transaction
    console.log('Executing SQL migration...');
    await sql.query(sqlContent);

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { runMigration };
