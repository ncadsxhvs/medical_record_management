import { sql } from '@/lib/db';
import { withAuth, apiError } from '@/lib/api-utils';
import { NextRequest, NextResponse } from 'next/server';

export const DELETE = withAuth(async (
  _req: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  try {
    const result = await sql`
      DELETE FROM custom_codes
      WHERE id = ${parseInt(id, 10)} AND user_id = ${userId}
      RETURNING *;
    `;

    if (result.rows.length === 0) {
      return apiError('Custom code not found', 404);
    }

    return NextResponse.json({ message: 'Custom code deleted' });
  } catch (error) {
    console.error('Failed to delete custom code:', error);
    return apiError('Failed to delete custom code', 500);
  }
});
