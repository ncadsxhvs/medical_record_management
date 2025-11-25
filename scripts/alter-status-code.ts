import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function alterStatusCodeColumn() {
  console.log('Altering status_code column...');

  try {
    await sql.query(`
      ALTER TABLE rvu_codes ALTER COLUMN status_code TYPE VARCHAR(50);
      ALTER TABLE entries ALTER COLUMN status_code TYPE VARCHAR(50);
    `);
    console.log('✅ Successfully altered status_code columns!');
  } catch (error) {
    console.error('❌ Error altering columns:', error);
    throw error;
  }
}

alterStatusCodeColumn()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
