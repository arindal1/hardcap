import bcrypt from "bcryptjs";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/schemas";
import { isRateLimited } from "@/lib/rate-limit";
import { authConfig } from "@/lib/auth.config";

// Fixed dummy hash to compare against when no user is found, so a
// nonexistent-email login takes the same code path (and roughly the same
// time) as a wrong-password login - prevents timing-based user enumeration.
const DUMMY_HASH = "$2b$12$CwaJqUV1V1V1V1V1V1V1VOQe6X8f8f8f8f8f8f8f8f8f8f8f8f8f8";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  // Render (and most PaaS) terminate TLS at a reverse proxy and forward
  // requests over plain HTTP with X-Forwarded-* headers. Without this,
  // NextAuth can't reliably determine the origin from a device that isn't
  // already holding a previously-issued cookie, breaking fresh sign-ins.
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        if (isRateLimited(`login:${parsed.data.email}`, 8, 10 * 60 * 1000)) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        const valid = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !user.passwordHash || !valid) return null;

        return { id: user.id, email: user.email };
      },
    }),
  ],
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
});