import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const id = await getUserId();
  if (!id) return NextResponse.json({ user: null });

  const userId = Number(id);
  if (!Number.isFinite(userId)) return NextResponse.json({ user: null });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true, displayName: true, online: true, createdAt: true },
  });

  return NextResponse.json({ user });
}
