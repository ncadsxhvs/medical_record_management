import { NextRequest } from 'next/server';

/**
 * Create a mock NextRequest for testing
 */
export function createMockRequest(options: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: any;
} = {}): NextRequest {
  const {
    method = 'GET',
    url = 'http://localhost:3001/api/test',
    headers = {},
    body = null,
  } = options;

  const request = new NextRequest(url, {
    method,
    headers: new Headers(headers),
    body: body ? JSON.stringify(body) : null,
  });

  return request;
}

/**
 * Mock database response
 */
export function mockDbResponse(rows: any[] = []) {
  return {
    rows,
    rowCount: rows.length,
    command: 'SELECT',
    fields: [],
  };
}

/**
 * Create mock user for authentication
 */
export function createMockUser(overrides: Partial<{
  id: string;
  email: string;
  name: string;
  image: string;
}> = {}) {
  return {
    id: overrides.id || 'test-user-123',
    email: overrides.email || 'test@example.com',
    name: overrides.name || 'Test User',
    image: overrides.image || null,
  };
}

/**
 * Create mock visit data
 */
export function createMockVisit(overrides: Partial<any> = {}) {
  return {
    id: overrides.id || 1,
    user_id: overrides.user_id || 'test-user-123',
    date: overrides.date || '2025-01-26',
    time: overrides.time || '14:30:00',
    notes: overrides.notes || 'Test visit',
    is_no_show: overrides.is_no_show || false,
    created_at: overrides.created_at || '2025-01-26T10:00:00.000Z',
    updated_at: overrides.updated_at || '2025-01-26T10:00:00.000Z',
    ...overrides,
  };
}

/**
 * Create mock procedure data
 */
export function createMockProcedure(overrides: Partial<any> = {}) {
  return {
    id: overrides.id || 1,
    visit_id: overrides.visit_id || 1,
    hcpcs: overrides.hcpcs || '99213',
    description: overrides.description || 'Office visit',
    status_code: overrides.status_code || 'A',
    work_rvu: overrides.work_rvu || '1.30',
    quantity: overrides.quantity || 1,
    created_at: overrides.created_at || '2025-01-26T10:00:00.000Z',
    ...overrides,
  };
}

/**
 * Create mock favorite data
 */
export function createMockFavorite(overrides: Partial<any> = {}) {
  return {
    id: overrides.id || 1,
    user_id: overrides.user_id || 'test-user-123',
    hcpcs: overrides.hcpcs || '99213',
    sort_order: overrides.sort_order || 0,
    created_at: overrides.created_at || '2025-01-26T10:00:00.000Z',
    ...overrides,
  };
}

/**
 * Create mock analytics data
 */
export function createMockAnalytics(overrides: Partial<any> = {}) {
  return {
    period_start: overrides.period_start || '2025-01-26T00:00:00.000Z',
    total_work_rvu: overrides.total_work_rvu || '10.50',
    total_encounters: overrides.total_encounters || '5',
    total_no_shows: overrides.total_no_shows || '1',
    ...overrides,
  };
}
