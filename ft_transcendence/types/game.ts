/**
 * @file types/game.ts
 * @description Shared game types for client, server, and SSE layers.
 */

// =============================================================================
// RE-EXPORT FROM REGISTRY (for convenience)
// =============================================================================

export type { GameDefinition, ActionDefinition } from "@/lib/game/GameRegistry";

// =============================================================================
// ROOM STATUS
// =============================================================================

export type RoomStatus = "OPEN" | "READY" | "IN_GAME" | "ENDED";

// =============================================================================
// PLAYER INFO
// =============================================================================

export interface PlayerInfo {
  userId: number;
  displayName: string;
  role: string | null;
  isConnected: boolean;
  isBot?: boolean; // Optional: Bot flag
}

// =============================================================================
// ROOM INFO (for lobby lists)
// =============================================================================

export interface RoomInfo {
  id: string;
  gameType: string;
  gameName: string; // Display name from registry
  status: RoomStatus;
  owner: { id: number; display_name: string } | null;
  playerCount: number;
  maxPlayers: number;
  supportsBots: boolean; // From registry
}

// =============================================================================
// ROOM SNAPSHOT (for SSE/game state)
// =============================================================================

/**
 * Generic snapshot structure sent via SSE.
 * Board type varies by game.
 */
export interface RoomSnapshot<TBoard = unknown> {
  roomId: string;
  gameType: string;
  status: RoomStatus;
  board: TBoard;
  currentTurn: string | null;
  winner: string | null;
  isDraw: boolean;
  players: PlayerInfo[];
  maxPlayers: number;
}

// =============================================================================
// GAME-SPECIFIC BOARDS
// =============================================================================

/** Tic-Tac-Toe specific board */
export type TicTacToeBoard = (string | null)[];

/** Connect4 specific board */
export type Connect4Board = (string | null)[][];

// =============================================================================
// ACTION PAYLOADS
// =============================================================================

export interface TicTacToeAction {
  cell: number;
}

export interface Connect4Action {
  column: number;
}

export type GameAction = TicTacToeAction | Connect4Action;
