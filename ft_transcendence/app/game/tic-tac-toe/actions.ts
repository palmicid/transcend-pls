/**
 * @file app/game/tic-tac-toe/actions.ts
 * @description Server actions for Tic-Tac-Toe game management.
 *
 * These functions run on the server and are called from client components.
 * They handle room creation, player joining, and game control.
 *
 * @example
 * ```ts
 * // In a client component
 * import { createTicTacToeRoom, joinTicTacToeRoom } from '@/app/game/tic-tac-toe/actions';
 *
 * await createTicTacToeRoom('room-123', 'owner-id');
 * await joinTicTacToeRoom('room-123', 'player-id');
 * ```
 */

"use server";

import { roomManager } from "@/lib/rooms";
import { broadcaster } from "@/lib/broadcast";
import TicTacToeGame from "./TicTacToeGame";

/**
 * Create a new Tic-Tac-Toe room.
 *
 * Creates a room with an initialized Tic-Tac-Toe game attached.
 *
 * @param roomId - Unique room identifier
 * @param ownerId - Optional owner user ID (can manage the room)
 * @returns Object with success status and room ID
 */
export async function createTicTacToeRoom(roomId: string, ownerId?: string) {
  const game = new TicTacToeGame();
  game.init();
  roomManager.attachGame(roomId, game, broadcaster, ownerId);
  return { ok: true, roomId };
}

/**
 * Join an existing Tic-Tac-Toe room.
 *
 * Adds the player to the room. They'll be assigned X or O based on availability.
 *
 * @param roomId - The room to join
 * @param playerId - The player's user ID
 * @returns Object with success status and current room state
 */
export async function joinTicTacToeRoom(roomId: string, playerId: string) {
  const ok = roomManager.addPlayer(roomId, playerId);
  const room = roomManager.getRoom(roomId);
  return { ok, state: room?.status ?? null };
}

/**
 * Submit a move in Tic-Tac-Toe.
 *
 * @param roomId - The room ID
 * @param playerId - The player making the move
 * @param cell - The cell index (0-8) to mark
 * @returns Object with success status and updated snapshot
 */
export async function submitTicTacToeMove(
  roomId: string,
  playerId: string,
  cell: number
) {
  const ok = roomManager.submitAction(roomId, playerId, { cell });
  const snapshot = roomManager.getSnapshot(roomId);
  return { ok, snapshot };
}

/**
 * Start the Tic-Tac-Toe game.
 *
 * Can only be called when both players have joined.
 *
 * @param roomId - The room ID
 * @returns Object with success status
 */
export async function startTicTacToeGame(roomId: string) {
  const ok = roomManager.start(roomId);
  return { ok };
}
