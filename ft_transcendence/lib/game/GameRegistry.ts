/**
 * @file lib/game/GameRegistry.ts
 * @description Central registry for all game types.
 *
 * Design: Registry Pattern + Strategy Pattern
 * - Each game provides its own validation, win checking, and draw checking
 * - Bot support is opt-in per game
 */

import { Game, GameConfig, GameState, PlayerSlot } from "@/lib/game";
import TicTacToeGame from "@/lib/game/tic-tac-toe/TicTacToeGame";
import Connect4Game from "@/lib/game/connect4/Connect4Game";

// =============================================================================
// TYPES
// =============================================================================

export interface GameDefinition {
  // ─────────────────────────────────────────────────────────────────────────
  // METADATA
  // ─────────────────────────────────────────────────────────────────────────

  /** Unique identifier (e.g., "tic-tac-toe", "connect4") */
  id: string;

  /** Display name (e.g., "Tic-Tac-Toe", "Connect 4") */
  name: string;

  /** Short description for lobby display */
  description: string;

  /** URL path segment */
  urlSlug: string;

  // ─────────────────────────────────────────────────────────────────────────
  // PLAYER CONFIGURATION
  // ─────────────────────────────────────────────────────────────────────────

  /** Minimum players to start */
  minPlayers: number;

  /** Maximum players allowed */
  maxPlayers: number;

  /** Ordered list of role names ["X", "O"] or ["Red", "Yellow"] */
  roles: readonly string[];

  /** Role that moves first */
  firstTurn: string;

  /** Whether this game supports bot players */
  supportsBots: boolean;

  // ─────────────────────────────────────────────────────────────────────────
  // BOARD CONFIGURATION
  // ─────────────────────────────────────────────────────────────────────────

  boardInfo: {
    type: "grid" | "linear" | "custom";
    rows?: number;
    cols?: number;
    size?: number;
  };

  /** Factory to create empty board state */
  createEmptyBoard: () => unknown;

  /** Parse board from Prisma JSON */
  parseBoard: (raw: unknown) => unknown;

  // ─────────────────────────────────────────────────────────────────────────
  // GAME LOGIC
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Check if a player has won.
   * @param board - Current board state
   * @returns Winning role or null
   */
  checkWin: (board: unknown) => string | null;

  /**
   * Check if game is a draw.
   * @param board - Current board state
   * @param winner - Winner role or null
   * @returns true if draw
   */
  checkDraw: (board: unknown, winner: string | null) => boolean;

  /**
   * Validate an action before processing.
   * @param board - Current board state
   * @param action - Proposed action
   * @param playerRole - Player's role
   * @param currentTurn - Whose turn it is
   */
  validateAction: (
    board: unknown,
    action: unknown,
    playerRole: string,
    currentTurn: string
  ) => { valid: boolean; error?: string };

  // ─────────────────────────────────────────────────────────────────────────
  // FACTORY
  // ─────────────────────────────────────────────────────────────────────────

  /** Factory to create Game instance */
  createGame: () => Game<GameConfig, GameState, PlayerSlot>;

  // ─────────────────────────────────────────────────────────────────────────
  // ACTION DEFINITIONS (for documentation/UI)
  // ─────────────────────────────────────────────────────────────────────────

  possibleActions: ActionDefinition[];
}

export interface ActionDefinition {
  type: string;
  description: string;
  params: Record<string, "number" | "string" | "boolean">;
}

// =============================================================================
// REGISTRY CLASS
// =============================================================================

class GameRegistryClass {
  private games: Map<string, GameDefinition> = new Map();

  register(game: GameDefinition): void {
    if (this.games.has(game.id)) {
      throw new Error(`Game "${game.id}" already registered`);
    }
    this.games.set(game.id, game);
  }

  get(id: string): GameDefinition | undefined {
    return this.games.get(id);
  }

  getOrThrow(id: string): GameDefinition {
    const game = this.games.get(id);
    if (!game) throw new Error(`Unknown game: ${id}`);
    return game;
  }

  list(): GameDefinition[] {
    return Array.from(this.games.values());
  }

  has(id: string): boolean {
    return this.games.has(id);
  }
}

