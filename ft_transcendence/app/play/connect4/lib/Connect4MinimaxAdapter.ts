/**
 * @file Connect4MinimaxAdapter.ts
 * @description Adapter to make Connect 4 compatible with the shared Minimax strategy.
 */

import type { MinimaxAdapter } from "@/lib/bot";
import type { PlayerColor } from "./Connect4PlayerSlot";

type Board = (PlayerColor | null)[][];
type Move = number; // Column index 0-6

const ROWS = 6;
const COLS = 7;
const WIN_LENGTH = 4;

export const Connect4MinimaxAdapter: MinimaxAdapter<Board, Move> = {
  /**
   * Get valid moves (columns that are not full).
   */
  getValidMoves(board: Board): Move[] {
    const moves: Move[] = [];
    for (let col = 0; col < COLS; col++) {
      // If top cell is empty, column is not full
      if (board[0][col] === null) {
        moves.push(col);
      }
    }
    return moves;
  },

  /**
   * Apply a move (drop piece with gravity) returning a NEW board array.
   */
  applyMove(board: Board, column: Move, role: string): Board {
    // Deep copy board to avoid mutation
    const newBoard = board.map((row) => [...row]);

    // Find lowest empty row in column
    for (let row = ROWS - 1; row >= 0; row--) {
      if (newBoard[row][column] === null) {
        newBoard[row][column] = role as PlayerColor;
        break;
      }
    }
    return newBoard;
  },

  /**
   * Check if the given role has won.
   */
  checkWin(board: Board, role: string): boolean {
    const r = role as PlayerColor;

    // Check all directions
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (board[row][col] !== r) continue;

        // Horizontal
        if (col + 3 < COLS &&
            board[row][col+1] === r &&
            board[row][col+2] === r &&
            board[row][col+3] === r) return true;

        // Vertical
        if (row + 3 < ROWS &&
            board[row+1][col] === r &&
            board[row+2][col] === r &&
            board[row+3][col] === r) return true;

        // Diagonal Down-Right
        if (row + 3 < ROWS && col + 3 < COLS &&
            board[row+1][col+1] === r &&
            board[row+2][col+2] === r &&
            board[row+3][col+3] === r) return true;

        // Diagonal Down-Left
        if (row + 3 < ROWS && col - 3 >= 0 &&
            board[row+1][col-1] === r &&
            board[row+2][col-2] === r &&
            board[row+3][col-3] === r) return true;
      }
    }
    return false;
  },

  /**
   * Check if board is full (draw).
   */
  checkDraw(board: Board): boolean {
    // If top row is full, board is full
    return board[0].every((cell) => cell !== null);
  },

  /**
   * Evaluate board state.
   */
  evaluate(board: Board, botRole: string, depth: number): number {
    if (this.checkWin(board, botRole)) return 100 + depth;
    const opponent = botRole === "Red" ? "Yellow" : "Red";
    if (this.checkWin(board, opponent)) return -100 - depth;

    // Heuristic: Center column control is valuable
    let score = 0;
    const centerCol = 3;
    const centerCount = board.reduce((count, row) =>
      row[centerCol] === botRole ? count + 1 : count, 0);
    score += centerCount * 3;

    return score;
  },
};
