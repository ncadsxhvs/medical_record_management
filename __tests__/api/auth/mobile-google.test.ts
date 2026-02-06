import { createMockRequest, mockDbResponse, createMockUser } from '../../helpers/test-utils';

// Mock dependencies FIRST
const mockVerifyIdToken = jest.fn();

jest.mock('@/lib/db', () => ({
  sql: jest.fn(),
}));

jest.mock('google-auth-library', () => {
  const mockVerify = jest.fn();
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken: mockVerify,
    })),
    __mockVerifyIdToken: mockVerify,
  };
});

jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock-jwt-token'),
  })),
}));

// Import after mocking
import { POST } from '@/app/api/auth/mobile/google/route';
import { sql } from '@/lib/db';
const googleAuthLib = require('google-auth-library');

describe('/api/auth/mobile/google', () => {
  let mockVerifyIdToken: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyIdToken = (googleAuthLib as any).__mockVerifyIdToken;
  });

  describe('POST', () => {
    it('should authenticate user with valid Google ID token', async () => {
      const mockUser = createMockUser({
        id: 'google-id-123',
        email: 'user@example.com',
        name: 'John Doe',
      });

      // Mock Google token verification
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'google-id-123',
          email: 'user@example.com',
          name: 'John Doe',
          picture: 'https://example.com/photo.jpg',
        }),
      });

      // Mock database upsert
      (sql as jest.Mock).mockResolvedValue(
        mockDbResponse([{
          id: 'google-id-123',
          email: 'user@example.com',
          name: 'John Doe',
          image: 'https://example.com/photo.jpg',
        }])
      );

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/auth/mobile/google',
        body: { idToken: 'valid-google-token' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toMatchObject({
        id: 'google-id-123',
        email: 'user@example.com',
        name: 'John Doe',
      });
      expect(data.sessionToken).toBe('mock-jwt-token');
      expect(data.expiresIn).toBe(2592000); // 30 days
    });

    it('should return 400 if idToken is missing', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/auth/mobile/google',
        body: {},
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing idToken');
    });

    it('should return 401 if Google token verification fails', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/auth/mobile/google',
        body: { idToken: 'invalid-token' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid ID token');
    });

    it('should return 401 if token payload is invalid', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => null, // Invalid payload
      });

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/auth/mobile/google',
        body: { idToken: 'token-with-invalid-payload' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid token payload');
    });

    it('should return 401 if payload missing sub or email', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'google-id-123',
          // email is missing
        }),
      });

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/auth/mobile/google',
        body: { idToken: 'token-missing-email' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid token payload');
    });

    it('should return 500 if database operation fails', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'google-id-123',
          email: 'user@example.com',
          name: 'John Doe',
        }),
      });

      // Mock database error
      (sql as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/auth/mobile/google',
        body: { idToken: 'valid-token' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create user session');
    });

    it('should upsert existing user', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'existing-user-id',
          email: 'existing@example.com',
          name: 'Updated Name',
          picture: 'https://example.com/new-photo.jpg',
        }),
      });

      (sql as jest.Mock).mockResolvedValue(
        mockDbResponse([{
          id: 'existing-user-id',
          email: 'existing@example.com',
          name: 'Updated Name',
          image: 'https://example.com/new-photo.jpg',
        }])
      );

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3001/api/auth/mobile/google',
        body: { idToken: 'valid-token' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.name).toBe('Updated Name');
      expect(sql).toHaveBeenCalled();
    });
  });
});
