/**
 * @file createSSEHandler.ts
 * @description Factory function for creating Server-Sent Events (SSE) streams.
 *
 * SSE is a simpler alternative to WebSockets for server-to-client streaming.
 * Unlike WebSocket, SSE:
 * - Works in all environments (dev server, edge, node)
 * - Is unidirectional (server → client only)
 * - Uses standard HTTP (no upgrade needed)
 * - Auto-reconnects on connection loss
 *
 * For client-to-server messages, use server actions instead.
 *
 * @example
 * ```ts
 * import { createSSEHandler } from '@/lib/sse';
 *
 * export async function GET(req: NextRequest) {
 *   return createSSEHandler({
 *     onInit: (send) => {
 *       send({ event: 'connected', data: { hello: true } });
 *     },
 *     onSubscribe: (send) => {
 *       broadcaster.addListener(roomId, (data) => send({ data }));
 *       return () => broadcaster.removeListener(roomId, listener);
 *     },
 *   });
 * }
 * ```
 */

/**
 * SSE message format.
 */
export interface SSEMessage {
  /** Event type (optional, defaults to 'message') */
  event?: string;
  /** Data payload (will be JSON stringified) */
  data: unknown;
  /** Event ID for client reconnection */
  id?: string;
  /** Retry interval in ms for client reconnection */
  retry?: number;
}

/**
 * Options for creating an SSE handler.
 */
export interface SSEHandlerOptions {
  /**
   * Called when the connection is established.
   * Use this to send initial data to the client.
   *
   * @param send - Function to send an SSE message
   */
  onInit?: (send: (msg: SSEMessage) => void) => void;

  /**
   * Called to set up subscriptions for broadcast messages.
   * Return a cleanup function to unsubscribe.
   *
   * @param send - Function to send an SSE message
   * @returns Cleanup function
   */
  onSubscribe?: (send: (msg: SSEMessage) => void) => () => void;

  /**
   * Called when the connection is closed.
   */
  onCleanup?: () => void;

  /**
   * Keep-alive ping interval in milliseconds. Default: 30000 (30 seconds)
   */
  pingInterval?: number;
}

/**
 * Format an SSE message for transmission.
 */
function formatSSE(msg: SSEMessage): string {
  let result = "";

  if (msg.event) {
    result += `event: ${msg.event}\n`;
  }

  if (msg.id) {
    result += `id: ${msg.id}\n`;
  }

  if (msg.retry) {
    result += `retry: ${msg.retry}\n`;
  }

  // Data must be on its own line(s)
  const dataStr = typeof msg.data === "string" ? msg.data : JSON.stringify(msg.data);
  // Handle multi-line data
  for (const line of dataStr.split("\n")) {
    result += `data: ${line}\n`;
  }

  result += "\n"; // End of message
  return result;
}

/**
 * Create a Server-Sent Events handler.
 *
 * Returns a streaming Response that keeps the connection open and
 * sends events to the client.
 *
 * @param options - Handler configuration
 * @returns A streaming Response with SSE content type
 */
export function createSSEHandler(options: SSEHandlerOptions): Response {
  const { onInit, onSubscribe, onCleanup, pingInterval = 30000 } = options;

  // Track whether stream is closed to prevent sending to closed controller
  let isClosed = false;
  let unsubscribe: (() => void) | undefined;
  let pingTimer: ReturnType<typeof setInterval> | undefined;

  // Create a readable stream
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      /**
       * Send an SSE message to the client.
       * Safely handles closed streams.
       */
      const send = (msg: SSEMessage): void => {
        // Don't try to send if stream is closed
        if (isClosed) return;

        try {
          controller.enqueue(encoder.encode(formatSSE(msg)));
        } catch {
          // Stream is closed, mark as such and cleanup
          isClosed = true;
          cleanup();
        }
      };

      /**
       * Cleanup function to release all resources.
       */
      const cleanup = (): void => {
        if (pingTimer) {
          clearInterval(pingTimer);
          pingTimer = undefined;
        }
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = undefined;
        }
        if (onCleanup) {
          onCleanup();
        }
      };

      // Send initial connection message
      send({ event: "connected", data: { connected: true, timestamp: Date.now() } });

      // Call init callback
      if (onInit) {
        onInit(send);
      }

      // Set up subscriptions
      if (onSubscribe) {
        unsubscribe = onSubscribe(send);
      }

      // Keep-alive ping to prevent connection timeout
      pingTimer = setInterval(() => {
        send({ event: "ping", data: { t: Date.now() } });
      }, pingInterval);
    },

    cancel() {
      // Called when client disconnects
      isClosed = true;

      // Cleanup resources
      if (pingTimer) {
        clearInterval(pingTimer);
        pingTimer = undefined;
      }
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = undefined;
      }
      if (onCleanup) {
        onCleanup();
      }
    },
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
