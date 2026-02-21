import { sql } from '@/lib/db';
import { withAuth, apiError } from '@/lib/api-utils';
import { NextRequest, NextResponse } from 'next/server';

export const DELETE = withAuth(async (_req: NextRequest, userId: string) => {
  try {
    // Delete in order: visit_procedures -> visits -> favorites -> user
    await sql`
      DELETE FROM visit_procedures
      WHERE visit_id IN (SELECT id FROM visits WHERE user_id = ${userId})
    `;
    await sql`DELETE FROM visits WHERE user_id = ${userId}`;
    await sql`DELETE FROM favorites WHERE user_id = ${userId}`;
    await sql`DELETE FROM users WHERE id = ${userId}`;

    return NextResponse.json({ success: true, message: 'Account and all data deleted' });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return apiError('Failed to delete account', 500);
  }
});
