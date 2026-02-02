import { NextResponse } from "next/server";
import { clearUserId } from "@/lib/auth/auth-session";

export async function POST() {
  await clearUserId();
  // set online_status to FALSE
  return NextResponse.json({ ok: true });
}
