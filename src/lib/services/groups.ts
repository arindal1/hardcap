import { prisma } from "@/lib/db";
import { computeGroupBalance, computeUnallocatedIncome } from "@/lib/budget";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function monthRange(month: string): { start: Date; end: Date } {
  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end };
}

export async function listGroupsWithBalances(userId: string, month = currentMonth()) {
  const { start, end } = monthRange(month);

  const groups = await prisma.expenseGroup.findMany({
    where: { userId, isArchived: false },
    orderBy: { createdAt: "asc" },
  });

  const spentByGroup = await prisma.expense.groupBy({
    by: ["groupId"],
    where: { userId, spentAt: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  const spentMap = new Map(spentByGroup.map((row) => [row.groupId, Number(row._sum.amount ?? 0)]));

  return groups.map((group) => {
    const spent = spentMap.get(group.id) ?? 0;
    const balance = computeGroupBalance(Number(group.budgetCap), spent);
    return { ...group, budgetCap: Number(group.budgetCap), ...balance };
  });
}

export async function getUnallocatedIncome(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const groups = await prisma.expenseGroup.findMany({
    where: { userId, isArchived: false },
    select: { budgetCap: true },
  });
  const totalCaps = groups.reduce((sum, g) => sum + Number(g.budgetCap), 0);
  return computeUnallocatedIncome(Number(user.monthlyIncome), totalCaps);
}

export async function createGroup(userId: string, name: string, budgetCap: number) {
  const group = await prisma.expenseGroup.create({
    data: { userId, name, budgetCap },
  });
  await prisma.budgetPeriod.create({
    data: { userId, groupId: group.id, month: currentMonth(), budgetCap },
  });
  return group;
}

export async function updateGroup(
  userId: string,
  groupId: string,
  data: { name?: string; budgetCap?: number }
) {
  const existing = await prisma.expenseGroup.findFirst({ where: { id: groupId, userId } });
  if (!existing) return null;

  const group = await prisma.expenseGroup.update({
    where: { id: groupId },
    data,
  });

  if (data.budgetCap !== undefined) {
    await prisma.budgetPeriod.upsert({
      where: { groupId_month: { groupId, month: currentMonth() } },
      create: { userId, groupId, month: currentMonth(), budgetCap: data.budgetCap },
      update: { budgetCap: data.budgetCap },
    });
  }

  return group;
}

export async function archiveGroup(userId: string, groupId: string) {
  const existing = await prisma.expenseGroup.findFirst({ where: { id: groupId, userId } });
  if (!existing) return null;
  await prisma.expenseGroup.update({ where: { id: groupId }, data: { isArchived: true } });
  return true;
}