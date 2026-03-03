# Full API Test Suite Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace mock-data-only tests with route-handler-level tests that mock the database and auth, giving full coverage of validation, auth, error handling, and response shapes for all 10 API routes.

**Architecture:** Mock `@/lib/db` (the `sql` tagged template) and `@/lib/mobile-auth` (the `getUserId` function) at the module level. Construct real `NextRequest` objects and call exported route handlers directly. Assert on response status codes, JSON bodies, and headers.

**Tech Stack:** Jest, NextRequest/NextResponse from next/server, jest.mock for db and auth.

---

## Shared Test Infrastructure

### Task 1: Create test helper utilities

**Files:**
- Create: `src/app/api/__tests__/helpers.ts`

**Step 1: Write the helper file**

```typescript
import { NextRequest } from 'next/server';

// Standard mock user ID used across all tests
export const TEST_USER_ID = 'test-user-id';

/**
 * Build a NextRequest for testing API routes.
 */
export function buildRequest(
  url: string,
  options: {
    method?: string;
    body?: any;
  } = {}
): NextRequest {
  const { method = 'GET', body } = options;
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  return new NextRequest(new URL(url, 'http://localhost:3001'), init);
}

/**
 * Parse JSON response body and status from a NextResponse.
 */
export async function parseResponse(response: Response) {
  const status = response.status;
  const json = await response.json();
  return { status, json };
}

/**
 * Create a mock sql tagged template function.
 * Returns the provided rows for the next call(s).
 */
export function createMockSql() {
  const fn = jest.fn().mockResolvedValue({ rows: [] });
  // Also mock sql.query() for parameterized queries (used by analytics)
  fn.query = jest.fn().mockResolvedValue({ rows: [] });
  return fn;
}
```

**Step 2: Commit**

```bash
git add src/app/api/__tests__/helpers.ts
git commit -m "test: add shared API test helpers"
```

---

## Visits API Tests

### Task 2: Test POST /api/visits

**Files:**
- Create: `src/app/api/__tests__/visits-api.test.ts`

**Step 1: Write tests**

