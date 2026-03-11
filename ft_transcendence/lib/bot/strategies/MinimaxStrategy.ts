/**
 * @file MinimaxStrategy.ts
 * @description Minimax algorithm with alpha-beta pruning using adapter pattern.
 *
 * Each game registers its own MinimaxStrategy instance with a unique ID so the
 * BotRegistry can store and retrieve them without collision:
 *
 *   new MinimaxStrategy(TicTacToeMinimaxAdapter, {
 *     id: "tic-tac-toe/minimax",
 *     depthMap: { Easy: 1, Medium: 3, Hard: 9 },
 *   })
 *
 *   new MinimaxStrategy(Connect4MinimaxAdapter, {
 *     id: "connect4/minimax",
 *     depthMap: { Easy: 2, Medium: 4, Hard: 6 },
 *   })
 *
 * The `depthMap` is the primary mechanism by which each strategy defines its
 * own difficulty behaviour.  "Easy" might mean depth 1 for a small game like
 * Tic-Tac-Toe but depth 2 for Connect4 (which has a much wider branching
 * factor).  Keeping the map inside the strategy instance means the call-sites
 * never need to know about raw numbers — they simply pass "Easy" / "Medium" /
 * "Hard" and the strategy does the rest.
 */

import type { BotStrategy, BotConfig } from "../BotStrategy";
import type { BotDifficulty } from "../constants";
import { DEFAULT_DIFFICULTY_DEPTH_MAP } from "../constants";

// =============================================================================
// ADAPTER INTERFACE
// =============================================================================

/**
 * Adapter interface for game-specific minimax logic.
 * Each game (TTT, Connect4, …) must implement this to use MinimaxStrategy.
 */
export interface MinimaxAdapter<TGameState, TMove> {
	/** Return all legal moves for the current state. */
	getValidMoves(state: TGameState): TMove[];

	/**
	 * Apply a move and return the resulting state.
	 * MUST return a NEW object — do NOT mutate the original.
	 */
	applyMove(state: TGameState, move: TMove, role: string): TGameState;

	/** Return true if the given role has won. */
	checkWin(state: TGameState, role: string): boolean;

	/** Return true if the game is a draw (called only after checkWin is false). */
	checkDraw(state: TGameState): boolean;

	/**
	 * Heuristic board evaluation from the bot's perspective.
	 * Positive  → good for the bot.
	 * Negative  → bad  for the bot.
	 * Called when the search hits depth 0 without a terminal state.
	 *
	 * @param state   - Current board state
	 * @param botRole - The role the bot is playing
	 * @param depth   - Remaining depth (can be used to prefer faster wins)
	 */
	evaluate(state: TGameState, botRole: string, depth: number): number;
}

// =============================================================================
// CONSTRUCTOR OPTIONS
// =============================================================================

export interface MinimaxStrategyOptions {
	/**
	 * Unique registry ID for this strategy instance.
	 * Use a namespaced format such as "tic-tac-toe/minimax" or "connect4/minimax"
	 * so multiple games can register their own Minimax strategies without
	 * overwriting each other in the BotRegistry.
	 *
	 * Defaults to "minimax" when omitted (backward-compatible).
	 */
	id?: string;

	/** Human-readable name shown in UI (defaults to "Minimax AI"). */
	name?: string;

	/** Tooltip description (defaults to a standard description). */
	description?: string;

	/**
	 * Maps each difficulty tier to the actual Minimax search depth used for
	 * that tier.  This is where each strategy defines its own difficulty
	 * behaviour without affecting any other strategy or call-site.
	 *
	 * Guidelines:
	 *   - Easy   → shallow depth; the bot should make occasional mistakes
	 *   - Medium → moderate depth; a fair challenge for most players
	 *   - Hard   → deepest viable depth for this game's branching factor
	 *
	 * Example for Tic-Tac-Toe (9-cell board, tiny tree):
	 *   { Easy: 1, Medium: 3, Hard: 9 }
	 *
	 * Example for Connect4 (7-column board, much wider tree):
	 *   { Easy: 2, Medium: 4, Hard: 6 }
	 *
	 * Falls back to DEFAULT_DIFFICULTY_DEPTH_MAP when omitted.
	 */
	depthMap?: Record<BotDifficulty, number>;
}

