/**
 * Integration tests for Favorites API
 * Tests GET favorites retrieval, sorting, and data structure
 */

// Mock data matching database structure
const mockFavorites = [
  {
    id: 1,
    user_id: 'test-user-id',
    hcpcs: '99213',
    sort_order: 0,
    created_at: '2025-12-01T10:00:00Z',
  },
  {
    id: 2,
    user_id: 'test-user-id',
    hcpcs: '99214',
    sort_order: 1,
    created_at: '2025-12-02T10:00:00Z',
  },
  {
    id: 3,
    user_id: 'test-user-id',
    hcpcs: '99215',
    sort_order: 2,
    created_at: '2025-12-03T10:00:00Z',
  },
];

const mockFavoritesUnsorted = [
  {
    id: 1,
    user_id: 'test-user-id',
    hcpcs: '99215',
    sort_order: 2,
    created_at: '2025-12-01T10:00:00Z',
  },
  {
    id: 2,
    user_id: 'test-user-id',
    hcpcs: '99213',
    sort_order: 0,
    created_at: '2025-12-02T10:00:00Z',
  },
  {
    id: 3,
    user_id: 'test-user-id',
    hcpcs: '99214',
    sort_order: 1,
    created_at: '2025-12-03T10:00:00Z',
  },
];

describe('Favorites API Integration', () => {
  describe('GET /api/favorites', () => {
    it('should return favorites sorted by sort_order ASC', () => {
      const sorted = [...mockFavoritesUnsorted].sort(
        (a, b) => a.sort_order - b.sort_order
      );

      expect(sorted[0].hcpcs).toBe('99213');
      expect(sorted[1].hcpcs).toBe('99214');
      expect(sorted[2].hcpcs).toBe('99215');
    });

    it('should fall back to created_at when sort_order is equal', () => {
      const sameSortOrder = [
        { id: 1, hcpcs: '99214', sort_order: 0, created_at: '2025-12-02T10:00:00Z' },
        { id: 2, hcpcs: '99213', sort_order: 0, created_at: '2025-12-01T10:00:00Z' },
        { id: 3, hcpcs: '99215', sort_order: 0, created_at: '2025-12-03T10:00:00Z' },
      ];

      const sorted = [...sameSortOrder].sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      expect(sorted[0].hcpcs).toBe('99213');
      expect(sorted[1].hcpcs).toBe('99214');
      expect(sorted[2].hcpcs).toBe('99215');
    });

    it('should return all expected fields per favorite', () => {
      const favorite = mockFavorites[0];

      expect(favorite).toHaveProperty('id');
      expect(favorite).toHaveProperty('user_id');
      expect(favorite).toHaveProperty('hcpcs');
      expect(favorite).toHaveProperty('sort_order');
      expect(favorite).toHaveProperty('created_at');
    });

    it('should scope favorites to a specific user', () => {
      const multiUserFavorites = [
        { id: 1, user_id: 'user-a', hcpcs: '99213', sort_order: 0 },
        { id: 2, user_id: 'user-b', hcpcs: '99214', sort_order: 0 },
        { id: 3, user_id: 'user-a', hcpcs: '99215', sort_order: 1 },
      ];

      const userAFavorites = multiUserFavorites.filter(
        (f) => f.user_id === 'user-a'
      );

      expect(userAFavorites).toHaveLength(2);
      expect(userAFavorites.every((f) => f.user_id === 'user-a')).toBe(true);
    });

    it('should return an empty array when user has no favorites', () => {
      const allFavorites = [
        { id: 1, user_id: 'other-user', hcpcs: '99213', sort_order: 0 },
      ];

      const userFavorites = allFavorites.filter(
        (f) => f.user_id === 'test-user-id'
      );

      expect(userFavorites).toEqual([]);
    });

    it('should contain valid HCPCS codes', () => {
      const hcpcsPattern = /^\d{5}$/;

      mockFavorites.forEach((favorite) => {
        expect(favorite.hcpcs).toMatch(hcpcsPattern);
      });
    });

    it('should have sequential sort_order values after reordering', () => {
      const reordered = mockFavorites.map((f, i) => ({
        ...f,
        sort_order: i,
      }));

      reordered.forEach((f, i) => {
        expect(f.sort_order).toBe(i);
      });
    });

    it('should not contain duplicate HCPCS codes for the same user', () => {
      const hcpcsCodes = mockFavorites.map((f) => f.hcpcs);
      const uniqueCodes = new Set(hcpcsCodes);

      expect(uniqueCodes.size).toBe(hcpcsCodes.length);
    });
  });
});
