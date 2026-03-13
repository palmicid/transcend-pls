import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/auth-session";
import { getLeaderboard, getUserRank } from "@/lib/game/leaderboardService";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
  const offset = Number(searchParams.get("offset")) || 0;

  const [entries, total, myRank] = await Promise.all([
    getLeaderboard({ limit, offset }),
    prisma.playerXP.count(),
    getUserRank(session.userId),
  ]);

  return NextResponse.json({ entries, total, myRank });
}