// =============================================================================
// STRATEGY
// =============================================================================

/**
 * Minimax strategy with alpha-beta pruning.
 *
 * Works with any game that provides a {@link MinimaxAdapter}.
 * Each instance owns its own {@link MinimaxStrategyOptions.depthMap}, so
 * difficulty calibration lives entirely inside the strategy — callers only
 * ever pass "Easy" | "Medium" | "Hard".
 *
 * @template TGameState - Shape of the game state (board array, etc.)
 * @template TMove      - Shape of a valid move (cell index, column, etc.)
 */
export class MinimaxStrategy<TGameState, TMove>
	implements BotStrategy<TGameState, TMove>
{
	readonly id: string;
	readonly name: string;
	readonly description: string;

	/** Per-instance depth map — defines the strategy's difficulty behaviour. */
	private readonly depthMap: Record<BotDifficulty, number>;

	constructor(
		private readonly adapter: MinimaxAdapter<TGameState, TMove>,
		options: MinimaxStrategyOptions = {},
	) {
		this.id = options.id ?? "minimax";
		this.name = options.name ?? "Minimax AI";
		this.description =
			options.description ?? "Classic game-tree search with alpha-beta pruning";
		this.depthMap = options.depthMap ?? { ...DEFAULT_DIFFICULTY_DEPTH_MAP };
	}

	// ---------------------------------------------------------------------------
	// PUBLIC API
	// ---------------------------------------------------------------------------

	getMove(gameState: TGameState, config: BotConfig): TMove | null {
		// Translate the human-readable difficulty tier into the search depth
		// that this particular strategy was calibrated with.
		const depth = this.depthMap[config.difficulty] ?? this.depthMap.Hard;

		const result = this.minimax(
			gameState,
			depth,
			true, // isMaximizing — bot always starts as maximiser
			config.role,
			config.opponentRole,
			-Infinity,
			Infinity,
		);
		return result.move;
	}

	// ---------------------------------------------------------------------------
	// PRIVATE — MINIMAX CORE
	// ---------------------------------------------------------------------------

	private minimax(
		state: TGameState,
		depth: number,
		isMaximizing: boolean,
		botRole: string,
		opponentRole: string,
		alpha: number,
		beta: number,
	): { score: number; move: TMove | null } {
		// --- Terminal state checks -----------------------------------------------

		if (this.adapter.checkWin(state, botRole)) {
			// Bot wins — reward faster wins (higher remaining depth = fewer moves used)
			return { score: 10 + depth, move: null };
		}
		if (this.adapter.checkWin(state, opponentRole)) {
			// Bot loses — penalise faster losses
			return { score: -10 - depth, move: null };
		}
		if (this.adapter.checkDraw(state) || depth === 0) {
			// Draw or depth limit reached — delegate to game-specific heuristic
			return {
				score: this.adapter.evaluate(state, botRole, depth),
				move: null,
			};
		}

		// --- Recursive search ----------------------------------------------------

		const moves = this.adapter.getValidMoves(state);
		let bestMove: TMove | null = null;

		if (isMaximizing) {
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
					beta,
				);

				if (result.score > maxScore) {
					maxScore = result.score;
					bestMove = move;
				}

				alpha = Math.max(alpha, result.score);
				if (beta <= alpha) break; // Alpha-beta prune
			}

			return { score: maxScore, move: bestMove };
		} else {
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
					beta,
				);

				if (result.score < minScore) {
					minScore = result.score;
					bestMove = move;
				}

				beta = Math.min(beta, result.score);
				if (beta <= alpha) break; // Alpha-beta prune
			}

			return { score: minScore, move: bestMove };
		}
	}
}
