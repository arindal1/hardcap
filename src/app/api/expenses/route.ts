import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createExpenseSchema, expenseFilterSchema } from "@/lib/schemas";
import { createExpense, listExpenses } from "@/lib/services/expenses";
import { isRateLimited } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const parsed = expenseFilterSchema.safeParse({
    groupId: searchParams.get("groupId") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const expenses = await listExpenses(session.user.id, {
    groupId: parsed.data.groupId,
    from: parsed.data.from ? new Date(parsed.data.from) : undefined,
    to: parsed.data.to ? new Date(parsed.data.to) : undefined,
  });

  return NextResponse.json({ data: expenses, total: expenses.length });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isRateLimited(`create:expense:${session.user.id}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Slow down." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const expense = await createExpense(session.user.id, {
    amount: parsed.data.amount,
    groupId: parsed.data.groupId,
    note: parsed.data.note,
    spentAt: parsed.data.spentAt ? new Date(parsed.data.spentAt) : undefined,
  });
  if (!expense) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  return NextResponse.json(expense, { status: 201 });
}