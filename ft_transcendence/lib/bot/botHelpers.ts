/**
 * @file lib/bot/botHelpers.ts
 * @description Shared bot-related utilities across games.
 */

import type { Room } from "@/lib/rooms";

/**
 * Check if a room has a fully configured bot (both role and difficulty set).
 */
export function isBotConfigured(
  botRole: string | null | undefined,
  botDifficulty: number | null | undefined
): boolean {
  return !!(botRole && botDifficulty);
}

/**
 * Count total players in a room including the bot if configured.
 */
export function getTotalPlayerCount(
  humanPlayerCount: number,
  botRole: string | null | undefined,
  botDifficulty: number | null | undefined
): number {
  return humanPlayerCount + (isBotConfigured(botRole, botDifficulty) ? 1 : 0);
}

/**
 * Get a user-friendly label for bot difficulty.
 */
export function getBotDifficultyLabel(difficulty: number | null | undefined): string {
  if (difficulty === 1) return "Easy";
  if (difficulty === 3) return "Medium";
  return "Hard";
}

/**
 * Validate bot configuration options with allowed roles.
 */
export function validateBotConfig(
  role: string,
  difficulty: number,
  allowedRoles: readonly string[]
): void {
  if (!allowedRoles.includes(role)) {
    throw new Error(`Invalid bot role: ${role}. Must be ${allowedRoles.map((r) => `"${r}"`).join(" or ")}.`);
  }

  if (![1, 3, 9].includes(difficulty)) {
    throw new Error(`Invalid bot difficulty: ${difficulty}. Must be 1 (Easy), 3 (Medium), or 9 (Hard).`);
  }
}

/**
 * Get bot configuration from a room for Prisma updates.
 */
export interface BotPrismaConfig {
  bot_role: string | null;
  bot_difficulty: number | null;
  bot_delay_ms?: number;
}

export function getBotPrismaConfig(
  botRole: string | null,
  botDifficulty: number | null,
  botDelayMs?: number
): BotPrismaConfig {
  return {
    bot_role: botRole,
    bot_difficulty: botDifficulty,
    bot_delay_ms: botDelayMs,
  };
}

/**
 * Create a standardized bot move callback for syncing and broadcasting.
 * Handles end-of-game transitions automatically.
 */
export function createBotMoveCallback(
  roomId: string,
  room: Room,
  game: { checkEndConditions: () => boolean },
  syncFn: (roomId: string, room: Room) => Promise<void>,
  broadcastFn: (roomId: string, event: string) => Promise<void>,
  prismaUpdateFn: (roomId: string, status: string) => Promise<void>
): () => Promise<void> {
  return async () => {
    await syncFn(roomId, room);
    await broadcastFn(roomId, "game_move");

    if (game.checkEndConditions()) {
      room.end();
      await prismaUpdateFn(roomId, "ENDED");
      await broadcastFn(roomId, "game_end");
    }
  };
}