```typescript
import { buildRequest, parseResponse, TEST_USER_ID, createMockSql } from './helpers';

// Mock db before importing routes
const mockSql = createMockSql();
jest.mock('@/lib/db', () => ({ sql: mockSql }));
jest.mock('@/lib/mobile-auth', () => ({
  getUserId: jest.fn().mockResolvedValue(TEST_USER_ID),
}));

import { POST, GET } from '@/app/api/visits/route';
import { getUserId } from '@/lib/mobile-auth';

const validProcedure = {
  hcpcs: '99213',
  description: 'Office visit',
  status_code: 'A',
  work_rvu: 1.3,
  quantity: 1,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/visits', () => {
  it('should create a visit with valid data', async () => {
    const visitRow = { id: 1, user_id: TEST_USER_ID, date: '2025-12-15', time: '14:30:00', notes: null, is_no_show: false };
    const procRow = { id: 1, visit_id: 1, ...validProcedure };

    mockSql
      .mockResolvedValueOnce({ rows: [visitRow] })   // INSERT visit
      .mockResolvedValueOnce({ rows: [procRow] });    // INSERT procedure

    const req = buildRequest('http://localhost:3001/api/visits', {
      method: 'POST',
      body: { date: '2025-12-15', time: '14:30:00', procedures: [validProcedure] },
    });

    const { status, json } = await parseResponse(await POST(req));
    expect(status).toBe(201);
    expect(json.id).toBe(1);
    expect(json.procedures).toHaveLength(1);
  });

  it('should accept work_rvu as a string (Postgres NUMERIC)', async () => {
    const procWithStringRvu = { ...validProcedure, work_rvu: '1.30' };
    const visitRow = { id: 2, user_id: TEST_USER_ID, date: '2025-12-15', time: null, notes: null, is_no_show: false };
    const procRow = { id: 2, visit_id: 2, ...procWithStringRvu };

    mockSql
      .mockResolvedValueOnce({ rows: [visitRow] })
      .mockResolvedValueOnce({ rows: [procRow] });

    const req = buildRequest('http://localhost:3001/api/visits', {
      method: 'POST',
      body: { date: '2025-12-15', procedures: [procWithStringRvu] },
    });

    const { status } = await parseResponse(await POST(req));
    expect(status).toBe(201);
  });

  it('should reject invalid work_rvu', async () => {
    const req = buildRequest('http://localhost:3001/api/visits', {
      method: 'POST',
      body: { date: '2025-12-15', procedures: [{ ...validProcedure, work_rvu: 'abc' }] },
    });

    const { status, json } = await parseResponse(await POST(req));
    expect(status).toBe(400);
    expect(json.error).toContain('work_rvu');
  });

  it('should reject null work_rvu', async () => {
    const req = buildRequest('http://localhost:3001/api/visits', {
      method: 'POST',
      body: { date: '2025-12-15', procedures: [{ ...validProcedure, work_rvu: null }] },
    });

    const { status, json } = await parseResponse(await POST(req));
    expect(status).toBe(400);
    expect(json.error).toContain('work_rvu');
  });

  it('should create a no-show visit without procedures', async () => {
    const visitRow = { id: 3, user_id: TEST_USER_ID, date: '2025-12-15', time: null, notes: 'No show', is_no_show: true };

    mockSql.mockResolvedValueOnce({ rows: [visitRow] });

    const req = buildRequest('http://localhost:3001/api/visits', {
      method: 'POST',
      body: { date: '2025-12-15', notes: 'No show', is_no_show: true, procedures: [] },
    });

    const { status, json } = await parseResponse(await POST(req));
    expect(status).toBe(201);
    expect(json.is_no_show).toBe(true);
  });

  it('should reject missing date', async () => {
    const req = buildRequest('http://localhost:3001/api/visits', {
      method: 'POST',
      body: { procedures: [validProcedure] },
    });

    const { status, json } = await parseResponse(await POST(req));
    expect(status).toBe(400);
    expect(json.error).toMatch(/date/i);
  });

  it('should reject invalid date format', async () => {
    const req = buildRequest('http://localhost:3001/api/visits', {
      method: 'POST',
      body: { date: '12/15/2025', procedures: [validProcedure] },
    });

    const { status } = await parseResponse(await POST(req));
    expect(status).toBe(400);
  });

  it('should reject invalid time format', async () => {
    const req = buildRequest('http://localhost:3001/api/visits', {
      method: 'POST',
      body: { date: '2025-12-15', time: '2:30 PM', procedures: [validProcedure] },
    });

    const { status } = await parseResponse(await POST(req));
    expect(status).toBe(400);
  });

  it('should reject invalid HCPCS code', async () => {
    const req = buildRequest('http://localhost:3001/api/visits', {
      method: 'POST',
      body: { date: '2025-12-15', procedures: [{ ...validProcedure, hcpcs: 'INVALID!!' }] },
    });

    const { status, json } = await parseResponse(await POST(req));
    expect(status).toBe(400);
    expect(json.error).toContain('HCPCS');
  });

  it('should reject empty procedures for non-no-show', async () => {
    const req = buildRequest('http://localhost:3001/api/visits', {
      method: 'POST',
      body: { date: '2025-12-15', procedures: [] },
    });

    const { status } = await parseResponse(await POST(req));
    expect(status).toBe(400);
  });

  it('should reject quantity out of range', async () => {
    const req = buildRequest('http://localhost:3001/api/visits', {
      method: 'POST',
      body: { date: '2025-12-15', procedures: [{ ...validProcedure, quantity: 1001 }] },
    });

    const { status } = await parseResponse(await POST(req));
    expect(status).toBe(400);
  });

  it('should return 500 on database error', async () => {
    mockSql.mockRejectedValueOnce(new Error('DB connection lost'));

    const req = buildRequest('http://localhost:3001/api/visits', {
      method: 'POST',
      body: { date: '2025-12-15', procedures: [validProcedure] },
    });

    const { status } = await parseResponse(await POST(req));
    expect(status).toBe(500);
  });
});

describe('GET /api/visits', () => {
  it('should return visits with procedures', async () => {
    const visits = [{ id: 1, user_id: TEST_USER_ID, date: '2025-12-15', created_at: '2025-12-15T10:00:00Z' }];
    const procs = [{ id: 1, visit_id: 1, hcpcs: '99213', work_rvu: '1.30', quantity: 1 }];

    mockSql
      .mockResolvedValueOnce({ rows: visits })
      .mockResolvedValueOnce({ rows: procs });

    const req = buildRequest('http://localhost:3001/api/visits');
    const { status, json } = await parseResponse(await GET(req));

    expect(status).toBe(200);
    expect(json).toHaveLength(1);
    expect(json[0].procedures).toHaveLength(1);
  });

  it('should return empty array when no visits', async () => {
    mockSql.mockResolvedValueOnce({ rows: [] });

    const req = buildRequest('http://localhost:3001/api/visits');
    const { status, json } = await parseResponse(await GET(req));

    expect(status).toBe(200);
    expect(json).toEqual([]);
  });

  it('should return 500 on database error', async () => {
    mockSql.mockRejectedValueOnce(new Error('DB error'));

    const req = buildRequest('http://localhost:3001/api/visits');
    const { status } = await parseResponse(await GET(req));
    expect(status).toBe(500);
  });
});

describe('Auth', () => {
  it('should return 401 when not authenticated', async () => {
    (getUserId as jest.Mock).mockResolvedValueOnce(null);

    const req = buildRequest('http://localhost:3001/api/visits');
    const { status, json } = await parseResponse(await GET(req));

    expect(status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });
});
```

