import { createMockRequest, mockDbResponse, createMockVisit, createMockProcedure } from '../../helpers/test-utils';

// Mock dependencies FIRST
jest.mock('@/lib/db', () => ({
  sql: jest.fn(),
}));
jest.mock('@/lib/mobile-auth', () => ({
  getUserId: jest.fn(),
  getAuthenticatedUser: jest.fn(),
}));

// Import after mocking
import { GET, POST } from '@/app/api/visits/route';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/mobile-auth';

describe('/api/visits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/visits', () => {
    it('should return all visits for authenticated user', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const mockVisit = createMockVisit();
      const mockProcedure = createMockProcedure();

      // Mock visits query
      (sql as jest.Mock).mockResolvedValueOnce(
        mockDbResponse([mockVisit])
      );

      // Mock procedures query
      (sql as jest.Mock).mockResolvedValueOnce(
        mockDbResponse([mockProcedure])
      );

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/visits',
        headers: { 'Authorization': 'Bearer test-token' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data[0]).toMatchObject({
        id: mockVisit.id,
        user_id: mockVisit.user_id,
        date: mockVisit.date,
      });
      expect(data[0].procedures).toHaveLength(1);
      expect(data[0].procedures[0].hcpcs).toBe('99213');
    });

    it('should return empty array if no visits exist', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      // Mock empty visits query
      (sql as jest.Mock).mockResolvedValue(mockDbResponse([]));

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/visits',
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
        url: 'http://localhost:3001/api/visits',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 500 if database query fails', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');
      (sql as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/visits',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch visits');
    });

    it('should group procedures by visit correctly', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const visit1 = createMockVisit({ id: 1 });
      const visit2 = createMockVisit({ id: 2 });
      const proc1 = createMockProcedure({ id: 1, visit_id: 1, hcpcs: '99213' });
      const proc2 = createMockProcedure({ id: 2, visit_id: 1, hcpcs: '99214' });
      const proc3 = createMockProcedure({ id: 3, visit_id: 2, hcpcs: '93000' });

      (sql as jest.Mock).mockResolvedValueOnce(mockDbResponse([visit1, visit2]));
      (sql as jest.Mock).mockResolvedValueOnce(mockDbResponse([proc1, proc2, proc3]));

      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3001/api/visits',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(data[0].procedures).toHaveLength(2);
      expect(data[1].procedures).toHaveLength(1);
      expect(data[0].procedures[0].hcpcs).toBe('99213');
      expect(data[0].procedures[1].hcpcs).toBe('99214');
      expect(data[1].procedures[0].hcpcs).toBe('93000');
    });
  });

  describe('POST /api/visits', () => {
    it('should create a new visit with procedures', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const newVisit = createMockVisit({ id: 10 });
      const newProcedure = createMockProcedure({ id: 20, visit_id: 10 });

      // Mock visit insert
      (sql as jest.Mock).mockResolvedValueOnce(mockDbResponse([newVisit]));

      // Mock procedure insert
      (sql as jest.Mock).mockResolvedValueOnce(mockDbResponse([newProcedure]));

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/visits',
        body: {
          date: '2025-01-26',
          time: '14:30:00',
          notes: 'Test visit',
          is_no_show: false,
          procedures: [{
            hcpcs: '99213',
            description: 'Office visit',
            status_code: 'A',
            work_rvu: 1.30,
            quantity: 1,
          }],
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe(10);
      expect(data.procedures).toHaveLength(1);
      expect(data.procedures[0].hcpcs).toBe('99213');
    });

    it('should create a no-show visit without procedures', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const noShowVisit = createMockVisit({
        id: 15,
        is_no_show: true,
      });

      (sql as jest.Mock).mockResolvedValueOnce(mockDbResponse([noShowVisit]));

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/visits',
        body: {
          date: '2025-01-26',
          notes: 'Patient did not show',
          is_no_show: true,
          procedures: [],
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.is_no_show).toBe(true);
      expect(data.procedures).toHaveLength(0);
    });

    it('should return 400 if date is missing', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/visits',
        body: {
          // date is missing
          procedures: [{
            hcpcs: '99213',
            description: 'Office visit',
            status_code: 'A',
            work_rvu: 1.30,
            quantity: 1,
          }],
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Date is required');
    });

    it('should return 400 if procedures are missing for regular visit', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/visits',
        body: {
          date: '2025-01-26',
          is_no_show: false,
          procedures: [], // Empty procedures for regular visit
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 401 if user is not authenticated', async () => {
      (getUserId as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/visits',
        body: {
          date: '2025-01-26',
          procedures: [],
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should set quantity to 1 if not provided', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const newVisit = createMockVisit({ id: 25 });
      (sql as jest.Mock).mockResolvedValueOnce(mockDbResponse([newVisit]));
      (sql as jest.Mock).mockResolvedValueOnce(mockDbResponse([
        createMockProcedure({ id: 30, visit_id: 25, quantity: 1 })
      ]));

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/visits',
        body: {
          date: '2025-01-26',
          procedures: [{
            hcpcs: '99213',
            description: 'Office visit',
            status_code: 'A',
            work_rvu: 1.30,
            // quantity is omitted
          }],
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.procedures[0].quantity).toBe(1);
    });

    it('should return 500 if database operation fails', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');
      (sql as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/visits',
        body: {
          date: '2025-01-26',
          procedures: [{
            hcpcs: '99213',
            description: 'Office visit',
            status_code: 'A',
            work_rvu: 1.30,
            quantity: 1,
          }],
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create visit');
    });
  });
});
