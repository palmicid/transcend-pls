import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/auth-session";
import {
  getLeaderboard,
  getLeaderboardTotalCount,
  getUserRank,
  type LeaderboardSortBy,
} from "@/lib/game/leaderboardService";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
  const offset = Number(searchParams.get("offset")) || 0;
  const sortByParam = searchParams.get("sortBy");
  const sortBy: LeaderboardSortBy =
    sortByParam === "ttt" ? sortByParam : "xp";

  const [entries, total, myRank] = await Promise.all([
    getLeaderboard({ limit, offset, sortBy }),
    getLeaderboardTotalCount(sortBy),
    getUserRank(session.userId, sortBy),
  ]);

  return NextResponse.json({ entries, total, myRank });
}
