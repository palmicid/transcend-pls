/**
 * @file TicTacToeBot.ts
 * @description Minimax algorithm with alpha-beta pruning for Tic-Tac-Toe.
 *
 * Refactored to use the shared modular bot architecture.
 * Acts as a facade for the MinimaxStrategy to maintain backward compatibility.
 */

import { MinimaxStrategy } from "@/lib/bot/strategies/MinimaxStrategy";
import { TicTacToeMinimaxAdapter } from "./TicTacToeMinimaxAdapter";
import type { PlayerRole } from "./TicTacToePlayerSlot";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Constant ID representing the bot player in player slots */
export const BOT_PLAYER_ID = "__BOT__";

/** Difficulty levels mapped to search depths */
export type BotDifficulty = 1 | 3 | 9;

// =============================================================================
// TYPES
// =============================================================================

type Board = (PlayerRole | null)[];

// =============================================================================
// STRATEGY INITIALIZATION
// =============================================================================

// Instantiate the strategy with the TTT adapter
const strategy = new MinimaxStrategy(TicTacToeMinimaxAdapter);

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Get the best move for the bot given the current board state.
 *
 * @param board - Current board state (array of 9 cells, each "X", "O", or null)
 * @param botRole - The role the bot is playing ("X" or "O")
 * @param maxDepth - Maximum search depth (difficulty): 1=Easy, 3=Medium, 9=Hard
 * @returns The best cell index to play (0-8), or null if no moves available
 */
export function getBotMove(
  board: Board,
  botRole: PlayerRole,
  maxDepth: BotDifficulty = 9
): number | null {
  // Create a copy to avoid mutating the original (though strategy should handle this, safety/API compat)
  // The strategy expects a generic config object
  const move = strategy.getMove(board, {
    difficulty: maxDepth,
    role: botRole,
    opponentRole: botRole === "X" ? "O" : "X",
    delayMs: 0, // Not used by calculation
  });

  return move;
}

/**
 * Check if a board position results in a win for the given role.
 * Useful for testing and validation.
 */
export function hasWon(board: Board, role: PlayerRole): boolean {
  return TicTacToeMinimaxAdapter.checkWin(board, role);
}

/**
 * Check if the board is in a draw state (full, no winner).
 */
export function isDraw(board: Board): boolean {
  // Note: Adapter's checkDraw only checks fullness, usually called after checkWin
  return (
    !TicTacToeMinimaxAdapter.checkWin(board, "X") &&
    !TicTacToeMinimaxAdapter.checkWin(board, "O") &&
    TicTacToeMinimaxAdapter.checkDraw(board)
  );
}
