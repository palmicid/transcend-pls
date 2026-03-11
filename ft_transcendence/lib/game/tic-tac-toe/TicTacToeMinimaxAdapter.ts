/**
 * @file TicTacToeMinimaxAdapter.ts
 * @description Adapter to make Tic-Tac-Toe compatible with the shared Minimax strategy.
 */

import type { MinimaxAdapter } from "@/lib/bot";
import type { PlayerRole } from "./TicTacToePlayerSlot";

type Board = (PlayerRole | null)[];
type Move = number; // Cell index 0-8

/**
 * Winning line combinations on a 3x3 board.
 */
const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export const TicTacToeMinimaxAdapter: MinimaxAdapter<Board, Move> = {
  /**
   * Get all empty cells as valid moves.
   */
  getValidMoves(board: Board): Move[] {
    return board
      .map((cell, idx) => (cell === null ? idx : -1))
      .filter((idx) => idx >= 0);
  },

  /**
   * Apply a move returning a NEW board array.
   */
  applyMove(board: Board, move: Move, role: string): Board {
    const newBoard = [...board];
    newBoard[move] = role as PlayerRole;
    return newBoard;
  },

  /**
   * Check if the given role has won.
   */
  checkWin(board: Board, role: string): boolean {
    return WINNING_LINES.some(([a, b, c]) =>
      board[a] === role && board[b] === role && board[c] === role
    );
  },

  /**
   * Check if the board is full (draw).
   * Note: This is only called if checkWin returns false.
   */
  checkDraw(board: Board): boolean {
    return board.every((cell) => cell !== null);
  },

  /**
   * Evaluate the board for the minimax score.
   * Simple +10/-10 evaluation for TTT is sufficient.
   */
  evaluate(board: Board, botRole: string, depth: number): number {
    // Note: checkWin is already called in MinimaxStrategy before evaluate
    // to handle terminal states with depth adjustment.
    // However, if we reach depth 0 without a terminal state (unlikely in 3x3 TTT but possible),
    // we return 0.

    // Safety check just in case
    if (this.checkWin(board, botRole)) return 10 + depth;
    const opponent = botRole === "X" ? "O" : "X";
    if (this.checkWin(board, opponent)) return -10 - depth;

    return 0;
  },
};
