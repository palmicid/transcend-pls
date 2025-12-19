/**
 * @file TicTacToeGame.ts
 * @description Complete Tic-Tac-Toe game implementation.
 *
 * Implements the abstract Game class with Tic-Tac-Toe specific logic:
 * - 3x3 board with X and O marks
 * - Alternating turns between players
 * - Win detection (3 in a row)
 * - Draw detection (full board, no winner)
 *
 * @example
 * ```ts
 * import TicTacToeGame from '@/app/game/tic-tac-toe/TicTacToeGame';
 *
 * const game = new TicTacToeGame();
 * game.init();
 * game.handlePlayerConnect('player-1'); // Gets X
 * game.handlePlayerConnect('player-2'); // Gets O
 * game.startGame();
 * game.playerAction('player-1', { cell: 4 }); // X marks center
 * ```
 */

import { Game } from "@/lib/game";
import TicTacToeConfig from "./TicTacToeConfig";
import TicTacToeState from "./TicTacToeState";
import TicTacToePlayerSlot, { PlayerRole } from "./TicTacToePlayerSlot";
import logger from "@/lib/logger";

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
  // GAME METADATA
  // ===========================================================================

  get type(): string {
    return "tic-tac-toe";
  }

  init(): void {
    this.playerslot = new TicTacToePlayerSlot();
    this.gameState = new TicTacToeState();
    this.gameConfig = new TicTacToeConfig();
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
   */
  get Snapshot(): unknown {
    return {
      board: this.gameState.board,
      currentTurn: this.gameState.currentTurn,
      winner: this.gameState.winner,
      players: this.playerslot.roles,
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

  get isReady2Start(): boolean {
    return this.playerslot.isFull;
  }

  startGame(): void {
    this.gameState.startTime = Date.now();
  }

  pauseGame(): void {
    // No-op for turn-based game
  }

  endGame(): void {
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
