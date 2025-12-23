import { NextResponse } from "next/server";
import { clearUserId } from "@/lib/auth";

export async function POST() {
  await clearUserId();
  return NextResponse.json({ ok: true });
}
