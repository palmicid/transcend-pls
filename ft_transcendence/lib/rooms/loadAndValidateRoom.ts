/**
 * @file lib/rooms/loadAndValidateRoom.ts
 * @description Load and validate room state from database using GameRegistry.
 */

import prisma from "@/lib/prisma";
import { broadcaster } from "@/lib/broadcast";
import Room from "@/lib/rooms/Room";
import { GameRegistry } from "@/lib/game/GameRegistry";
import type RoomManager from "@/lib/rooms/RoomManager";

// Use dynamic import to avoid circular dependency
let roomManager: InstanceType<typeof RoomManager> | null = null;

async function getRoomManager() {
  if (!roomManager) {
    const { roomManager: rm } = await import("@/lib/rooms/RoomManager");
    roomManager = rm;
  }
  return roomManager;
}

// =============================================================================
// LOADING & VALIDATION
// =============================================================================

/**
 * Load a room from the database and validate its state.
 *
 * @param roomId - The room ID to load
 * @returns In-memory Room object if found and valid, null otherwise
 */
export async function loadAndValidateRoom(roomId: string): Promise<Room | null> {
  const rm = await getRoomManager();

  // Check if room is already in memory
  let room = rm.getRoom(roomId);
  if (room) return room;

  // Load room from database
  const dbRoom = await prisma.room.findUnique({
    where: { id: roomId },
    include: { players: true },
  });

  if (!dbRoom) return null;

  // Check if game is supported
  const gameDef = GameRegistry.get(dbRoom.game_type);
  if (!gameDef) {
    console.warn(`[Room] Unknown game type for room ${roomId}: ${dbRoom.game_type}`);
    return null; // Cannot hydrate unknown game
  }

  // Parse board state
  const board = gameDef.parseBoard(dbRoom.board_state);

  // Hydrate in-memory game from database state
  const game = gameDef.createGame();
  game.init();

  // Restore state (includes players via updated Game implementations)
  game.loadState(dbRoom);

  // Attach game to room manager
  room = rm.attachGame(
    dbRoom.id,
    game,
    broadcaster,
    dbRoom.owner_id.toString()
  );

  // Restore room status (wrapper state) to match DB
  room.restoreStatus(dbRoom.status);

  return room;
}

/**
 * Load a room with error handling. Returns null instead of throwing on
 * validation errors, but logs them.
 */
export async function loadAndValidateRoomSafe(
  roomId: string
): Promise<Room | null> {
  try {
    return await loadAndValidateRoom(roomId);
  } catch (error) {
    console.error(`[Room] Failed to load room ${roomId}:`, error);
    return null;
  }
}
