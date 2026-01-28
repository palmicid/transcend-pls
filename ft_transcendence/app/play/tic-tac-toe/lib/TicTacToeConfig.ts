/**
 * @file TicTacToeConfig.ts
 * @description Configuration settings for Tic-Tac-Toe games.
 *
 * Defines the static settings that don't change during gameplay,
 * like board size and available player symbols.
 */

import { GameConfig } from "@/lib/game";

/**
 * Configuration for a Tic-Tac-Toe game.
 */
export default class TicTacToeConfig implements GameConfig {
  /** Size of the board (3x3 = 9 cells) */
  boardSize = 3;

  /** Available player symbols */
  players = ["X", "O"] as const;
}
