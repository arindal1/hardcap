import { prisma } from "@/lib/db";
import {
  computeEmergencyFundBalance,
  computeGroupBalance,
  computeRolloverAmount,
  computeUnallocatedIncome,
} from "@/lib/budget";
import { getTotalActiveGoalSaved } from "@/lib/services/goals";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function monthRange(month: string): { start: Date; end: Date } {
  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end };
}

function previousMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m - 2, 1)).toISOString().slice(0, 7);
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

  // Rollover only applies to groups that opted in - carries forward last
  // month's unspent surplus (never a deficit) as extra room this month.
  const rolloverGroupIds = groups.filter((g) => g.rolloverEnabled).map((g) => g.id);
  const rolloverByGroup = new Map<string, number>();
  if (rolloverGroupIds.length > 0) {
    const prevMonth = previousMonth(month);
    const { start: prevStart, end: prevEnd } = monthRange(prevMonth);
    const [prevPeriods, prevSpentRows] = await Promise.all([
      prisma.budgetPeriod.findMany({ where: { userId, month: prevMonth, groupId: { in: rolloverGroupIds } } }),
      prisma.expense.groupBy({
        by: ["groupId"],
        where: { userId, groupId: { in: rolloverGroupIds }, spentAt: { gte: prevStart, lt: prevEnd } },
        _sum: { amount: true },
      }),
    ]);
    const prevSpentMap = new Map(prevSpentRows.map((row) => [row.groupId, Number(row._sum.amount ?? 0)]));
    for (const period of prevPeriods) {
      rolloverByGroup.set(
        period.groupId,
        computeRolloverAmount(Number(period.budgetCap), prevSpentMap.get(period.groupId) ?? 0)
      );
    }
  }

  const withBalances = groups.map((group) => {
    const spent = spentMap.get(group.id) ?? 0;
    const baseCap = Number(group.budgetCap);
    const rolloverAmount = group.rolloverEnabled ? rolloverByGroup.get(group.id) ?? 0 : 0;
    const balance = computeGroupBalance(baseCap + rolloverAmount, spent);
    return { ...group, budgetCap: baseCap, baseCap, rolloverAmount, ...balance, drawnFromOverage: 0 };
  });

  // The Emergency Fund absorbs every other group's overage instead of the
  // user seeing negative balances scattered across groups - see
  // lib/budget.ts computeEmergencyFundBalance.
  const emergencyFund = withBalances.find((g) => g.isEmergencyFund);
  if (!emergencyFund) return withBalances;

  const totalOverage = withBalances
    .filter((g) => !g.isEmergencyFund)
    .reduce((sum, g) => sum + g.overageAmount, 0);
  const efBalance = computeEmergencyFundBalance(emergencyFund.cap, emergencyFund.spent, totalOverage);

  return withBalances.map((group) =>
    group.id === emergencyFund.id
      ? {
          ...group,
          remaining: efBalance.remaining,
          isOverCap: efBalance.isDepleted,
          overageAmount: efBalance.isDepleted ? -efBalance.remaining : 0,
          drawnFromOverage: efBalance.drawnFromOverage,
        }
      : group
  );
}

export async function getUnallocatedIncome(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const groups = await prisma.expenseGroup.findMany({
    where: { userId, isArchived: false },
    select: { budgetCap: true },
  });
  const totalCaps = groups.reduce((sum, g) => sum + Number(g.budgetCap), 0);
  const totalGoalSaved = await getTotalActiveGoalSaved(userId);
  return computeUnallocatedIncome(Number(user.monthlyIncome), totalCaps, totalGoalSaved);
}

export class EmergencyFundConflictError extends Error {
  constructor() {
    super("Only one active group can be the Emergency Fund");
  }
}

export async function createGroup(
  userId: string,
  data: {
    name: string;
    budgetCap: number;
    color?: string;
    icon?: string;
    rolloverEnabled?: boolean;
    isEmergencyFund?: boolean;
  }
) {
  if (data.isEmergencyFund) {
    const conflict = await prisma.expenseGroup.findFirst({
      where: { userId, isArchived: false, isEmergencyFund: true },
    });
    if (conflict) throw new EmergencyFundConflictError();
  }

  const group = await prisma.expenseGroup.create({
    data: { userId, ...data },
  });
  await prisma.budgetPeriod.create({
    data: { userId, groupId: group.id, month: currentMonth(), budgetCap: data.budgetCap },
  });
  return group;
}

