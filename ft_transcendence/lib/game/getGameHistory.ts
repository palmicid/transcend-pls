/**
 * @file lib/game/getGameHistory.ts
 * @description Query APIs for fetching user game history and stats
 */

import prisma from "@/lib/prisma";

export type GameHistoryEntry = {
  id: number;
  gameType: string;
  roomId: string | null;
  winnerId: number | null;
  isDraw: boolean;
  durationMs: number | null;
  startedAt: Date;
  endedAt: Date;
  result: "win" | "loss" | "draw";
  opponent: { id: number; displayName: string };
  finalBoard: unknown;
  xpEarned: number;
  playerRole: string | null;
};

export type PlayerStats = {
  wins: number;
  losses: number;
  draws: number;
  total: number;
  winRate: number;
  nonLossRate: number;
  averageDurationMs: number | null;
};

/**
 * Get a user's game history with pagination.
 */
export async function getGameHistory(userId: number, options?: {
  gameType?: string;
  limit?: number;
  offset?: number;
}): Promise<GameHistoryEntry[]> {
  const { gameType, limit = 20, offset = 0 } = options ?? {};

  const results = await prisma.gameResult.findMany({
    where: {
      OR: [
        { player1_id: userId },
        { player2_id: userId },
      ],
      ...(gameType && { game_type: gameType }),
    },
    include: {
      player1: { select: { id: true, display_name: true } },
      player2: { select: { id: true, display_name: true } },
    },
    orderBy: { ended_at: "desc" },
    take: limit,
    skip: offset,
  });

  return results.map((result: any) => {
    const isP1 = result.player1_id === userId;
    const opponent = isP1 ? result.player2 : result.player1;

    const xpEarnedRaw = isP1 ? result.xp_awarded_p1 : result.xp_awarded_p2;
    const xpEarned = typeof xpEarnedRaw === "number" ? xpEarnedRaw : 0;

    const playerRoleRaw = isP1 ? result.player1_role : result.player2_role;
    const playerRole = typeof playerRoleRaw === "string" ? playerRoleRaw : null;

    return {
      id: result.id,
      gameType: result.game_type,
      roomId: result.room_id,
      winnerId: result.winner_id,
      isDraw: result.is_draw,
      durationMs: result.duration_ms,
      startedAt: result.started_at,
      endedAt: result.ended_at,
      result: result.is_draw
        ? "draw"
        : result.winner_id === userId
          ? "win"
          : "loss",
      opponent: {
        id: opponent.id,
        displayName: opponent.display_name,
      },
      finalBoard: result.final_board,
      xpEarned,
      playerRole,
    };
  });
}

/**
 * Get user's win/loss/draw stats.
 */
export async function getPlayerStats(userId: number, gameType?: string): Promise<PlayerStats> {
  const games = await prisma.gameResult.findMany({
    where: {
      OR: [
        { player1_id: userId },
        { player2_id: userId },
      ],
      ...(gameType && { game_type: gameType }),
    },
    select: {
      winner_id: true,
      is_draw: true,
      duration_ms: true,
    },
  });

  let wins = 0, losses = 0, draws = 0;
  let totalDurationMs = 0;
  let completedDurations = 0;

  for (const game of games) {
    if (game.is_draw) draws++;
    else if (game.winner_id === userId) wins++;
    else losses++;

    if (typeof game.duration_ms === "number") {
      totalDurationMs += game.duration_ms;
      completedDurations++;
    }
  }

  const total = games.length;

  return {
    wins,
    losses,
    draws,
    total,
    winRate: total === 0 ? 0 : Math.round((wins / total) * 100),
    nonLossRate: total === 0 ? 0 : Math.round(((wins + draws) / total) * 100),
    averageDurationMs:
      completedDurations === 0 ? null : Math.round(totalDurationMs / completedDurations),
  };
}
