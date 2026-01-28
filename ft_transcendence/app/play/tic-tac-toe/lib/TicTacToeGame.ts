/**
 * @file TicTacToeGame.ts
 * @description Complete Tic-Tac-Toe game implementation.
 *
 * Implements the abstract Game class with Tic-Tac-Toe specific logic:
 * - 3x3 board with X and O marks
 * - Alternating turns between players
 * - Win detection (3 in a row)
 * - Draw detection (full board, no winner)
 * - Bot opponent support with configurable difficulty
 *
 * @example
 * ```ts
 * import TicTacToeGame from '@/app/play/tic-tac-toe/lib/TicTacToeGame';
 *
 * const game = new TicTacToeGame();
 * game.init();
 * game.handlePlayerConnect('player-1'); // Gets X
 * game.configureBot('O', 9); // Add hard bot as O
 * game.startGame();
 * game.playerAction('player-1', { cell: 4 }); // X marks center
 * // Bot will respond automatically via scheduleBotMoveIfNeeded()
 * ```
 */

import { Game } from "@/lib/game";
import TicTacToeConfig from "./TicTacToeConfig";
import TicTacToeState from "./TicTacToeState";
import TicTacToePlayerSlot, { PlayerRole, BOT_PLAYER_ID } from "./TicTacToePlayerSlot";
import { getBotMove, type BotDifficulty } from "./TicTacToeBot";
import logger from "@/lib/logger";

/**
 * Shape of persisted Tic-Tac-Toe state from the database.
 * Uses loose types to handle Prisma's JsonValue type.
 */
export interface TicTacToePersistedState {
  board_state?: unknown; // Will be cast to (PlayerRole | null)[]
  current_turn?: string | null;
  status?: string;
  winner_role?: string | null;
  bot_difficulty?: number | null;
  bot_role?: string | null;
  bot_delay_ms?: number;
}

/**
 * Winning line combinations on a 3x3 board.
 * Each array contains the indices of a winning line.
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

/**
 * Tic-Tac-Toe game implementation.
 */
export default class TicTacToeGame extends Game<
  TicTacToeConfig,
  TicTacToeState,
  TicTacToePlayerSlot
