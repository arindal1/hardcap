import { prisma } from "@/lib/db";
import { classifySpendIntensity, computeBurnRate } from "@/lib/budget";
import { listGroupsWithBalances } from "@/lib/services/groups";

const HEATMAP_DAYS = 182;

function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// GitHub-style spending heatmap: one intensity bucket per day over the last
// ~6 months, classified relative to the user's average daily spend over that
// same window (see lib/budget.ts classifySpendIntensity).
export async function getSpendHeatmap(userId: string) {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - HEATMAP_DAYS);

  const expenses = await prisma.expense.findMany({
    where: { userId, spentAt: { gte: start, lte: end } },
    select: { amount: true, spentAt: true },
  });

  const spentByDay = new Map<string, number>();
  for (const expense of expenses) {
    const key = toDayKey(expense.spentAt);
    spentByDay.set(key, (spentByDay.get(key) ?? 0) + Number(expense.amount));
  }

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const averageDailySpend = totalSpent / HEATMAP_DAYS;

  const days: { date: string; intensity: ReturnType<typeof classifySpendIntensity> }[] = [];
  for (let i = HEATMAP_DAYS - 1; i >= 0; i--) {
    const day = new Date(end);
    day.setUTCDate(day.getUTCDate() - i);
    const key = toDayKey(day);
    const spend = spentByDay.get(key) ?? 0;
    days.push({ date: key, intensity: classifySpendIntensity(spend, averageDailySpend) });
  }
  return days;
}

function daysInMonth(month: string): number {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m, 0)).getUTCDate();
}

// Burn rate: total spend across every group vs. total cap, compared against
// how far through the month we are - see lib/budget.ts computeBurnRate.
export async function getBurnRate(userId: string) {
  const month = new Date().toISOString().slice(0, 7);
  const groups = await listGroupsWithBalances(userId, month);
  const totalBudget = groups.reduce((sum, g) => sum + g.cap, 0);
  const totalSpent = groups.reduce((sum, g) => sum + g.spent, 0);
  const dayOfMonth = new Date().getUTCDate();
  return computeBurnRate(totalSpent, totalBudget, dayOfMonth, daysInMonth(month));
}