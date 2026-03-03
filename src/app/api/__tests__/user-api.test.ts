/**
 * @jest-environment node
 */
import { buildRequest, parseResponse, TEST_USER_ID } from './helpers';

jest.mock('@/lib/db');
jest.mock('@/lib/mobile-auth');

import { DELETE } from '@/app/api/user/route';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/mobile-auth';

const mockSql = sql as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  (getUserId as jest.Mock).mockResolvedValue(TEST_USER_ID);
  mockSql.mockResolvedValue({ rows: [] });
});

describe('DELETE /api/user', () => {
  it('should delete user account and all data', async () => {
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
