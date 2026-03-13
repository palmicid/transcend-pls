/**
 * @file Connect4BotHelpers.ts
 * @description Centralized bot-related utilities for Connect 4, mirroring TTT helpers.
 */

import {
  isBotConfigured,
  getTotalPlayerCount,
  createBotMoveCallback,
  getBotDifficultyLabel,
  validateBotConfig as validateSharedBotConfig,
  getBotPrismaConfig,
  type BotPrismaConfig,
} from "@/lib/bot/botHelpers";

/**
 * Check if a room has a fully configured bot.
 */
export { isBotConfigured };

/**
 * Count total players in a room including the bot if configured.
 */
export { getTotalPlayerCount };

/**
 * Create a standardized bot move callback for syncing and broadcasting.
 */
export { createBotMoveCallback };

/**
 * Get a user-friendly label for bot difficulty.
 */
export { getBotDifficultyLabel };

/**
 * Validate bot configuration options.
 */
export function validateBotConfig(role: string, difficulty: string): void {
  validateSharedBotConfig(role, difficulty, ["Red", "Yellow"]);
}

/**
 * Get bot configuration from a room for Prisma updates.
 */
export type { BotPrismaConfig };
export { getBotPrismaConfig };
