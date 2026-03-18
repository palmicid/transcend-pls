import prisma from "@/lib/prisma";
import type { LeaderboardEntry } from "@/types/progression";

export type LeaderboardSortBy = "xp" | "ttt";

async function buildPerGameLeaderboard(gameType: "tic-tac-toe" | "connect4"): Promise<LeaderboardEntry[]> {
  const [allUsers, player1Counts, player2Counts, winCounts] = await Promise.all([
    prisma.playerXP.findMany({
      include: {
        user: {
          select: {
            id: true,
            display_name: true,
            avatar_url: true,
          },
        },
      },
    }),
    prisma.gameResult.groupBy({
      by: ["player1_id"],
      where: { game_type: gameType },
      _count: { _all: true },
    }),
    prisma.gameResult.groupBy({
      by: ["player2_id"],
      where: { game_type: gameType },
      _count: { _all: true },
    }),
    prisma.gameResult.groupBy({
      by: ["winner_id"],
      where: { game_type: gameType, winner_id: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const totalGamesByUser = new Map<number, number>();
  const winsByUser = new Map<number, number>();
  const drawsByUser = new Map<number, number>();

  for (const row of player1Counts) {
    totalGamesByUser.set(
      row.player1_id,
      (totalGamesByUser.get(row.player1_id) ?? 0) + row._count._all,
    );
  }

  for (const row of player2Counts) {
    totalGamesByUser.set(
      row.player2_id,
      (totalGamesByUser.get(row.player2_id) ?? 0) + row._count._all,
    );
  }

  for (const row of winCounts) {
    if (row.winner_id === null) continue;
    winsByUser.set(row.winner_id, row._count._all);
  }

  const draws = await prisma.gameResult.findMany({
    where: { game_type: gameType, is_draw: true },
    select: { player1_id: true, player2_id: true },
  });

  for (const draw of draws) {
    drawsByUser.set(draw.player1_id, (drawsByUser.get(draw.player1_id) ?? 0) + 1);
    drawsByUser.set(draw.player2_id, (drawsByUser.get(draw.player2_id) ?? 0) + 1);
  }

  const ranked = allUsers
    .map((entry: any) => {
      const userId = entry.user.id;
      const totalGames = totalGamesByUser.get(userId) ?? 0;
      const wins = winsByUser.get(userId) ?? 0;
      const draws = drawsByUser.get(userId) ?? 0;
      const losses = Math.max(0, totalGames - wins - draws);
      const winRate = totalGames > 0 ? wins / totalGames : 0;

      return {
        userId,
        displayName: entry.user.display_name,
        avatarUrl: entry.user.avatar_url,
        level: entry.level,
        totalXP: entry.total_xp,
        wins,
        draws,
        losses,
        totalGames,
        winRate,
      };
    })
    .filter((entry) => entry.totalGames > 0)
    .sort(
      (a, b) =>
        b.wins - a.wins ||
        b.winRate - a.winRate ||
        b.totalGames - a.totalGames ||
        b.totalXP - a.totalXP,
    )
    .map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      displayName: entry.displayName,
      avatarUrl: entry.avatarUrl,
      level: entry.level,
      totalXP: entry.totalXP,
      wins: entry.wins,
      draws: entry.draws,
      losses: entry.losses,
      totalGames: entry.totalGames,
    }));

  return ranked;
}

/**
 * Fetch a paginated leaderboard ranked by overall XP or per-game (TTT/C4) performance.
 *
 * Query strategy: Join PlayerXP → User for display info.
 * Win/draw/loss counts come from GameResult aggregations.
 */
export async function getLeaderboard(options?: {
  limit?: number;
  offset?: number;
  sortBy?: LeaderboardSortBy;
}): Promise<LeaderboardEntry[]> {
  const { limit = 20, offset = 0, sortBy = "xp" } = options ?? {};

  if (sortBy === "ttt" || sortBy === "c4") {
    const gameType = sortBy === "ttt" ? "tic-tac-toe" : "connect4";
    const ranked = await buildPerGameLeaderboard(gameType);
    return ranked
      .slice(offset, offset + limit)
      .map((entry, index) => ({ ...entry, rank: offset + index + 1 }));
  }

  // Default: Sort by XP
  const drawGames = await prisma.gameResult.findMany({
    where: { is_draw: true },
    select: { player1_id: true, player2_id: true },
  });

  const drawsByUser = new Map<number, number>();
  for (const draw of drawGames) {
    drawsByUser.set(draw.player1_id, (drawsByUser.get(draw.player1_id) ?? 0) + 1);
    drawsByUser.set(draw.player2_id, (drawsByUser.get(draw.player2_id) ?? 0) + 1);
  }

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

  return entries.map((entry: any, index: number) => {
    const wins = entry.user._count.gamesWon;
    const totalGames =
      entry.user._count.gamesAsPlayer1 + entry.user._count.gamesAsPlayer2;
    const draws = drawsByUser.get(entry.user.id) ?? 0;
    const losses = Math.max(0, totalGames - wins - draws);

    return {
      rank: offset + index + 1,
      userId: entry.user.id,
      displayName: entry.user.display_name,
      avatarUrl: entry.user.avatar_url,
      level: entry.level,
      totalXP: entry.total_xp,
      wins,
      draws,
      losses,
      totalGames,
    };
  });
}

/** Get a single user's rank (position in the leaderboard). */
export async function getUserRank(
  userId: number,
  sortBy: LeaderboardSortBy = "xp"
): Promise<number> {
  if (sortBy === "ttt" || sortBy === "c4") {
    const fullBoard = await getLeaderboard({ limit: 99999, sortBy });
    const userEntry = fullBoard.find((u) => u.userId === userId);
    return userEntry ? userEntry.rank : 0;
  }

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

export async function getLeaderboardTotalCount(
  sortBy: LeaderboardSortBy = "xp",
): Promise<number> {
  if (sortBy === "ttt" || sortBy === "c4") {
    const gameType = sortBy === "ttt" ? "tic-tac-toe" : "connect4";
    const ranked = await buildPerGameLeaderboard(gameType);
    return ranked.length;
  }

  return prisma.playerXP.count();
}
