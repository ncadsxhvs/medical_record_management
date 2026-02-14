import { sql } from '@/lib/db';
import { withAuth, apiError } from '@/lib/api-utils';
import { NextRequest, NextResponse } from 'next/server';

const periodMap: Record<string, string> = {
  'daily': 'day',
  'weekly': 'week',
  'monthly': 'month',
  'yearly': 'year'
};

async function querySummary(userId: string, truncUnit: string, start: string, end: string) {
  if (truncUnit === 'day') {
    return sql`
      SELECT
        v.date::text as period_start,
        COALESCE(SUM(vp.work_rvu * COALESCE(vp.quantity, 1)), 0) as total_work_rvu,
        COUNT(DISTINCT CASE WHEN vp.id IS NOT NULL THEN v.id END) as total_encounters,
        COUNT(DISTINCT CASE WHEN v.is_no_show = true THEN v.id END) as total_no_shows
      FROM visits v
      LEFT JOIN visit_procedures vp ON v.id = vp.visit_id
      WHERE v.user_id = ${userId} AND v.date >= ${start} AND v.date <= ${end}
      GROUP BY v.date
      ORDER BY v.date
    `;
  }
  // For week/month/year, use DATE_TRUNC with validated unit
  const truncExpr = truncUnit as 'week' | 'month' | 'year';
  return sql.query(
    `SELECT
      DATE_TRUNC($1, v.date) as period_start,
      COALESCE(SUM(vp.work_rvu * COALESCE(vp.quantity, 1)), 0) as total_work_rvu,
      COUNT(DISTINCT CASE WHEN vp.id IS NOT NULL THEN v.id END) as total_encounters,
      COUNT(DISTINCT CASE WHEN v.is_no_show = true THEN v.id END) as total_no_shows
    FROM visits v
    LEFT JOIN visit_procedures vp ON v.id = vp.visit_id
    WHERE v.user_id = $2 AND v.date >= $3 AND v.date <= $4
    GROUP BY DATE_TRUNC($1, v.date)
    ORDER BY period_start`,
    [truncExpr, userId, start, end]
  );
}

async function queryBreakdown(userId: string, truncUnit: string, start: string, end: string) {
  if (truncUnit === 'day') {
    return sql`
      SELECT
        v.date::text as period_start,
        vp.hcpcs,
        vp.description,
        vp.status_code,
        SUM(vp.work_rvu * COALESCE(vp.quantity, 1)) as total_work_rvu,
        SUM(COALESCE(vp.quantity, 1)) as total_quantity,
        COUNT(*) as encounter_count
      FROM visits v
      JOIN visit_procedures vp ON v.id = vp.visit_id
      WHERE v.user_id = ${userId} AND v.date >= ${start} AND v.date <= ${end}
      GROUP BY v.date, vp.hcpcs, vp.description, vp.status_code
      ORDER BY v.date DESC, total_work_rvu DESC
    `;
  }
  const truncExpr = truncUnit as 'week' | 'month' | 'year';
  return sql.query(
    `SELECT
      DATE_TRUNC($1, v.date) as period_start,
      vp.hcpcs,
      vp.description,
      vp.status_code,
      SUM(vp.work_rvu * COALESCE(vp.quantity, 1)) as total_work_rvu,
      SUM(COALESCE(vp.quantity, 1)) as total_quantity,
      COUNT(*) as encounter_count
    FROM visits v
    JOIN visit_procedures vp ON v.id = vp.visit_id
    WHERE v.user_id = $2 AND v.date >= $3 AND v.date <= $4
    GROUP BY DATE_TRUNC($1, v.date), vp.hcpcs, vp.description, vp.status_code
    ORDER BY period_start DESC, total_work_rvu DESC`,
    [truncExpr, userId, start, end]
  );
}

export const GET = withAuth(async (req: NextRequest, userId: string) => {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'day';
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const groupBy = searchParams.get('groupBy');

  if (!start || !end) {
    return apiError('Missing required query parameters: start and end', 400);
  }

  const truncUnit = periodMap[period] || period;

  try {
    const result = groupBy === 'hcpcs'
      ? await queryBreakdown(userId, truncUnit, start, end)
      : await querySummary(userId, truncUnit, start, end);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return apiError('Failed to fetch analytics', 500);
  }
});
