/**
 * @file RoomManager.ts
 * @description Singleton that manages all active game rooms.
 *
 * The RoomManager is the central orchestrator for all game rooms in the application.
 * It handles:
 * - Creating and destroying rooms
 * - Looking up rooms by ID
 * - Delegating player/game operations to the appropriate room
 *
 * This is a singleton to ensure consistent state across the application and
 * to survive Next.js hot-reloading in development.
 *
 * @example
 * ```ts
 * import { roomManager } from '@/lib/rooms';
 * import { broadcaster } from '@/lib/broadcast';
 * import TicTacToeGame from '@/app/game/tic-tac-toe/TicTacToeGame';
 *
 * // Create a room with a game
 * const game = new TicTacToeGame();
 * game.init();
 * roomManager.attachGame('room-123', game, broadcaster, 'owner-id');
 *
 * // Add players
 * roomManager.addPlayer('room-123', 'player-1');
 * roomManager.addPlayer('room-123', 'player-2');
 *
 * // Start the game
 * roomManager.start('room-123');
 * ```
 */

import { Game, GameConfig, GameState, PlayerSlot } from "@/lib/game";
import { Broadcaster } from "@/lib/broadcast";
import Room from "./Room";
import { State } from "./RoomState";

/**
 * Room metadata returned by list/get operations.
 */
export interface RoomMeta {
  id: string;
  state: State | null;
  gameType: string | null;
  ownerId: string | null;
  playerCount: number;
}

/**
 * Singleton class that manages all active game rooms.
 *
 * Use the exported `roomManager` instance rather than creating new instances.
 */
class RoomManager {
  /** Singleton instance */
  private static instance: RoomManager;

  /** Map of room ID to Room instance */
  private rooms: Map<string, Room> = new Map();

  /**
   * Get the singleton instance.
   */
  static get Instance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  // ===========================================================================
  // ROOM LIFECYCLE
  // ===========================================================================

  /**
   * Create or get an existing room.
   *
   * If the room exists, attaches the broadcaster (if provided) and sets the owner
   * (if not already set). If the room doesn't exist, creates a new one.
   *
   * @param roomId - Unique room identifier
   * @param broadcaster - Optional broadcaster for real-time updates
   * @param ownerId - Optional owner user ID
   * @returns The room instance
   */
  ensureRoom(roomId: string, broadcaster?: Broadcaster, ownerId?: string): Room {
    let room = this.rooms.get(roomId);

    if (!room) {
      room = new Room(roomId, broadcaster ?? null, ownerId ?? null);
      this.rooms.set(roomId, room);
    } else if (broadcaster) {
      room.attachBroadcaster(broadcaster);
    }

    room.setOwnerIfEmpty(ownerId);
    return room;
  }

  /**
   * Destroy a room and remove it from the manager.
   *
   * @param roomId - The room to destroy
   * @returns true if the room was found and destroyed
   */
  destroyRoom(roomId: string): boolean {
    return this.rooms.delete(roomId);
  }

  /**
   * Delete a room (with ownership check).
   *
   * Only the owner can delete a room. If the room has no owner, anyone can delete it.
   *
   * @param roomId - The room to delete
   * @param requesterId - The user ID requesting the deletion
   * @returns true if the room was deleted
   */
  deleteRoom(roomId: string, requesterId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    // Only owner can delete (or anyone if no owner)
    if (room.owner && room.owner !== requesterId) return false;

    return this.rooms.delete(roomId);
  }

  /**
   * Attach a game to a room.
   *
   * Creates the room if it doesn't exist, then attaches the game instance.
   *
   * @param roomId - The room ID
   * @param game - The game instance (must be initialized)
   * @param broadcaster - Optional broadcaster
   * @param ownerId - Optional owner ID
   * @returns The room instance
   */
  attachGame(
    roomId: string,
    game: Game<GameConfig, GameState, PlayerSlot>,
    broadcaster?: Broadcaster,
    ownerId?: string
  ): Room {
    const room = this.ensureRoom(roomId, broadcaster, ownerId);
    room.attachGame(game);
    return room;
  }

  // ===========================================================================
  // PLAYER OPERATIONS
  // ===========================================================================

  /**
   * Add a player to a room.
   *
   * @param roomId - The room ID
   * @param playerId - The player's user ID
   * @returns true if the player was added
   */
  addPlayer(roomId: string, playerId: string): boolean {
    const room = this.rooms.get(roomId);
    return room ? room.addPlayer(playerId) : false;
  }

  /**
   * Remove a player from a room.
   *
   * @param roomId - The room ID
   * @param playerId - The player's user ID
   * @returns true if the player was removed
   */
  removePlayer(roomId: string, playerId: string): boolean {
    const room = this.rooms.get(roomId);
    return room ? room.removePlayer(playerId) : false;
  }

  // ===========================================================================
  // GAME OPERATIONS
  // ===========================================================================

  /**
   * Submit a player action to a room's game.
   *
   * @param roomId - The room ID
   * @param playerId - The player making the action
   * @param action - The action payload
   * @returns true if the action was valid and processed
   */
  submitAction(roomId: string, playerId: string, action: unknown): boolean {
    const room = this.rooms.get(roomId);
    return room ? room.submitAction(playerId, action) : false;
  }

  /**
   * Start a room's game.
   *
   * @param roomId - The room ID
   * @returns true if the game was started
   */
  start(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    return room ? room.start() : false;
  }

  /**
   * Pause a room's game.
   *
   * @param roomId - The room ID
   * @returns true if the game was paused
   */
  pause(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    return room ? room.pause() : false;
  }

  /**
   * End a room's game.
   *
   * @param roomId - The room ID
   * @returns true if the game was ended
   */
  end(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    return room ? room.end() : false;
  }

  /**
   * Reset a room for a new game.
   *
   * @param roomId - The room ID
   * @returns true if the room was reset
   */
  reset(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    return room ? room.reset() : false;
  }

  // ===========================================================================
  // QUERIES
  // ===========================================================================

  /**
   * Get the current game snapshot from a room.
   *
   * @param roomId - The room ID
   * @returns The game snapshot, or null if room/game not found
   */
  getSnapshot(roomId: string): unknown {
    const room = this.rooms.get(roomId);
    return room ? room.getSnapshot() : null;
  }

  /**
   * Get the Room instance directly (for internal use).
   *
   * @param roomId - The room ID
   * @returns The Room instance, or undefined if not found
   */
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * List all rooms with their metadata.
   *
   * @returns Array of room metadata objects
   */
  listRooms(): RoomMeta[] {
    return Array.from(this.rooms.entries()).map(([id, room]) => ({
      id,
      state: room.status,
      gameType: room.gameType,
      ownerId: room.owner,
      playerCount: room.playerCount,
    }));
  }

  /**
   * Get metadata for a specific room.
   *
   * @param roomId - The room ID
   * @returns Room metadata (with nulls if room not found)
   */
  getRoomMeta(roomId: string): RoomMeta {
    const room = this.rooms.get(roomId);
    return {
      id: roomId,
      state: room ? room.status : null,
      gameType: room ? room.gameType : null,
      ownerId: room ? room.owner : null,
      playerCount: room ? room.playerCount : 0,
    };
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Global RoomManager instance.
 *
 * Uses globalThis to survive Next.js hot-reloading in development.
 */
const globalForRooms = globalThis as unknown as {
  roomManager: RoomManager | undefined;
};

export const roomManager = globalForRooms.roomManager ?? RoomManager.Instance;

// Preserve instance during development hot-reloads
if (process.env.NODE_ENV !== "production") {
  globalForRooms.roomManager = roomManager;
}

export default RoomManager;
