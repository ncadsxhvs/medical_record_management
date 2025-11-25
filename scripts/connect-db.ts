import { sql } from '@vercel/postgres';

// WARNING: Hardcoding sensitive information like database URLs directly in code
// is generally a bad security practice. Use environment variables instead.
process.env.POSTGRES_URL = "YOUR_HARDCODED_NEON_POSTGRES_URL"; // Replace with your actual URL

async function connectToDb() {
  try {
    console.log('Attempting to connect to Neon Postgres database...');
    // Execute a simple query to test the connection
    const result = await sql`SELECT NOW();`;
    console.log('Successfully connected to the database!');
    console.log('Current database time:', result.rows[0].now);
  } catch (error) {
    console.error('Failed to connect to the database:', error);
  }
}

connectToDb();
