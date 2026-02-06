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
import { PUT, DELETE } from '@/app/api/visits/[id]/route';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/mobile-auth';

describe('/api/visits/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT /api/visits/:id', () => {
    it('should update an existing visit', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const updatedVisit = createMockVisit({ id: 1, notes: 'Updated notes' });
      const updatedProcedure = createMockProcedure({ id: 5, visit_id: 1, hcpcs: '99214' });

      // Mock visit update
      (sql as jest.Mock).mockResolvedValueOnce(mockDbResponse([updatedVisit]));

      // Mock delete old procedures
      (sql as jest.Mock).mockResolvedValueOnce(mockDbResponse([]));

      // Mock insert new procedures
      (sql as jest.Mock).mockResolvedValueOnce(mockDbResponse([updatedProcedure]));

      const request = createMockRequest({
        method: 'PUT',
        url: 'http://localhost:3001/api/visits/1',
        body: {
          date: '2025-01-26',
          time: '15:00:00',
          notes: 'Updated notes',
          procedures: [{
            hcpcs: '99214',
            description: 'Office visit',
            status_code: 'A',
            work_rvu: 1.92,
            quantity: 1,
          }],
        },
      });

      const params = Promise.resolve({ id: '1' });
      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(1);
      expect(data.notes).toBe('Updated notes');
      expect(data.procedures[0].hcpcs).toBe('99214');
    });

    it('should return 404 if visit not found', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      // Mock visit not found
      (sql as jest.Mock).mockResolvedValueOnce(mockDbResponse([]));

      const request = createMockRequest({
        method: 'PUT',
        url: 'http://localhost:3001/api/visits/999',
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

      const params = Promise.resolve({ id: '999' });
      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Visit not found or unauthorized');
    });

    it('should return 400 if date is missing', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const request = createMockRequest({
        method: 'PUT',
        url: 'http://localhost:3001/api/visits/1',
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

      const params = Promise.resolve({ id: '1' });
      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 400 if procedures are missing', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const request = createMockRequest({
        method: 'PUT',
        url: 'http://localhost:3001/api/visits/1',
        body: {
          date: '2025-01-26',
          procedures: [], // Empty procedures
        },
      });

      const params = Promise.resolve({ id: '1' });
      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 401 if user is not authenticated', async () => {
      (getUserId as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest({
        method: 'PUT',
        url: 'http://localhost:3001/api/visits/1',
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

      const params = Promise.resolve({ id: '1' });
      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should replace all procedures', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const updatedVisit = createMockVisit({ id: 1 });
      const proc1 = createMockProcedure({ id: 10, visit_id: 1, hcpcs: '99213' });
      const proc2 = createMockProcedure({ id: 11, visit_id: 1, hcpcs: '99214' });

      (sql as jest.Mock).mockResolvedValueOnce(mockDbResponse([updatedVisit]));
      (sql as jest.Mock).mockResolvedValueOnce(mockDbResponse([])); // DELETE
      (sql as jest.Mock).mockResolvedValueOnce(mockDbResponse([proc1])); // INSERT proc1
      (sql as jest.Mock).mockResolvedValueOnce(mockDbResponse([proc2])); // INSERT proc2

      const request = createMockRequest({
        method: 'PUT',
        url: 'http://localhost:3001/api/visits/1',
        body: {
          date: '2025-01-26',
          procedures: [
            {
              hcpcs: '99213',
              description: 'Office visit 1',
              status_code: 'A',
              work_rvu: 1.30,
              quantity: 1,
            },
            {
              hcpcs: '99214',
              description: 'Office visit 2',
              status_code: 'A',
              work_rvu: 1.92,
              quantity: 1,
            },
          ],
        },
      });

      const params = Promise.resolve({ id: '1' });
      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.procedures).toHaveLength(2);

      // Verify sql was called multiple times (UPDATE visit, DELETE procedures, INSERT new procedures)
      expect(sql).toHaveBeenCalled();
    });

    it('should return 500 if database operation fails', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');
      (sql as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({
        method: 'PUT',
        url: 'http://localhost:3001/api/visits/1',
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

      const params = Promise.resolve({ id: '1' });
      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update visit');
    });
  });

  describe('DELETE /api/visits/:id', () => {
    it('should delete an existing visit', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const deletedVisit = createMockVisit({ id: 1 });

      // Mock visit delete
      (sql as jest.Mock).mockResolvedValueOnce(mockDbResponse([deletedVisit]));

      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3001/api/visits/1',
      });

      const params = Promise.resolve({ id: '1' });
      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Visit deleted successfully');
    });

    it('should return 404 if visit not found', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      // Mock visit not found
      (sql as jest.Mock).mockResolvedValueOnce(mockDbResponse([]));

      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3001/api/visits/999',
      });

      const params = Promise.resolve({ id: '999' });
      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Visit not found or unauthorized');
    });

    it('should return 401 if user is not authenticated', async () => {
      (getUserId as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3001/api/visits/1',
      });

      const params = Promise.resolve({ id: '1' });
      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should cascade delete associated procedures', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');

      const deletedVisit = createMockVisit({ id: 1 });
      (sql as jest.Mock).mockResolvedValueOnce(mockDbResponse([deletedVisit]));

      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3001/api/visits/1',
      });

      const params = Promise.resolve({ id: '1' });
      const response = await DELETE(request, { params });

      expect(response.status).toBe(200);

      // Verify DELETE was called
      expect(sql).toHaveBeenCalled();
    });

    it('should return 500 if database operation fails', async () => {
      (getUserId as jest.Mock).mockResolvedValue('test-user-123');
      (sql as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({
        method: 'DELETE',
        url: 'http://localhost:3001/api/visits/1',
      });

      const params = Promise.resolve({ id: '1' });
      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete visit');
    });
  });
});
