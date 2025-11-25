import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function checkUser() {
  const email = 'ncadsxhtest@gmail.com';

  try {
    const result = await sql`SELECT * FROM users WHERE email = ${email};`;
    console.log('User in database:', result.rows);
  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

checkUser();
