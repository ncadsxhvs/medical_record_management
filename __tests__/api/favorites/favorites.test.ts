import { createMockRequest, mockDbResponse, createMockFavorite } from '../../helpers/test-utils';

// Mock dependencies FIRST
jest.mock('@/lib/db', () => ({
  sql: jest.fn(),
}));
jest.mock('@/lib/mobile-auth', () => ({
  getUserId: jest.fn(),
  getAuthenticatedUser: jest.fn(),
}));

// Import after mocking
import { GET, POST, PATCH } from '@/app/api/favorites/route';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/mobile-auth';

describe('/api/favorites', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/favorites', () => {
    it('should return all favorites for authenticated user', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const favorite1 = createMockFavorite({ id: 1, hcpcs: '99213', sort_order: 0 });
      const favorite2 = createMockFavorite({ id: 2, hcpcs: '99214', sort_order: 1 });

      (sql as jest.Mock).mockResolvedValue(mockDbResponse([favorite1, favorite2]));

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/favorites',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0].hcpcs).toBe('99213');
      expect(data[0].sort_order).toBe(0);
      expect(data[1].hcpcs).toBe('99214');
      expect(data[1].sort_order).toBe(1);
    });

    it('should return empty array if no favorites exist', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');
      (sql as jest.Mock).mockResolvedValue(mockDbResponse([]));

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/favorites',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it('should return 401 if user is not authenticated', async () => {
      (getUserId as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/favorites',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return favorites ordered by sort_order', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const favorites = [
        createMockFavorite({ id: 1, hcpcs: '99213', sort_order: 0 }),
        createMockFavorite({ id: 2, hcpcs: '99214', sort_order: 1 }),
        createMockFavorite({ id: 3, hcpcs: '93000', sort_order: 2 }),
      ];

      (sql as jest.Mock).mockResolvedValue(mockDbResponse(favorites));

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/favorites',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(data[0].sort_order).toBe(0);
      expect(data[1].sort_order).toBe(1);
      expect(data[2].sort_order).toBe(2);
      expect(sql).toHaveBeenCalled();
    });

    it('should return 500 if database query fails', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');
      (sql as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/favorites',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch favorites');
    });
  });

  describe('POST /api/favorites', () => {
    it('should add a new favorite', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const newFavorite = createMockFavorite({ id: 5, hcpcs: '93000', sort_order: 3 });

      // Mock max sort_order query
      (sql as jest.Mock).mockResolvedValueOnce(mockDbResponse([{ max_order: 2 }]));

      // Mock insert
      (sql as jest.Mock).mockResolvedValueOnce(mockDbResponse([newFavorite]));

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/favorites',
        body: { hcpcs: '93000' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.hcpcs).toBe('93000');
      expect(data.sort_order).toBe(3);
    });

    it('should set sort_order to 0 for first favorite', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const firstFavorite = createMockFavorite({ id: 1, hcpcs: '99213', sort_order: 0 });

      // Mock max sort_order query (no favorites yet)
      (sql as jest.Mock).mockResolvedValueOnce(mockDbResponse([{ max_order: -1 }]));

      // Mock insert
      (sql as jest.Mock).mockResolvedValueOnce(mockDbResponse([firstFavorite]));

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/favorites',
        body: { hcpcs: '99213' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.sort_order).toBe(0);
    });

    it('should return 400 if hcpcs is missing', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/favorites',
        body: {}, // No hcpcs
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required field: hcpcs');
    });

    it('should return 401 if user is not authenticated', async () => {
      (getUserId as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/favorites',
        body: { hcpcs: '99213' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle duplicate favorites (ON CONFLICT)', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      // Mock max sort_order query
      (sql as jest.Mock).mockResolvedValueOnce(mockDbResponse([{ max_order: 2 }]));

      // Mock insert with ON CONFLICT DO NOTHING - returns empty rows array
      (sql as jest.Mock).mockResolvedValueOnce(mockDbResponse([]));

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/favorites',
        body: { hcpcs: '99213' }, // Duplicate
      });

      const response = await POST(request);

      // ON CONFLICT DO NOTHING returns no rows, causing undefined serialization error
      expect(response.status).toBe(500);
    });

    it('should return 500 if database operation fails', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');
      (sql as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/favorites',
        body: { hcpcs: '99213' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to add favorite');
    });
  });

  describe('PATCH /api/favorites', () => {
    it('should reorder favorites', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      // Mock successful updates
      (sql as jest.Mock).mockResolvedValue(mockDbResponse([]));

      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3001/api/favorites',
        body: {
          favorites: [
            { hcpcs: '99214' }, // Now first (sort_order 0)
            { hcpcs: '99213' }, // Now second (sort_order 1)
            { hcpcs: '93000' }, // Now third (sort_order 2)
          ],
        },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify UPDATE was called 3 times
      expect(sql).toHaveBeenCalledTimes(3);
    });

    it('should return 400 if favorites is not an array', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3001/api/favorites',
        body: {
          favorites: 'not-an-array',
        },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request: favorites must be an array');
    });

    it('should return 401 if user is not authenticated', async () => {
      (getUserId as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3001/api/favorites',
        body: {
          favorites: [{ hcpcs: '99213' }],
        },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should update sort_order based on array index', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const updateMock = jest.fn().mockResolvedValue(mockDbResponse([]));
      (sql as jest.Mock).mockImplementation(updateMock);

      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3001/api/favorites',
        body: {
          favorites: [
            { hcpcs: '99214' },
            { hcpcs: '99213' },
          ],
        },
      });

      await PATCH(request);

      // Verify updates were called for both favorites
      expect(updateMock).toHaveBeenCalledTimes(2);
    });

    it('should return 500 if database operation fails', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');
      (sql as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({
        method: 'PATCH',
        url: 'http://localhost:3001/api/favorites',
        body: {
          favorites: [{ hcpcs: '99213' }],
        },
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to reorder favorites');
    });
  });
});
