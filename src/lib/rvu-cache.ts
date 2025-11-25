import { sql } from '@/lib/db';
import { RVUCode } from '@/types';

interface RVUCache {
  codes: RVUCode[];
  lastUpdated: number;
  isLoading: boolean;
}

const cache: RVUCache = {
  codes: [],
  lastUpdated: 0,
  isLoading: false,
};

// Cache duration: 24 hours (RVU codes don't change frequently)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

/**
 * Load all RVU codes into memory cache
 */
async function loadRVUCodes(): Promise<RVUCode[]> {
  console.log('[RVU Cache] Loading RVU codes from database...');
  const startTime = Date.now();

  try {
    const { rows } = await sql`
      SELECT id, hcpcs, description, status_code, work_rvu
      FROM rvu_codes
      ORDER BY hcpcs;
    `;

    cache.codes = rows as RVUCode[];
    cache.lastUpdated = Date.now();

    const duration = Date.now() - startTime;
    console.log(`[RVU Cache] Loaded ${cache.codes.length} RVU codes in ${duration}ms`);

    return cache.codes;
  } catch (error) {
    console.error('[RVU Cache] Failed to load RVU codes:', error);
    throw error;
  }
}

/**
 * Get all RVU codes from cache (loads from DB if cache is empty or expired)
 */
export async function getRVUCodes(): Promise<RVUCode[]> {
  const now = Date.now();
  const cacheAge = now - cache.lastUpdated;

  // If cache is empty or expired, reload
  if (cache.codes.length === 0 || cacheAge > CACHE_DURATION) {
    // Prevent concurrent loads
    if (cache.isLoading) {
      // Wait for the existing load to complete
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!cache.isLoading) {
            clearInterval(checkInterval);
            resolve(null);
          }
        }, 100);
      });
      return cache.codes;
    }

    cache.isLoading = true;
    try {
      await loadRVUCodes();
    } finally {
      cache.isLoading = false;
    }
  }

  return cache.codes;
}

/**
 * Search RVU codes in memory cache
 */
export async function searchRVUCodes(query: string, limit: number = 100): Promise<RVUCode[]> {
  const codes = await getRVUCodes();
  const lowerQuery = query.toLowerCase();

  const results = codes.filter((code) => {
    return (
      code.hcpcs.toLowerCase().includes(lowerQuery) ||
      code.description.toLowerCase().includes(lowerQuery)
    );
  });

  // Return first N matches
  return results.slice(0, limit);
}

/**
 * Get a specific RVU code by HCPCS
 */
export async function getRVUCodeByHCPCS(hcpcs: string): Promise<RVUCode | null> {
  const codes = await getRVUCodes();
  return codes.find((code) => code.hcpcs === hcpcs) || null;
}

/**
 * Manually refresh the cache (useful for admin operations)
 */
export async function refreshCache(): Promise<void> {
  cache.isLoading = true;
  try {
    await loadRVUCodes();
  } finally {
    cache.isLoading = false;
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    totalCodes: cache.codes.length,
    lastUpdated: cache.lastUpdated,
    cacheAge: Date.now() - cache.lastUpdated,
    isLoading: cache.isLoading,
  };
}
