/**
 * @file Connect4State.ts
 * @description Dynamic game state for Connect Four.
 *
 * Contains all data that changes during gameplay:
 * - Board state (7x6 grid of pieces)
 * - Current turn
 * - Winner (if any)
 * - Start time (for duration tracking)
 */

import { GameState } from "@/lib/game";
import type { PlayerColor } from "./Connect4PlayerSlot";

/**
 * Current state of a Connect Four game.
 */
export default class Connect4State implements GameState {
  /**
   * 6-row × 7-column board.
   * Each cell is Red, Yellow, or null (empty).
   * board[0] is the top row, board[5] is the bottom row.
   */
  board: Array<Array<PlayerColor | null>> = Array(6)
    .fill(null)
    .map(() => Array(7).fill(null));

  /** Which player's turn it is */
  currentTurn: PlayerColor = "Red";

  /** Winner (Red, Yellow, or null if game not ended) */
  winner: PlayerColor | null = null;

  /** Timestamp when the game started */
  startTime: number = Date.now();
}
