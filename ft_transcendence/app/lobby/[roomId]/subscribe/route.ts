/**
 * @file app/lobby/[roomId]/subscribe/route.ts
 * @description Server-Sent Events endpoint for lobby room subscriptions.
 *
 * Clients connect to this endpoint to receive real-time game updates.
 * For sending actions (start, pause, leave), use server actions instead.
 *
 * @example
 * ```ts
 * // Client-side
 * const eventSource = new EventSource('/lobby/room-123/subscribe?userId=player-1');
 *
 * eventSource.addEventListener('message', (event) => {
 *   const data = JSON.parse(event.data);
 *   console.log('Snapshot:', data);
 * });
 *
 * eventSource.addEventListener('init', (event) => {
 *   console.log('Initial state:', JSON.parse(event.data));
 * });
 * ```
 */

import { NextRequest } from "next/server";
import { roomManager } from "@/lib/rooms";
import { broadcaster } from "@/lib/broadcast";
import { createSSEHandler } from "@/lib/sse";

/**
 * Handle SSE connection for lobby rooms.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");

  // Validate required parameters
  if (!userId) {
    return new Response("Missing userId query parameter", { status: 400 });
  }

  // Ensure room exists and add player
  roomManager.ensureRoom(roomId, broadcaster);
  roomManager.addPlayer(roomId, userId);

  // Create SSE connection
  return createSSEHandler({
    // Send initial state when client connects
    onInit: (send) => {
      const snapshot = roomManager.getSnapshot(roomId);
      const room = roomManager.getRoom(roomId);
      send({
        event: "init",
        data: {
          roomId,
          snapshot,
          state: room?.status ?? null,
        },
      });
    },

    // Subscribe to room broadcasts
    onSubscribe: (send) => {
      const listener = (data: string) => {
        try {
          // Forward broadcast data as SSE message
          send({ event: "snapshot", data: JSON.parse(data) });
        } catch {
          send({ data });
        }
      };
      broadcaster.addListener(roomId, listener);
      return () => broadcaster.removeListener(roomId, listener);
    },

    // Cleanup when client disconnects
    onCleanup: () => {
      roomManager.removePlayer(roomId, userId);
    },
  });
}
