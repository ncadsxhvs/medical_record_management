import { sql } from '@/lib/db';
import { withAuth, apiError } from '@/lib/api-utils';
import { NextRequest, NextResponse } from 'next/server';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;
const HCPCS_RE = /^[A-Za-z0-9]{4,5}$/;

function validateId(id: string): number | null {
  const n = parseInt(id, 10);
  return !isNaN(n) && n > 0 ? n : null;
}

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

export const PUT = withAuth(async (
  req: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const numericId = validateId(id);
  if (!numericId) return apiError('Invalid visit ID', 400);

  const { date, time, notes, procedures } = await req.json();

  if (!date || !DATE_RE.test(date)) {
    return apiError('Invalid or missing date (YYYY-MM-DD)', 400);
  }

  if (time && !TIME_RE.test(time)) {
    return apiError('Invalid time format (HH:MM or HH:MM:SS)', 400);
  }

  if (!procedures || !Array.isArray(procedures) || procedures.length === 0) {
    return apiError('Missing required fields', 400);
  }

  const procError = validateProcedures(procedures);
  if (procError) return apiError(procError, 400);

  try {
    const visitResult = await sql`
      UPDATE visits
      SET date = ${date}, time = ${time || null}, notes = ${notes || null}
      WHERE id = ${numericId} AND user_id = ${userId}
      RETURNING *;
    `;

    if (visitResult.rows.length === 0) {
      return apiError('Visit not found or unauthorized', 404);
    }

    await sql`DELETE FROM visit_procedures WHERE visit_id = ${numericId}`;

    const procedureResults = [];
    for (const proc of procedures) {
      const procResult = await sql`
        INSERT INTO visit_procedures (visit_id, hcpcs, description, status_code, work_rvu, quantity)
        VALUES (${numericId}, ${proc.hcpcs}, ${proc.description}, ${proc.status_code}, ${proc.work_rvu}, ${proc.quantity || 1})
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
  const numericId = validateId(id);
  if (!numericId) return apiError('Invalid visit ID', 400);

  try {
    const result = await sql`
      DELETE FROM visits
      WHERE id = ${numericId} AND user_id = ${userId}
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
