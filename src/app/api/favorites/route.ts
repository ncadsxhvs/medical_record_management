import { sql } from '@/lib/db';
import { getUserId } from '@/lib/mobile-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { rows } = await sql`
      SELECT * FROM favorites
      WHERE user_id = ${userId}
      ORDER BY sort_order ASC, created_at ASC;
    `;
    console.log(`[Favorites API] GET - userId: ${userId}, count: ${rows.length}, data:`, JSON.stringify(rows));
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Failed to fetch favorites:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { hcpcs } = await req.json();

  if (!hcpcs) {
    return NextResponse.json({ error: 'Missing required field: hcpcs' }, { status: 400 });
  }

  try {
    // Get max sort_order for this user
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
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { favorites } = await req.json();

  if (!Array.isArray(favorites)) {
    return NextResponse.json({ error: 'Invalid request: favorites must be an array' }, { status: 400 });
  }

  try {
    // Update sort_order for each favorite
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
    return NextResponse.json({ error: 'Failed to reorder favorites' }, { status: 500 });
  }
}
