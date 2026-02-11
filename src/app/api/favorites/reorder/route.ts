import { sql } from '@/lib/db';
import { getUserId } from '@/lib/mobile-auth';
import { NextRequest, NextResponse } from 'next/server';

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
    for (let i = 0; i < favorites.length; i++) {
      const sortOrder = favorites[i].sort_order ?? i;
      await sql`
        UPDATE favorites
        SET sort_order = ${sortOrder}
        WHERE user_id = ${userId} AND hcpcs = ${favorites[i].hcpcs}
      `;
    }

    return NextResponse.json({ message: 'Favorites reordered successfully' });
  } catch (error) {
    console.error('Failed to reorder favorites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
