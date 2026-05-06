import { sql } from '@/lib/db';
import { withAuth, apiError } from '@/lib/api-utils';
import { NextRequest, NextResponse } from 'next/server';

export const DELETE = withAuth(async (_req: NextRequest, userId: string) => {
  try {
    // FK CASCADE handles visits, favorites, favorite_groups, custom_codes, user_settings
    await sql`DELETE FROM users WHERE id = ${userId}`;

    return NextResponse.json({ success: true, message: 'Account and all data deleted' });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return apiError('Failed to delete account', 500);
  }
});
