import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createGroupSchema } from "@/lib/schemas";
import { createGroup, listArchivedGroups, listGroupsWithBalances } from "@/lib/services/groups";
import { isRateLimited } from "@/lib/rate-limit";

// Balance figures must never be served from a cached route response - always
// recompute live from the DB (see ARCHITECTURE.md "Balance computation").
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  if (searchParams.get("archived") === "1") {
    const groups = await listArchivedGroups(session.user.id);
    return NextResponse.json({ data: groups });
  }

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
    return NextResponse.json(
      {
        error: existing.isArchived
          ? "An archived group with this name already exists - restore it instead of creating a new one"
          : "Group name already exists",
        archivedGroupId: existing.isArchived ? existing.id : undefined,
      },
      { status: 409 }
    );
  }

  const group = await createGroup(session.user.id, parsed.data);
  return NextResponse.json(group, { status: 201 });
}