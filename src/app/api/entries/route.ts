import { sql } from '@/lib/db';
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id || session?.user?.email;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { hcpcs, description, status_code, work_rvu, date } = await req.json();

  if (!hcpcs || !description || !work_rvu || !date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const result = await sql`
      INSERT INTO entries (user_id, hcpcs, description, status_code, work_rvu, date)
      VALUES (${userId}, ${hcpcs}, ${description}, ${status_code}, ${work_rvu}, ${date})
      RETURNING *;
    `;
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create entry:', error);
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}

export async function GET(_req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id || session?.user?.email;

  if (!userId) {
    console.log('[Entries API] Unauthorized - no user ID or email');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { rows } = await sql`
      SELECT * FROM entries
      WHERE user_id = ${userId}
      ORDER BY date DESC;
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Failed to fetch entries:', error);
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }
}
