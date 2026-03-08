/**
 * @jest-environment node
 */
import { buildRequest, parseResponse, TEST_USER_ID } from './helpers';

jest.mock('@/lib/db');
jest.mock('@/lib/mobile-auth');

import { GET, POST, PATCH } from '@/app/api/favorites/route';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/mobile-auth';

const mockSql = sql as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  (getUserId as jest.Mock).mockResolvedValue(TEST_USER_ID);
  mockSql.mockResolvedValue({ rows: [] });
});

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
      .mockResolvedValueOnce({ rows: [{ max_order: 2 }] })
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
    mockSql.mockResolvedValue({ rows: [] });

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
