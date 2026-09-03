import { prisma } from "@/lib/db";
import { requestGeminiMonthEndReview } from "@/lib/gemini";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function monthRange(month: string): { start: Date; end: Date } {
  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end };
}

export class MonthNotCompletedError extends Error {
  constructor() {
    super("Can only generate a review for a completed month");
  }
}

// Cached per user+month (unique constraint) - generated on-demand the first
// time it's requested, since there's no scheduler to generate it automatically.
export async function generateMonthEndReview(userId: string, month: string) {
  if (month >= currentMonth()) throw new MonthNotCompletedError();

  const existing = await prisma.monthEndReviewSnapshot.findUnique({
    where: { userId_month: { userId, month } },
  });
  if (existing) return existing;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const { start, end } = monthRange(month);

  const periods = await prisma.budgetPeriod.findMany({
    where: { userId, month },
    include: { group: { select: { name: true } } },
  });
  const spentRows = await prisma.expense.groupBy({
    by: ["groupId"],
    where: { userId, spentAt: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  const spentMap = new Map(spentRows.map((row) => [row.groupId, Number(row._sum.amount ?? 0)]));

  const groups = periods.map((period) => {
    const cap = Number(period.budgetCap);
    const spent = spentMap.get(period.groupId) ?? 0;
    return { name: period.group.name, cap, spent, isOverCap: spent > cap };
  });
  const totalCap = groups.reduce((sum, g) => sum + g.cap, 0);
  const totalSpent = groups.reduce((sum, g) => sum + g.spent, 0);

  const payload = {
    month,
    monthlyIncome: Number(user.monthlyIncome),
    totalCap,
    totalSpent,
    closedUnderBudget: totalSpent <= totalCap,
    groups,
  };

  const responseText = await requestGeminiMonthEndReview(payload);

  return prisma.monthEndReviewSnapshot.create({
    data: { userId, month, inputSummary: payload, responseText },
  });
}

export async function listMonthEndReviews(userId: string) {
  return prisma.monthEndReviewSnapshot.findMany({
    where: { userId },
    orderBy: { month: "desc" },
  });
}

// Which past months have data (BudgetPeriod rows) but no review generated yet -
// drives the "Generate review" list in the UI.
export async function listCompletedMonthsWithoutReview(userId: string) {
  const month = currentMonth();
  const [periods, reviews] = await Promise.all([
    prisma.budgetPeriod.findMany({
      where: { userId, month: { lt: month } },
      select: { month: true },
      distinct: ["month"],
      orderBy: { month: "desc" },
    }),
    prisma.monthEndReviewSnapshot.findMany({ where: { userId }, select: { month: true } }),
  ]);
  const reviewed = new Set(reviews.map((r) => r.month));
  return periods.map((p) => p.month).filter((m) => !reviewed.has(m));
}