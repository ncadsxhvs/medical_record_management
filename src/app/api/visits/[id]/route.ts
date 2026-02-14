import { sql } from '@/lib/db';
import { withAuth, apiError } from '@/lib/api-utils';
import { NextRequest, NextResponse } from 'next/server';

export const PUT = withAuth(async (
  req: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const { date, time, notes, procedures } = await req.json();

  if (!date || !procedures || !Array.isArray(procedures) || procedures.length === 0) {
    return apiError('Missing required fields', 400);
  }

  try {
    const visitResult = await sql`
      UPDATE visits
      SET date = ${date}, time = ${time || null}, notes = ${notes || null}
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *;
    `;

    if (visitResult.rows.length === 0) {
      return apiError('Visit not found or unauthorized', 404);
    }

    await sql`DELETE FROM visit_procedures WHERE visit_id = ${id}`;

    const procedureResults = [];
    for (const proc of procedures) {
      const procResult = await sql`
        INSERT INTO visit_procedures (visit_id, hcpcs, description, status_code, work_rvu, quantity)
        VALUES (${id}, ${proc.hcpcs}, ${proc.description}, ${proc.status_code}, ${proc.work_rvu}, ${proc.quantity || 1})
        RETURNING *;
      `;
      procedureResults.push(procResult.rows[0]);
    }

    const result = {
      ...visitResult.rows[0],
      procedures: procedureResults
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to update visit:', error);
    return apiError('Failed to update visit', 500);
  }
});

export const DELETE = withAuth(async (
  _req: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  try {
    const result = await sql`
      DELETE FROM visits
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *;
    `;

    if (result.rows.length === 0) {
      return apiError('Visit not found or unauthorized', 404);
    }

    return NextResponse.json({ message: 'Visit deleted successfully' });
  } catch (error) {
    console.error('Failed to delete visit:', error);
    return apiError('Failed to delete visit', 500);
  }
});
