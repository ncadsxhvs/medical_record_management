import { sql } from '@/lib/db';
import { withAuth, apiError } from '@/lib/api-utils';
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

interface VisitRow {
  date: string;
  time: string;
  hcpcs: string;
  description: string;
  work_rvu: number;
  quantity: number;
  total_rvu: number;
  notes: string;
  is_no_show: boolean;
}

export const GET = withAuth(async (req: NextRequest, userId: string) => {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!start || !end) {
    return apiError('Missing start and end parameters', 400);
  }

  try {
    const { rows } = await sql`
      SELECT
        v.date::text as date,
        COALESCE(v.time::text, '') as time,
        COALESCE(vp.hcpcs, '') as hcpcs,
        COALESCE(vp.description, '') as description,
        COALESCE(vp.work_rvu, 0) as work_rvu,
        COALESCE(vp.quantity, 1) as quantity,
        COALESCE(vp.work_rvu * COALESCE(vp.quantity, 1), 0) as total_rvu,
        COALESCE(v.notes, '') as notes,
        v.is_no_show
      FROM visits v
      LEFT JOIN visit_procedures vp ON v.id = vp.visit_id
      WHERE v.user_id = ${userId}
        AND v.date >= ${start}::date
        AND v.date <= ${end}::date
      ORDER BY v.date DESC, v.time DESC;
    `;

    const allRows = rows as VisitRow[];

    const dailyMap = new Map<string, { date: string; visits: number; rvu: number; no_shows: number }>();
    const weeklyMap = new Map<string, { week: string; start_date: string; visits: number; rvu: number; no_shows: number }>();
    const monthlyMap = new Map<string, { month: string; visits: number; rvu: number; no_shows: number }>();
    const annualMap = new Map<string, { year: string; visits: number; rvu: number; no_shows: number }>();

    const visitDates = new Set<string>();
    const noShowDates = new Set<string>();

    for (const row of allRows) {
      const d = row.date;
      const month = d.substring(0, 7);
      const year = d.substring(0, 4);

      const dateObj = new Date(d + 'T00:00:00');
      const dayOfWeek = dateObj.getDay();
      const weekStart = new Date(dateObj);
      weekStart.setDate(dateObj.getDate() - dayOfWeek);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!dailyMap.has(d)) dailyMap.set(d, { date: d, visits: 0, rvu: 0, no_shows: 0 });
      if (!weeklyMap.has(weekKey)) weeklyMap.set(weekKey, { week: weekKey, start_date: weekKey, visits: 0, rvu: 0, no_shows: 0 });
      if (!monthlyMap.has(month)) monthlyMap.set(month, { month, visits: 0, rvu: 0, no_shows: 0 });
      if (!annualMap.has(year)) annualMap.set(year, { year, visits: 0, rvu: 0, no_shows: 0 });

      const daily = dailyMap.get(d)!;
      const weekly = weeklyMap.get(weekKey)!;
      const monthly = monthlyMap.get(month)!;
      const annual = annualMap.get(year)!;

      if (row.is_no_show) {
        if (!noShowDates.has(`${d}-${row.time}`)) {
          noShowDates.add(`${d}-${row.time}`);
          daily.no_shows++;
          weekly.no_shows++;
          monthly.no_shows++;
          annual.no_shows++;
        }
      } else {
        const visitKey = `${d}-${row.time}`;
        if (!visitDates.has(visitKey)) {
          visitDates.add(visitKey);
          daily.visits++;
          weekly.visits++;
          monthly.visits++;
          annual.visits++;
        }
        const rvu = Number(row.total_rvu) || 0;
        daily.rvu += rvu;
        weekly.rvu += rvu;
        monthly.rvu += rvu;
        annual.rvu += rvu;
      }
    }

    const round = (n: number) => Math.round(n * 100) / 100;

    const dailySheet = [...dailyMap.values()]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(r => ({ Date: r.date, Visits: r.visits, 'Total RVU': round(r.rvu), 'No Shows': r.no_shows }));

    const weeklySheet = [...weeklyMap.values()]
      .sort((a, b) => b.week.localeCompare(a.week))
      .map(r => ({ 'Week Starting': r.start_date, Visits: r.visits, 'Total RVU': round(r.rvu), 'No Shows': r.no_shows }));

    const monthlySheet = [...monthlyMap.values()]
      .sort((a, b) => b.month.localeCompare(a.month))
      .map(r => ({ Month: r.month, Visits: r.visits, 'Total RVU': round(r.rvu), 'No Shows': r.no_shows }));

    const annualSheet = [...annualMap.values()]
      .sort((a, b) => b.year.localeCompare(a.year))
      .map(r => ({ Year: r.year, Visits: r.visits, 'Total RVU': round(r.rvu), 'No Shows': r.no_shows }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dailySheet), 'Daily');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(weeklySheet), 'Weekly');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(monthlySheet), 'Monthly');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(annualSheet), 'Annual');

    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="rvu-export-${start}-to-${end}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Failed to export data:', error);
    return apiError('Failed to export data', 500);
  }
});
