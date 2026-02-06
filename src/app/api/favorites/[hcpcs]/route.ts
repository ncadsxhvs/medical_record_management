import { sql } from '@/lib/db';
import { getUserId } from '@/lib/mobile-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ hcpcs: string }> }) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { hcpcs } = await params;

  try {
    const result = await sql`
      DELETE FROM favorites
      WHERE user_id = ${userId} AND hcpcs = ${hcpcs}
      RETURNING *;
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Favorite not found or user not authorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Favorite removed successfully' });
  } catch (error) {
    console.error('Failed to remove favorite:', error);
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
  }
}
