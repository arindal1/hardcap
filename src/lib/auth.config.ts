import type { NextAuthConfig } from "next-auth";

// Edge-safe subset of the NextAuth config, shared by middleware.ts (which
// runs on the Edge runtime) and auth.ts (which runs on Node.js). Must not
// import PrismaAdapter, bcryptjs, or the Credentials provider's authorize()
// — none of those are Edge-runtime compatible, and middleware only needs
// enough config to decode the JWT session cookie, not to perform sign-in.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
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
