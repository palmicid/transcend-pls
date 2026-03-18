/**
 * @file lib/game/saveGameResult.ts
 * @description Saves completed game results to DB.
 *              Bot games are saved with is_bot_game=true, awarding 1 XP.
 *              PvP games award full XP based on GameRegistry config.
 */

import prisma from "@/lib/prisma";
import { calculateXP, awardXP } from "@/lib/game/xpService";
import { checkAndAwardAchievements } from "@/lib/game/achievementService";
import bcrypt from "bcryptjs";

const BOT_USER_EMAIL = "bot@transcendence.local";
const BOT_USER_DISPLAY_NAME = "AI Bot";

interface SaveGameResultParams {
  gameType: string;
  roomId: string;
  players: { id: number; role: string }[];
  winnerRole: string | null;
  isDraw: boolean;
  startedAt: Date;
  finalBoard?: unknown;
  isBotGame?: boolean;
}

/**
 * Save a completed game result to the database.
 *
 * RULES:
 * - PvP games (2 human players): full XP based on outcome
 * - Bot games: flat 1 XP, flagged with is_bot_game=true
 *
 * @returns The created GameResult or null if conditions not met
 */
export async function saveGameResult(params: SaveGameResultParams) {
  const { gameType, roomId, players, winnerRole, isDraw, startedAt, finalBoard, isBotGame = false } = params;

  // GUARD: Must have enough players
  if ((!isBotGame && players.length !== 2) || (isBotGame && players.length < 1)) {
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

  if (isBotGame) {
    const humanPlayer = players.find((p) => p.id > 0) ?? players[0];
    if (!humanPlayer) {
      console.log("[saveGameResult] Skipped: Bot game without a human player");
      return null;
    }

    const botPlayer = players.find((p) => p.id !== humanPlayer.id);
    const inferredBotRole =
      botPlayer?.role ??
      (humanPlayer.role === "X"
        ? "O"
        : humanPlayer.role === "O"
          ? "X"
          : humanPlayer.role === "Red"
            ? "Yellow"
            : humanPlayer.role === "Yellow"
              ? "Red"
              : null);

    try {
      const botUser = await prisma.user.upsert({
        where: { email: BOT_USER_EMAIL },
        create: {
          email: BOT_USER_EMAIL,
          password: await bcrypt.hash(crypto.randomUUID(), 12),
          display_name: BOT_USER_DISPLAY_NAME,
          is_verified: false,
          is_bot: true,
        },
        update: {
          display_name: BOT_USER_DISPLAY_NAME,
        },
        select: { id: true },
      });

      const winnerId =
        isDraw || !winnerRole
          ? null
          : winnerRole === humanPlayer.role
            ? humanPlayer.id
            : botUser.id;

      const result = await prisma.gameResult.create({
        data: {
          game_type: gameType,
          room_id: roomId,
          player1_id: humanPlayer.id,
          player1_role: humanPlayer.role,
          player2_id: botUser.id,
          player2_role: inferredBotRole,
          winner_id: winnerId,
          is_draw: isDraw,
          is_bot_game: true,
          started_at: startedAt,
          duration_ms: Date.now() - new Date(startedAt).getTime(),
          final_board: finalBoard as any,
          xp_awarded_p1: 1,
          xp_awarded_p2: 0,
        },
      });

      await Promise.all([
        awardXP(humanPlayer.id, 1),
        checkAndAwardAchievements(humanPlayer.id),
      ]);

      console.log(`[saveGameResult] Saved bot game result: ${result.id}`);
      return result;
    } catch (error) {
      console.error("[saveGameResult] Failed to save bot game result:", error);
      return null;
    }
  }

  // Determine winner user ID from role
  let winnerId: number | null = null;
  if (winnerRole) {
    const winnerPlayer = players.find(p => p.role === winnerRole);
    winnerId = winnerPlayer?.id ?? null;
  }

  try {
    // Determine each player's outcome
    const p1Result = isDraw ? "draw" : winnerId === players[0].id ? "win" : "loss";
    const p2Result = isDraw ? "draw" : winnerId === players[1].id ? "win" : "loss";

    // Bot games: flat 1 XP regardless of outcome
    // PvP games: full XP based on game type config
    const xpP1 = isBotGame ? 1 : calculateXP(gameType, p1Result);
    const xpP2 = isBotGame ? 1 : calculateXP(gameType, p2Result);

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
        is_bot_game: isBotGame,
        started_at: startedAt,
        duration_ms: Date.now() - new Date(startedAt).getTime(),
        final_board: finalBoard as any,
        xp_awarded_p1: xpP1,
        xp_awarded_p2: xpP2,
      },
    });

    console.log(`[saveGameResult] Saved game result: ${result.id} (bot: ${isBotGame})`);

    // Award XP
    await Promise.all([
      awardXP(players[0].id, xpP1),
      ...(isBotGame ? [] : [awardXP(players[1].id, xpP2)]),
    ]);

    // Check achievements (only for human players)
    await Promise.all([
      checkAndAwardAchievements(players[0].id),
      ...(isBotGame ? [] : [checkAndAwardAchievements(players[1].id)]),
    ]);

    return result;
  } catch (error) {
    console.error("[saveGameResult] Failed to save result:", error);
    return null;
  }
}