**Step 2: Run tests to verify they fail (route has old validation)**

Run: `npm test -- --testPathPattern=visits-api`
Expected: `work_rvu as string` test FAILS (this is the bug we're fixing)

**Step 3: Commit**

```bash
git add src/app/api/__tests__/visits-api.test.ts
git commit -m "test: add POST/GET /api/visits route handler tests"
```

---

### Task 3: Test PUT/DELETE /api/visits/[id]

**Files:**
- Create: `src/app/api/__tests__/visits-id-api.test.ts`

**Step 1: Write tests**

```typescript
import { buildRequest, parseResponse, TEST_USER_ID, createMockSql } from './helpers';

const mockSql = createMockSql();
jest.mock('@/lib/db', () => ({ sql: mockSql }));
jest.mock('@/lib/mobile-auth', () => ({
  getUserId: jest.fn().mockResolvedValue(TEST_USER_ID),
}));

import { PUT, DELETE } from '@/app/api/visits/[id]/route';

const validProcedure = {
  hcpcs: '99213',
  description: 'Office visit',
  status_code: 'A',
  work_rvu: 1.3,
  quantity: 1,
};

const makeContext = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => jest.clearAllMocks());

describe('PUT /api/visits/[id]', () => {
  it('should update a visit', async () => {
    const visitRow = { id: 1, user_id: TEST_USER_ID, date: '2025-12-20', time: null, notes: null };
    const procRow = { id: 10, visit_id: 1, ...validProcedure };

    mockSql
      .mockResolvedValueOnce({ rows: [visitRow] })   // UPDATE visit
      .mockResolvedValueOnce({ rows: [] })            // DELETE old procedures
      .mockResolvedValueOnce({ rows: [procRow] });    // INSERT new procedure

    const req = buildRequest('http://localhost:3001/api/visits/1', {
      method: 'PUT',
      body: { date: '2025-12-20', procedures: [validProcedure] },
    });

    const { status, json } = await parseResponse(await PUT(req, makeContext('1')));
    expect(status).toBe(200);
    expect(json.procedures).toHaveLength(1);
  });

  it('should return 404 when visit not found', async () => {
    mockSql.mockResolvedValueOnce({ rows: [] });

    const req = buildRequest('http://localhost:3001/api/visits/999', {
      method: 'PUT',
      body: { date: '2025-12-20', procedures: [validProcedure] },
    });

    const { status } = await parseResponse(await PUT(req, makeContext('999')));
    expect(status).toBe(404);
  });

  it('should reject invalid visit ID', async () => {
    const req = buildRequest('http://localhost:3001/api/visits/abc', {
      method: 'PUT',
      body: { date: '2025-12-20', procedures: [validProcedure] },
    });

    const { status } = await parseResponse(await PUT(req, makeContext('abc')));
    expect(status).toBe(400);
  });

  it('should reject negative visit ID', async () => {
    const req = buildRequest('http://localhost:3001/api/visits/-1', {
      method: 'PUT',
      body: { date: '2025-12-20', procedures: [validProcedure] },
    });

    const { status } = await parseResponse(await PUT(req, makeContext('-1')));
    expect(status).toBe(400);
  });

  it('should reject missing procedures', async () => {
    const req = buildRequest('http://localhost:3001/api/visits/1', {
      method: 'PUT',
      body: { date: '2025-12-20' },
    });

    const { status } = await parseResponse(await PUT(req, makeContext('1')));
    expect(status).toBe(400);
  });

  it('should reject invalid date', async () => {
    const req = buildRequest('http://localhost:3001/api/visits/1', {
      method: 'PUT',
      body: { date: 'bad', procedures: [validProcedure] },
    });

    const { status } = await parseResponse(await PUT(req, makeContext('1')));
    expect(status).toBe(400);
  });

  it('should return 500 on database error', async () => {
    mockSql.mockRejectedValueOnce(new Error('DB error'));

    const req = buildRequest('http://localhost:3001/api/visits/1', {
      method: 'PUT',
      body: { date: '2025-12-20', procedures: [validProcedure] },
    });

    const { status } = await parseResponse(await PUT(req, makeContext('1')));
    expect(status).toBe(500);
  });
});

describe('DELETE /api/visits/[id]', () => {
  it('should delete a visit', async () => {
    mockSql.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const req = buildRequest('http://localhost:3001/api/visits/1', { method: 'DELETE' });
    const { status, json } = await parseResponse(await DELETE(req, makeContext('1')));

    expect(status).toBe(200);
    expect(json.message).toMatch(/deleted/i);
  });

  it('should return 404 when visit not found', async () => {
    mockSql.mockResolvedValueOnce({ rows: [] });

    const req = buildRequest('http://localhost:3001/api/visits/999', { method: 'DELETE' });
    const { status } = await parseResponse(await DELETE(req, makeContext('999')));
    expect(status).toBe(404);
  });

  it('should reject invalid ID', async () => {
    const req = buildRequest('http://localhost:3001/api/visits/abc', { method: 'DELETE' });
    const { status } = await parseResponse(await DELETE(req, makeContext('abc')));
    expect(status).toBe(400);
  });
});
```

**Step 2: Run tests**

Run: `npm test -- --testPathPattern=visits-id-api`

**Step 3: Commit**

```bash
git add src/app/api/__tests__/visits-id-api.test.ts
git commit -m "test: add PUT/DELETE /api/visits/[id] route handler tests"
```

---

### Task 4: Test GET/POST/PATCH /api/favorites

**Files:**
- Create: `src/app/api/__tests__/favorites-api.test.ts`

**Step 1: Write tests**

```typescript
import { buildRequest, parseResponse, TEST_USER_ID, createMockSql } from './helpers';

const mockSql = createMockSql();
jest.mock('@/lib/db', () => ({ sql: mockSql }));
jest.mock('@/lib/mobile-auth', () => ({
  getUserId: jest.fn().mockResolvedValue(TEST_USER_ID),
}));

import { GET, POST, PATCH } from '@/app/api/favorites/route';

beforeEach(() => jest.clearAllMocks());

describe('GET /api/favorites', () => {
  it('should return favorites list', async () => {
    const rows = [
      { id: 1, user_id: TEST_USER_ID, hcpcs: '99213', sort_order: 0 },
      { id: 2, user_id: TEST_USER_ID, hcpcs: '99214', sort_order: 1 },
    ];
    mockSql.mockResolvedValueOnce({ rows });

    const req = buildRequest('http://localhost:3001/api/favorites');
    const { status, json } = await parseResponse(await GET(req));

    expect(status).toBe(200);
    expect(json).toHaveLength(2);
  });

  it('should return empty array when no favorites', async () => {
    mockSql.mockResolvedValueOnce({ rows: [] });

    const req = buildRequest('http://localhost:3001/api/favorites');
    const { status, json } = await parseResponse(await GET(req));

    expect(status).toBe(200);
    expect(json).toEqual([]);
  });

  it('should return 500 on database error', async () => {
    mockSql.mockRejectedValueOnce(new Error('DB error'));

    const req = buildRequest('http://localhost:3001/api/favorites');
    const { status } = await parseResponse(await GET(req));
    expect(status).toBe(500);
  });
});

describe('POST /api/favorites', () => {
  it('should add a favorite', async () => {
    mockSql
      .mockResolvedValueOnce({ rows: [{ max_order: 2 }] })  // SELECT max
      .mockResolvedValueOnce({ rows: [{ id: 4, user_id: TEST_USER_ID, hcpcs: '99215', sort_order: 3 }] });

    const req = buildRequest('http://localhost:3001/api/favorites', {
      method: 'POST',
      body: { hcpcs: '99215' },
    });

    const { status, json } = await parseResponse(await POST(req));
    expect(status).toBe(201);
    expect(json.hcpcs).toBe('99215');
  });

  it('should reject missing hcpcs', async () => {
    const req = buildRequest('http://localhost:3001/api/favorites', {
      method: 'POST',
      body: {},
    });

    const { status } = await parseResponse(await POST(req));
    expect(status).toBe(400);
  });

  it('should return 500 on database error', async () => {
    mockSql.mockRejectedValueOnce(new Error('DB error'));

    const req = buildRequest('http://localhost:3001/api/favorites', {
      method: 'POST',
      body: { hcpcs: '99213' },
    });

    const { status } = await parseResponse(await POST(req));
    expect(status).toBe(500);
  });
});

describe('PATCH /api/favorites (reorder)', () => {
  it('should reorder favorites', async () => {
    mockSql.mockResolvedValue({ rows: [] }); // UPDATE calls

    const req = buildRequest('http://localhost:3001/api/favorites', {
      method: 'PATCH',
      body: { favorites: [{ hcpcs: '99214' }, { hcpcs: '99213' }] },
    });

    const { status, json } = await parseResponse(await PATCH(req));
    expect(status).toBe(200);
    expect(json.success).toBe(true);
  });

  it('should reject non-array favorites', async () => {
    const req = buildRequest('http://localhost:3001/api/favorites', {
      method: 'PATCH',
      body: { favorites: 'not-array' },
    });

    const { status } = await parseResponse(await PATCH(req));
    expect(status).toBe(400);
  });
});
```

**Step 2: Run tests**

Run: `npm test -- --testPathPattern=favorites-api`

**Step 3: Commit**

```bash
git add src/app/api/__tests__/favorites-api.test.ts
git commit -m "test: add favorites route handler tests"
```

---

### Task 5: Test DELETE /api/favorites/[hcpcs]

**Files:**
- Create: `src/app/api/__tests__/favorites-hcpcs-api.test.ts`

**Step 1: Write tests**

```typescript
import { buildRequest, parseResponse, TEST_USER_ID, createMockSql } from './helpers';

const mockSql = createMockSql();
jest.mock('@/lib/db', () => ({ sql: mockSql }));
jest.mock('@/lib/mobile-auth', () => ({
  getUserId: jest.fn().mockResolvedValue(TEST_USER_ID),
}));

import { DELETE } from '@/app/api/favorites/[hcpcs]/route';

const makeContext = (hcpcs: string) => ({ params: Promise.resolve({ hcpcs }) });

beforeEach(() => jest.clearAllMocks());

describe('DELETE /api/favorites/[hcpcs]', () => {
  it('should delete a favorite', async () => {
    mockSql.mockResolvedValueOnce({ rows: [{ id: 1, hcpcs: '99213' }] });

    const req = buildRequest('http://localhost:3001/api/favorites/99213', { method: 'DELETE' });
    const { status, json } = await parseResponse(await DELETE(req, makeContext('99213')));

    expect(status).toBe(200);
    expect(json.message).toMatch(/removed/i);
  });

  it('should return 404 when favorite not found', async () => {
    mockSql.mockResolvedValueOnce({ rows: [] });

    const req = buildRequest('http://localhost:3001/api/favorites/XXXXX', { method: 'DELETE' });
    const { status } = await parseResponse(await DELETE(req, makeContext('XXXXX')));
    expect(status).toBe(404);
  });

  it('should return 500 on database error', async () => {
    mockSql.mockRejectedValueOnce(new Error('DB error'));

    const req = buildRequest('http://localhost:3001/api/favorites/99213', { method: 'DELETE' });
    const { status } = await parseResponse(await DELETE(req, makeContext('99213')));
    expect(status).toBe(500);
  });
});
```

**Step 2: Run tests**

Run: `npm test -- --testPathPattern=favorites-hcpcs-api`

**Step 3: Commit**

```bash
git add src/app/api/__tests__/favorites-hcpcs-api.test.ts
git commit -m "test: add DELETE /api/favorites/[hcpcs] tests"
```

---

### Task 6: Test GET /api/analytics

**Files:**
- Create: `src/app/api/__tests__/analytics-api.test.ts`

**Step 1: Write tests**

```typescript
import { buildRequest, parseResponse, TEST_USER_ID, createMockSql } from './helpers';

const mockSql = createMockSql();
jest.mock('@/lib/db', () => ({ sql: mockSql }));
jest.mock('@/lib/mobile-auth', () => ({
  getUserId: jest.fn().mockResolvedValue(TEST_USER_ID),
}));

import { GET } from '@/app/api/analytics/route';

beforeEach(() => jest.clearAllMocks());

describe('GET /api/analytics', () => {
  it('should return summary data for daily period', async () => {
    const rows = [
      { period_start: '2025-12-15', total_work_rvu: '3.90', total_encounters: '2', total_no_shows: '0' },
    ];
    mockSql.mockResolvedValueOnce({ rows });

    const req = buildRequest('http://localhost:3001/api/analytics?start=2025-12-01&end=2025-12-31&period=daily');
    const { status, json } = await parseResponse(await GET(req));

    expect(status).toBe(200);
    expect(json).toHaveLength(1);
    expect(json[0].period_start).toBe('2025-12-15');
  });

  it('should return HCPCS breakdown when groupBy=hcpcs', async () => {
    const rows = [
      { period_start: '2025-12-15', hcpcs: '99213', description: 'Office visit', total_work_rvu: '2.60', total_quantity: '2', encounter_count: '2' },
    ];
    mockSql.mockResolvedValueOnce({ rows });

    const req = buildRequest('http://localhost:3001/api/analytics?start=2025-12-01&end=2025-12-31&period=daily&groupBy=hcpcs');
    const { status, json } = await parseResponse(await GET(req));

    expect(status).toBe(200);
    expect(json[0].hcpcs).toBe('99213');
  });

  it('should use sql.query for non-daily periods', async () => {
    mockSql.query.mockResolvedValueOnce({ rows: [] });

    const req = buildRequest('http://localhost:3001/api/analytics?start=2025-01-01&end=2025-12-31&period=monthly');
    const { status } = await parseResponse(await GET(req));

    expect(status).toBe(200);
    expect(mockSql.query).toHaveBeenCalled();
  });

  it('should reject missing start param', async () => {
    const req = buildRequest('http://localhost:3001/api/analytics?end=2025-12-31');
    const { status, json } = await parseResponse(await GET(req));

    expect(status).toBe(400);
    expect(json.error).toMatch(/start/i);
  });

  it('should reject missing end param', async () => {
    const req = buildRequest('http://localhost:3001/api/analytics?start=2025-12-01');
    const { status } = await parseResponse(await GET(req));
    expect(status).toBe(400);
  });

  it('should return empty array for no data', async () => {
    mockSql.mockResolvedValueOnce({ rows: [] });

    const req = buildRequest('http://localhost:3001/api/analytics?start=2099-01-01&end=2099-12-31&period=daily');
    const { status, json } = await parseResponse(await GET(req));

    expect(status).toBe(200);
    expect(json).toEqual([]);
  });

  it('should return 500 on database error', async () => {
    mockSql.mockRejectedValueOnce(new Error('DB error'));

    const req = buildRequest('http://localhost:3001/api/analytics?start=2025-12-01&end=2025-12-31&period=daily');
    const { status } = await parseResponse(await GET(req));
    expect(status).toBe(500);
  });
});
```

**Step 2: Run tests**

Run: `npm test -- --testPathPattern=analytics-api`

**Step 3: Commit**

```bash
git add src/app/api/__tests__/analytics-api.test.ts
git commit -m "test: add GET /api/analytics route handler tests"
```

---

### Task 7: Test GET /api/rvu/search

**Files:**
- Create: `src/app/api/__tests__/rvu-search-api.test.ts`

**Step 1: Write tests**

```typescript
import { buildRequest, parseResponse, TEST_USER_ID } from './helpers';

const mockSearchRVUCodes = jest.fn();
const mockGetCacheStats = jest.fn();

jest.mock('@/lib/db', () => ({ sql: jest.fn() }));
jest.mock('@/lib/rvu-cache', () => ({
  searchRVUCodes: mockSearchRVUCodes,
  getCacheStats: mockGetCacheStats,
}));
jest.mock('@/lib/mobile-auth', () => ({
  getUserId: jest.fn().mockResolvedValue(TEST_USER_ID),
}));

import { GET } from '@/app/api/rvu/search/route';

beforeEach(() => jest.clearAllMocks());

describe('GET /api/rvu/search', () => {
  it('should return search results', async () => {
    const results = [
      { id: 1, hcpcs: '99213', description: 'Office visit', status_code: 'A', work_rvu: 1.3 },
    ];
    mockSearchRVUCodes.mockResolvedValueOnce(results);
    mockGetCacheStats.mockReturnValueOnce({ totalCodes: 16852, cacheAge: 5000 });

    const req = buildRequest('http://localhost:3001/api/rvu/search?q=99213');
    const res = await GET(req);
    const { status, json } = await parseResponse(res);

    expect(status).toBe(200);
    expect(json).toHaveLength(1);
    expect(json[0].hcpcs).toBe('99213');
    expect(res.headers.get('X-Cache-Total')).toBe('16852');
  });

  it('should reject missing query param', async () => {
    const req = buildRequest('http://localhost:3001/api/rvu/search');
    const { status, json } = await parseResponse(await GET(req));

    expect(status).toBe(400);
    expect(json.error).toMatch(/query/i);
  });

  it('should return empty array for no matches', async () => {
    mockSearchRVUCodes.mockResolvedValueOnce([]);
    mockGetCacheStats.mockReturnValueOnce({ totalCodes: 16852, cacheAge: 5000 });

    const req = buildRequest('http://localhost:3001/api/rvu/search?q=ZZZZZ');
    const { status, json } = await parseResponse(await GET(req));

    expect(status).toBe(200);
    expect(json).toEqual([]);
  });

  it('should return 500 on search error', async () => {
    mockSearchRVUCodes.mockRejectedValueOnce(new Error('Cache error'));

    const req = buildRequest('http://localhost:3001/api/rvu/search?q=99213');
    const { status } = await parseResponse(await GET(req));
    expect(status).toBe(500);
  });
});
```

**Step 2: Run tests**

Run: `npm test -- --testPathPattern=rvu-search-api`

**Step 3: Commit**

```bash
git add src/app/api/__tests__/rvu-search-api.test.ts
git commit -m "test: add GET /api/rvu/search route handler tests"
```

---

### Task 8: Test DELETE /api/user

**Files:**
- Create: `src/app/api/__tests__/user-api.test.ts`

**Step 1: Write tests**

```typescript
import { buildRequest, parseResponse, TEST_USER_ID, createMockSql } from './helpers';

const mockSql = createMockSql();
jest.mock('@/lib/db', () => ({ sql: mockSql }));
jest.mock('@/lib/mobile-auth', () => ({
  getUserId: jest.fn().mockResolvedValue(TEST_USER_ID),
}));

import { DELETE } from '@/app/api/user/route';

beforeEach(() => jest.clearAllMocks());

describe('DELETE /api/user', () => {
  it('should delete user account and all data', async () => {
    // 4 DELETE queries: visit_procedures, visits, favorites, users
    mockSql
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const req = buildRequest('http://localhost:3001/api/user', { method: 'DELETE' });
    const { status, json } = await parseResponse(await DELETE(req));

    expect(status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockSql).toHaveBeenCalledTimes(4);
  });

  it('should return 500 on database error', async () => {
    mockSql.mockRejectedValueOnce(new Error('DB error'));

    const req = buildRequest('http://localhost:3001/api/user', { method: 'DELETE' });
    const { status } = await parseResponse(await DELETE(req));
    expect(status).toBe(500);
  });
});
```

**Step 2: Run tests**

Run: `npm test -- --testPathPattern=user-api`

**Step 3: Commit**

```bash
git add src/app/api/__tests__/user-api.test.ts
git commit -m "test: add DELETE /api/user route handler tests"
```

---

### Task 9: Remove old mock-data-only tests

The old test files (`visits.test.ts`, `analytics.test.ts`, `favorites.test.ts`) test with mock data objects without calling route handlers. The new `*-api.test.ts` files supersede them.

**Files:**
- Delete: `src/app/api/__tests__/visits.test.ts`
- Delete: `src/app/api/__tests__/analytics.test.ts`
- Delete: `src/app/api/__tests__/favorites.test.ts`

**Step 1: Delete old test files**

```bash
rm src/app/api/__tests__/visits.test.ts
rm src/app/api/__tests__/analytics.test.ts
rm src/app/api/__tests__/favorites.test.ts
```

**Step 2: Run full test suite**

Run: `npm test`
Expected: All new tests pass, no old tests remain.

**Step 3: Commit**

```bash
git add -A src/app/api/__tests__/
git commit -m "test: remove superseded mock-data-only API tests"
```

---

### Task 10: Apply work_rvu fix and verify the regression test catches it

This task applies the bugfix from PR #20 (`fix/work-rvu-validation`) and verifies the new test suite would have caught the original bug.

**Files:**
- Modify: `src/app/api/visits/route.ts:13`
- Modify: `src/app/api/visits/[id]/route.ts:18`

**Step 1: Verify test fails with old validation**

Run: `npm test -- --testPathPattern=visits-api`
Expected: "should accept work_rvu as a string" FAILS

**Step 2: Apply fix in visits/route.ts**

Change line 13 from:
```typescript
if (proc.work_rvu == null || typeof proc.work_rvu !== 'number') return 'Invalid work_rvu value';
```
To:
```typescript
const rvu = Number(proc.work_rvu);
if (proc.work_rvu == null || isNaN(rvu)) return 'Invalid work_rvu value';
```

Apply the same fix in `visits/[id]/route.ts` line 18.

**Step 3: Run tests to verify fix**

Run: `npm test`
Expected: ALL tests pass

**Step 4: Commit**

```bash
git add src/app/api/visits/route.ts src/app/api/visits/[id]/route.ts
git commit -m "fix: accept string work_rvu values from Postgres NUMERIC columns"
```

---

### Task 11: Final verification and commit

**Step 1: Run full test suite with coverage**

Run: `npm run test:coverage`
Expected: All tests pass, coverage meets 70% threshold for tested files.

**Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 3: Final commit if any cleanup needed**

---

## Summary

| Task | Test File | Route | Tests |
|------|-----------|-------|-------|
| 1 | helpers.ts | (shared) | - |
| 2 | visits-api.test.ts | POST/GET /api/visits | ~16 |
| 3 | visits-id-api.test.ts | PUT/DELETE /api/visits/[id] | ~10 |
| 4 | favorites-api.test.ts | GET/POST/PATCH /api/favorites | ~8 |
| 5 | favorites-hcpcs-api.test.ts | DELETE /api/favorites/[hcpcs] | ~3 |
| 6 | analytics-api.test.ts | GET /api/analytics | ~7 |
| 7 | rvu-search-api.test.ts | GET /api/rvu/search | ~4 |
| 8 | user-api.test.ts | DELETE /api/user | ~2 |
| 9 | (cleanup) | Remove old tests | - |
| 10 | (bugfix) | work_rvu validation | - |
| 11 | (verify) | Full suite + build | - |

**Total: ~50 new route-handler-level tests + 23 existing dateUtils tests = ~73 tests**
