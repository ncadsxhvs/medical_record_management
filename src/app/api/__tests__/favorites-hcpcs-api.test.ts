/**
 * @jest-environment node
 */
import { buildRequest, parseResponse, TEST_USER_ID } from './helpers';

jest.mock('@/lib/db');
jest.mock('@/lib/mobile-auth');

import { DELETE } from '@/app/api/favorites/[hcpcs]/route';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/mobile-auth';

const mockSql = sql as jest.Mock;
const makeContext = (hcpcs: string) => ({ params: Promise.resolve({ hcpcs }) });

beforeEach(() => {
  jest.clearAllMocks();
  (getUserId as jest.Mock).mockResolvedValue(TEST_USER_ID);
  mockSql.mockResolvedValue({ rows: [] });
});

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
