import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { sql } from '@/lib/db';
import { generateSessionToken } from '@/lib/auth-token';

const APPLE_JWKS_URL = new URL('https://appleid.apple.com/auth/keys');
const appleJWKS = createRemoteJWKSet(APPLE_JWKS_URL);

export async function POST(req: NextRequest) {
  try {
    const { identityToken, fullName } = await req.json();

    if (!identityToken) {
      return NextResponse.json(
        { error: 'Missing identityToken' },
        { status: 400 }
      );
    }

    const appleClientId = process.env.APPLE_CLIENT_ID;
    if (!appleClientId) {
      console.error('[Mobile Auth Apple] APPLE_CLIENT_ID not configured');
      return NextResponse.json(
        { error: 'Apple Sign-In not configured' },
        { status: 500 }
      );
    }

    // Verify Apple identity token
    let payload;
    try {
      const result = await jwtVerify(identityToken, appleJWKS, {
        issuer: 'https://appleid.apple.com',
        audience: appleClientId,
      });
      payload = result.payload;
    } catch (error) {
      console.error('[Mobile Auth Apple] Token verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid identity token' },
        { status: 401 }
      );
    }

    if (!payload.sub || !payload.email) {
      return NextResponse.json(
        { error: 'Invalid token payload' },
        { status: 401 }
      );
    }

    const appleUserId = `apple_${payload.sub}`;
    const email = payload.email as string;
    // Apple only sends name on first sign-in; iOS app must forward it
    const name = fullName
      ? [fullName.givenName, fullName.familyName].filter(Boolean).join(' ') || null
      : null;

    // Upsert user into database
    try {
      const upsertResult = await sql`
        INSERT INTO users (id, email, name, image)
        VALUES (${appleUserId}, ${email}, ${name}, ${null})
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          name = CASE WHEN EXCLUDED.name IS NOT NULL THEN EXCLUDED.name ELSE users.name END,
          image = EXCLUDED.image,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id, email, name, image;
      `;

      const user = upsertResult.rows[0];

      const sessionToken = await generateSessionToken(user.id, user.email, user.name);

      console.log('[Mobile Auth Apple] User authenticated successfully:', user.email);

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        },
        sessionToken: sessionToken,
        expiresIn: 2592000, // 30 days in seconds
      });

    } catch (dbError) {
      console.error('[Mobile Auth Apple] Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create user session' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[Mobile Auth Apple] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
