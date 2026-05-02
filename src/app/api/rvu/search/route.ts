import { NextRequest, NextResponse } from 'next/server';
import { searchRVUCodes, getCacheStats } from '@/lib/rvu-cache';
import { withAuth } from '@/lib/api-utils';
import { sql } from '@/lib/db';

export const GET = withAuth(async (req: NextRequest, userId: string) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    const [standardResults, customResults] = await Promise.all([
      searchRVUCodes(q, 100),
      sql`
        SELECT hcpcs, description, work_rvu, 'C' as status_code
        FROM custom_codes
        WHERE user_id = ${userId}
          AND (LOWER(hcpcs) LIKE ${'%' + q.toLowerCase() + '%'} OR LOWER(description) LIKE ${'%' + q.toLowerCase() + '%'})
        ORDER BY hcpcs
        LIMIT 20;
      `.then(r => r.rows).catch(() => []),
    ]);

    const customHcpcs = new Set(customResults.map((c) => String(c.hcpcs)));
    const filtered = standardResults.filter((r) => !customHcpcs.has(r.hcpcs));
    const results = [...customResults, ...filtered];

    const stats = getCacheStats();
    return NextResponse.json(results, {
      headers: {
        'X-Cache-Total': stats.totalCodes.toString(),
        'X-Cache-Age': stats.cacheAge.toString(),
      },
    });
  } catch (error) {
    console.error('Failed to search RVU codes:', error);
    return NextResponse.json({ error: 'Failed to search RVU codes' }, { status: 500 });
  }
});
