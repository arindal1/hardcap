import { prisma } from "@/lib/db";
import { requestGeminiInsight } from "@/lib/gemini";
import { listGroupsWithBalances } from "@/lib/services/groups";
import { computeOverallRemaining } from "@/lib/budget";

const COOLDOWN_MS = 60_000;

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function daysRemainingInMonth(): number {
  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export class InsightCooldownError extends Error {
  constructor() {
    super("Please wait before requesting another insight.");
  }
}

export async function requestInsight(userId: string) {
  const month = currentMonth();

  const last = await prisma.aIInsightRequestSnapshot.findFirst({
    where: { userId },
    orderBy: { requestedAt: "desc" },
  });
  if (last && Date.now() - last.requestedAt.getTime() < COOLDOWN_MS) {
    throw new InsightCooldownError();
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const groups = await listGroupsWithBalances(userId, month);
  const totalSpent = groups.reduce((sum, g) => sum + g.spent, 0);

  const payload = {
    month,
    monthlyIncome: Number(user.monthlyIncome),
    overallRemaining: computeOverallRemaining(Number(user.monthlyIncome), totalSpent),
    daysRemainingInMonth: daysRemainingInMonth(),
    groups: groups.map((g) => ({
      name: g.name,
      cap: g.cap,
      spent: g.spent,
      remaining: g.remaining,
    })),
  };

  const responseText = await requestGeminiInsight(payload);

  return prisma.aIInsightRequestSnapshot.create({
    data: {
      userId,
      month,
      inputSummary: payload,
      responseText,
    },
  });
}

export async function listInsightHistory(userId: string) {
  return prisma.aIInsightRequestSnapshot.findMany({
    where: { userId },
    orderBy: { requestedAt: "desc" },
  });
}