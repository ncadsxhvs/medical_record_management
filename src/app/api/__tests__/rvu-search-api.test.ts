/**
 * @jest-environment node
 */
import { buildRequest, parseResponse, TEST_USER_ID } from './helpers';

jest.mock('@/lib/db');
jest.mock('@/lib/mobile-auth');
jest.mock('@/lib/rvu-cache');

import { GET } from '@/app/api/rvu/search/route';
import { getUserId } from '@/lib/mobile-auth';
import { searchRVUCodes, getCacheStats } from '@/lib/rvu-cache';

const mockSearch = searchRVUCodes as jest.Mock;
const mockStats = getCacheStats as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  (getUserId as jest.Mock).mockResolvedValue(TEST_USER_ID);
  mockSearch.mockResolvedValue([]);
  mockStats.mockReturnValue({ totalCodes: 0, cacheAge: 0 });
});

describe('GET /api/rvu/search', () => {
  it('should return search results', async () => {
    const results = [
      { id: 1, hcpcs: '99213', description: 'Office visit', status_code: 'A', work_rvu: 1.3 },
    ];
    mockSearch.mockResolvedValueOnce(results);
    mockStats.mockReturnValueOnce({ totalCodes: 16852, cacheAge: 5000 });

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
    mockSearch.mockResolvedValueOnce([]);
    mockStats.mockReturnValueOnce({ totalCodes: 16852, cacheAge: 5000 });

    const req = buildRequest('http://localhost:3001/api/rvu/search?q=ZZZZZ');
    const { status, json } = await parseResponse(await GET(req));

    expect(status).toBe(200);
    expect(json).toEqual([]);
  });

  it('should return 500 on search error', async () => {
    mockSearch.mockRejectedValueOnce(new Error('Cache error'));

    const req = buildRequest('http://localhost:3001/api/rvu/search?q=99213');
    const { status } = await parseResponse(await GET(req));
    expect(status).toBe(500);
  });
});
