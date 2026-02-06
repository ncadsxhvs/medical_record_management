import { createMockRequest } from '../helpers/test-utils';

// Mock dependencies FIRST - before any imports that use them
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}));

// Import after mocking
import { getAuthenticatedUser, getUserId } from '@/lib/mobile-auth';
import { auth } from '@/auth';
import { jwtVerify } from 'jose';

describe('mobile-auth library', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getAuthenticatedUser', () => {
    it('should return user from valid JWT token', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DEV_BYPASS_AUTH = 'false';

      (jwtVerify as jest.Mock).mockResolvedValue({
        payload: {
          sub: 'google-id-123',
          email: 'user@example.com',
          name: 'John Doe',
        },
      });

      const request = createMockRequest({
        headers: {
          'Authorization': 'Bearer valid-jwt-token',
        },
      });

      const user = await getAuthenticatedUser(request);

      expect(user).toMatchObject({
        id: 'google-id-123',
        email: 'user@example.com',
        name: 'John Doe',
      });
    });

    it('should return null for invalid JWT token', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DEV_BYPASS_AUTH = 'false';

      (jwtVerify as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      const request = createMockRequest({
        headers: {
          'Authorization': 'Bearer invalid-jwt-token',
        },
      });

      const user = await getAuthenticatedUser(request);

      expect(user).toBeNull();
    });

    it('should return null if JWT payload is missing sub', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DEV_BYPASS_AUTH = 'false';

      (jwtVerify as jest.Mock).mockResolvedValue({
        payload: {
          // sub is missing
          email: 'user@example.com',
        },
      });

      const request = createMockRequest({
        headers: {
          'Authorization': 'Bearer token-without-sub',
        },
      });

      const user = await getAuthenticatedUser(request);

      expect(user).toBeNull();
    });

    it('should return null if JWT payload is missing email', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DEV_BYPASS_AUTH = 'false';

      (jwtVerify as jest.Mock).mockResolvedValue({
        payload: {
          sub: 'google-id-123',
          // email is missing
        },
      });

      const request = createMockRequest({
        headers: {
          'Authorization': 'Bearer token-without-email',
        },
      });

      const user = await getAuthenticatedUser(request);

      expect(user).toBeNull();
    });

    it('should fall back to NextAuth session if no JWT token', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DEV_BYPASS_AUTH = 'false';

      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: 'session-user-id',
          email: 'session@example.com',
          name: 'Session User',
          image: 'https://example.com/avatar.jpg',
        },
      });

      const request = createMockRequest({
        // No Authorization header
      });

      const user = await getAuthenticatedUser(request);

      expect(user).toMatchObject({
        id: 'session-user-id',
        email: 'session@example.com',
        name: 'Session User',
      });
    });

    it('should use email as fallback if session user has no id', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DEV_BYPASS_AUTH = 'false';

      (auth as jest.Mock).mockResolvedValue({
        user: {
          // id is missing
          email: 'user@example.com',
          name: 'User Name',
        },
      });

      const request = createMockRequest();

      const user = await getAuthenticatedUser(request);

      expect(user).toMatchObject({
        id: 'user@example.com',
        email: 'user@example.com',
      });
    });

    it('should return null if no authentication method succeeds', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DEV_BYPASS_AUTH = 'false';

      (auth as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest();

      const user = await getAuthenticatedUser(request);

      expect(user).toBeNull();
    });

    it('should return mock user in dev bypass mode', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DEV_BYPASS_AUTH = 'true';
      process.env.DEV_USER_ID = 'dev-user-456';
      process.env.DEV_USER_EMAIL = 'dev@test.com';

      const request = createMockRequest();

      const user = await getAuthenticatedUser(request);

      expect(user).toMatchObject({
        id: 'dev-user-456',
        email: 'dev@test.com',
        name: 'Dev User',
      });

      // Verify NextAuth and JWT were not called
      expect(auth).not.toHaveBeenCalled();
      expect(jwtVerify).not.toHaveBeenCalled();
    });

    it('should not bypass in production even if DEV_BYPASS_AUTH=true', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DEV_BYPASS_AUTH = 'true'; // Should be ignored

      (auth as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest();

      const user = await getAuthenticatedUser(request);

      expect(user).toBeNull();
      expect(auth).toHaveBeenCalled(); // Should use normal auth
    });

    it('should prioritize JWT token over session cookie', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DEV_BYPASS_AUTH = 'false';

      (jwtVerify as jest.Mock).mockResolvedValue({
        payload: {
          sub: 'jwt-user-id',
          email: 'jwt@example.com',
          name: 'JWT User',
        },
      });

      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: 'session-user-id',
          email: 'session@example.com',
        },
      });

      const request = createMockRequest({
        headers: {
          'Authorization': 'Bearer jwt-token',
        },
      });

      const user = await getAuthenticatedUser(request);

      expect(user?.id).toBe('jwt-user-id');
      expect(auth).not.toHaveBeenCalled(); // Session should not be checked
    });

    it('should handle Bearer token without space correctly', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DEV_BYPASS_AUTH = 'false';

      (auth as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest({
        headers: {
          'Authorization': 'BearerInvalidFormat',
        },
      });

      const user = await getAuthenticatedUser(request);

      // Should fall back to session (which returns null)
      expect(user).toBeNull();
      expect(jwtVerify).not.toHaveBeenCalled();
    });
  });

  describe('getUserId', () => {
    it('should return user id from authenticated user', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DEV_BYPASS_AUTH = 'false';

      (jwtVerify as jest.Mock).mockResolvedValue({
        payload: {
          sub: 'user-id-123',
          email: 'user@example.com',
        },
      });

      const request = createMockRequest({
        headers: {
          'Authorization': 'Bearer valid-token',
        },
      });

      const userId = await getUserId(request);

      expect(userId).toBe('user-id-123');
    });

    it('should return null if no user is authenticated', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DEV_BYPASS_AUTH = 'false';

      (auth as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest();

      const userId = await getUserId(request);

      expect(userId).toBeNull();
    });

    it('should return dev user id in bypass mode', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DEV_BYPASS_AUTH = 'true';
      process.env.DEV_USER_ID = 'dev-user-999';

      const request = createMockRequest();

      const userId = await getUserId(request);

      expect(userId).toBe('dev-user-999');
    });
  });
});
