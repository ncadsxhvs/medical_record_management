import { sql } from '@/lib/db';
import { withAuth, apiError } from '@/lib/api-utils';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withAuth(async (_req: NextRequest, userId: string) => {
  try {
    const { rows } = await sql`
      SELECT * FROM custom_codes
      WHERE user_id = ${userId}
      ORDER BY created_at DESC;
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Failed to fetch custom codes:', error);
    return apiError('Failed to fetch custom codes', 500);
  }
});

export const POST = withAuth(async (req: NextRequest, userId: string) => {
  const { hcpcs, description, work_rvu } = await req.json();

  if (!hcpcs || !description) {
    return apiError('Missing required fields: hcpcs and description', 400);
  }

  const rvu = parseFloat(work_rvu) || 0;

  try {
    const result = await sql`
      INSERT INTO custom_codes (user_id, hcpcs, description, work_rvu)
      VALUES (${userId}, ${hcpcs.trim().toUpperCase()}, ${description.trim()}, ${rvu})
      ON CONFLICT (user_id, hcpcs) DO UPDATE SET
        description = EXCLUDED.description,
        work_rvu = EXCLUDED.work_rvu
      RETURNING *;
    `;
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create custom code:', error);
    return apiError('Failed to create custom code', 500);
  }
});
