import { sql } from '@vercel/postgres';

export { sql };

// Helper function to get user ID from session
export function getUserId(session: any): string {
  if (!session?.user?.email) {
    throw new Error('Unauthorized');
  }
  return session.user.email;
}
