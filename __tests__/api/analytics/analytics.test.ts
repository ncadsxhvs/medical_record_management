import { createMockRequest, mockDbResponse, createMockAnalytics } from '../../helpers/test-utils';

// Mock dependencies FIRST
jest.mock('@/lib/db', () => ({
  sql: jest.fn(),
}));
jest.mock('@/lib/mobile-auth', () => ({
  getUserId: jest.fn(),
  getAuthenticatedUser: jest.fn(),
}));

// Import after mocking
import { GET } from '@/app/api/analytics/route';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/mobile-auth';

describe('/api/analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/analytics', () => {
    it('should return analytics data for daily period', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const analytics = [
        createMockAnalytics({
          period_start: '2025-01-25',
          total_work_rvu: '10.50',
          total_encounters: '5',
          total_no_shows: '1',
        }),
        createMockAnalytics({
          period_start: '2025-01-26',
          total_work_rvu: '15.30',
          total_encounters: '8',
          total_no_shows: '0',
        }),
      ];

      (sql as jest.Mock).mockResolvedValue(mockDbResponse(analytics));

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/analytics?start=2025-01-25&end=2025-01-26&period=daily',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0].total_work_rvu).toBe('10.50');
      expect(data[0].total_encounters).toBe('5');
      expect(data[1].total_work_rvu).toBe('15.30');
    });

    it('should return 400 if start date is missing', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/analytics?end=2025-01-26&period=daily',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required query parameters: start and end');
    });

    it('should return 400 if end date is missing', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/analytics?start=2025-01-25&period=daily',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required query parameters: start and end');
    });

    it('should return 401 if user is not authenticated', async () => {
      (getUserId as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/analytics?start=2025-01-25&end=2025-01-26&period=daily',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should support weekly period', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const analytics = [
        createMockAnalytics({
          period_start: '2025-01-20T00:00:00.000Z',
          total_work_rvu: '50.00',
          total_encounters: '20',
          total_no_shows: '2',
        }),
      ];

      (sql as jest.Mock).mockResolvedValue(mockDbResponse(analytics));

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/analytics?start=2025-01-20&end=2025-01-26&period=weekly',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(sql).toHaveBeenCalled();
    });

    it('should support monthly period', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const analytics = [
        createMockAnalytics({
          period_start: '2025-01-01T00:00:00.000Z',
          total_work_rvu: '200.00',
          total_encounters: '100',
          total_no_shows: '5',
        }),
      ];

      (sql as jest.Mock).mockResolvedValue(mockDbResponse(analytics));

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/analytics?start=2025-01-01&end=2025-01-31&period=monthly',
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(sql).toHaveBeenCalled();
    });

    it('should support yearly period', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const analytics = [
        createMockAnalytics({
          period_start: '2025-01-01T00:00:00.000Z',
          total_work_rvu: '2500.00',
          total_encounters: '1200',
          total_no_shows: '50',
        }),
      ];

      (sql as jest.Mock).mockResolvedValue(mockDbResponse(analytics));

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/analytics?start=2025-01-01&end=2025-12-31&period=yearly',
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(sql).toHaveBeenCalled();
    });

    it('should support HCPCS breakdown with groupBy=hcpcs', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const breakdown = [
        {
          period_start: '2025-01-26',
          hcpcs: '99213',
          description: 'Office visit',
          status_code: 'A',
          total_work_rvu: '5.20',
          total_quantity: '4',
          encounter_count: '4',
        },
        {
          period_start: '2025-01-26',
          hcpcs: '99214',
          description: 'Office visit extended',
          status_code: 'A',
          total_work_rvu: '3.84',
          total_quantity: '2',
          encounter_count: '2',
        },
      ];

      (sql as jest.Mock).mockResolvedValue(mockDbResponse(breakdown));

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/analytics?start=2025-01-26&end=2025-01-26&period=daily&groupBy=hcpcs',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0].hcpcs).toBe('99213');
      expect(data[0].total_work_rvu).toBe('5.20');
      expect(data[1].hcpcs).toBe('99214');
      expect(sql).toHaveBeenCalled();
    });

    it('should default to daily period if not specified', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');
      (sql as jest.Mock).mockResolvedValue(mockDbResponse([]));

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/analytics?start=2025-01-25&end=2025-01-26',
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(sql).toHaveBeenCalled();
    });

    it('should return empty array if no data for period', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');
      (sql as jest.Mock).mockResolvedValue(mockDbResponse([]));

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/analytics?start=2025-12-01&end=2025-12-31&period=daily',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it('should filter by user_id', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');
      (sql as jest.Mock).mockResolvedValue(mockDbResponse([]));

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/analytics?start=2025-01-25&end=2025-01-26&period=daily',
      });

      await GET(request);

      // Verify sql was called for the query
      expect(sql).toHaveBeenCalled();
    });

    it('should return 500 if database query fails', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');
      (sql as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/analytics?start=2025-01-25&end=2025-01-26&period=daily',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch analytics');
    });
  });
});
