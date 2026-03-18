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
  // PROGRESSION
  // ─────────────────────────────────────────────────────────────────────────

  xpReward: {
    base: number;
    winMultiplier: number;
    drawMultiplier: number;
    lossMultiplier: number;
  };

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

  xpReward: { base: 50, winMultiplier: 2, drawMultiplier: 1, lossMultiplier: 0.5 },

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


