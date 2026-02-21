import { sql } from '@/lib/db';
import { withAuth, apiError } from '@/lib/api-utils';
import { NextRequest, NextResponse } from 'next/server';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;
const HCPCS_RE = /^[A-Za-z0-9]{4,5}$/;

function validateProcedures(procedures: any[]): string | null {
  for (const proc of procedures) {
    if (!proc.hcpcs || !HCPCS_RE.test(proc.hcpcs)) return 'Invalid HCPCS code format';
    if (!proc.description || typeof proc.description !== 'string') return 'Invalid procedure description';
    if (proc.work_rvu == null || typeof proc.work_rvu !== 'number') return 'Invalid work_rvu value';
    if (proc.quantity != null && (!Number.isInteger(proc.quantity) || proc.quantity < 1 || proc.quantity > 1000)) {
      return 'Quantity must be an integer between 1 and 1000';
    }
  }
  return null;
}

export const POST = withAuth(async (req: NextRequest, userId: string) => {
  const { date, time, notes, procedures, is_no_show } = await req.json();

  if (!date || !DATE_RE.test(date)) {
    return apiError('Invalid or missing date (YYYY-MM-DD)', 400);
  }

  if (time && !TIME_RE.test(time)) {
    return apiError('Invalid time format (HH:MM or HH:MM:SS)', 400);
  }

  if (!is_no_show && (!procedures || !Array.isArray(procedures) || procedures.length === 0)) {
    return apiError('Missing required fields', 400);
  }

  if (procedures && Array.isArray(procedures) && procedures.length > 0) {
    const procError = validateProcedures(procedures);
    if (procError) return apiError(procError, 400);
  }

  try {
    const visitResult = await sql`
      INSERT INTO visits (user_id, date, time, notes, is_no_show)
      VALUES (${userId}, ${date}, ${time || null}, ${notes || null}, ${is_no_show || false})
      RETURNING *;
    `;

    const visitId = visitResult.rows[0].id;

    const procedureResults = [];
    if (procedures && Array.isArray(procedures) && procedures.length > 0) {
      for (const proc of procedures) {
        const procResult = await sql`
          INSERT INTO visit_procedures (visit_id, hcpcs, description, status_code, work_rvu, quantity)
          VALUES (${visitId}, ${proc.hcpcs}, ${proc.description}, ${proc.status_code}, ${proc.work_rvu}, ${proc.quantity || 1})
          RETURNING *;
        `;
        procedureResults.push(procResult.rows[0]);
      }
    }

    const result = {
      ...visitResult.rows[0],
      procedures: procedureResults
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Failed to create visit:', error);
    return apiError('Failed to create visit', 500);
  }
});

export const GET = withAuth(async (_req: NextRequest, userId: string) => {
  try {
    const { rows: visits } = await sql`
      SELECT * FROM visits
      WHERE user_id = ${userId}
      ORDER BY created_at DESC;
    `;

    if (visits.length === 0) {
      return NextResponse.json([]);
    }

    const visitIds = visits.map(v => Number(v.id));
    const visitIdArray = `{${visitIds.join(',')}}`;
    const { rows: procedures } = await sql`
      SELECT * FROM visit_procedures
      WHERE visit_id = ANY(${visitIdArray}::int[])
      ORDER BY id;
    `;

    const visitsWithProcedures = visits.map(visit => ({
      ...visit,
      procedures: procedures.filter(p => p.visit_id === visit.id)
    }));

    return NextResponse.json(visitsWithProcedures);
  } catch (error) {
    console.error('Failed to fetch visits:', error);
    return apiError('Failed to fetch visits', 500);
  }
});
