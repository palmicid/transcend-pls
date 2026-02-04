/**
 * @file BotStrategy.ts
 * @description Inteface for bot AI strategies.
 */

/**
 * Configuration passed to bot strategies.
 */
export interface BotConfig {
  difficulty: 1 | 3 | 9;        // Controls search depth or heuristics
  role: string;                  // The bot's role (e.g., "X", "O", "Red")
  opponentRole: string;          // The opponent's role
  delayMs: number;               // Artificial delay before moving
}

/**
 * Abstract interface for bot AI strategies.
 * Implement this to add new AI algorithms (Minimax, Random, NeuralNet, etc.).
 *
 * @template TGameState - The shape of the game state (board, turn, etc.)
 * @template TMove - The shape of a valid move (cell index, column index, etc.)
 */
export interface BotStrategy<TGameState, TMove> {
  /** Unique identifier for this strategy (e.g., "minimax") */
  readonly id: string;

  /** Human-readable name for UI display */
  readonly name: string;

  /** Description for UI tooltips */
  readonly description: string;

  /**
   * Calculate the best move for the given game state.
   * @param gameState - Current game state
   * @param config - Bot configuration
   * @returns The move to make, or null if no valid moves
   */
  getMove(gameState: TGameState, config: BotConfig): TMove | null;
}
