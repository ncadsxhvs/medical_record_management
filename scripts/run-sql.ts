import { sql } from '@vercel/postgres';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

const envFile = process.argv[2] || '.env.development';
const sqlFile = process.argv[3] || 'scripts/add-constraints.sql';

dotenv.config({ path: path.join(process.cwd(), envFile) });

async function run() {
  console.log(`Running ${sqlFile} against ${envFile}...`);
  const content = fs.readFileSync(path.join(process.cwd(), sqlFile), 'utf-8');
  await sql.query(content);
  console.log('Done.');
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
