import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { sql } from '@/lib/db';
import { generateSessionToken } from '@/lib/auth-token';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'Missing idToken' },
        { status: 400 }
      );
    }

    // Verify the Google ID token
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (error) {
      console.error('[Mobile Auth] Token verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid ID token' },
        { status: 401 }
      );
    }

    const payload = ticket.getPayload();

    if (!payload || !payload.sub || !payload.email) {
      return NextResponse.json(
        { error: 'Invalid token payload' },
        { status: 401 }
      );
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name || null;
    const image = payload.picture || null;

    // Upsert user into database
    try {
      const upsertResult = await sql`
        INSERT INTO users (id, email, name, image)
        VALUES (${googleId}, ${email}, ${name}, ${image})
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          name = EXCLUDED.name,
          image = EXCLUDED.image,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id, email, name, image;
      `;

      const user = upsertResult.rows[0];

      // Generate session token for iOS app
      const sessionToken = await generateSessionToken(user.id, user.email, user.name);

      console.log('[Mobile Auth] User authenticated successfully:', user.email);

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
      console.error('[Mobile Auth] Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create user session' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[Mobile Auth] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
