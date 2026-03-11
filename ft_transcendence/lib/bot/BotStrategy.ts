/**
 * @file BotStrategy.ts
 * @description Interface for bot AI strategies.
 */

import type { BotDifficulty } from "./constants";

/**
 * Configuration passed to bot strategies.
 *
 * `difficulty` is the human-readable tier ("Easy" | "Medium" | "Hard").
 * Each strategy is responsible for translating this label into whatever
 * internal parameter its algorithm needs (search depth, randomness, etc.).
 * This keeps the public API clean while allowing every strategy to calibrate
 * its own behaviour per difficulty tier.
 */
export interface BotConfig {
	difficulty: BotDifficulty; // Human-readable difficulty tier
	role: string; // The bot's role (e.g. "X", "O", "Red")
	opponentRole: string; // The opponent's role
	delayMs: number; // Artificial delay before moving (ms)
}

/**
 * Abstract interface for bot AI strategies.
 * Implement this to add new AI algorithms (Minimax, Random, NeuralNet, etc.).
 *
 * @template TGameState - The shape of the game state (board, turn, etc.)
 * @template TMove      - The shape of a valid move (cell index, column, etc.)
 */
export interface BotStrategy<TGameState, TMove> {
	/** Unique identifier for this strategy (e.g. "tic-tac-toe/minimax") */
	readonly id: string;

	/** Human-readable name for UI display */
	readonly name: string;

	/** Description for UI tooltips */
	readonly description: string;

	/**
	 * Calculate the best move for the given game state.
	 * @param gameState - Current game state
	 * @param config    - Bot configuration including the difficulty tier
	 * @returns The move to make, or null if no valid moves exist
	 */
	getMove(gameState: TGameState, config: BotConfig): TMove | null;
}
