import { prisma } from "@/lib/db";

export interface ExpenseFilters {
  groupId?: string;
  from?: Date;
  to?: Date;
}

export async function listExpenses(userId: string, filters: ExpenseFilters = {}) {
  return prisma.expense.findMany({
    where: {
      userId,
      groupId: filters.groupId,
      spentAt: {
        gte: filters.from,
        lte: filters.to,
      },
    },
    orderBy: { spentAt: "desc" },
    include: { group: { select: { name: true } } },
  });
}

export async function createExpense(
  userId: string,
  data: { amount: number; groupId: string; note?: string; spentAt?: Date }
) {
  const group = await prisma.expenseGroup.findFirst({
    where: { id: data.groupId, userId, isArchived: false },
  });
  if (!group) return null;

  return prisma.expense.create({
    data: {
      userId,
      groupId: data.groupId,
      amount: data.amount,
      note: data.note,
      spentAt: data.spentAt ?? new Date(),
    },
  });
}

export async function updateExpense(
  userId: string,
  expenseId: string,
  data: { amount?: number; groupId?: string; note?: string; spentAt?: Date }
) {
  const existing = await prisma.expense.findFirst({ where: { id: expenseId, userId } });
  if (!existing) return null;

  if (data.groupId) {
    const group = await prisma.expenseGroup.findFirst({
      where: { id: data.groupId, userId, isArchived: false },
    });
    if (!group) return null;
  }

  return prisma.expense.update({ where: { id: expenseId }, data });
}

export async function deleteExpense(userId: string, expenseId: string) {
  const existing = await prisma.expense.findFirst({ where: { id: expenseId, userId } });
  if (!existing) return null;
  await prisma.expense.delete({ where: { id: expenseId } });
  return true;
}