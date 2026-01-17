import { sql } from '@/lib/db';
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'day';
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const groupBy = searchParams.get('groupBy'); // 'hcpcs' or null

  if (!start || !end) {
    return NextResponse.json({ error: 'Missing required query parameters: start and end' }, { status: 400 });
  }

  // Map frontend period names to PostgreSQL DATE_TRUNC units
  const periodMap: Record<string, string> = {
    'daily': 'day',
    'weekly': 'week',
    'monthly': 'month',
    'yearly': 'year'
  };

  const truncUnit = periodMap[period] || period;

  try {
    if (groupBy === 'hcpcs') {
      // Return data grouped by both period and HCPCS
      let result;
      if (truncUnit === 'day') {
        result = await sql`
          SELECT
            v.date as period_start,
            vp.hcpcs,
            vp.description,
            vp.status_code,
            SUM(vp.work_rvu * COALESCE(vp.quantity, 1)) as total_work_rvu,
            SUM(COALESCE(vp.quantity, 1)) as total_quantity,
            COUNT(*) as encounter_count
          FROM visits v
          JOIN visit_procedures vp ON v.id = vp.visit_id
          WHERE v.user_id = ${session.user.id} AND v.date >= ${start} AND v.date <= ${end}
          GROUP BY v.date, vp.hcpcs, vp.description, vp.status_code
          ORDER BY period_start DESC, total_work_rvu DESC
        `;
      } else if (truncUnit === 'week') {
        result = await sql`
          SELECT
            DATE_TRUNC('week', v.date) as period_start,
            vp.hcpcs,
            vp.description,
            vp.status_code,
            SUM(vp.work_rvu * COALESCE(vp.quantity, 1)) as total_work_rvu,
            SUM(COALESCE(vp.quantity, 1)) as total_quantity,
            COUNT(*) as encounter_count
          FROM visits v
          JOIN visit_procedures vp ON v.id = vp.visit_id
          WHERE v.user_id = ${session.user.id} AND v.date >= ${start} AND v.date <= ${end}
          GROUP BY DATE_TRUNC('week', v.date), vp.hcpcs, vp.description, vp.status_code
          ORDER BY period_start DESC, total_work_rvu DESC
        `;
      } else if (truncUnit === 'month') {
        result = await sql`
          SELECT
            DATE_TRUNC('month', v.date) as period_start,
            vp.hcpcs,
            vp.description,
            vp.status_code,
            SUM(vp.work_rvu * COALESCE(vp.quantity, 1)) as total_work_rvu,
            SUM(COALESCE(vp.quantity, 1)) as total_quantity,
            COUNT(*) as encounter_count
          FROM visits v
          JOIN visit_procedures vp ON v.id = vp.visit_id
          WHERE v.user_id = ${session.user.id} AND v.date >= ${start} AND v.date <= ${end}
          GROUP BY DATE_TRUNC('month', v.date), vp.hcpcs, vp.description, vp.status_code
          ORDER BY period_start DESC, total_work_rvu DESC
        `;
      } else {
        result = await sql`
          SELECT
            DATE_TRUNC('year', v.date) as period_start,
            vp.hcpcs,
            vp.description,
            vp.status_code,
            SUM(vp.work_rvu * COALESCE(vp.quantity, 1)) as total_work_rvu,
            SUM(COALESCE(vp.quantity, 1)) as total_quantity,
            COUNT(*) as encounter_count
          FROM visits v
          JOIN visit_procedures vp ON v.id = vp.visit_id
          WHERE v.user_id = ${session.user.id} AND v.date >= ${start} AND v.date <= ${end}
          GROUP BY DATE_TRUNC('year', v.date), vp.hcpcs, vp.description, vp.status_code
          ORDER BY period_start DESC, total_work_rvu DESC
        `;
      }
      return NextResponse.json(result.rows);
    } else {
      // Return data grouped by period only (original behavior)
      let result;
      if (truncUnit === 'day') {
        result = await sql`
          SELECT
            v.date as period_start,
            COALESCE(SUM(vp.work_rvu * COALESCE(vp.quantity, 1)), 0) as total_work_rvu,
            COUNT(DISTINCT CASE WHEN vp.id IS NOT NULL THEN v.id END) as total_encounters,
            COUNT(DISTINCT CASE WHEN v.is_no_show = true THEN v.id END) as total_no_shows
          FROM visits v
          LEFT JOIN visit_procedures vp ON v.id = vp.visit_id
          WHERE v.user_id = ${session.user.id} AND v.date >= ${start} AND v.date <= ${end}
          GROUP BY v.date
          ORDER BY period_start
        `;
      } else if (truncUnit === 'week') {
        result = await sql`
          SELECT
            DATE_TRUNC('week', v.date) as period_start,
            COALESCE(SUM(vp.work_rvu * COALESCE(vp.quantity, 1)), 0) as total_work_rvu,
            COUNT(DISTINCT CASE WHEN vp.id IS NOT NULL THEN v.id END) as total_encounters,
            COUNT(DISTINCT CASE WHEN v.is_no_show = true THEN v.id END) as total_no_shows
          FROM visits v
          LEFT JOIN visit_procedures vp ON v.id = vp.visit_id
          WHERE v.user_id = ${session.user.id} AND v.date >= ${start} AND v.date <= ${end}
          GROUP BY DATE_TRUNC('week', v.date)
          ORDER BY period_start
        `;
      } else if (truncUnit === 'month') {
        result = await sql`
          SELECT
            DATE_TRUNC('month', v.date) as period_start,
            COALESCE(SUM(vp.work_rvu * COALESCE(vp.quantity, 1)), 0) as total_work_rvu,
            COUNT(DISTINCT CASE WHEN vp.id IS NOT NULL THEN v.id END) as total_encounters,
            COUNT(DISTINCT CASE WHEN v.is_no_show = true THEN v.id END) as total_no_shows
          FROM visits v
          LEFT JOIN visit_procedures vp ON v.id = vp.visit_id
          WHERE v.user_id = ${session.user.id} AND v.date >= ${start} AND v.date <= ${end}
          GROUP BY DATE_TRUNC('month', v.date)
          ORDER BY period_start
        `;
      } else {
        result = await sql`
          SELECT
            DATE_TRUNC('year', v.date) as period_start,
            COALESCE(SUM(vp.work_rvu * COALESCE(vp.quantity, 1)), 0) as total_work_rvu,
            COUNT(DISTINCT CASE WHEN vp.id IS NOT NULL THEN v.id END) as total_encounters,
            COUNT(DISTINCT CASE WHEN v.is_no_show = true THEN v.id END) as total_no_shows
          FROM visits v
          LEFT JOIN visit_procedures vp ON v.id = vp.visit_id
          WHERE v.user_id = ${session.user.id} AND v.date >= ${start} AND v.date <= ${end}
          GROUP BY DATE_TRUNC('year', v.date)
          ORDER BY period_start
        `;
      }
      return NextResponse.json(result.rows);
    }
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