export const GameRegistry = new GameRegistryClass();

// =============================================================================
// GAME REGISTRATIONS
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// TIC-TAC-TOE
// ─────────────────────────────────────────────────────────────────────────────

const TTT_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],            // diagonals
];

GameRegistry.register({
  id: "tic-tac-toe",
  name: "Tic-Tac-Toe",
  description: "Classic 3×3 grid game. Get 3 in a row to win!",
  urlSlug: "tic-tac-toe",

  minPlayers: 2,
  maxPlayers: 2,
  roles: ["X", "O"] as const,
  firstTurn: "X",
  supportsBots: true, // TTT supports bots

  boardInfo: { type: "linear", size: 9 },
  createEmptyBoard: () => Array(9).fill(null),
  parseBoard: (raw) => (raw as (string | null)[]) || Array(9).fill(null),

  checkWin: (board) => {
    const b = board as (string | null)[];
    for (const [a, c, e] of TTT_LINES) {
      if (b[a] && b[a] === b[c] && b[a] === b[e]) return b[a];
    }
    return null;
  },

  checkDraw: (board, winner) => {
    if (winner) return false;
    return (board as (string | null)[]).every(c => c !== null);
  },

  validateAction: (board, action, playerRole, currentTurn) => {
    if (playerRole !== currentTurn) {
      return { valid: false, error: "Not your turn" };
    }
    const { cell } = action as { cell: number };
    if (cell < 0 || cell > 8) {
      return { valid: false, error: "Invalid cell" };
    }
    const b = board as (string | null)[];
    if (b[cell] !== null) {
      return { valid: false, error: "Cell occupied" };
    }
    return { valid: true };
  },

  createGame: () => new TicTacToeGame(),

  possibleActions: [
    { type: "move", description: "Place mark on cell", params: { cell: "number" } },
  ],
});

// ─────────────────────────────────────────────────────────────────────────────
// CONNECT 4
// ─────────────────────────────────────────────────────────────────────────────

GameRegistry.register({
  id: "connect4",
  name: "Connect 4",
  description: "Drop discs to connect 4 in any direction!",
  urlSlug: "connect4",

  minPlayers: 2,
  maxPlayers: 2,
  roles: ["Red", "Yellow"] as const,
  firstTurn: "Red",
  supportsBots: true, // Connect4 supports bots

  boardInfo: { type: "grid", rows: 6, cols: 7 },
  createEmptyBoard: () => Array(6).fill(null).map(() => Array(7).fill(null)),
  parseBoard: (raw) =>
    (raw as (string | null)[][]) || Array(6).fill(null).map(() => Array(7).fill(null)),

  checkWin: (board) => {
    const b = board as (string | null)[][];
    const ROWS = 6, COLS = 7, WIN = 4;

    const check = (r: number, c: number, dr: number, dc: number): string | null => {
      const piece = b[r][c];
      if (!piece) return null;
      for (let i = 1; i < WIN; i++) {
        const nr = r + dr * i, nc = c + dc * i;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return null;
        if (b[nr][nc] !== piece) return null;
      }
      return piece;
    };

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const winner =
          check(r, c, 0, 1) ||   // horizontal
          check(r, c, 1, 0) ||   // vertical
          check(r, c, 1, 1) ||   // diagonal down-right
          check(r, c, 1, -1);    // diagonal down-left
        if (winner) return winner;
      }
    }
    return null;
  },

  checkDraw: (board, winner) => {
    if (winner) return false;
    return (board as (string | null)[][]).every(row => row.every(c => c !== null));
  },

  validateAction: (board, action, playerRole, currentTurn) => {
    if (playerRole !== currentTurn) {
      return { valid: false, error: "Not your turn" };
    }
    const { column } = action as { column: number };
    if (column < 0 || column > 6) {
      return { valid: false, error: "Invalid column" };
    }
    const b = board as (string | null)[][];
    if (b[0][column] !== null) {
      return { valid: false, error: "Column full" };
    }
    return { valid: true };
  },

  createGame: () => new Connect4Game(),

  possibleActions: [
    { type: "move", description: "Drop disc in column", params: { column: "number" } },
  ],
});
