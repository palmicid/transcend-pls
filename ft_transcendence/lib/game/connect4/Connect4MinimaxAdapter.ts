/**
 * @file Connect4MinimaxAdapter.ts
 * @description Adapter to make Connect 4 compatible with the shared Minimax strategy.
 *
 * Heuristic improvements over the original:
 *  - All windows of 4 cells are scored in every direction (horizontal,
 *    vertical, both diagonals), not just center-column occupancy.
 *  - A window's value depends on how many bot / opponent pieces it contains:
 *      3 bot   + 1 empty → +50   (one move from winning)
 *      2 bot   + 2 empty → +10   (building threat)
 *      3 opp   + 1 empty → −140  (must block — much higher than attack)
 *      2 opp   + 2 empty → −18   (opponent building threat)
 *  - Mixed windows (both colours present) are worth 0 — neither side can
 *    complete them, so they are irrelevant.
 *  - Center column control still adds +3 per bot piece (positional bonus).
 */

import type { MinimaxAdapter } from "@/lib/bot";
import type { PlayerColor } from "./Connect4PlayerSlot";

type Board = (PlayerColor | null)[][];
type Move = number; // Column index 0-6

const ROWS = 6;
const COLS = 7;
const WIN_LENGTH = 4;

// =============================================================================
// HEURISTIC HELPERS
// =============================================================================

/**
 * Score a single window of WIN_LENGTH cells from the bot's perspective.
 *
 * Rules:
 *  - If the window contains pieces of both colours it is blocked and worth 0.
 *  - Otherwise score based on how many bot / opponent pieces it holds.
 *
 * @param window       - Array of WIN_LENGTH cells (null = empty)
 * @param botRole      - The colour the bot is playing
 * @param opponentRole - The opponent's colour
 * @returns Signed integer score contribution
 */
function scoreWindow(
	window: (PlayerColor | null)[],
	botRole: PlayerColor,
	opponentRole: PlayerColor,
): number {
	const botCount = window.filter((c) => c === botRole).length;
	const oppCount = window.filter((c) => c === opponentRole).length;

	// Mixed window — neither player can ever complete it
	if (botCount > 0 && oppCount > 0) return 0;

	// Bot-favourable
	if (botCount === 4) return 1000; // Terminal win (fallback — checkWin handles this first)
	if (botCount === 3) return 50; // One move from winning
	if (botCount === 2) return 10; // Building

	// Opponent-favourable — blocking pressure is weighted much higher
	// than attacking so risky lines are punished aggressively.
	if (oppCount === 4) return -1000; // Terminal loss (fallback)
	if (oppCount === 3) return -140; // Must block immediately
	if (oppCount === 2) return -18; // Opponent building

	return 0;
}

/**
 * Evaluate the entire board by scoring every possible window of 4 cells.
 *
 * Scans all horizontal, vertical, and diagonal windows and sums their
 * individual contributions. Also adds a center-column positional bonus.
 *
 * @param board        - Current board state
 * @param botRole      - The colour the bot is playing
 * @param opponentRole - The opponent's colour
 * @returns Signed integer heuristic score (positive = good for bot)
 */
function scoreBoard(
	board: Board,
	botRole: PlayerColor,
	opponentRole: PlayerColor,
): number {
	let score = 0;

	// --- Center column positional bonus -----------------------------------
	// The center column is the most flexible — pieces there participate in
	// more potential windows than any other column.
	const centerCol = Math.floor(COLS / 2); // 3 for a 7-wide board
	for (let row = 0; row < ROWS; row++) {
		if (board[row][centerCol] === botRole) score += 3;
	}

	// --- Horizontal windows -----------------------------------------------
	for (let row = 0; row < ROWS; row++) {
		for (let col = 0; col <= COLS - WIN_LENGTH; col++) {
			const window: (PlayerColor | null)[] = [
				board[row][col],
				board[row][col + 1],
				board[row][col + 2],
				board[row][col + 3],
			];
			score += scoreWindow(window, botRole, opponentRole);
		}
	}

	// --- Vertical windows -------------------------------------------------
	for (let col = 0; col < COLS; col++) {
		for (let row = 0; row <= ROWS - WIN_LENGTH; row++) {
			const window: (PlayerColor | null)[] = [
				board[row][col],
				board[row + 1][col],
				board[row + 2][col],
				board[row + 3][col],
			];
			score += scoreWindow(window, botRole, opponentRole);
		}
	}

	// --- Diagonal windows (down-right) ------------------------------------
	for (let row = 0; row <= ROWS - WIN_LENGTH; row++) {
		for (let col = 0; col <= COLS - WIN_LENGTH; col++) {
			const window: (PlayerColor | null)[] = [
				board[row][col],
				board[row + 1][col + 1],
				board[row + 2][col + 2],
				board[row + 3][col + 3],
			];
			score += scoreWindow(window, botRole, opponentRole);
		}
	}

	// --- Diagonal windows (down-left) -------------------------------------
	for (let row = 0; row <= ROWS - WIN_LENGTH; row++) {
		for (let col = WIN_LENGTH - 1; col < COLS; col++) {
			const window: (PlayerColor | null)[] = [
				board[row][col],
				board[row + 1][col - 1],
				board[row + 2][col - 2],
				board[row + 3][col - 3],
			];
			score += scoreWindow(window, botRole, opponentRole);
		}
	}

	return score;
}

