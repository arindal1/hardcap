import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteGroupPermanently } from "@/lib/services/groups";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await deleteGroupPermanently(session.user.id, id);
  if (!result) return NextResponse.json({ error: "Not found or not archived" }, { status: 404 });
  return NextResponse.json({ success: true });
}