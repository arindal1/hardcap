import type { NextAuthConfig } from "next-auth";

// Edge-safe subset of the NextAuth config, shared by middleware.ts (which
// runs on the Edge runtime) and auth.ts (which runs on Node.js). Must not
// import PrismaAdapter, bcryptjs, or the Credentials provider's authorize()
// - none of those are Edge-runtime compatible, and middleware only needs
// enough config to decode the JWT session cookie, not to perform sign-in.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  // Render (and most PaaS) terminate TLS at a reverse proxy and forward
  // requests over plain HTTP with X-Forwarded-* headers. Must be set here
  // (not just in auth.ts) because middleware.ts builds its own NextAuth
  // instance from this shared config alone - without it, middleware's
  // auth() throws UntrustedHost on every request and breaks session
  // reads for all visitors on the deployed host.
  trustHost: true,
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) token.id = user.id;
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
};