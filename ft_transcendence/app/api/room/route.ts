import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const rooms = await prisma.room.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, type: true, maxUsers: true, createdAt: true },
  });
  return NextResponse.json({ rooms });
}
