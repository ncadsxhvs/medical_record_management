import { sql } from '@/lib/db';
import { withAuth, apiError } from '@/lib/api-utils';
import { NextRequest, NextResponse } from 'next/server';

export const DELETE = withAuth(async (
  _req: NextRequest,
  userId: string,
  { params }: { params: Promise<{ hcpcs: string }> }
) => {
  const { hcpcs } = await params;

  try {
    const result = await sql`
      DELETE FROM favorites
      WHERE user_id = ${userId} AND hcpcs = ${hcpcs}
      RETURNING *;
    `;

    if (result.rows.length === 0) {
      return apiError('Favorite not found or user not authorized', 404);
    }

    return NextResponse.json({ message: 'Favorite removed successfully' });
  } catch (error) {
    console.error('Failed to remove favorite:', error);
    return apiError('Failed to remove favorite', 500);
  }
});
