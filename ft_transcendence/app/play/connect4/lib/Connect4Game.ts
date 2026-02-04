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
 *
 * @example
 * ```ts
 * import Connect4Game from '@/app/play/connect4/lib/Connect4Game';
 *
 * const game = new Connect4Game();
 * game.init();
 * game.handlePlayerConnect('player-1'); // Gets Red
 * game.handlePlayerConnect('player-2'); // Gets Yellow
 * game.startGame();
 * game.playerAction('player-1', { column: 3 }); // Red drops in column 3
 * ```
 */

import { Game } from "@/lib/game";
import Connect4Config from "./Connect4Config";
import Connect4State from "./Connect4State";
import Connect4PlayerSlot, { PlayerColor } from "./Connect4PlayerSlot";
import logger from "@/lib/logger";

/**
 * Shape of persisted Connect Four state from the database.
 */
interface Connect4PersistedState {
  board_state?: (PlayerColor | null)[][];
  current_turn?: PlayerColor;
  status?: string;
  winner_role?: PlayerColor;
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
  // GAME METADATA
  // ===========================================================================

  get type(): string {
    return "connect4";
  }

  init(): void {
    this.playerslot = new Connect4PlayerSlot();
    this.gameState = new Connect4State();
    this.gameConfig = new Connect4Config();
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
  // ACTION VALIDATION
  // ===========================================================================

  /**
   * Validate a player's move before processing.
   *
   * Checks:
   * - It's the correct player's turn
   * - Column index is valid (0-6)
   * - Column is not full
   *
   * @param playerId - The player attempting the move
   * @param action - The move action with column index
   * @returns true if move is valid
   */
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

  /**
   * Process a player's move.
   *
   * Drops a piece into the specified column. The piece falls to the lowest
   * available row due to gravity. Then switches turns to the other player.
   *
   * @param playerId - The player making the move
   * @param action - The move action containing the column
   */
  playerAction(playerId: string, action: unknown): void {
    const role = this.playerslot.getRole(playerId);
    if (!role) return;

    const move = action as { column: number };

    // Validate move
    if (!this.isValidAction(playerId, action)) return;

    // Find the lowest empty row in the column (gravity effect)
    let dropRow = -1;
    for (let row = this.gameConfig.rows - 1; row >= 0; row--) {
      if (this.gameState.board[row][move.column] === null) {
        dropRow = row;
        break;
      }
    }

    if (dropRow === -1) return; // Column is full (shouldn't happen if validation works)

    // Place the piece
    this.gameState.board[dropRow][move.column] = role;

    // Switch turns
    this.gameState.currentTurn = this.gameState.currentTurn === "Red" ? "Yellow" : "Red";
  }

  // ===========================================================================
  // GAME STATE
  // ===========================================================================

  loadState(data?: any): void {
    this.gameState = new Connect4State();
    if (data) {
        if (data.board_state) this.gameState.board = data.board_state;
        if (data.current_turn) this.gameState.currentTurn = data.current_turn;
        if (data.status === "ENDED" && data.winner_role) this.gameState.winner = data.winner_role;

        // Restore players
        if (data.players && Array.isArray(data.players)) {
            data.players.forEach((p: any) => {
                if (p.role === "Red" || p.role === "Yellow") {
                    this.playerslot.roles[p.role as PlayerColor] = p.user_id.toString();
                }
            });
        }
    }
  }

  /**
   * Restore game state from persistent storage.
   *
   * @param data - The raw state data from the database
   */
  restoreState(data: Connect4PersistedState): void {
    if (!data) return;

    if (data.board_state) {
      this.gameState.board = data.board_state;
    }
    if (data.current_turn) {
      this.gameState.currentTurn = data.current_turn;
    }
    if (data.status === "ENDED" && data.winner_role) {
      this.gameState.winner = data.winner_role;
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
   */
  get Snapshot(): unknown {
    const isFull = this.gameState.board.every((row) =>
      row.every((cell) => cell !== null)
    );
    const isDraw = isFull && this.gameState.winner === null;

    return {
      board: this.gameState.board,
      currentTurn: this.gameState.currentTurn,
      winner: this.gameState.winner,
      is_draw: isDraw,
      players: this.playerslot.roles,
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
      msg: "Connect4 game ended",
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
      this.gameState.board.every((row) => row.every((cell) => cell !== null))
    );
  }

  // ===========================================================================
  // GAME RESULTS
  // ===========================================================================

  get result(): unknown {
    const isFull = this.gameState.board.every((row) =>
      row.every((cell) => cell !== null)
    );
    const isDraw = isFull && this.gameState.winner === null;

    return {
      winner: this.gameState.winner,
      is_draw: isDraw,
      duration: Date.now() - this.gameState.startTime,
      players: this.playerslot.roles,
    };
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  /**
   * Check if there's a winner by examining all directions from every piece.
   *
   * @returns The winning player color, or null if no winner yet
   */
  private checkWinner(): PlayerColor | null {
    // Check all pieces on the board
    for (let row = 0; row < this.gameConfig.rows; row++) {
      for (let col = 0; col < this.gameConfig.columns; col++) {
        const piece = this.gameState.board[row][col];
        if (!piece) continue;

        // Check four directions from this piece
        // 1. Horizontal (right)
        if (this.countDirection(piece, row, col, 0, 1) >= this.gameConfig.winCondition)
          return piece;

        // 2. Vertical (down)
        if (this.countDirection(piece, row, col, 1, 0) >= this.gameConfig.winCondition)
          return piece;

        // 3. Diagonal (down-right and up-left)
        if (
          this.countBidirectional(piece, row, col, 1, 1) >=
          this.gameConfig.winCondition
        )
          return piece;

        // 4. Diagonal (down-left and up-right)
        if (
          this.countBidirectional(piece, row, col, 1, -1) >=
          this.gameConfig.winCondition
        )
          return piece;
      }
    }

    return null;
  }

  /**
   * Count consecutive pieces in one direction from a starting position.
   *
   * @param piece - The piece color to check
   * @param startRow - Starting row
   * @param startCol - Starting column
   * @param rowDelta - Row increment (-1, 0, or 1)
   * @param colDelta - Column increment (-1, 0, or 1)
   * @returns Count of consecutive pieces in that direction
   */
  private countDirection(
    piece: PlayerColor,
    startRow: number,
    startCol: number,
    rowDelta: number,
    colDelta: number
  ): number {
    let count = 0;
    let row = startRow;
    let col = startCol;

    while (
      row >= 0 &&
      row < this.gameConfig.rows &&
      col >= 0 &&
      col < this.gameConfig.columns &&
      this.gameState.board[row][col] === piece
    ) {
      count++;
      row += rowDelta;
      col += colDelta;
    }

    return count;
  }

  /**
   * Count consecutive pieces in both directions from a starting position.
   * Used for diagonal checking where we need to check both directions.
   *
   * @param piece - The piece color to check
   * @param startRow - Starting row
   * @param startCol - Starting column
   * @param rowDelta - Row increment for forward direction (-1, 0, or 1)
   * @param colDelta - Column increment for forward direction (-1, 0, or 1)
   * @returns Total count of consecutive pieces in both directions (including the start)
   */
  private countBidirectional(
    piece: PlayerColor,
    startRow: number,
    startCol: number,
    rowDelta: number,
    colDelta: number
  ): number {
    // Count in forward direction (including start)
    const forward = this.countDirection(piece, startRow, startCol, rowDelta, colDelta);

    // Count in backward direction (excluding start)
    const backward = this.countDirection(
      piece,
      startRow - rowDelta,
      startCol - colDelta,
      -rowDelta,
      -colDelta
    );

    return forward + backward;
  }
}
