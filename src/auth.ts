import NextAuth from "next-auth";
import { sql } from "@/lib/db";
import authConfig from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, account, profile, user }) {
      if (account?.provider === 'credentials' && user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        try {
          await sql`
            INSERT INTO users (id, email, name)
            VALUES (${user.id}, ${user.email}, ${user.name})
            ON CONFLICT (id) DO UPDATE SET
              email = EXCLUDED.email,
              name = EXCLUDED.name,
              updated_at = CURRENT_TIMESTAMP
          `;
        } catch (error) {
          console.error('[JWT Callback] Dev user upsert error:', error);
        }
        return token;
      }

      if (!token.id && token.email) {
        try {
          const result = await sql`
            SELECT id FROM users WHERE email = ${token.email} LIMIT 1;
          `;
          if (result.rows.length > 0) {
            token.id = result.rows[0].id;
          }
        } catch (error) {
          console.error('[JWT Callback] Error fetching user by email:', error);
        }
      }

      if (account && profile) {
        const googleId = profile.sub;
        const email = profile.email;
        const name = profile.name;
        const image = profile.picture;

        try {
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
          token.id = upsertResult.rows[0].id;
          token.email = upsertResult.rows[0].email;
        } catch (dbError) {
          console.error("[JWT Callback] Database upsert error for user:", dbError);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      } else if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
