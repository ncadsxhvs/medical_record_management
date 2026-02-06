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
import { DELETE } from '@/app/api/favorites/[hcpcs]/route';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/mobile-auth';

describe('/api/favorites/:hcpcs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DELETE /api/favorites/:hcpcs', () => {
    it('should delete an existing favorite', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const deletedFavorite = createMockFavorite({ id: 1, hcpcs: '99213' });

      // Mock favorite delete
      (sql as jest.Mock).mockResolvedValueOnce(mockDbResponse([deletedFavorite]));

      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3001/api/favorites/99213',
      });

      const params = Promise.resolve({ hcpcs: '99213' });
      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Favorite removed successfully');
      expect(sql).toHaveBeenCalled();
    });

    it('should return 404 if favorite not found', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      // Mock favorite not found
      (sql as jest.Mock).mockResolvedValueOnce(mockDbResponse([]));

      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3001/api/favorites/99999',
      });

      const params = Promise.resolve({ hcpcs: '99999' });
      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Favorite not found or user not authorized');
    });

    it('should return 401 if user is not authenticated', async () => {
      (getUserId as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3001/api/favorites/99213',
      });

      const params = Promise.resolve({ hcpcs: '99213' });
      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should only delete favorites for the authenticated user', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const deletedFavorite = createMockFavorite({
        id: 1,
        user_id: 'test-user-123',
        hcpcs: '99213'
      });

      (sql as jest.Mock).mockResolvedValueOnce(mockDbResponse([deletedFavorite]));

      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3001/api/favorites/99213',
      });

      const params = Promise.resolve({ hcpcs: '99213' });
      await DELETE(request, { params });

      // Verify DELETE was called
      expect(sql).toHaveBeenCalled();
    });

    it('should handle HCPCS codes with special characters', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const deletedFavorite = createMockFavorite({ id: 1, hcpcs: 'G0463' });
      (sql as jest.Mock).mockResolvedValueOnce(mockDbResponse([deletedFavorite]));

      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3001/api/favorites/G0463',
      });

      const params = Promise.resolve({ hcpcs: 'G0463' });
      const response = await DELETE(request, { params });

      expect(response.status).toBe(200);
    });

    it('should return 500 if database operation fails', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');
      (sql as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3001/api/favorites/99213',
      });

      const params = Promise.resolve({ hcpcs: '99213' });
      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to remove favorite');
    });
  });
});
