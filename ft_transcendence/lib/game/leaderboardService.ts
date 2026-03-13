import prisma from "@/lib/prisma";
import type { LeaderboardEntry } from "@/types/progression";

/**
 * Fetch a paginated leaderboard ranked by total XP.
 *
 * Query strategy: Join PlayerXP → User for display info.
 * Win counts come from a subquery on GameResult.
 */
export async function getLeaderboard(options?: {
  limit?: number;
  offset?: number;
}): Promise<LeaderboardEntry[]> {
  const { limit = 20, offset = 0 } = options ?? {};

  const entries = await prisma.playerXP.findMany({
    orderBy: { total_xp: "desc" },
    take: limit,
    skip: offset,
    include: {
      user: {
        select: {
          id: true,
          display_name: true,
          avatar_url: true,
          // Count games and wins using _count
          _count: {
            select: {
              gamesAsPlayer1: true,
              gamesAsPlayer2: true,
              gamesWon: true,
            },
          },
        },
      },
    },
  });

  return entries.map((entry: any, index: number) => ({
    rank: offset + index + 1,
    userId: entry.user.id,
    displayName: entry.user.display_name,
    avatarUrl: entry.user.avatar_url,
    level: entry.level,
    totalXP: entry.total_xp,
    wins: entry.user._count.gamesWon,
    totalGames:
      entry.user._count.gamesAsPlayer1 + entry.user._count.gamesAsPlayer2,
  }));
}

/** Get a single user's rank (position in the leaderboard). */
export async function getUserRank(userId: number): Promise<number> {
  const userXP = await prisma.playerXP.findUnique({
    where: { user_id: userId },
    select: { total_xp: true },
  });

  if (!userXP) return 0;

  // Count users with more XP
  const higherCount = await prisma.playerXP.count({
    where: { total_xp: { gt: userXP.total_xp } },
  });

  return higherCount + 1;
}
