import { prisma } from "@/lib/db";

// Total saved across active (not-yet-completed) goals - excluded from
// unallocated income since that money is earmarked and can't be assigned to
// a budget group. See lib/budget.ts computeUnallocatedIncome.
export async function getTotalActiveGoalSaved(userId: string) {
  const goals = await prisma.goal.findMany({
    where: { userId, isCompleted: false },
    select: { savedAmount: true },
  });
  return goals.reduce((sum, g) => sum + Number(g.savedAmount), 0);
}

export async function listGoals(userId: string) {
  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: [{ isCompleted: "asc" }, { createdAt: "asc" }],
  });
  return goals.map((goal) => ({
    ...goal,
    targetAmount: Number(goal.targetAmount),
    savedAmount: Number(goal.savedAmount),
  }));
}

export async function createGoal(
  userId: string,
  data: { name: string; targetAmount: number; icon?: string }
) {
  return prisma.goal.create({ data: { userId, ...data } });
}

export async function updateGoal(
  userId: string,
  goalId: string,
  data: { name?: string; targetAmount?: number; icon?: string }
) {
  const existing = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!existing) return null;
  return prisma.goal.update({ where: { id: goalId }, data });
}

export async function deleteGoal(userId: string, goalId: string) {
  const existing = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!existing) return null;
  await prisma.goal.delete({ where: { id: goalId } });
  return true;
}

export class InsufficientGoalFundsError extends Error {
  constructor() {
    super("Withdrawal amount exceeds the goal's saved amount");
  }
}

// Signed contribution: positive amount = deposit, negative = withdrawal.
// Marks the goal completed once saved amount reaches its target.
export async function contributeToGoal(userId: string, goalId: string, amount: number) {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!goal) return null;

  const newSaved = Number(goal.savedAmount) + amount;
  if (newSaved < 0) throw new InsufficientGoalFundsError();

  const isCompleted = newSaved >= Number(goal.targetAmount);
  const updated = await prisma.$transaction([
    prisma.goalContribution.create({ data: { userId, goalId, amount } }),
    prisma.goal.update({
      where: { id: goalId },
      data: {
        savedAmount: newSaved,
        isCompleted,
        completedAt: isCompleted ? (goal.isCompleted ? goal.completedAt : new Date()) : null,
      },
    }),
  ]);
  return updated[1];
}