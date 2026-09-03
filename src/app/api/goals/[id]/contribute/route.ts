import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { contributeGoalSchema } from "@/lib/schemas";
import { contributeToGoal, InsufficientGoalFundsError } from "@/lib/services/goals";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isRateLimited(`contribute:goal:${session.user.id}`, 30, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Slow down." }, { status: 429 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = contributeGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const goal = await contributeToGoal(session.user.id, id, parsed.data.amount);
    if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(goal);
  } catch (err) {
    if (err instanceof InsufficientGoalFundsError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}