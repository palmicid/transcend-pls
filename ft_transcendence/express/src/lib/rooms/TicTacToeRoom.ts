import { UserConn } from './types';
import { SSERoom } from './SSERoom';

type Symbol = 'X' | 'O';
type Cell = Symbol | null;

interface TicTacToeClient extends UserConn {
  symbol?: Symbol;
}

interface DisconnectedPlayer {
  symbol: Symbol;
  disconnectedAt: number;
  timeoutId: NodeJS.Timeout;
}

type TTTOpenState = 'OPEN' | 'X_PLAY' | 'O_PLAY';
type TTTEndState = 'X_WIN' | 'O_WIN' | 'DRAW';
type TTTState = TTTOpenState | TTTEndState;

export class TicTacToeRoom extends SSERoom {
  protected role: Map<Symbol, string> = new Map();

  private static readonly MAX_PLAYERS = 2;
  private static readonly WIN_PATTERNS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6],            // diagonals
  ];

  /** Timeout durations in milliseconds */
  public static readonly DISCONNECT_TIMEOUT_MS = 30000; // 30 seconds to reconnect
  public static readonly TURN_TIMEOUT_MS = 60000;       // 60 seconds per turn

  private board: Cell[] = Array(9).fill(null);
  private state: TTTState = 'OPEN';
  private lastUpdatedAt: number = Date.now();

  /** Track disconnected players waiting for reconnection */
  private disconnectedPlayers: Map<string, DisconnectedPlayer> = new Map();

  /** Turn timer state */
  private turnTimeoutId: NodeJS.Timeout | null = null;
  private turnStartedAt: number = 0;

  /** Check if the game has ended */
  private isEndState(): boolean {
    return this.state === 'X_WIN' || this.state === 'O_WIN' || this.state === 'DRAW';
  }

  /** Get the symbol for a player by their connection ID */
  private getPlayerSymbol(connId: string): Symbol | null {
    for (const [symbol, playerId] of this.role.entries()) {
      if (playerId === connId) return symbol;
    }
    return null;
  }

  /** Get the current player's symbol */
  private getCurrentPlayerSymbol(): Symbol | null {
    if (this.state === 'X_PLAY') return 'X';
    if (this.state === 'O_PLAY') return 'O';
    return null;
  }

  /** Check if it's the given player's turn */
  private isPlayerTurn(connId: string): boolean {
    const symbol = this.getPlayerSymbol(connId);
    if (!symbol) return false;
    return (this.state === 'X_PLAY' && symbol === 'X')
        || (this.state === 'O_PLAY' && symbol === 'O');
  }

  /** Check for a winner */
  private checkWinner(): Symbol | null {
    for (const pattern of TicTacToeRoom.WIN_PATTERNS) {
      const [a, b, c] = pattern;
      if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
        return this.board[a];
      }
    }
    return null;
  }

  /** Check if the board is full (draw) */
  private isBoardFull(): boolean {
    return this.board.every(cell => cell !== null);
  }

  /** Start the turn timer for the current player */
  private startTurnTimer(): void {
    this.clearTurnTimer();

    if (this.isEndState() || this.state === 'OPEN') {
      return;
    }

    this.turnStartedAt = Date.now();
    this.turnTimeoutId = setTimeout(() => {
      this.handleTurnTimeout();
    }, TicTacToeRoom.TURN_TIMEOUT_MS);
  }

  /** Clear the turn timer */
  private clearTurnTimer(): void {
    if (this.turnTimeoutId) {
      clearTimeout(this.turnTimeoutId);
      this.turnTimeoutId = null;
    }
  }

  /** Handle turn timeout - current player forfeits */
  private handleTurnTimeout(): void {
    const currentSymbol = this.getCurrentPlayerSymbol();
    if (!currentSymbol) return;

    // The player who timed out loses
    this.state = currentSymbol === 'X' ? 'O_WIN' : 'X_WIN';
    this.lastUpdatedAt = Date.now();
    this.clearTurnTimer();

    this.broadcast({
      type: 'TURN_TIMEOUT',
      payload: {
        ...this.getGameState(),
        timedOutPlayer: currentSymbol
      }
    });
  }

  /** Handle disconnect timeout - player forfeits */
  private handleDisconnectTimeout(connId: string, symbol: Symbol): void {
    this.disconnectedPlayers.delete(connId);

    // Only forfeit if game is still in progress
    if (!this.isEndState() && this.state !== 'OPEN') {
      const otherSymbol: Symbol = symbol === 'X' ? 'O' : 'X';
      this.state = otherSymbol === 'X' ? 'X_WIN' : 'O_WIN';
      this.lastUpdatedAt = Date.now();
      this.clearTurnTimer();

      this.broadcast({
        type: 'DISCONNECT_FORFEIT',
        payload: {
          ...this.getGameState(),
          forfeitedPlayer: symbol
        }
      });
    }

    // Clean up role assignment
    this.role.delete(symbol);
  }

  /** Clear all timers (for cleanup) */
  private clearAllTimers(): void {
    this.clearTurnTimer();

    // Clear all disconnect timers
    for (const [, player] of this.disconnectedPlayers) {
      clearTimeout(player.timeoutId);
    }
    this.disconnectedPlayers.clear();
  }

  /** Update game state after a move */
  private updateGameState(): void {
    const winner = this.checkWinner();
    if (winner) {
      this.state = winner === 'X' ? 'X_WIN' : 'O_WIN';
      this.clearTurnTimer();
    } else if (this.isBoardFull()) {
      this.state = 'DRAW';
      this.clearTurnTimer();
    } else {
      // Switch turns
      this.state = this.state === 'X_PLAY' ? 'O_PLAY' : 'X_PLAY';
      this.startTurnTimer();
    }
    this.lastUpdatedAt = Date.now();
  }

  /** Get the current game state for broadcasting */
  public getGameState() {
    const turnTimeRemaining = this.turnTimeoutId && this.turnStartedAt
      ? Math.max(0, TicTacToeRoom.TURN_TIMEOUT_MS - (Date.now() - this.turnStartedAt))
      : null;

    return {
      board: this.board,
      state: this.state,
      players: {
        X: this.role.get('X') || null,
        O: this.role.get('O') || null,
      },
      lastUpdatedAt: this.lastUpdatedAt,
      turnStartedAt: this.turnStartedAt || null,
      turnTimeRemaining,
      disconnectedPlayers: Array.from(this.disconnectedPlayers.keys()),
    };
  }

  /** Subscribe a player to the room */
  public subscribe(conn: UserConn): void {
    // Check if this is a reconnection
    const existingDisconnect = this.disconnectedPlayers.get(conn.id);
    if (existingDisconnect) {
      // Cancel the disconnect timeout
      clearTimeout(existingDisconnect.timeoutId);
      this.disconnectedPlayers.delete(conn.id);

      // Restore the player's connection
      if (!conn.sse) {
        throw new Error('Client cannot be connected');
      }

      this.clients.set(conn.id, conn);
      conn.sse.setHeader('Content-Type', 'text/event-stream');
      conn.sse.setHeader('Cache-Control', 'no-cache');
      conn.sse.setHeader('Connection', 'keep-alive');
      conn.sse.flushHeaders();

      // Broadcast reconnection
      this.broadcast({ type: 'PLAYER_RECONNECTED', payload: this.getGameState() });
      return;
    }

    // Normal subscription flow
    if (this.clients.size >= TicTacToeRoom.MAX_PLAYERS || this.isEndState()) {
      throw new Error('Room is unable to join');
    }

    // Call parent to handle SSE setup
    super.subscribe(conn);

    // Assign symbol to the player
    if (!this.role.has('X')) {
      this.role.set('X', conn.id);
    } else if (!this.role.has('O')) {
      this.role.set('O', conn.id);
    }

    // Start the game when both players have joined
    if (this.clients.size === TicTacToeRoom.MAX_PLAYERS) {
      this.state = 'X_PLAY';
      this.lastUpdatedAt = Date.now();
      this.startTurnTimer();
    }

    // Broadcast current game state to all players
    this.broadcast({ type: 'GAME_STATE', payload: this.getGameState() });
  }

  /** Unsubscribe a player from the room */
  public unsubscribe(conn: UserConn): void {
    const symbol = this.getPlayerSymbol(conn.id);

    // Remove from active clients
    if (!this.clients.has(conn.id)) {
      throw new Error('Client not found');
    }
    this.clients.delete(conn.id);

    // If game is in progress, start disconnect timer instead of immediate forfeit
    if (symbol && !this.isEndState() && this.state !== 'OPEN') {
      const timeoutId = setTimeout(() => {
        this.handleDisconnectTimeout(conn.id, symbol);
      }, TicTacToeRoom.DISCONNECT_TIMEOUT_MS);

      this.disconnectedPlayers.set(conn.id, {
        symbol,
        disconnectedAt: Date.now(),
        timeoutId,
      });

      // Broadcast that player disconnected (but may reconnect)
      this.broadcast({
        type: 'PLAYER_DISCONNECTED',
        payload: {
          ...this.getGameState(),
          disconnectedPlayer: symbol,
          reconnectTimeoutMs: TicTacToeRoom.DISCONNECT_TIMEOUT_MS,
        }
      });
    } else {
      // Game not in progress, just remove the player
      if (symbol) {
        this.role.delete(symbol);
      }
      this.broadcast({ type: 'PLAYER_LEFT', payload: this.getGameState() });
    }
  }

  /** Handle a player's move */
  public receive(conn: UserConn, raw: any): void {
    if (!this.clients.has(conn.id)) {
      throw new Error('Client not found');
    }

    // Parse the move: expects { type: 'MOVE', position: 0-8 }
    const { type, position } = raw;

    if (type !== 'MOVE') {
      throw new Error('Invalid message type');
    }

    // Validate game is in progress
    if (this.isEndState()) {
      throw new Error('Game has already ended');
    }

    if (this.state === 'OPEN') {
      throw new Error('Game has not started yet');
    }

    // Validate it's the player's turn
    if (!this.isPlayerTurn(conn.id)) {
      throw new Error('Not your turn');
    }

    // Validate position
    if (typeof position !== 'number' || position < 0 || position > 8) {
      throw new Error('Invalid position');
    }

    // Validate cell is empty
    if (this.board[position] !== null) {
      throw new Error('Cell is already occupied');
    }

    // Make the move
    const symbol = this.getPlayerSymbol(conn.id);
    this.board[position] = symbol;

    // Update game state
    this.updateGameState();

    // Broadcast the new game state
    this.broadcast({ type: 'GAME_STATE', payload: this.getGameState() });
  }

  /** Reset the game for a rematch */
  public reset(): void {
    this.clearAllTimers();
    this.board = Array(9).fill(null);
    this.state = this.clients.size === TicTacToeRoom.MAX_PLAYERS ? 'X_PLAY' : 'OPEN';
    this.lastUpdatedAt = Date.now();
    this.turnStartedAt = 0;

    if (this.state === 'X_PLAY') {
      this.startTurnTimer();
    }

    this.broadcast({ type: 'GAME_RESET', payload: this.getGameState() });
  }

  /** Cleanup when room is destroyed */
  public destroy(): void {
    this.clearAllTimers();
  }
}
