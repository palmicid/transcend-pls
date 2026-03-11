import { NextResponse } from "next/server";
import { clearUserId, getSession } from "@/lib/auth/auth-session";
import prisma from "@/lib/prisma";

export async function POST() {
  const session = await getSession();
  if (session?.userId) {
    await prisma.user.update({
      where: { id: session.userId },
      data: { online_status: false },
    });
  }
  await clearUserId();
  return NextResponse.json({ ok: true });
}
