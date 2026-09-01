import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { InsightCooldownError, requestInsight } from "@/lib/services/insight";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const snapshot = await requestInsight(session.user.id);
    return NextResponse.json(snapshot, { status: 201 });
  } catch (error) {
    if (error instanceof InsightCooldownError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    return NextResponse.json({ error: "Failed to generate insight" }, { status: 502 });
  }
}