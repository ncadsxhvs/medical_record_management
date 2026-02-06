import { GET } from '@/app/api/rvu/search/route';
import { createMockRequest } from '../../helpers/test-utils';

// Mock RVU cache
jest.mock('@/lib/rvu-cache', () => ({
  searchRVUCodes: jest.fn(),
  getCacheStats: jest.fn(),
}));

import { searchRVUCodes, getCacheStats } from '@/lib/rvu-cache';

describe('/api/rvu/search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/rvu/search', () => {
    it('should return RVU codes matching search query', async () => {
      const mockResults = [
        {
          id: 1,
          hcpcs: '99213',
          description: 'Office/outpatient visit, established patient, 20-29 minutes',
          status_code: 'A',
          work_rvu: '1.30',
        },
        {
          id: 2,
          hcpcs: '99214',
          description: 'Office/outpatient visit, established patient, 30-39 minutes',
          status_code: 'A',
          work_rvu: '1.92',
        },
      ];

      const mockStats = {
        totalCodes: 16852,
        cacheAge: 5000,
        lastRefresh: Date.now(),
      };

      (searchRVUCodes as jest.Mock).mockResolvedValue(mockResults);
      (getCacheStats as jest.Mock).mockReturnValue(mockStats);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/rvu/search?q=9921',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0].hcpcs).toBe('99213');
      expect(data[1].hcpcs).toBe('99214');

      // Verify cache headers
      expect(response.headers.get('X-Cache-Total')).toBe('16852');
      expect(response.headers.get('X-Cache-Age')).toBe('5000');

      // Verify search was called with correct params
      expect(searchRVUCodes).toHaveBeenCalledWith('9921', 100);
    });

    it('should return 400 if query parameter is missing', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/rvu/search',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Query parameter "q" is required');

      // Verify search was not called
      expect(searchRVUCodes).not.toHaveBeenCalled();
    });

    it('should return empty array if no codes match', async () => {
      (searchRVUCodes as jest.Mock).mockResolvedValue([]);
      (getCacheStats as jest.Mock).mockReturnValue({
        totalCodes: 16852,
        cacheAge: 5000,
        lastRefresh: Date.now(),
      });

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/rvu/search?q=ZZZZZ',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it('should search with single character query', async () => {
      (searchRVUCodes as jest.Mock).mockResolvedValue([
        {
          id: 100,
          hcpcs: 'G0463',
          description: 'Hospital outpatient clinic visit',
          status_code: 'A',
          work_rvu: '1.50',
        },
      ]);
      (getCacheStats as jest.Mock).mockReturnValue({
        totalCodes: 16852,
        cacheAge: 5000,
        lastRefresh: Date.now(),
      });

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/rvu/search?q=G',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(searchRVUCodes).toHaveBeenCalledWith('G', 100);
    });

    it('should search by description keywords', async () => {
      const mockResults = [
        {
          id: 50,
          hcpcs: '93000',
          description: 'Electrocardiogram, routine ECG with at least 12 leads',
          status_code: 'A',
          work_rvu: '0.17',
        },
      ];

      (searchRVUCodes as jest.Mock).mockResolvedValue(mockResults);
      (getCacheStats as jest.Mock).mockReturnValue({
        totalCodes: 16852,
        cacheAge: 5000,
        lastRefresh: Date.now(),
      });

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/rvu/search?q=ECG',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].description).toContain('ECG');
    });

    it('should limit results to 100 items', async () => {
      (searchRVUCodes as jest.Mock).mockResolvedValue([]);
      (getCacheStats as jest.Mock).mockReturnValue({
        totalCodes: 16852,
        cacheAge: 5000,
        lastRefresh: Date.now(),
      });

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/rvu/search?q=test',
      });

      await GET(request);

      // Verify limit of 100
      expect(searchRVUCodes).toHaveBeenCalledWith('test', 100);
    });

    it('should handle URL encoded query parameters', async () => {
      (searchRVUCodes as jest.Mock).mockResolvedValue([]);
      (getCacheStats as jest.Mock).mockReturnValue({
        totalCodes: 16852,
        cacheAge: 5000,
        lastRefresh: Date.now(),
      });

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/rvu/search?q=office%20visit',
      });

      await GET(request);

      // Verify decoded query
      expect(searchRVUCodes).toHaveBeenCalledWith('office visit', 100);
    });

    it('should return 500 if search fails', async () => {
      (searchRVUCodes as jest.Mock).mockRejectedValue(new Error('Cache error'));

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/rvu/search?q=test',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to search RVU codes');
    });

    it('should include cache statistics in response headers', async () => {
      (searchRVUCodes as jest.Mock).mockResolvedValue([]);
      (getCacheStats as jest.Mock).mockReturnValue({
        totalCodes: 16852,
        cacheAge: 120000, // 2 minutes
        lastRefresh: Date.now() - 120000,
      });

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/rvu/search?q=test',
      });

      const response = await GET(request);

      expect(response.headers.get('X-Cache-Total')).toBe('16852');
      expect(response.headers.get('X-Cache-Age')).toBe('120000');
    });

    it('should be publicly accessible (no authentication required)', async () => {
      (searchRVUCodes as jest.Mock).mockResolvedValue([]);
      (getCacheStats as jest.Mock).mockReturnValue({
        totalCodes: 16852,
        cacheAge: 5000,
        lastRefresh: Date.now(),
      });

      // Request without authentication
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/rvu/search?q=test',
        // No Authorization header
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });
});
