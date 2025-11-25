import { NextResponse } from 'next/server';
import { getRVUCodes, getCacheStats } from '@/lib/rvu-cache';

/**
 * Warmup endpoint to preload RVU codes cache
 * This can be called on app initialization or manually to refresh the cache
 */
export async function GET() {
  try {
    const startTime = Date.now();
    await getRVUCodes();
    const duration = Date.now() - startTime;

    const stats = getCacheStats();

    return NextResponse.json({
      success: true,
      message: 'RVU cache loaded successfully',
      stats: {
        totalCodes: stats.totalCodes,
        loadTime: duration,
        cacheAge: stats.cacheAge,
      },
    });
  } catch (error) {
    console.error('Failed to warm up RVU cache:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to warm up cache' },
      { status: 500 }
    );
  }
}
