import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeOverallRemaining } from "@/lib/budget";
import { listGroupsWithBalances, getUnallocatedIncome } from "@/lib/services/groups";
import type { GroupWithBalance } from "@/lib/types";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const groups = await listGroupsWithBalances(session.user.id);
  const totalSpent = groups.reduce((sum: number, g: GroupWithBalance) => sum + g.spent, 0);
  const unallocatedIncome = await getUnallocatedIncome(session.user.id);

  return NextResponse.json({
    overallRemaining: computeOverallRemaining(Number(user.monthlyIncome), totalSpent),
    monthlyIncome: Number(user.monthlyIncome),
    totalSpent,
    unallocatedIncome,
    groups,
  });
}