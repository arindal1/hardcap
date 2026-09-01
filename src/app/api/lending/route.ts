import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createLendingSchema } from "@/lib/schemas";
import { createLendingEntry, listLendingEntries } from "@/lib/services/lending";
import { isRateLimited } from "@/lib/rate-limit";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await listLendingEntries(session.user.id);
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isRateLimited(`create:lending:${session.user.id}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Slow down." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createLendingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const entry = await createLendingEntry(session.user.id, {
    personName: parsed.data.personName,
    amount: parsed.data.amount,
    reason: parsed.data.reason,
    date: new Date(parsed.data.date),
  });
  return NextResponse.json(entry, { status: 201 });
}