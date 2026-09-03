import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateMonthEndReviewSchema } from "@/lib/schemas";
import {
  generateMonthEndReview,
  listCompletedMonthsWithoutReview,
  MonthNotCompletedError,
} from "@/lib/services/month-end-review";
import { isRateLimited } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const months = await listCompletedMonthsWithoutReview(session.user.id);
  return NextResponse.json({ data: months });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isRateLimited(`month-end-review:${session.user.id}`, 10, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Slow down." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = generateMonthEndReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const review = await generateMonthEndReview(session.user.id, parsed.data.month);
    return NextResponse.json(review, { status: 201 });
  } catch (err) {
    if (err instanceof MonthNotCompletedError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to generate review" }, { status: 502 });
  }
}