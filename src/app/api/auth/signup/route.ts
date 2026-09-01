import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signupSchema } from "@/lib/schemas";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`signup:ip:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many signup attempts. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Separate, tighter per-email limit - the 409 duplicate-email response
  // below is an inherent enumeration signal (unavoidable without switching
  // to an email-verification flow), so cap attempts against any single
  // email address independent of which IP they come from.
  if (isRateLimited(`signup:email:${parsed.data.email}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many signup attempts. Try again later." }, { status: 429 });
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: { email: parsed.data.email, passwordHash, authProvider: "credentials" },
  });

  return NextResponse.json({ user: { id: user.id, email: user.email } }, { status: 201 });
}