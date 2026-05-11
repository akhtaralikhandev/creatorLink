import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config — no Node.js-only imports (no bcrypt, no Prisma).
 * Used by middleware.ts which runs in the Edge runtime.
 * The full config (with adapter + credentials provider) lives in lib/auth.ts.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string | undefined;
      }
      return session;
    },
  },
};