> {
  playerslot = new TicTacToePlayerSlot();
  gameState = new TicTacToeState();
  gameConfig = new TicTacToeConfig();

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
    return "tic-tac-toe";
  }

  init(): void {
    this.playerslot = new TicTacToePlayerSlot();
    this.gameState = new TicTacToeState();
    this.gameConfig = new TicTacToeConfig();

    // If config has a bot, assign it to the slot
    if (this.gameConfig.botRole) {
      this.playerslot.assignBot(this.gameConfig.botRole);
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
   * @param role - The role for the bot ("X" or "O"), or null to remove bot
   * @param difficulty - Search depth (1=Easy, 3=Medium, 9=Hard)
   * @param delayMs - Delay before bot moves (milliseconds)
   */
  configureBot(
    role: "X" | "O" | null,
    difficulty: BotDifficulty | null = 9,
    delayMs: number = 500
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
    this.gameConfig.botDifficulty = difficulty;
    this.gameConfig.botDelayMs = delayMs;

    // Assign bot to slot if enabled
    if (role) {
      this.playerslot.assignBot(role);
    }

    logger.info({
      msg: "Bot configured",
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
    if (!this.playerslot.isBot(currentRole)) return;
    if (this.gameState.winner || this.checkEndConditions()) return;

    // Clear any pending bot move
    if (this.botMoveTimeout) {
      clearTimeout(this.botMoveTimeout);
    }

    // Schedule the move with delay for human-like feel
    this.botMoveTimeout = setTimeout(async () => {
      this.executeBotMove();
      if (this.onBotMove) {
        await this.onBotMove();
      }
    }, this.gameConfig.botDelayMs);

    logger.debug({
      msg: "Bot move scheduled",
      delayMs: this.gameConfig.botDelayMs,
      botRole: this.gameConfig.botRole,
    });
  }

  /**
   * Execute the bot's move immediately.
   * Called by the timeout after delay.
   */
  private executeBotMove(): void {
    const botRole = this.gameState.currentTurn;
    if (!this.playerslot.isBot(botRole)) return;

    const bestCell = getBotMove(
      this.gameState.board,
      botRole,
      this.gameConfig.botDifficulty ?? 9
    );

    if (bestCell !== null) {
      // Bot makes its move just like a player would
      this.gameState.board[bestCell] = botRole;
      this.gameState.currentTurn = botRole === "X" ? "O" : "X";
      this.updateState(); // Check for winner

      logger.info({
        msg: "Bot move executed",
        botRole,
        cell: bestCell,
        difficulty: this.gameConfig.botDifficulty,
      });
    }
  }

  // ===========================================================================
  // PLAYER ACTIONS
  // ===========================================================================

  /**
   * Process a player's move.
   *
   * Validates that:
   * - It's the player's turn
   * - The cell is empty
   *
   * Then marks the cell and switches turns.
   */
  playerAction(playerId: string, action: unknown): void {
    const role = this.playerslot.getRole(playerId);
    if (!role) return;

    const move = action as { cell: number };

    // Validate it's this player's turn and cell is empty
    if (role === this.gameState.currentTurn && this.gameState.board[move.cell] === null) {
      this.gameState.board[move.cell] = role;
      this.gameState.currentTurn = this.gameState.currentTurn === "X" ? "O" : "X";
    }
  }

  /**
   * Validate a move before processing.
   */
  isValidAction(playerId: string, action: unknown): boolean {
    const role = this.playerslot.getRole(playerId);
    if (!role || role !== this.gameState.currentTurn) return false;

    const move = action as { cell: number };
    return (
      move.cell >= 0 &&
      move.cell < 9 &&
      this.gameState.board[move.cell] === null
    );
  }

  // ===========================================================================
  // GAME STATE
  // ===========================================================================

  loadState(): void {
    this.gameState = new TicTacToeState();
  }

  /**
   * Restore game state from persistent storage.
   *
   * @param data - The raw state data from the database
   */
  restoreState(data: TicTacToePersistedState): void {
    if (!data) return;

    // Restore board state with proper type casting
    if (data.board_state && Array.isArray(data.board_state)) {
      this.gameState.board = data.board_state as (PlayerRole | null)[];
    }

    // Restore current turn with validation
    if (data.current_turn && (data.current_turn === "X" || data.current_turn === "O")) {
      this.gameState.currentTurn = data.current_turn as PlayerRole;
    }

    // Infer winner if game is ended
    if (data.status === "ENDED" && data.winner_role) {
      this.gameState.winner = data.winner_role as PlayerRole;
    }

    // Restore bot config
    if (data.bot_role && data.bot_difficulty) {
      this.configureBot(
        data.bot_role as "X" | "O",
        data.bot_difficulty as BotDifficulty,
        data.bot_delay_ms ?? 500
      );
    }
  }

  /**
   * Update state after a move - check for winner.
   */
  updateState(): void {
    const winner = this.checkWinner();
    if (winner) {
      this.gameState.winner = winner;
    }
  }

  /**
   * Get the current game snapshot for client display.
   * Includes bot configuration for SSE broadcast.
   */
  get Snapshot(): unknown {
    const isDraw = !this.gameState.winner && this.gameState.board.every((c) => c !== null);
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
    this.gameConfig = new TicTacToeConfig();
  }

  // ===========================================================================
  // GAME FLOW CONTROL
  // ===========================================================================

  /**
   * Check if game is ready to start.
   * With a bot, only need 1 human player.
   */
  get isReady2Start(): boolean {
    console.log("[TicTacToeGame.isReady2Start] Checking:", {
      hasBot: this.gameConfig.hasBot,
      botRole: this.gameConfig.botRole,
      botDifficulty: this.gameConfig.botDifficulty,
      playerSlotRoles: this.playerslot.roles,
      isFull: this.playerslot.isFull,
    });

    if (this.gameConfig.hasBot) {
      // With bot, need 1 human player (bot is already in slot)
      const humanRole = this.gameConfig.botRole === "X" ? "O" : "X";
      const humanPlayerId = this.playerslot.roles[humanRole];
      const isReady = humanPlayerId !== null && humanPlayerId !== BOT_PLAYER_ID;
      console.log("[TicTacToeGame.isReady2Start] Bot game check:", {
        humanRole,
        humanPlayerId,
        isReady,
      });
      return isReady;
    }
    return this.playerslot.isFull;
  }

  startGame(): void {
    this.gameState.startTime = Date.now();

    // If bot plays first (is X), schedule its move
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
      msg: "Game ended",
      gameType: this.type,
      result: this.result,
    });
  }

  /**
   * Check if game is over (winner or draw).
   */
  checkEndConditions(): boolean {
    return (
      this.gameState.winner !== null ||
      this.gameState.board.every((cell) => cell !== null)
    );
  }

  // ===========================================================================
  // GAME RESULTS
  // ===========================================================================

  get result(): unknown {
    return {
      winner: this.gameState.winner,
      duration: Date.now() - this.gameState.startTime,
      players: this.playerslot.roles,
      vsBot: this.gameConfig.hasBot,
      botDifficulty: this.gameConfig.botDifficulty,
    };
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  /**
   * Check if there's a winner.
   *
   * @returns The winning player role, or null if no winner yet
   */
  private checkWinner(): PlayerRole | null {
    for (const [a, b, c] of WINNING_LINES) {
      const player = this.gameState.board[a];
      if (
        player &&
        this.gameState.board[b] === player &&
        this.gameState.board[c] === player
      ) {
        return player;
      }
    }
    return null;
  }
}
