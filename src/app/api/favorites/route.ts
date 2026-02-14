import { sql } from '@/lib/db';
import { withAuth, apiError } from '@/lib/api-utils';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withAuth(async (_req: NextRequest, userId: string) => {
  try {
    const { rows } = await sql`
      SELECT * FROM favorites
      WHERE user_id = ${userId}
      ORDER BY sort_order ASC, created_at ASC;
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Failed to fetch favorites:', error);
    return apiError('Failed to fetch favorites', 500);
  }
});

export const POST = withAuth(async (req: NextRequest, userId: string) => {
  const { hcpcs } = await req.json();

  if (!hcpcs) {
    return apiError('Missing required field: hcpcs', 400);
  }

  try {
    const maxOrder = await sql`
      SELECT COALESCE(MAX(sort_order), -1) as max_order
      FROM favorites
      WHERE user_id = ${userId}
    `;
    const nextOrder = (maxOrder.rows[0]?.max_order || 0) + 1;

    const result = await sql`
      INSERT INTO favorites (user_id, hcpcs, sort_order)
      VALUES (${userId}, ${hcpcs}, ${nextOrder})
      ON CONFLICT (user_id, hcpcs) DO NOTHING
      RETURNING *;
    `;
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Failed to add favorite:', error);
    return apiError('Failed to add favorite', 500);
  }
});

export const PATCH = withAuth(async (req: NextRequest, userId: string) => {
  const { favorites } = await req.json();

  if (!Array.isArray(favorites)) {
    return apiError('Invalid request: favorites must be an array', 400);
  }

  try {
    for (let i = 0; i < favorites.length; i++) {
      await sql`
        UPDATE favorites
        SET sort_order = ${i}
        WHERE user_id = ${userId} AND hcpcs = ${favorites[i].hcpcs}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to reorder favorites:', error);
    return apiError('Failed to reorder favorites', 500);
  }
});
