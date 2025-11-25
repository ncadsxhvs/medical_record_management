import { sql } from '@/lib/db';
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'daily';
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!start || !end) {
    return NextResponse.json({ error: 'Missing required query parameters: start and end' }, { status: 400 });
  }

  try {
    const { rows } = await sql`
      SELECT
        DATE_TRUNC(${period}, date) as period_start,
        SUM(work_rvu) as total_work_rvu,
        COUNT(*) as total_entries
      FROM entries
      WHERE user_id = ${session.user.id} AND date >= ${start} AND date <= ${end}
      GROUP BY period_start
      ORDER BY period_start;
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
