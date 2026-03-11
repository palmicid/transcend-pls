/**
 * @file Connect4Game.ts
 * @description Complete Connect Four game implementation.
 *
 * Implements the abstract Game class with Connect Four specific logic:
 * - 7x6 board with Red and Yellow discs
 * - Gravity-based piece dropping (pieces fall to bottom)
 * - Alternating turns between players
 * - Win detection (4 in a row: horizontal, vertical, diagonal)
 * - Draw detection (full board, no winner)
 * - Bot opponent support with configurable difficulty
 *
 * @example
 * ```ts
 * import Connect4Game from '@/lib/game/connect4/Connect4Game';
 *
 * const game = new Connect4Game();
 * game.init();
 * game.handlePlayerConnect('player-1'); // Gets Red
 * game.configureBot('Yellow', 'Hard'); // Add hard bot as Yellow
 * game.startGame();
 * game.playerAction('player-1', { column: 3 }); // Red drops in column 3
 * // Bot will respond automatically via scheduleBotMoveIfNeeded()
 * ```
 */

import { Game } from "@/lib/game";
import Connect4Config from "./Connect4Config";
import Connect4State from "./Connect4State";
import Connect4PlayerSlot, { PlayerColor } from "./Connect4PlayerSlot";
import logger from "@/lib/logger";
import { MinimaxStrategy, BotRegistry, BOT_PLAYER_ID } from "@/lib/bot";
import type { BotDifficulty } from "@/lib/bot/constants";
import { Connect4MinimaxAdapter } from "./Connect4MinimaxAdapter";

// =============================================================================
// REGISTRY SETUP
// =============================================================================

/** Registry key for the Connect4 Minimax strategy. */
export const C4_STRATEGY_ID = "connect4/minimax";

/**
 * Maps each difficulty tier to a Minimax search depth calibrated for
 * Connect4's branching factor (~7 columns per move).
 *
 * Without a cap, "Hard" at raw depth 9 would explore up to 7^9 ≈ 40M nodes
 * per move (before alpha-beta cuts), potentially blocking the Node.js event
 * loop for several seconds.  Depth 6 with the window-scoring heuristic is
 * still an extremely strong player.
 *
 *   Difficulty │ Search depth │ Behaviour
 *   ───────────┼──────────────┼──────────────────────────────────────────
 *   Easy       │ 2            │ Very shallow — makes frequent blunders
 *   Medium     │ 4            │ Decent play, misses some multi-step traps
 *   Hard       │ 6            │ Strong positional play, rarely loses
 *
 * This map lives here (and is passed to the MinimaxStrategy constructor) so
 * that the strategy owns the depth calibration and call-sites only ever deal
 * with human-readable difficulty strings.
 */
const C4_DEPTH_MAP: Record<BotDifficulty, number> = {
	Easy: 2,
	Medium: 4,
	Hard: 6,
};

// Register once per server process (globalThis-backed BotRegistry survives
// hot-reloads without creating duplicate entries).
if (!BotRegistry.has(C4_STRATEGY_ID)) {
	BotRegistry.register(
		new MinimaxStrategy(Connect4MinimaxAdapter, {
			id: C4_STRATEGY_ID,
			name: "Connect4 Minimax",
			description:
				"Minimax with alpha-beta pruning and window-scoring heuristic",
			depthMap: C4_DEPTH_MAP,
		}),
	);
}

// =============================================================================
// TYPES
// =============================================================================

/**
 * Shape of persisted Connect Four state from the database.
 */
interface Connect4PersistedState {
	board_state?: (PlayerColor | null)[][];
	current_turn?: PlayerColor;
	status?: string;
	winner_role?: PlayerColor;
	bot_difficulty?: BotDifficulty | string | null;
	bot_role?: PlayerColor | null;
	bot_delay_ms?: number;
}

/**
 * Connect Four game implementation.
 *
 * Manages a 7×6 grid where two players alternate dropping colored discs.
 * The first to connect four pieces in a row (horizontal, vertical, or diagonal) wins.
 */
export default class Connect4Game extends Game<
	Connect4Config,
	Connect4State,
	Connect4PlayerSlot
