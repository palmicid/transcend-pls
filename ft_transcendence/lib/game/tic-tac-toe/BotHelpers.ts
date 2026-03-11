/**
 * @file BotHelpers.ts
 * @description Centralized bot-related utilities for Tic-Tac-Toe
 *
 * Provides helper functions for:
 * - Bot configuration validation
 * - Bot player counting
 * - Bot move callbacks
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
 * Check if a room has a fully configured bot (both role and difficulty set).
 * This is the source of truth for "hasBot" semantics.
 */
export { isBotConfigured };

/**
 * Count total players in a room including the bot if configured.
 * Use this for capacity checks and room status transitions.
 */
export { getTotalPlayerCount };

/**
 * Create a standardized bot move callback for syncing and broadcasting.
 * Handles end-of-game transitions automatically.
 */
export { createBotMoveCallback };

/**
 * Get a user-friendly label for bot difficulty.
 */
export { getBotDifficultyLabel };

/**
 * Validate bot configuration options.
 * Throws an error if configuration is invalid.
 */
export function validateBotConfig(role: string, difficulty: number): void {
  validateSharedBotConfig(role, difficulty, ["X", "O"]);
}

/**
 * Get bot configuration from a room for Prisma updates.
 */
export type { BotPrismaConfig };
export { getBotPrismaConfig };
