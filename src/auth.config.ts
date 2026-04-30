import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

const isDevBypass = process.env.DEV_BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development';

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    ...(isDevBypass
      ? [Credentials({
          credentials: {},
          async authorize() {
            return {
              id: process.env.DEV_USER_ID || 'sandbox-user',
              email: process.env.DEV_USER_EMAIL || 'sandbox@localhost',
              name: process.env.DEV_USER_NAME || 'Sandbox User',
            };
          },
        })]
      : []),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
  },
  trustHost: true,
  cookies: {
    pkceCodeVerifier: {
      name: "authjs.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
  },
  callbacks: {
    authorized: async ({ auth, request }) => {
      const url = request.nextUrl;
      if (url.pathname === '/sign-in') return true;
      return !!auth;
    },
  },
} satisfies NextAuthConfig;
