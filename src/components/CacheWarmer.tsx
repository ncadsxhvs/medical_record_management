import { getRVUCodes } from '@/lib/rvu-cache';

/**
 * Server component that warms up the RVU cache on app initialization
 * This runs on the server side and preloads all RVU codes into memory
 */
export default async function CacheWarmer() {
  try {
    // Preload RVU codes into cache on server startup
    await getRVUCodes();
  } catch (error) {
    console.error('[CacheWarmer] Failed to preload RVU codes:', error);
  }

  // This component doesn't render anything
  return null;
}
