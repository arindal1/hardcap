import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateGroupSchema } from "@/lib/schemas";
import { archiveGroup, updateGroup } from "@/lib/services/groups";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.name) {
    const existing = await prisma.expenseGroup.findFirst({
      where: {
        userId: session.user.id,
        name: { equals: parsed.data.name, mode: "insensitive" },
        NOT: { id },
      },
    });
    if (existing) {
      return NextResponse.json(
        {
          error: existing.isArchived
            ? "An archived group with this name already exists - restore it instead of renaming to it"
            : "Group name already exists",
          archivedGroupId: existing.isArchived ? existing.id : undefined,
        },
        { status: 409 }
      );
    }
  }

  const group = await updateGroup(session.user.id, id, parsed.data);
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(group);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await archiveGroup(session.user.id, id);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}