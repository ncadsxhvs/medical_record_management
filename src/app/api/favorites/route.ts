import { sql } from '@/lib/db';
import { withAuth, apiError } from '@/lib/api-utils';
import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_FAVORITES = ['99213', '99214', '99215', '99203', '99204'];

export const GET = withAuth(async (_req: NextRequest, userId: string) => {
  try {
    const { rows } = await sql`
      SELECT f.*, r.description, r.work_rvu
      FROM favorites f
      LEFT JOIN rvu_codes r ON f.hcpcs = r.hcpcs
      WHERE f.user_id = ${userId}
      ORDER BY f.sort_order ASC, f.created_at ASC;
    `;

    if (rows.length === 0) {
      for (let i = 0; i < DEFAULT_FAVORITES.length; i++) {
        await sql`
          INSERT INTO favorites (user_id, hcpcs, sort_order)
          VALUES (${userId}, ${DEFAULT_FAVORITES[i]}, ${i})
          ON CONFLICT (user_id, hcpcs) DO NOTHING;
        `;
      }
      const { rows: seeded } = await sql`
        SELECT f.*, r.description, r.work_rvu
        FROM favorites f
        LEFT JOIN rvu_codes r ON f.hcpcs = r.hcpcs
        WHERE f.user_id = ${userId}
        ORDER BY f.sort_order ASC, f.created_at ASC;
      `;
      return NextResponse.json(seeded);
    }

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
