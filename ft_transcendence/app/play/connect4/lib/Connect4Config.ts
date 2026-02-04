/**
 * @file Connect4Config.ts
 * @description Configuration settings for Connect Four games.
 *
 * Defines the static settings that don't change during gameplay,
 * like board dimensions and available player colors.
 */

import { GameConfig } from "@/lib/game";

/**
 * Configuration for a Connect Four game.
 *
 * Connect Four is played on a 7-column × 6-row grid.
 * Two players alternate dropping colored discs.
 */
export default class Connect4Config implements GameConfig {
  /** Number of columns (width) */
  readonly columns = 7;

  /** Number of rows (height) */
  readonly rows = 6;

  /** Pieces needed in a row to win */
  readonly winCondition = 4;

  /** Available player colors */
  readonly players = ["Red", "Yellow"] as const;
}
