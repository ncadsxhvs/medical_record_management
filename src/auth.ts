import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { sql } from "@/lib/db"; // Import sql for database interaction

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    // Custom authorized callback - allow sign-in page when not authenticated
    authorized: async ({ auth, request }) => {
      const url = request.nextUrl;
      const isSignInPage = url.pathname === '/sign-in';

      // Allow access to sign-in page when not authenticated
      if (isSignInPage) return true;

      // Require auth for all other pages
      return !!auth;
    },
    // JWT Callback: Invoked when a JWT is created (on sign in, or subsequent requests)
    async jwt({ token, account, profile }) {
      // If token doesn't have an ID yet, try to get it from the database by email
      if (!token.id && token.email) {
        console.log('[JWT Callback] Token missing ID, fetching from DB for email:', token.email);
        try {
          const result = await sql`
            SELECT id FROM users WHERE email = ${token.email} LIMIT 1;
          `;
          if (result.rows.length > 0) {
            token.id = result.rows[0].id;
            console.log('[JWT Callback] Found existing user, token.id:', token.id);
          }
        } catch (error) {
          console.error('[JWT Callback] Error fetching user by email:', error);
        }
      }

      if (account && profile) {
        // User is signing in for the first time or account is being linked
        const googleId = profile.sub; // Google's unique user ID
        const email = profile.email;
        const name = profile.name; // user.name is also available, or profile.name
        const image = profile.picture; // user.image is also available, or profile.picture

        console.log('[JWT Callback] New sign-in, upserting user:', { googleId, email });

        // Upsert user into our 'users' table
        try {
          // Using a simple INSERT ... ON CONFLICT (id) DO UPDATE SET ...
          // If you prefer to use 'email' as the primary unique identifier for ON CONFLICT,
          // ensure 'email' has a UNIQUE constraint and adjust the ON CONFLICT clause accordingly.
          const upsertResult = await sql`
            INSERT INTO users (id, email, name, image)
            VALUES (${googleId}, ${email}, ${name}, ${image})
            ON CONFLICT (id) DO UPDATE SET
              email = EXCLUDED.email,
              name = EXCLUDED.name,
              image = EXCLUDED.image,
              updated_at = CURRENT_TIMESTAMP
            RETURNING id, email;
          `;
          // Attach our database user ID to the token
          token.id = upsertResult.rows[0].id;
          token.email = upsertResult.rows[0].email; // Ensure email is also updated in token
          console.log('[JWT Callback] User upserted, token.id:', token.id);
        } catch (dbError) {
          console.error("[JWT Callback] Database upsert error for user:", dbError);
          // Depending on your error handling strategy, you might want to:
          // 1. Throw the error: `throw new Error("Failed to process user data");`
          // 2. Return an error token: `token.error = "Failed to load user data";`
          // For now, we'll just log and continue, which might lead to issues later if token.id is missing.
        }
      }
      console.log('[JWT Callback] Returning token with id:', token.id);
      return token;
    },
    // Session Callback: Invoked whenever a session is checked
    async session({ session, token }) {
      console.log('[Session Callback] token.id:', token.id);
      // Add user ID from the token to the session object
      if (token.id) {
        session.user.id = token.id as string;
        console.log('[Session Callback] Added ID to session:', session.user.id);
      } else {
        console.log('[Session Callback] No token.id found! Using sub as fallback');
        // Fallback: use token.sub (Google ID) as the user ID
        if (token.sub) {
          session.user.id = token.sub;
          console.log('[Session Callback] Using sub as ID:', session.user.id);
        }
      }
      return session;
    },
  },
});