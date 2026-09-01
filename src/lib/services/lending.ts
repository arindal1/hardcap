import { prisma } from "@/lib/db";

export async function listLendingEntries(userId: string) {
  return prisma.lendingEntry.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });
}

export async function createLendingEntry(
  userId: string,
  data: { personName: string; amount: number; reason?: string; date: Date }
) {
  return prisma.lendingEntry.create({ data: { userId, ...data } });
}

export async function updateLendingEntry(
  userId: string,
  entryId: string,
  data: { personName?: string; amount?: number; reason?: string; date?: Date; isSettled?: boolean }
) {
  const existing = await prisma.lendingEntry.findFirst({ where: { id: entryId, userId } });
  if (!existing) return null;

  return prisma.lendingEntry.update({
    where: { id: entryId },
    data: {
      ...data,
      settledAt: data.isSettled === undefined ? undefined : data.isSettled ? new Date() : null,
    },
  });
}

export async function deleteLendingEntry(userId: string, entryId: string) {
  const existing = await prisma.lendingEntry.findFirst({ where: { id: entryId, userId } });
  if (!existing) return null;
  await prisma.lendingEntry.delete({ where: { id: entryId } });
  return true;
}