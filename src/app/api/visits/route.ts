import { sql } from '@/lib/db';
import { getUserId } from '@/lib/mobile-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { date, time, notes, procedures, is_no_show } = await req.json();

  // Validation
  if (!date) {
    return NextResponse.json({ error: 'Date is required' }, { status: 400 });
  }

  // Allow empty procedures only if is_no_show is true
  if (!is_no_show && (!procedures || !Array.isArray(procedures) || procedures.length === 0)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // Insert visit with is_no_show flag and time
    const visitResult = await sql`
      INSERT INTO visits (user_id, date, time, notes, is_no_show)
      VALUES (${userId}, ${date}, ${time || null}, ${notes || null}, ${is_no_show || false})
      RETURNING *;
    `;

    const visitId = visitResult.rows[0].id;

    // Insert all procedures (skip for no-shows)
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
    return NextResponse.json({ error: 'Failed to create visit' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);

  if (!userId) {
    console.log('[Visits API] Unauthorized - no user ID or email');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch all visits for the user
    const { rows: visits } = await sql`
      SELECT * FROM visits
      WHERE user_id = ${userId}
      ORDER BY created_at DESC;
    `;

    // If no visits, return empty array
    if (visits.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch procedures for all visits
    // Build a Postgres int[] literal for ANY() while keeping parameters sanitized
    const visitIds = visits.map(v => Number(v.id));
    const visitIdArray = `{${visitIds.join(',')}}`;
    const { rows: procedures } = await sql`
      SELECT * FROM visit_procedures
      WHERE visit_id = ANY(${visitIdArray}::int[])
      ORDER BY id;
    `;

    // Group procedures by visit
    const visitsWithProcedures = visits.map(visit => ({
      ...visit,
      procedures: procedures.filter(p => p.visit_id === visit.id)
    }));

    return NextResponse.json(visitsWithProcedures);
  } catch (error) {
    console.error('Failed to fetch visits:', error);
    return NextResponse.json({ error: 'Failed to fetch visits' }, { status: 500 });
  }
}
