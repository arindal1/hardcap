import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaKeepAlive: NodeJS.Timeout | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Neon (and similar managed Postgres providers) suspend the compute after 5
// minutes of idle, adding cold-start latency to the next query. Pinging the
// DB every 5 minutes keeps it warm. `unref()` so this timer never keeps a
// script/test process alive by itself, and cache on `globalThis` so dev HMR
// doesn't stack up duplicate intervals.
if (!globalForPrisma.prismaKeepAlive) {
  const interval = setInterval(
    () => {
      prisma.$queryRaw`SELECT 1`.catch(() => {
        // Best-effort keep-alive - a failed ping isn't actionable here.
      });
    },
    5 * 60 * 1000,
  );
  interval.unref?.();
  globalForPrisma.prismaKeepAlive = interval;
}