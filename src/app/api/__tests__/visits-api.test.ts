/**
 * @jest-environment node
 */
import { buildRequest, parseResponse, TEST_USER_ID } from './helpers';

jest.mock('@/lib/db');
jest.mock('@/lib/mobile-auth');

import { POST, GET } from '@/app/api/visits/route';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/mobile-auth';

const mockSql = sql as jest.Mock;

const validProcedure = {
  hcpcs: '99213',
  description: 'Office visit',
  status_code: 'A',
  work_rvu: 1.3,
  quantity: 1,
};

beforeEach(() => {
  jest.clearAllMocks();
  (getUserId as jest.Mock).mockResolvedValue(TEST_USER_ID);
  mockSql.mockResolvedValue({ rows: [] });
});

describe('POST /api/visits', () => {
  it('should create a visit with valid data', async () => {
    const visitRow = { id: 1, user_id: TEST_USER_ID, date: '2025-12-15', time: '14:30:00', notes: null, is_no_show: false };
    const procRow = { id: 1, visit_id: 1, ...validProcedure };

    mockSql
      .mockResolvedValueOnce({ rows: [visitRow] })
      .mockResolvedValueOnce({ rows: [procRow] });

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
