/**
 * @jest-environment node
 */
import { buildRequest, parseResponse, TEST_USER_ID } from './helpers';

jest.mock('@/lib/db');
jest.mock('@/lib/mobile-auth');

import { GET } from '@/app/api/analytics/route';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/mobile-auth';

const mockSql = sql as any;

beforeEach(() => {
  jest.clearAllMocks();
  (getUserId as jest.Mock).mockResolvedValue(TEST_USER_ID);
  mockSql.mockResolvedValue({ rows: [] });
  mockSql.query.mockResolvedValue({ rows: [] });
});

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
