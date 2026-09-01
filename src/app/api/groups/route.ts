import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createGroupSchema } from "@/lib/schemas";
import { createGroup, listGroupsWithBalances } from "@/lib/services/groups";
import { isRateLimited } from "@/lib/rate-limit";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const groups = await listGroupsWithBalances(session.user.id);
  return NextResponse.json({ data: groups });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isRateLimited(`create:group:${session.user.id}`, 30, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Slow down." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.expenseGroup.findFirst({
    where: { userId: session.user.id, name: { equals: parsed.data.name, mode: "insensitive" } },
  });
  if (existing) {
    return NextResponse.json({ error: "Group name already exists" }, { status: 409 });
  }

  const group = await createGroup(session.user.id, parsed.data.name, parsed.data.budgetCap);
  return NextResponse.json(group, { status: 201 });
}