/**
 * @file lib/game/index.ts
 * @description Barrel exports for the game framework module.
 *
 * Import from this file for clean, consistent imports:
 * ```ts
 * import { Game, GameConfig, GameState, PlayerSlot } from '@/lib/game';
 * ```
 */

export { default as Game } from "./Game";
export type { default as GameConfig } from "./GameConfig";
export type { default as GameState } from "./GameState";
export type { default as PlayerSlot } from "./PlayerSlot";
