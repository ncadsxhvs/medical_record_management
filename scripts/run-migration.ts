import { sql } from '@vercel/postgres';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  console.log('Starting database migration...');

  try {
    // Read SQL file
    const sqlPath = path.join(process.cwd(), 'scripts', 'init-db.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    // Split by semicolon and execute each statement
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      await sql.query(statement);
    }

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
