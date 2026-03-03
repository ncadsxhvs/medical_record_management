/**
 * @jest-environment node
 */
import { buildRequest, parseResponse, TEST_USER_ID } from './helpers';

jest.mock('@/lib/db');
jest.mock('@/lib/mobile-auth');

import { PUT, DELETE } from '@/app/api/visits/[id]/route';
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

const makeContext = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  jest.clearAllMocks();
  (getUserId as jest.Mock).mockResolvedValue(TEST_USER_ID);
  mockSql.mockResolvedValue({ rows: [] });
});

describe('PUT /api/visits/[id]', () => {
  it('should update a visit', async () => {
    const visitRow = { id: 1, user_id: TEST_USER_ID, date: '2025-12-20', time: null, notes: null };
    const procRow = { id: 10, visit_id: 1, ...validProcedure };

    mockSql
      .mockResolvedValueOnce({ rows: [visitRow] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [procRow] });

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
