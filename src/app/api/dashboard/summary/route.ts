import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeBudgetHealthGrade, computeOverallRemaining } from "@/lib/budget";
import {
  computeBudgetHealth,
  didPreviousMonthCloseUnderBudget,
  listGroupsWithBalances,
  getUnallocatedIncome,
} from "@/lib/services/groups";
import { getBurnRate, getSpendHeatmap } from "@/lib/services/analytics";
import type { GroupWithBalance } from "@/lib/types";

// Balance figures must never be served from a cached route response - always
// recompute live from the DB (see ARCHITECTURE.md "Balance computation").
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const groups = await listGroupsWithBalances(session.user.id);
  const totalSpent = groups.reduce((sum: number, g: GroupWithBalance) => sum + g.spent, 0);
  const unallocatedIncome = await getUnallocatedIncome(session.user.id);
  const health = await computeBudgetHealth(session.user.id);
  const previousMonthClosedUnderBudget = await didPreviousMonthCloseUnderBudget(session.user.id);
  const burnRate = await getBurnRate(session.user.id);
  const spendHeatmap = await getSpendHeatmap(session.user.id);

  return NextResponse.json({
    overallRemaining: computeOverallRemaining(Number(user.monthlyIncome), totalSpent),
    monthlyIncome: Number(user.monthlyIncome),
    totalSpent,
    unallocatedIncome,
    groups,
    budgetHealth: { ...health, grade: computeBudgetHealthGrade(health.overageFrequency) },
    previousMonthClosedUnderBudget,
    burnRate,
    spendHeatmap,
  });
}