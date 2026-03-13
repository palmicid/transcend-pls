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
 * import TicTacToeGame from '@/lib/game/tic-tac-toe/TicTacToeGame';
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
import prisma from "@/lib/prisma";
import type { BotDifficulty } from "@/lib/bot/constants";
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
   * Delete OPEN rooms for the given game type that have been idle longer than
   * the given age (default 2 hours). Destroys in-memory state first, then
   * removes from DB.
   */
  async cleanupStaleRooms(
    gameType: string,
    maxAgeMs = 2 * 60 * 60 * 1000,
  ): Promise<void> {
    const cutoff = new Date(Date.now() - maxAgeMs);

    const staleRooms = await prisma.room.findMany({
      where: { game_type: gameType, status: "OPEN", created_at: { lt: cutoff } },
      select: { id: true },
    });

    if (staleRooms.length === 0) return;

    const staleIds = staleRooms.map((r: { id: string }) => r.id);
    for (const id of staleIds) {
      this.rooms.delete(id);
    }

    await prisma.room.deleteMany({ where: { id: { in: staleIds } } });
  }

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
    ownerId?: string,
    initialState?: unknown
  ): Room {
    const room = this.ensureRoom(roomId, broadcaster, ownerId);
    room.attachGame(game, initialState);
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
  async submitAction(
    roomId: string,
    playerId: string,
    action: unknown,
  ): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const ok = room.submitAction(playerId, action);
    if (!ok) return false;

    await this.persistStateToDb(roomId);
    return true;
  }

  /**
   * Start a room's game.
   *
   * @param roomId - The room ID
   * @returns true if the game was started
   */
  async start(roomId: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const started = room.start();
    if (!started) return false;

    await this.persistStateToDb(roomId);
    return true;
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
  // PERSISTENCE
  // ===========================================================================

  /**
   * Create a room record in Prisma.
   */
  async createRoomRecord(params: {
    id: string;
    gameType: string;
    ownerId: number;
    maxPlayers: number;
    boardState: unknown;
    currentTurn: string;
  }): Promise<{ id: string }> {
    const room = await prisma.room.create({
      data: {
        id: params.id,
        game_type: params.gameType,
        owner_id: params.ownerId,
        max_players: params.maxPlayers,
        status: "OPEN",
        board_state: params.boardState as any,
        current_turn: params.currentTurn,
      },
      select: { id: true },
    });

    return room;
  }

  /**
   * Delete a room from Prisma and evict it from memory.
   */
  async deleteRoomRecord(roomId: string): Promise<boolean> {
    const deleted = await prisma.room.deleteMany({ where: { id: roomId } });
    this.destroyRoom(roomId);
    return deleted.count > 0;
  }

  /**
   * Persist the room wrapper state and current game snapshot into Prisma.
   */
  async persistStateToDb(
    roomId: string,
    extraData?: Record<string, unknown>,
  ): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const snapshot = room.getSnapshot() as
      | { board?: unknown; currentTurn?: string | null; winner?: string | null }
      | null;

    const winner = snapshot?.winner ?? null;

    await prisma.room.update({
      where: { id: roomId },
      data: {
        status: room.status,
        board_state: snapshot?.board ?? null,
        current_turn: winner ? null : (snapshot?.currentTurn ?? null),
        winner_role: winner,
        ...(extraData ?? {}),
      },
    });
  }

  /**
   * Configure bot in-memory and persist bot config in Prisma.
   */
  async configureBot(
    roomId: string,
    params: {
      role: string | null;
      difficulty: BotDifficulty | null;
      delayMs?: number;
    },
  ): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const game = room.game as any;
    if (!game || typeof game.configureBot !== "function") return false;

    game.configureBot(params.role, params.difficulty, params.delayMs ?? 500);

    const patch: Record<string, unknown> = {
      bot_role: params.role,
      bot_difficulty: params.difficulty,
    };
    if (typeof params.delayMs === "number") {
      patch.bot_delay_ms = params.delayMs;
    }

    await this.persistStateToDb(roomId, patch);
    return true;
  }

  /**
   * Switch player role in-memory and persist the updated RoomPlayer role.
   */
  async switchPlayerRole(
    roomId: string,
    userId: number,
    targetRole: string,
  ): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const game = room.game as any;
    const playerslot = game?.playerslot;
    if (!playerslot || typeof playerslot.switchTo !== "function") return false;

    const success = playerslot.switchTo(userId.toString(), targetRole);
    if (!success) return false;

    await prisma.roomPlayer.update({
      where: { room_id_user_id: { room_id: roomId, user_id: userId } },
      data: { role: targetRole },
    });

    return true;
  }

  /**
   * Ensure a player's slot assignment is applied in-memory and persisted in Prisma.
   * Returns the assigned role, or null if assignment failed.
   */
  async ensurePlayerMembership(
    roomId: string,
    userId: number,
  ): Promise<string | null> {
    const room = this.rooms.get(roomId);
    if (!room || !room.game) return null;

    const userIdStr = userId.toString();

    const existingRole = room.game.getPlayerRole(userIdStr);
    const hadRole = existingRole && existingRole !== "spectator";

    if (!hadRole) {
      const added = room.addPlayer(userIdStr);
      if (!added) return null;
    }

    const role = room.game.getPlayerRole(userIdStr);
    if (!role || role === "spectator") return null;

    await prisma.roomPlayer.upsert({
      where: { room_id_user_id: { room_id: roomId, user_id: userId } },
      update: { role },
      create: { room_id: roomId, user_id: userId, role },
    });

    await this.persistStateToDb(roomId);
    return role;
  }

  /**
   * Remove player membership in-memory and in Prisma in one operation.
   */
  async removePlayerMembership(
    roomId: string,
    userId: number,
  ): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const removed = room.removePlayer(userId.toString());
    if (!removed) return false;

    await prisma.roomPlayer.deleteMany({
      where: { room_id: roomId, user_id: userId },
    });

    // If room was waiting and no longer has enough players, drop back to OPEN.
    if (room.game && room.status === State.READY && !room.game.isReady2Start) {
      room.setStatus(State.OPEN);
    }

    await this.persistStateToDb(roomId);
    return true;
  }

  /**
   * Remove player membership even when the room is not currently hydrated.
   */
  async removePlayerMembershipSafe(
    roomId: string,
    userId: number,
  ): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (room) {
      return this.removePlayerMembership(roomId, userId);
    }

    await prisma.roomPlayer.deleteMany({
      where: { room_id: roomId, user_id: userId },
    });

    return true;
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

globalForRooms.roomManager = roomManager;

export default RoomManager;
