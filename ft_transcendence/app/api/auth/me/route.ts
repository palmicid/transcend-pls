import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/auth-session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });

  const userId = session.userId;
  if (!Number.isFinite(userId)) return NextResponse.json({ user: null });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, display_name: true, online_status: true, created_at: true },
  });

  return NextResponse.json({ user });
}