> {
	playerslot = new Connect4PlayerSlot();
	gameState = new Connect4State();
	gameConfig = new Connect4Config();

	// ===========================================================================
	// BOT MANAGEMENT
	// ===========================================================================

	/** Pending bot move timeout ID (for cancellation) */
	private botMoveTimeout: NodeJS.Timeout | null = null;

	/**
	 * Callback to trigger after bot move (for syncing to DB and broadcasting).
	 * Set by the room manager or server actions when integrating the game.
	 */
	onBotMove: (() => Promise<void>) | null = null;

	// ===========================================================================
	// GAME METADATA
	// ===========================================================================

	get type(): string {
		return "connect4";
	}

	init(): void {
		this.playerslot = new Connect4PlayerSlot();
		this.gameState = new Connect4State();
		this.gameConfig = new Connect4Config();

		// If config has a bot, assign it to the slot
		if (this.gameConfig.botRole) {
			this.playerslot.assignBot(this.gameConfig.botRole as PlayerColor);
		}
	}

	// ===========================================================================
	// PLAYER MANAGEMENT
	// ===========================================================================

	getPlayerRole(playerId: string): string {
		return this.playerslot.getRole(playerId) ?? "spectator";
	}

	get canAcceptMorePlayers(): boolean {
		return this.playerslot.canAcceptMorePlayers;
	}

	handlePlayerConnect(playerId: string): void {
		this.playerslot.assign(playerId);
	}

	handlePlayerDisconnect(playerId: string): void {
		this.playerslot.remove(playerId);
	}

	handlePlayerReconnect(): void {
		// No special logic needed - players rejoin via handlePlayerConnect
	}

	getPlayerTimeoutThreshold(): number {
		return 30000; // 30 seconds
	}

	// ===========================================================================
	// BOT CONFIGURATION
	// ===========================================================================

	/**
	 * Configure the bot. Can be called to add/remove bot mid-game.
	 *
	 * @param role       - The role for the bot ("Red" or "Yellow"), or null to remove bot
	 * @param difficulty - Difficulty tier ("Easy" | "Medium" | "Hard")
	 * @param delayMs    - Delay before bot moves (milliseconds)
	 */
	configureBot(
		role: PlayerColor | null,
		difficulty: BotDifficulty | null = "Medium",
		delayMs: number = 500,
	): void {
		// Remove existing bot if any
		const existingBotRole = this.playerslot.getBotRole();
		if (existingBotRole) {
			this.playerslot.removeBot(existingBotRole);
		}

		// Clear any pending bot move
		if (this.botMoveTimeout) {
			clearTimeout(this.botMoveTimeout);
			this.botMoveTimeout = null;
		}

		// Set new config
		this.gameConfig.botRole = role;
		this.gameConfig.botDifficulty = difficulty ?? "Medium";
		this.gameConfig.botDelayMs = delayMs;

		// Assign bot to slot if enabled
		if (role) {
			this.playerslot.assignBot(role);
		}

		logger.info({
			msg: "C4 Bot configured",
			gameType: this.type,
			botRole: role,
			difficulty,
			delayMs,
		});
	}

	/**
	 * Schedule bot move with delay for human-like feel.
	 * Called after human moves or at game start if bot plays first.
	 */
	scheduleBotMoveIfNeeded(): void {
		if (!this.gameConfig.hasBot) return;

		const currentRole = this.gameState.currentTurn;
		// Note: TypeScript might not strictly infer currentTurn as PlayerColor here
		if (!this.playerslot.isBot(currentRole as PlayerColor)) return;
		if (this.gameState.winner || this.checkEndConditions()) return;

		// Clear any pending bot move
		if (this.botMoveTimeout) {
			clearTimeout(this.botMoveTimeout);
		}

		// Schedule the move with delay for human-like feel
		this.botMoveTimeout = setTimeout(async () => {
			try {
				this.executeBotMove();
				if (this.onBotMove) {
					await this.onBotMove();
				}
			} catch (error) {
				logger.error({
					msg: "C4 Bot move callback failed",
					error: error instanceof Error ? error.message : String(error),
					botRole: this.gameConfig.botRole,
				});
			}
		}, this.gameConfig.botDelayMs);
	}

	/**
	 * Execute the bot's move immediately.
	 * Called by the timeout after delay.
	 */
	private executeBotMove(): void {
		const botRole = this.gameState.currentTurn as PlayerColor;
		if (!this.playerslot.isBot(botRole)) return;

		// Retrieve the strategy from the registry (registered at module load above).
		const strategy = BotRegistry.get<(PlayerColor | null)[][], number>(
			C4_STRATEGY_ID,
		);
		if (!strategy) {
			logger.error({
				msg: "Connect4 minimax strategy not found in BotRegistry",
			});
			return;
		}

		// Pass the difficulty string directly — the strategy's depthMap handles
		// translating "Easy" / "Medium" / "Hard" to the appropriate search depth.
		const bestColumn = strategy.getMove(this.gameState.board, {
			difficulty: this.gameConfig.botDifficulty ?? "Medium",
			role: botRole,
			opponentRole: botRole === "Red" ? "Yellow" : "Red",
			delayMs: 0,
		});

		if (bestColumn !== null) {
			// Apply the move (drop piece logic)
			this.dropPiece(bestColumn, botRole);

			// Switch turns
			this.gameState.currentTurn = botRole === "Red" ? "Yellow" : "Red";
			this.updateState(); // Check for winner

			logger.info({
				msg: "C4 Bot move executed",
				botRole,
				column: bestColumn,
				difficulty: this.gameConfig.botDifficulty,
			});
		}
	}

	// ===========================================================================
	// ACTION VALIDATION
	// ===========================================================================

	isValidAction(playerId: string, action: unknown): boolean {
		const role = this.playerslot.getRole(playerId);
		if (!role || role !== this.gameState.currentTurn) return false;

		const move = action as { column?: number };
		if (move.column === undefined) return false;

		const column = move.column;
		if (column < 0 || column >= this.gameConfig.columns) return false;

		// Check if column is full (top row occupied)
		return this.gameState.board[0][column] === null;
	}

	// ===========================================================================
	// PLAYER ACTIONS
	// ===========================================================================

	playerAction(playerId: string, action: unknown): void {
		const role = this.playerslot.getRole(playerId);
		if (!role) return;

		const move = action as { column: number };

		// Validate move
		if (!this.isValidAction(playerId, action)) return;

		// Apply move
		this.dropPiece(move.column, role);

		// Switch turns
		this.gameState.currentTurn =
			this.gameState.currentTurn === "Red" ? "Yellow" : "Red";
		this.updateState(); // Check for winner

		// Trigger bot if it's now its turn
		this.scheduleBotMoveIfNeeded();
	}

	/**
	 * Helper to drop a piece into a column with gravity.
	 */
	private dropPiece(column: number, role: PlayerColor): void {
		// Find the lowest empty row in the column (gravity effect)
		let dropRow = -1;
		for (let row = this.gameConfig.rows - 1; row >= 0; row--) {
			if (this.gameState.board[row][column] === null) {
				dropRow = row;
				break;
			}
		}

		if (dropRow === -1) return; // Column is full

		// Place the piece
		this.gameState.board[dropRow][column] = role;
	}

	// ===========================================================================
	// GAME STATE
	// ===========================================================================

	loadState(data?: any): void {
		this.gameState = new Connect4State();
		if (data) {
			if (data.board_state) this.gameState.board = data.board_state;
			if (data.current_turn) this.gameState.currentTurn = data.current_turn;
			if (data.status === "ENDED" && data.winner_role)
				this.gameState.winner = data.winner_role;

			// Restore bot config from DB state
			if (data.bot_role) {
				this.gameConfig.botRole = data.bot_role;
				this.gameConfig.botDifficulty = data.bot_difficulty as BotDifficulty;
				this.gameConfig.botDelayMs = data.bot_delay_ms ?? 500;

				this.playerslot.assignBot(data.bot_role);
			}

			// Restore players (careful not to overwrite bot if already set)
			if (data.players && Array.isArray(data.players)) {
				data.players.forEach((p: any) => {
					if (
						(p.role === "Red" || p.role === "Yellow") &&
						!this.playerslot.isBot(p.role)
					) {
						this.playerslot.roles[p.role as PlayerColor] = p.user_id.toString();
					}
				});
			}
		}
	}

	restoreState(data: Connect4PersistedState): void {
		if (!data) return;

		if (data.board_state) this.gameState.board = data.board_state;
		if (data.current_turn) this.gameState.currentTurn = data.current_turn;
		if (data.status === "ENDED" && data.winner_role)
			this.gameState.winner = data.winner_role;

		// Restore bot config
		if (data.bot_role && data.bot_difficulty) {
			this.configureBot(
				data.bot_role as PlayerColor,
				data.bot_difficulty as BotDifficulty,
				data.bot_delay_ms ?? 500,
			);
		}
	}

	updateState(): void {
		const winner = this.checkWinner();
		if (winner) {
			this.gameState.winner = winner;
		}
	}

	get Snapshot(): unknown {
		const isFull = this.gameState.board.every((row) =>
			row.every((cell) => cell !== null),
		);
		const isDraw = isFull && this.gameState.winner === null;
		const botRole = this.playerslot.getBotRole();

		return {
			board: this.gameState.board,
			currentTurn: this.gameState.currentTurn,
			winner: this.gameState.winner,
			is_draw: isDraw,
			players: this.playerslot.roles,
			// Bot configuration for frontend
			bot: this.gameConfig.hasBot
				? {
						role: botRole,
						difficulty: this.gameConfig.botDifficulty,
						delayMs: this.gameConfig.botDelayMs,
					}
				: null,
		};
	}

	// ===========================================================================
	// GAME CONFIGURATION
	// ===========================================================================

	loadConfig(): void {
		this.gameConfig = new Connect4Config();
	}

	// ===========================================================================
	// GAME FLOW CONTROL
	// ===========================================================================

	get isReady2Start(): boolean {
		if (this.gameConfig.hasBot) {
			// With bot, need 1 human player
			const humanRole = this.gameConfig.botRole === "Red" ? "Yellow" : "Red";
			const humanPlayerId = this.playerslot.roles[humanRole];
			return humanPlayerId !== null && humanPlayerId !== BOT_PLAYER_ID;
		}
		return this.playerslot.isFull;
	}

	startGame(): void {
		this.gameState.startTime = Date.now();

		// If bot plays first, schedule its move
		this.scheduleBotMoveIfNeeded();
	}

	pauseGame(): void {
		// No-op for turn-based game
	}

	endGame(): void {
		// Clear any pending bot move
		if (this.botMoveTimeout) {
			clearTimeout(this.botMoveTimeout);
			this.botMoveTimeout = null;
		}

		logger.info({
			msg: "Connect4 game ended",
			gameType: this.type,
			result: this.result,
		});
	}

	checkEndConditions(): boolean {
		return (
			this.gameState.winner !== null ||
			this.gameState.board.every((row) => row.every((cell) => cell !== null))
		);
	}

	// ===========================================================================
	// GAME RESULTS
	// ===========================================================================

	get result(): unknown {
		const isFull = this.gameState.board.every((row) =>
			row.every((cell) => cell !== null),
		);
		const isDraw = isFull && this.gameState.winner === null;

		return {
			winner: this.gameState.winner,
			is_draw: isDraw,
			duration: Date.now() - this.gameState.startTime,
			players: this.playerslot.roles,
			vsBot: this.gameConfig.hasBot,
			botDifficulty: this.gameConfig.botDifficulty,
		};
	}

	// ===========================================================================
	// PRIVATE HELPERS
	// ===========================================================================

	private checkWinner(): PlayerColor | null {
		// Reusing the adapter checkWin for consistency
		if (Connect4MinimaxAdapter.checkWin(this.gameState.board, "Red"))
			return "Red";
		if (Connect4MinimaxAdapter.checkWin(this.gameState.board, "Yellow"))
			return "Yellow";
		return null;
	}
}
