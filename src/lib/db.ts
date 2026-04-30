import { sql as vercelSql } from '@vercel/postgres';
import { Pool } from 'pg';

const isLocalDb = (process.env.POSTGRES_URL || '').includes('localhost');

let localPool: Pool | null = null;
function getLocalPool(): Pool {
  if (!localPool) {
    localPool = new Pool({ connectionString: process.env.POSTGRES_URL });
  }
  return localPool;
}

function localSql(strings: TemplateStringsArray, ...values: unknown[]) {
  let text = '';
  strings.forEach((s, i) => {
    text += s;
    if (i < values.length) text += `$${i + 1}`;
  });
  return getLocalPool().query(text, values as unknown[]);
}

export const sql: typeof vercelSql = isLocalDb
  ? (localSql as unknown as typeof vercelSql)
  : vercelSql;

// Helper function to get user ID from session
export function getUserId(session: any): string {
  if (!session?.user?.email) {
    throw new Error('Unauthorized');
  }
  return session.user.email;
}