export async function updateGroup(
  userId: string,
  groupId: string,
  data: {
    name?: string;
    budgetCap?: number;
    color?: string;
    icon?: string;
    rolloverEnabled?: boolean;
    isEmergencyFund?: boolean;
  }
) {
  const existing = await prisma.expenseGroup.findFirst({ where: { id: groupId, userId } });
  if (!existing) return null;

  if (data.isEmergencyFund) {
    const conflict = await prisma.expenseGroup.findFirst({
      where: { userId, isArchived: false, isEmergencyFund: true, NOT: { id: groupId } },
    });
    if (conflict) throw new EmergencyFundConflictError();
  }

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

export async function listArchivedGroups(userId: string) {
  const groups = await prisma.expenseGroup.findMany({
    where: { userId, isArchived: true },
    orderBy: { updatedAt: "desc" },
  });
  return groups.map((group) => ({ ...group, budgetCap: Number(group.budgetCap) }));
}

export class ActiveNameConflictError extends Error {
  constructor() {
    super("An active group with this name already exists");
  }
}

export async function restoreGroup(userId: string, groupId: string) {
  const existing = await prisma.expenseGroup.findFirst({ where: { id: groupId, userId, isArchived: true } });
  if (!existing) return null;

  const activeConflict = await prisma.expenseGroup.findFirst({
    where: { userId, isArchived: false, name: { equals: existing.name, mode: "insensitive" } },
  });
  if (activeConflict) throw new ActiveNameConflictError();

  return prisma.expenseGroup.update({ where: { id: groupId }, data: { isArchived: false } });
}

// Permanently removes an archived group and, via the schema's onDelete: Cascade
// relations, all of its Expense and BudgetPeriod rows. Irreversible - only
// operates on already-archived groups so the destructive action requires two
// deliberate steps (archive, then permanently delete).
export async function deleteGroupPermanently(userId: string, groupId: string) {
  const existing = await prisma.expenseGroup.findFirst({ where: { id: groupId, userId, isArchived: true } });
  if (!existing) return null;
  await prisma.expenseGroup.delete({ where: { id: groupId } });
  return true;
}

// Budget health grade - fraction of past (completed, not the current month's)
// group-months that went over their recorded cap. Only completed months count
// since the current month hasn't finished yet.
export async function computeBudgetHealth(userId: string, month = currentMonth()) {
  const periods = await prisma.budgetPeriod.findMany({ where: { userId, month: { lt: month } } });
  if (periods.length === 0) return { grade: "A" as const, overageFrequency: 0, monthsConsidered: 0 };

  const { start } = monthRange(month);
  const pastExpenses = await prisma.expense.findMany({
    where: { userId, spentAt: { lt: start } },
    select: { groupId: true, amount: true, spentAt: true },
  });
  const spentByKey = new Map<string, number>();
  for (const expense of pastExpenses) {
    const key = `${expense.groupId}:${expense.spentAt.toISOString().slice(0, 7)}`;
    spentByKey.set(key, (spentByKey.get(key) ?? 0) + Number(expense.amount));
  }

  let overCount = 0;
  for (const period of periods) {
    const spent = spentByKey.get(`${period.groupId}:${period.month}`) ?? 0;
    if (spent > Number(period.budgetCap)) overCount++;
  }
  const overageFrequency = overCount / periods.length;
  return { overageFrequency, monthsConsidered: periods.length };
}

// Proxy for "did last month close under budget": did total spend across the
// groups that existed last month stay within their recorded caps. Returns
// null when there's no prior-month data to compare against.
export async function didPreviousMonthCloseUnderBudget(userId: string, month = currentMonth()) {
  const prevMonth = previousMonth(month);
  const periods = await prisma.budgetPeriod.findMany({ where: { userId, month: prevMonth } });
  if (periods.length === 0) return null;

  const { start, end } = monthRange(prevMonth);
  const groupIds = periods.map((p) => p.groupId);
  const spentRows = await prisma.expense.groupBy({
    by: ["groupId"],
    where: { userId, groupId: { in: groupIds }, spentAt: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  const totalSpent = spentRows.reduce((sum, row) => sum + Number(row._sum.amount ?? 0), 0);
  const totalCap = periods.reduce((sum, p) => sum + Number(p.budgetCap), 0);
  return totalSpent <= totalCap;
}