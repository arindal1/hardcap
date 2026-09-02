import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ActiveNameConflictError, restoreGroup } from "@/lib/services/groups";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const group = await restoreGroup(session.user.id, id);
    if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(group);
  } catch (err) {
    if (err instanceof ActiveNameConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}