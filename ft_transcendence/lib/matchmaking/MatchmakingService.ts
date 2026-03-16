/**
 * @file lib/matchmaking/MatchmakingService.ts
 * @description In-memory matchmaking queue and pairing logic.
 */

import { QueueEntry, MatchResult } from "./types";
import { generateRoomId } from "@/lib/utils/roomId";

const DEFAULT_TIMEOUT_MS = 60 * 1000; // 60 seconds (safety net — SSE abort + beacon should cleanup faster)

export class MatchmakingService {
  // Map of gameType -> QueueEntry[]
  private queues: Map<string, QueueEntry[]> = new Map();

  /**
   * Add a user to the matchmaking queue for a specific game type.
   */
  public joinQueue(userId: number, displayName: string, gameType: string): void {
    const queue = this.getQueue(gameType);

    // Check if player is already in queue
    const existingIndex = queue.findIndex(entry => entry.userId === userId);
    if (existingIndex !== -1) {
      const existing = queue[existingIndex];
      // Only reject if they are actively waiting
      if (existing.status === "WAITING") {
        return; // Already in queue
      }
      // If they were matched/cancelled/expired, remove old entry and let them rejoin
      queue.splice(existingIndex, 1);
    }

    queue.push({
      userId,
      displayName,
      gameType,
      joinedAt: new Date(),
      status: "WAITING",
    });
  }

  /**
   * Remove a user from the matchmaking queue.
   */
  public leaveQueue(userId: number, gameType: string): void {
    const queue = this.getQueue(gameType);
    const entry = queue.find(e => e.userId === userId && e.status === "WAITING");
    if (entry) {
      entry.status = "CANCELLED";
    }
    // We keep CANCELLED entries around briefly for polling clients to see the update,
    // they get cleaned up by cleanupStale() later.
  }

  /**
   * Get the current status of a user in the queue.
   */
  public getStatus(userId: number, gameType: string): {
    status: QueueEntry["status"] | null;
    position: number;
    waitSeconds: number;
    matchedRoomId?: string;
    matchedRole?: string;
  } {
    const queue = this.getQueue(gameType);
    const entry = queue.find(e => e.userId === userId);

    if (!entry) {
      return { status: null, position: 0, waitSeconds: 0 };
    }

    let position = 0;
    if (entry.status === "WAITING") {
      // Filter the queue to only WAITING players, then find this user's index (1-based)
      const waitingQueue = queue.filter(e => e.status === "WAITING");
      position = waitingQueue.findIndex(e => e.userId === userId) + 1;
    }

    const waitSeconds = Math.floor((Date.now() - entry.joinedAt.getTime()) / 1000);

    return {
      status: entry.status,
      position,
      waitSeconds,
      matchedRoomId: entry.matchedRoomId,
      matchedRole: entry.matchedRole,
    };
  }

  /**
   * Attempt to pair waiting users in a specific game queue.
   */
  public async tryPair(gameType: string): Promise<MatchResult | null> {
    const queue = this.getQueue(gameType);

    // Find first two WAITING players
    const waitingPlayers = queue.filter(e => e.status === "WAITING");

    if (waitingPlayers.length >= 2) {
      const player1 = waitingPlayers[0];
      const player2 = waitingPlayers[1];

      const roomId = generateRoomId();

      try {
        const { roomManager } = await import("@/lib/rooms");
        const { GameRegistry } = await import("@/lib/game/GameRegistry");

        const gameDef = GameRegistry.get(gameType);
        if (!gameDef) {
           console.error(`[Matchmaking] Unknown game type ${gameType}`);
           return null;
        }

        // Create the room in the DB
        await roomManager.createRoomRecord({
          id: roomId,
          gameType: gameType,
          ownerId: player1.userId,
          maxPlayers: gameDef.maxPlayers,
          boardState: gameDef.createEmptyBoard() as unknown,
          currentTurn: gameDef.firstTurn,
        });

        // Update statuses
        const now = new Date();
        player1.status = "MATCHED";
        player1.matchedRoomId = roomId;
        player1.matchedRole = gameDef.roles[0];
        player1.matchedAt = now;

        player2.status = "MATCHED";
        player2.matchedRoomId = roomId;
        player2.matchedRole = gameDef.roles[1];
        player2.matchedAt = now;

        console.log(`[Matchmaking] Successfully paired players ${player1.userId} and ${player2.userId} in room ${roomId}`);

        return {
          player1,
          player2,
          roomId,
          gameType
        };
      } catch (err) {
        console.error(`[Matchmaking] Failed to create matched room:`, err);
        // Keep them waiting if room creation fails
        return null;
      }
    }

    return null;
  }

  /**
   * Remove stale or cancelled entries from memory.
   */
  public cleanupStale(maxAgeMs: number = DEFAULT_TIMEOUT_MS): void {
    const now = Date.now();
    for (const [gameType, queue] of this.queues.entries()) {
      const activeQueue = queue.filter(entry => {
        // Keep waiting players unless they've timed out
        if (entry.status === "WAITING") {
          const age = now - entry.joinedAt.getTime();
          if (age > maxAgeMs) {
            entry.status = "EXPIRED";
            return true; // Keep it just a bit longer so client sees EXPIRED
          }
          return true;
        }

        // For non-WAITING states (MATCHED, CANCELLED, EXPIRED)
        // Keep them around for 30 seconds so polling clients can see the final state
        const stateAge = entry.matchedAt
          ? now - entry.matchedAt.getTime()
          : now - entry.joinedAt.getTime();

        return stateAge < 30000;
      });

      this.queues.set(gameType, activeQueue);
    }
  }

  private getQueue(gameType: string): QueueEntry[] {
    if (!this.queues.has(gameType)) {
      this.queues.set(gameType, []);
    }
    return this.queues.get(gameType)!;
  }
}

// Global singleton to survive Next.js HMR
const globalForMatchmaking = globalThis as unknown as {
  matchmakingService: MatchmakingService | undefined;
};

export const matchmakingService =
  globalForMatchmaking.matchmakingService ?? new MatchmakingService();

if (process.env.NODE_ENV !== "production") {
  globalForMatchmaking.matchmakingService = matchmakingService;
}
