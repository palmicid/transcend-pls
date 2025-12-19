/**
 * @file TicTacToeState.ts
 * @description Dynamic game state for Tic-Tac-Toe.
 *
 * Contains all data that changes during gameplay:
 * - Board state (which cells are marked)
 * - Current turn
 * - Winner (if any)
 * - Start time (for duration tracking)
 */

import { GameState } from "@/lib/game";
import type { PlayerRole } from "./TicTacToePlayerSlot";

/**
 * Current state of a Tic-Tac-Toe game.
 */
export default class TicTacToeState implements GameState {
  /** 9-cell board, each cell is X, O, or null (empty) */
  board: Array<PlayerRole | null> = Array(9).fill(null);

  /** Which player's turn it is */
  currentTurn: PlayerRole = "X";

  /** Winner (X, O, or null if game not ended) */
  winner: PlayerRole | null = null;

  /** Timestamp when the game started */
  startTime: number = Date.now();
}
