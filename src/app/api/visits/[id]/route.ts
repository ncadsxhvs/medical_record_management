import { sql } from '@/lib/db';
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id || session?.user?.email;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { date, time, notes, procedures } = await req.json();

  // Validation
  if (!date || !procedures || !Array.isArray(procedures) || procedures.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // Update visit
    const visitResult = await sql`
      UPDATE visits
      SET date = ${date}, time = ${time || null}, notes = ${notes || null}
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *;
    `;

    if (visitResult.rows.length === 0) {
      return NextResponse.json({ error: 'Visit not found or unauthorized' }, { status: 404 });
    }

    // Delete existing procedures
    await sql`DELETE FROM visit_procedures WHERE visit_id = ${id}`;

    // Insert new procedures
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
    return NextResponse.json({ error: 'Failed to update visit' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id || session?.user?.email;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // CASCADE delete will automatically remove procedures
    const result = await sql`
      DELETE FROM visits
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *;
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Visit not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Visit deleted successfully' });
  } catch (error) {
    console.error('Failed to delete visit:', error);
    return NextResponse.json({ error: 'Failed to delete visit' }, { status: 500 });
  }
}
