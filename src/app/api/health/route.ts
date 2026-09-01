import { NextResponse } from "next/server";

// No auth/DB dependency — this route only needs to keep the Node process
// warm, not verify anything downstream. Used as the target of the self-ping
// keep-alive started in `instrumentation.ts`.
export async function GET() {
  return NextResponse.json({ status: "ok" });
}