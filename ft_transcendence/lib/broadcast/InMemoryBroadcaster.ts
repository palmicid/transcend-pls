/**
 * @file InMemoryBroadcaster.ts
 * @description Simple in-memory pub/sub broadcaster for development and single-server deployments.
 *
 * This implementation stores all listeners in memory using a Map. It's perfect for:
 * - Local development
 * - Single-server deployments
 * - Testing
 *
 * For multi-server production deployments, use a Redis-backed broadcaster instead.
 *
 * @example
 * ```ts
 * import { broadcaster } from '@/lib/broadcast';
 *
 * // Subscribe to room updates
 * broadcaster.addListener('room-123', (data) => {
 *   console.log('Received:', JSON.parse(data));
 * });
 *
 * // Broadcast a message to all subscribers
 * broadcaster.broadcast('room-123', JSON.stringify({ event: 'update' }));
 * ```
 */

import Broadcaster, { type BroadcastListener } from "./Broadcaster";

/**
 * In-memory broadcaster using JavaScript Map and Set.
 *
 * Stores listeners per room in a Map<roomId, Set<listener>>.
 * Not suitable for multi-process/multi-server deployments.
 */
class InMemoryBroadcaster extends Broadcaster {
  /**
   * Map of room IDs to their subscribed listeners.
   * Each room can have multiple listeners (one per connected client).
   */
  private listeners: Map<string, Set<BroadcastListener>> = new Map();

  /**
   * Broadcast a message to all listeners in a room.
   * Catches and logs errors from individual listeners to prevent one
   * failing listener from breaking the broadcast loop.
   */
  broadcast(roomId: string, message: string): void {
    const listenerSet = this.listeners.get(roomId);
    if (!listenerSet) return;

    for (const listener of listenerSet) {
      try {
        listener(message);
      } catch (error) {
        // Log but don't throw - one failing listener shouldn't break others
        console.error(`[Broadcaster] Listener error for room ${roomId}:`, error);
      }
    }
  }

  /**
   * Add a listener for a room. Creates the room's listener set if it doesn't exist.
   */
  addListener(roomId: string, listener: BroadcastListener): void {
    let listenerSet = this.listeners.get(roomId);
    if (!listenerSet) {
      listenerSet = new Set();
      this.listeners.set(roomId, listenerSet);
    }
    listenerSet.add(listener);
  }

  /**
   * Remove a listener from a room. Cleans up the room's set if empty.
   */
  removeListener(roomId: string, listener: BroadcastListener): void {
    const listenerSet = this.listeners.get(roomId);
    if (!listenerSet) return;

    listenerSet.delete(listener);

    // Clean up empty sets to prevent memory leaks
    if (listenerSet.size === 0) {
      this.listeners.delete(roomId);
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Global broadcaster instance.
 *
 * Uses globalThis to survive Next.js hot-reloading in development.
 * In production, this is a simple module-level singleton.
 */
const globalForBroadcaster = globalThis as unknown as {
  broadcaster: InMemoryBroadcaster | undefined;
};

export const broadcaster =
  globalForBroadcaster.broadcaster ?? new InMemoryBroadcaster();

// Preserve instance during development hot-reloads
if (process.env.NODE_ENV !== "production") {
  globalForBroadcaster.broadcaster = broadcaster;
}

export default InMemoryBroadcaster;
