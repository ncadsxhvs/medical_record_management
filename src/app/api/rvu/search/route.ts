import { NextRequest, NextResponse } from 'next/server';
import { searchRVUCodes, getCacheStats } from '@/lib/rvu-cache';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    const results = await searchRVUCodes(q, 100);

    // Add cache stats to response headers for debugging
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
}
