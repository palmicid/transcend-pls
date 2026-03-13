/**
 * @file lib/game/saveGameResult.ts
 * @description Saves completed game results to DB (remote games only, no bots)
 */

import prisma from "@/lib/prisma";
import { calculateXP, awardXP } from "@/lib/game/xpService";
import { checkAndAwardAchievements } from "@/lib/game/achievementService";

interface SaveGameResultParams {
  gameType: string;
  roomId: string;
  players: { id: number; role: string }[];
  winnerRole: string | null;
  isDraw: boolean;
  startedAt: Date;
  finalBoard?: unknown;
}

/**
 * Save a completed game result to the database.
 *
 * SECURITY: Only saves if:
 * - Exactly 2 players
 * - No bot is configured
 *
 * @returns The created GameResult or null if conditions not met
 */
export async function saveGameResult(params: SaveGameResultParams) {
  const { gameType, roomId, players, winnerRole, isDraw, startedAt, finalBoard } = params;

  // GUARD: Must have exactly 2 players
  if (players.length !== 2) {
    console.log("[saveGameResult] Skipped: Not exactly 2 players");
    return null;
  }

  const existingResult = await prisma.gameResult.findFirst({
    where: { room_id: roomId },
    select: { id: true },
  });

  if (existingResult) {
    console.log(`[saveGameResult] Skipped: Result already exists for room ${roomId}`);
    return null;
  }

  // GUARD: Check for bot in room
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { bot_difficulty: true, bot_role: true },
  });

  if (room?.bot_difficulty || room?.bot_role) {
    console.log("[saveGameResult] Skipped: Game includes a bot");
    return null;
  }

  // Determine winner user ID from role
  let winnerId: number | null = null;
  if (winnerRole) {
    const winnerPlayer = players.find(p => p.role === winnerRole);
    winnerId = winnerPlayer?.id ?? null;
  }

  // Create the record
  try {
    // Determine each player's outcome
    const p1Result = isDraw ? "draw" : winnerId === players[0].id ? "win" : "loss";
    const p2Result = isDraw ? "draw" : winnerId === players[1].id ? "win" : "loss";

    const xpP1 = calculateXP(gameType, p1Result);
    const xpP2 = calculateXP(gameType, p2Result);

    const result = await prisma.gameResult.create({
      data: {
        game_type: gameType,
        room_id: roomId,
        player1_id: players[0].id,
        player1_role: players[0].role,
        player2_id: players[1].id,
        player2_role: players[1].role,
        winner_id: winnerId,
        is_draw: isDraw,
        started_at: startedAt,
        duration_ms: Date.now() - new Date(startedAt).getTime(),
        final_board: finalBoard as any,
        xp_awarded_p1: xpP1,
        xp_awarded_p2: xpP2,
      },
    });

    console.log(`[saveGameResult] Saved game result: ${result.id}`);

    // Award XP and check achievements (fire and forget pattern or await, here we await for simplicity)
    await Promise.all([
      awardXP(players[0].id, xpP1),
      awardXP(players[1].id, xpP2),
    ]);

    await Promise.all([
      checkAndAwardAchievements(players[0].id),
      checkAndAwardAchievements(players[1].id),
    ]);

    return result;
  } catch (error) {
    console.error("[saveGameResult] Failed to save result:", error);
    return null;
  }
}
