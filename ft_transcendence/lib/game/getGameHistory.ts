/**
 * @file lib/game/getGameHistory.ts
 * @description Query APIs for fetching user game history and stats
 */

import prisma from "@/lib/prisma";

export type GameHistoryEntry = {
  id: number;
  game_type: string;
  room_id: string | null;
  winner_id: number | null;
  is_draw: boolean;
  duration_ms: number | null;
  started_at: Date;
  ended_at: Date;
  player1: { id: number; display_name: string };
  player2: { id: number; display_name: string };
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
      winner: { select: { id: true, display_name: true } },
    },
    orderBy: { ended_at: "desc" },
    take: limit,
    skip: offset,
  });

  return results as unknown as GameHistoryEntry[];
}

/**
 * Get user's win/loss/draw stats.
 */
export async function getPlayerStats(userId: number, gameType?: string) {
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
    },
  });

  let wins = 0, losses = 0, draws = 0;
  for (const game of games) {
    if (game.is_draw) draws++;
    else if (game.winner_id === userId) wins++;
    else losses++;
  }

  return { wins, losses, draws, total: games.length };
}
