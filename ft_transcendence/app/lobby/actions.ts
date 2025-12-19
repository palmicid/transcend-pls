/**
 * @file app/lobby/actions.ts
 * @description Server actions for lobby and generic room management.
 *
 * These functions run on the server and are called from client components.
 * They handle room creation, player management, and game lifecycle.
 *
 * @example
 * ```ts
 * // In a client component
 * import { ensureLobbyRoom, joinLobbyRoom, listAllRooms } from '@/app/lobby/actions';
 *
 * const rooms = await listAllRooms();
 * await ensureLobbyRoom('room-123', 'owner-id');
 * await joinLobbyRoom('room-123', 'player-id');
 * ```
 */

"use server";

import { roomManager } from "@/lib/rooms";
import { broadcaster } from "@/lib/broadcast";

// =============================================================================
// ROOM MANAGEMENT
// =============================================================================

/**
 * Create or get an existing room.
 *
 * If the room already exists, returns it. Otherwise creates a new one.
 *
 * @param roomId - Unique room identifier
 * @param ownerId - Optional owner user ID
 * @returns Object with success status, room ID, and current state
 */
export async function ensureLobbyRoom(roomId: string, ownerId?: string) {
  const room = roomManager.ensureRoom(roomId, broadcaster, ownerId);
  return { ok: true, roomId, state: room.status };
}

/**
 * Delete a room (owner only).
 *
 * Only the room owner can delete a room. If no owner, anyone can delete.
 *
 * @param roomId - The room to delete
 * @param requesterId - The user requesting deletion
 * @returns Object with success status
 */
export async function deleteLobbyRoom(roomId: string, requesterId: string) {
  const ok = roomManager.deleteRoom(roomId, requesterId);
  return { ok };
}

// =============================================================================
// PLAYER MANAGEMENT
// =============================================================================

/**
 * Join a room.
 *
 * @param roomId - The room to join
 * @param playerId - The player's user ID
 * @returns Object with success status and current state
 */
export async function joinLobbyRoom(roomId: string, playerId: string) {
  const ok = roomManager.addPlayer(roomId, playerId);
  const room = roomManager.getRoom(roomId);
  return { ok, state: room?.status ?? null };
}

/**
 * Leave a room.
 *
 * @param roomId - The room to leave
 * @param playerId - The player's user ID
 * @returns Object with success status
 */
export async function leaveLobbyRoom(roomId: string, playerId: string) {
  const ok = roomManager.removePlayer(roomId, playerId);
  return { ok };
}

// =============================================================================
// GAME ACTIONS
// =============================================================================

/**
 * Submit an action to the room's game.
 *
 * @param roomId - The room ID
 * @param playerId - The player making the action
 * @param action - The action payload (game-specific)
 * @returns Object with success status and updated snapshot
 */
export async function submitLobbyAction(
  roomId: string,
  playerId: string,
  action: unknown
) {
  const ok = roomManager.submitAction(roomId, playerId, action);
  const snapshot = roomManager.getSnapshot(roomId);
  return { ok, snapshot };
}

// =============================================================================
// GAME FLOW CONTROL
// =============================================================================

/**
 * Start the game in a room.
 */
export async function startLobbyRoom(roomId: string) {
  const ok = roomManager.start(roomId);
  return { ok };
}

/**
 * Pause the game in a room.
 */
export async function pauseLobbyRoom(roomId: string) {
  const ok = roomManager.pause(roomId);
  return { ok };
}

/**
 * End the game in a room.
 */
export async function endLobbyRoom(roomId: string) {
  const ok = roomManager.end(roomId);
  return { ok };
}

/**
 * Reset a room for a new game.
 */
export async function resetLobbyRoom(roomId: string) {
  const ok = roomManager.reset(roomId);
  return { ok };
}

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get the current game snapshot for a room.
 *
 * @param roomId - The room ID
 * @returns Object with snapshot and current state
 */
export async function getLobbySnapshot(roomId: string) {
  const snapshot = roomManager.getSnapshot(roomId);
  const room = roomManager.getRoom(roomId);
  return { snapshot, state: room?.status ?? null };
}

/**
 * List all active rooms.
 *
 * @returns Array of room metadata
 */
export async function listAllRooms() {
  return roomManager.listRooms();
}

/**
 * Get metadata for a specific room.
 *
 * @param roomId - The room ID
 * @returns Room metadata (id, state, gameType, ownerId)
 */
export async function getRoomMeta(roomId: string) {
  return roomManager.getRoomMeta(roomId);
}