// =============================================================================
// ADAPTER
// =============================================================================

export const Connect4MinimaxAdapter: MinimaxAdapter<Board, Move> = {
	/**
	 * Return all columns that still have at least one empty cell.
	 * Moves are ordered center-out so alpha-beta pruning cuts more branches.
	 */
	getValidMoves(board: Board): Move[] {
		// Build center-out ordering: 3,2,4,1,5,0,6 for a 7-wide board
		const centerOut = [3, 2, 4, 1, 5, 0, 6];
		return centerOut.filter((col) => board[0][col] === null);
	},

	/**
	 * Drop a piece into `column` with gravity, returning a NEW board.
	 * Never mutates the original.
	 */
	applyMove(board: Board, column: Move, role: string): Board {
		const newBoard = board.map((row) => [...row]);

		for (let row = ROWS - 1; row >= 0; row--) {
			if (newBoard[row][column] === null) {
				newBoard[row][column] = role as PlayerColor;
				break;
			}
		}

		return newBoard;
	},

	/**
	 * Return true if `role` has four pieces in a row in any direction.
	 */
	checkWin(board: Board, role: string): boolean {
		const r = role as PlayerColor;

		for (let row = 0; row < ROWS; row++) {
			for (let col = 0; col < COLS; col++) {
				if (board[row][col] !== r) continue;

				// Horizontal
				if (
					col + 3 < COLS &&
					board[row][col + 1] === r &&
					board[row][col + 2] === r &&
					board[row][col + 3] === r
				)
					return true;

				// Vertical
				if (
					row + 3 < ROWS &&
					board[row + 1][col] === r &&
					board[row + 2][col] === r &&
					board[row + 3][col] === r
				)
					return true;

				// Diagonal down-right
				if (
					row + 3 < ROWS &&
					col + 3 < COLS &&
					board[row + 1][col + 1] === r &&
					board[row + 2][col + 2] === r &&
					board[row + 3][col + 3] === r
				)
					return true;

				// Diagonal down-left
				if (
					row + 3 < ROWS &&
					col - 3 >= 0 &&
					board[row + 1][col - 1] === r &&
					board[row + 2][col - 2] === r &&
					board[row + 3][col - 3] === r
				)
					return true;
			}
		}

		return false;
	},

	/**
	 * Return true if the board is completely full (draw).
	 * Only called after checkWin returns false for both sides.
	 */
	checkDraw(board: Board): boolean {
		return board[0].every((cell) => cell !== null);
	},

	/**
	 * Heuristic board evaluation.
	 *
	 * Terminal states (win/loss) are handled by MinimaxStrategy before
	 * evaluate() is called, so the scores here are for non-terminal
	 * positions reached at the depth limit.
	 *
	 * @param board   - Current board state
	 * @param botRole - The colour the bot is playing
	 * @param depth   - Remaining depth (unused here; terminal bonuses are in
	 *                  MinimaxStrategy itself)
	 */
	evaluate(board: Board, botRole: string, _depth: number): number {
		const bot = botRole as PlayerColor;
		const opponent: PlayerColor = bot === "Red" ? "Yellow" : "Red";
		return scoreBoard(board, bot, opponent);
	},
};
