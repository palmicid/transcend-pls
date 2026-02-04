/**
 * @file MinimaxStrategy.ts
 * @description Minimax algorithm with alpha-beta pruning using adapter pattern.
 */

import type { BotStrategy, BotConfig } from "../BotStrategy";

/**
 * Adapter interface for game-specific minimax logic.
 * Each game (TTT, Connect4) must implement this adapter to use the Minimax strategy.
 */
export interface MinimaxAdapter<TGameState, TMove> {
  /** Get all valid moves for the current state */
  getValidMoves(state: TGameState): TMove[];

  /**
   * Apply a move and return the new state.
   * IMPORTANT: Must return a NEW state object, do NOT mutate the original.
   */
  applyMove(state: TGameState, move: TMove, role: string): TGameState;

  /** Check if the given role has won */
  checkWin(state: TGameState, role: string): boolean;

  /** Check if the game is a draw */
  checkDraw(state: TGameState): boolean;

  /**
   * Evaluate the board state from the perspective of botRole.
   * Positive score = good for bot, negative = bad.
   */
  evaluate(state: TGameState, botRole: string, depth: number): number;
}

/**
 * Minimax strategy with alpha-beta pruning.
 * Works with any game that provides a MinimaxAdapter.
 */
export class MinimaxStrategy<TGameState, TMove>
  implements BotStrategy<TGameState, TMove>
{
  readonly id = "minimax";
  readonly name = "Minimax AI";
  readonly description = "Classic game-tree search with alpha-beta pruning";

  constructor(private adapter: MinimaxAdapter<TGameState, TMove>) {}

  getMove(gameState: TGameState, config: BotConfig): TMove | null {
    const result = this.minimax(
      gameState,
      config.difficulty, // Maps directly to recursion depth
      true,              // isMaximizing
      config.role,
      config.opponentRole,
      -Infinity,
      Infinity
    );
    return result.move;
  }

  private minimax(
    state: TGameState,
    depth: number,
    isMaximizing: boolean,
    botRole: string,
    opponentRole: string,
    alpha: number,
    beta: number
  ): { score: number; move: TMove | null } {
    // 1. Check terminal states
    if (this.adapter.checkWin(state, botRole)) {
      // Win for bot (prefer faster wins by adding depth)
      return { score: 10 + depth, move: null };
    }
    if (this.adapter.checkWin(state, opponentRole)) {
      // Loss for bot (prefer slower losses by subtracting depth)
      return { score: -10 - depth, move: null };
    }
    if (this.adapter.checkDraw(state) || depth === 0) {
      // Draw or depth limit reached
      return { score: this.adapter.evaluate(state, botRole, depth), move: null };
    }

    const moves = this.adapter.getValidMoves(state);
    let bestMove: TMove | null = null;

    if (isMaximizing) {
      // MAXIMIZER (Bot)
      let maxScore = -Infinity;
      for (const move of moves) {
        const newState = this.adapter.applyMove(state, move, botRole);
        const result = this.minimax(
          newState,
          depth - 1,
          false,
          botRole,
          opponentRole,
          alpha,
          beta
        );

        if (result.score > maxScore) {
          maxScore = result.score;
          bestMove = move;
        }

        alpha = Math.max(alpha, result.score);
        if (beta <= alpha) break; // Prune
      }
      return { score: maxScore, move: bestMove };

    } else {
      // MINIMIZER (Opponent)
      let minScore = Infinity;
      for (const move of moves) {
        const newState = this.adapter.applyMove(state, move, opponentRole);
        const result = this.minimax(
          newState,
          depth - 1,
          true,
          botRole,
          opponentRole,
          alpha,
          beta
        );

        if (result.score < minScore) {
          minScore = result.score;
          bestMove = move;
        }

        beta = Math.min(beta, result.score);
        if (beta <= alpha) break; // Prune
      }
      return { score: minScore, move: bestMove };
    }
  }
}
