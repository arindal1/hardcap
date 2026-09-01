import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateExpenseSchema } from "@/lib/schemas";
import { deleteExpense, updateExpense } from "@/lib/services/expenses";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const expense = await updateExpense(session.user.id, id, {
    amount: parsed.data.amount,
    groupId: parsed.data.groupId,
    note: parsed.data.note,
    spentAt: parsed.data.spentAt ? new Date(parsed.data.spentAt) : undefined,
  });
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(expense);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await deleteExpense(session.user.id, id);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}