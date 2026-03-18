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
  const limitParam = searchParams.get("limit");
  let limit = Number.parseInt(limitParam ?? "", 10);
  if (!Number.isFinite(limit) || limit <= 0) {
    limit = 20;
  }
  limit = Math.min(limit, 100);

  const offsetParam = searchParams.get("offset");
  let offset = Number.parseInt(offsetParam ?? "", 10);
  if (!Number.isFinite(offset) || offset < 0) {
    offset = 0;
  }

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
