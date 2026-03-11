/**
 * @file TicTacToeBot.ts
 * @description Minimax bot facade for Tic-Tac-Toe.
 *
 * Registers the Tic-Tac-Toe Minimax strategy with the shared BotRegistry
 * under the namespaced ID "tic-tac-toe/minimax", then exposes a simple
 * getBotMove() function for backward-compatible use inside TicTacToeGame.
 *
 * Difficulty calibration for Tic-Tac-Toe:
 *
 *   Difficulty │ Search depth │ Behaviour
 *   ───────────┼──────────────┼──────────────────────────────────────────
 *   Easy       │ 1            │ Only looks one move ahead — makes blunders
 *   Medium     │ 3            │ Decent play, occasionally misses traps
 *   Hard       │ 9            │ Full-tree search — effectively unbeatable
 *
 * TTT's game tree is tiny (9! ≈ 362k nodes max), so even "Hard" completes
 * in microseconds.  The depth map is owned by this module so that the
 * MinimaxStrategy never needs to know about game-specific tuning.
 */

import { MinimaxStrategy } from "@/lib/bot/strategies/MinimaxStrategy";
import { BotRegistry } from "@/lib/bot/BotRegistry";
import type { BotDifficulty } from "@/lib/bot/constants";
import { TicTacToeMinimaxAdapter } from "./TicTacToeMinimaxAdapter";
import type { PlayerRole } from "./TicTacToePlayerSlot";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Sentinel ID that occupies a player slot when the bot is playing. */
export const BOT_PLAYER_ID = "__BOT__";

/** Registry key for the Tic-Tac-Toe Minimax strategy. */
export const TTT_STRATEGY_ID = "tic-tac-toe/minimax";

// =============================================================================
// TYPES
// =============================================================================

type Board = (PlayerRole | null)[];

// =============================================================================
// REGISTRY SETUP
// =============================================================================

/**
 * Maps each difficulty tier to a Minimax search depth calibrated for TTT.
 *
 * Because the TTT game tree is very small, even depth 9 runs in microseconds.
 * Easy intentionally uses a shallow depth so the bot makes obvious mistakes;
 * Hard uses the full tree depth for perfect play.
 */
const TTT_DEPTH_MAP: Record<BotDifficulty, number> = {
	Easy: 1,
	Medium: 3,
	Hard: 9,
};

// Register once per server process (globalThis-backed BotRegistry survives
// hot-reloads without creating duplicate entries).
if (!BotRegistry.has(TTT_STRATEGY_ID)) {
	BotRegistry.register(
		new MinimaxStrategy(TicTacToeMinimaxAdapter, {
			id: TTT_STRATEGY_ID,
			name: "Tic-Tac-Toe Minimax",
			description: "Minimax with alpha-beta pruning for Tic-Tac-Toe",
			depthMap: TTT_DEPTH_MAP,
		}),
	);
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Get the best move for the bot given the current board state.
 *
 * Looks the strategy up from BotRegistry so that any future replacement
 * (e.g. swapping to a neural-net strategy at runtime) is picked up
 * automatically without touching this file.
 *
 * @param board      - Current board (9-cell array of "X" | "O" | null)
 * @param botRole    - Role the bot is playing ("X" or "O")
 * @param difficulty - Human-readable difficulty tier (defaults to "Hard")
 * @returns Cell index to play (0-8), or null if no moves are available
 */
export function getBotMove(
	board: Board,
	botRole: PlayerRole,
	difficulty: BotDifficulty = "Hard",
): number | null {
	const strategy = BotRegistry.get<Board, number>(TTT_STRATEGY_ID);
	if (!strategy) {
		// Should never happen once the module has been imported, but guard anyway.
		console.error(
			`[TicTacToeBot] Strategy "${TTT_STRATEGY_ID}" not found in BotRegistry`,
		);
		return null;
	}

	return strategy.getMove(board, {
		difficulty,
		role: botRole,
		opponentRole: botRole === "X" ? "O" : "X",
		delayMs: 0,
	});
}

/**
 * Check whether a board position is a win for the given role.
 * Thin convenience wrapper around the adapter — useful in tests.
 */
export function hasWon(board: Board, role: PlayerRole): boolean {
	return TicTacToeMinimaxAdapter.checkWin(board, role);
}

/**
 * Check whether the board is a draw (full board, no winner).
 */
export function isDraw(board: Board): boolean {
	return (
		!TicTacToeMinimaxAdapter.checkWin(board, "X") &&
		!TicTacToeMinimaxAdapter.checkWin(board, "O") &&
		TicTacToeMinimaxAdapter.checkDraw(board)
	);
}
