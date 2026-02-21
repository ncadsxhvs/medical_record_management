import { auth } from '@/auth';
import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

/**
 * Verify JWT token from mobile app
 */
async function verifyMobileToken(token: string): Promise<AuthUser | null> {
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (!payload.sub || !payload.email) {
      return null;
    }

    return {
      id: payload.sub as string,
      email: payload.email as string,
      name: (payload.name as string) || null,
      image: null,
    };
  } catch (error) {
    console.error('[Mobile Auth] JWT verification failed:', error);
    return null;
  }
}

/**
 * Get authenticated user from either NextAuth session or mobile JWT token
 *
 * Supports:
 * 1. NextAuth web sessions (cookies)
 * 2. Mobile app JWT tokens (Authorization: Bearer <token>)
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<AuthUser | null> {
  // Check for mobile JWT token in Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const user = await verifyMobileToken(token);

    if (user) {
      console.log('[Mobile Auth] Mobile token verified for:', user.email);
      return user;
    }

    // Invalid token, but header was present
    console.log('[Mobile Auth] Invalid mobile token provided');
    return null;
  }

  // Fall back to NextAuth session (web)
  const session = await auth();
  if (session?.user) {
    const userId = session.user.id || session.user.email;
    if (userId) {
      return {
        id: userId,
        email: session.user.email || '',
        name: session.user.name,
        image: session.user.image,
      };
    }
  }

  return null;
}

/**
 * Get user ID from authenticated user (convenience function)
 */
export async function getUserId(req: NextRequest): Promise<string | null> {
  const user = await getAuthenticatedUser(req);
  return user?.id || null;
}
