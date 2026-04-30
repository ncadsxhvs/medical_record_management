/**
 * Centralized cache keys for SWR
 * This prevents typos and makes API structure changes easier to manage
 */
export const CACHE_KEYS = {
  visits: '/api/visits',
  favoriteGroups: '/api/favorite-groups',
  analytics: (period: string, start: string, end: string) =>
    `/api/analytics?period=${period}&start=${start}&end=${end}`,
  analyticsBreakdown: (period: string, start: string, end: string) =>
    `/api/analytics?period=${period}&start=${start}&end=${end}&groupBy=hcpcs`,
  settings: '/api/settings',
} as const;
