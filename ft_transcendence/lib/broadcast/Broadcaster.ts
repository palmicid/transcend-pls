/**
 * @file Broadcaster.ts
 * @description Abstract base class for broadcasting messages to room subscribers.
 *
 * Broadcasters enable real-time communication between the server and connected clients.
 * Different implementations can use WebSockets, Server-Sent Events (SSE), or external
 * pub/sub services like Redis.
 *
 * @example
 * ```ts
 * import { Broadcaster } from '@/lib/broadcast';
 *
 * class RedisBroadcaster extends Broadcaster {
 *   broadcast(roomId: string, message: string): void {
 *     // Publish to Redis channel
 *   }
 *   // ... implement other methods
 * }
 * ```
 */

/**
 * Callback function type for receiving broadcast messages.
 */
export type BroadcastListener = (data: string) => void;

/**
 * Abstract broadcaster for room snapshots and events.
 *
 * Implementations can use WebSockets, Server-Sent Events, or any pub/sub mechanism.
 * The broadcaster acts as a message bus between game rooms and connected clients.
 */
export default abstract class Broadcaster {
  /**
   * Broadcast a message to all listeners subscribed to a specific room.
   *
   * @param roomId - The unique identifier of the room
   * @param message - The message payload (typically JSON string)
   *
   * @example
   * ```ts
   * broadcaster.broadcast('room-123', JSON.stringify({ event: 'move', data: {...} }));
   * ```
   */
  abstract broadcast(roomId: string, message: string): void;

  /**
   * Subscribe a listener to receive future broadcasts for a room.
   *
   * The listener will be called whenever `broadcast()` is invoked for this room.
   *
   * @param roomId - The room to subscribe to
   * @param listener - Callback function that receives broadcast messages
   *
   * @example
   * ```ts
   * const onMessage = (data: string) => console.log('Received:', data);
   * broadcaster.addListener('room-123', onMessage);
   * ```
   */
  abstract addListener(roomId: string, listener: BroadcastListener): void;

  /**
   * Unsubscribe a listener from a room.
   *
   * Should be called when a client disconnects to prevent memory leaks.
   *
   * @param roomId - The room to unsubscribe from
   * @param listener - The same function reference passed to `addListener()`
   */
  abstract removeListener(roomId: string, listener: BroadcastListener): void;
}
