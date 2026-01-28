/**
 * @file TicTacToeBot.ts
 * @description Minimax algorithm with alpha-beta pruning for Tic-Tac-Toe.
 *
 * Reuses types from existing modules to avoid duplication.
 * The bot is stateless—given a board and role, it returns the optimal move.
 *
 * @example
 * ```ts
 * import { getBotMove, BOT_PLAYER_ID } from './TicTacToeBot';
 *
 * const board = Array(9).fill(null);
 * board[4] = 'X'; // Human played center
 *
 * const botMove = getBotMove(board, 'O', 9); // Hard difficulty
 * console.log(botMove); // e.g., 0 (corner)
 * ```
 */

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

/** Board is an array of 9 cells, each X, O, or null */
type Board = (PlayerRole | null)[];

interface MinimaxResult {
  score: number;
  cell: number | null;
}

// =============================================================================
// WINNING LINES
// =============================================================================

/**
 * All possible winning line combinations on a 3x3 board.
 * Each array contains the indices of cells that form a winning line.
 */
const WINNING_LINES = [
  [0, 1, 2], // Top row
  [3, 4, 5], // Middle row
  [6, 7, 8], // Bottom row
  [0, 3, 6], // Left column
  [1, 4, 7], // Middle column
  [2, 5, 8], // Right column
  [0, 4, 8], // Diagonal top-left to bottom-right
  [2, 4, 6], // Diagonal top-right to bottom-left
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if there's a winner on the board.
 *
 * @param board - Current board state
 * @returns The winning player role, or null if no winner
 */
function checkWinner(board: Board): PlayerRole | null {
  for (const [a, b, c] of WINNING_LINES) {
    const cell = board[a];
    if (cell && board[b] === cell && board[c] === cell) {
      return cell;
    }
  }
  return null;
}

/**
 * Get indices of all empty cells on the board.
 *
 * @param board - Current board state
 * @returns Array of empty cell indices
 */
function getEmptyCells(board: Board): number[] {
  return board
    .map((cell, idx) => (cell === null ? idx : -1))
    .filter((idx) => idx >= 0);
}

// =============================================================================
// MINIMAX ALGORITHM
// =============================================================================

/**
 * Minimax algorithm with alpha-beta pruning.
 *
 * Evaluates all possible moves and returns the best one for the current player.
 * Uses alpha-beta pruning to skip branches that won't affect the final decision.
 *
 * @param board - Current board state (will be mutated during search, restored after)
 * @param depth - Remaining depth to search (controls difficulty)
 * @param isMaximizing - True if it's the bot's turn (maximizing score)
 * @param botRole - The role the bot is playing ("X" or "O")
 * @param alpha - Best score the maximizer can guarantee so far
 * @param beta - Best score the minimizer can guarantee so far
 * @returns Object with the best score and corresponding cell index
 */
function minimax(
  board: Board,
  depth: number,
  isMaximizing: boolean,
  botRole: PlayerRole,
  alpha: number,
  beta: number
): MinimaxResult {
  const winner = checkWinner(board);
  const humanRole: PlayerRole = botRole === "X" ? "O" : "X";

  // Terminal states - return scores
  // Adding depth to score makes the bot prefer faster wins / slower losses
  if (winner === botRole) return { score: 10 + depth, cell: null };
  if (winner === humanRole) return { score: -10 - depth, cell: null };

  const emptyCells = getEmptyCells(board);

  // Draw or depth limit reached
  if (emptyCells.length === 0 || depth === 0) return { score: 0, cell: null };

  let bestCell: number | null = null;

  if (isMaximizing) {
    // Bot's turn - maximize score
    let maxScore = -Infinity;

    for (const cell of emptyCells) {
      // Try this move
      board[cell] = botRole;
      const result = minimax(board, depth - 1, false, botRole, alpha, beta);
      // Undo move
      board[cell] = null;

      if (result.score > maxScore) {
        maxScore = result.score;
        bestCell = cell;
      }

      // Alpha-beta pruning
      alpha = Math.max(alpha, result.score);
      if (beta <= alpha) break;
    }

    return { score: maxScore, cell: bestCell };
  } else {
    // Human's turn - minimize score
    let minScore = Infinity;

    for (const cell of emptyCells) {
      // Try this move
      board[cell] = humanRole;
      const result = minimax(board, depth - 1, true, botRole, alpha, beta);
      // Undo move
      board[cell] = null;

      if (result.score < minScore) {
        minScore = result.score;
        bestCell = cell;
      }

      // Alpha-beta pruning
      beta = Math.min(beta, result.score);
      if (beta <= alpha) break;
    }

    return { score: minScore, cell: bestCell };
  }
}

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
 *
 * @example
 * ```ts
 * const board = ['X', null, null, null, 'O', null, null, null, null];
 * const move = getBotMove(board, 'O', 9);
 * // Returns optimal counter-move
 * ```
 */
export function getBotMove(
  board: Board,
  botRole: PlayerRole,
  maxDepth: BotDifficulty = 9
): number | null {
  // Create a copy to avoid mutating the original during search
  const boardCopy = [...board];
  const result = minimax(boardCopy, maxDepth, true, botRole, -Infinity, Infinity);
  return result.cell;
}

/**
 * Check if a board position results in a win for the given role.
 * Useful for testing and validation.
 *
 * @param board - Board state to check
 * @param role - Role to check for win
 * @returns True if the role has won
 */
export function hasWon(board: Board, role: PlayerRole): boolean {
  return checkWinner(board) === role;
}

/**
 * Check if the board is in a draw state (full, no winner).
 *
 * @param board - Board state to check
 * @returns True if the game is a draw
 */
export function isDraw(board: Board): boolean {
  return checkWinner(board) === null && getEmptyCells(board).length === 0;
}
