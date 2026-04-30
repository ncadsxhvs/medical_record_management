import { getUserId } from '@/lib/mobile-auth';
import { NextRequest, NextResponse } from 'next/server';

type AuthenticatedHandler = (
  req: NextRequest,
  userId: string,
  context?: any
) => Promise<NextResponse>;

/**
 * Wrap an API route handler with authentication.
 * Extracts userId and returns 401 if unauthenticated.
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest, context?: any) => {
    try {
      const userId = await getUserId(req);
      if (!userId) {
        return apiError('Unauthorized', 401);
      }
      return await handler(req, userId, context);
    } catch (error) {
      console.error(`[API] ${req.method} ${req.nextUrl.pathname} error:`, error);
      return apiError('Internal server error', 500);
    }
  };
}

/**
 * Standardized error response helper
 */
export function apiError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}
