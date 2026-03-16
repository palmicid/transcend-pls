/**
 * @file app/api/play/matchmaking/sse/route.ts
 * @description SSE endpoint for matchmaking to push connection status and match found events.
 */

import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/auth-session";
import { matchmakingService } from "@/lib/matchmaking/MatchmakingService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const gameType = searchParams.get("gameType");

  if (!gameType) {
    return new Response("gameType required", { status: 400 });
  }

  const userId = session.userId;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const sendEvent = (event: string, data: object) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Stream might be closed
        }
      };

      const closeController = () => {
        try {
          controller.close();
        } catch {
          // Stream may already be closed.
        }
      };

      // Send initial connection event
      sendEvent("connected", { status: "connected" });

      // Poll the matchmaking service for this user
      // A more robust implementation would use an event emitter,
      // but polling is simple and sufficient for the size of this queue.
      let isActive = true;
      let lastStatus: string | null = null;
      let lastPosition: number = -1;

      const heartbeatInterval = setInterval(() => {
        if (!isActive) return;
        sendEvent("heartbeat", { ts: Date.now() });
      }, 15000);

      const stopStream = () => {
        if (!isActive) return;
        isActive = false;
        clearInterval(pollInterval);
        clearInterval(heartbeatInterval);
        setTimeout(closeController, 80);
      };

      const processStatus = (info: { status: string | null; position: number; waitSeconds: number; matchedRoomId?: string }) => {
        if (info.status === "MATCHED" && info.matchedRoomId) {
          sendEvent("match_found", { roomId: info.matchedRoomId });
          sendEvent("stream_closed", { reason: "MATCH_FOUND" });
          stopStream();
          return;
        }

        if (info.status === "CANCELLED" || info.status === "EXPIRED") {
          sendEvent("queue_cancelled", { reason: info.status });
          sendEvent("stream_closed", { reason: info.status });
          stopStream();
          return;
        }

        if (info.status === "WAITING") {
          if (info.status !== lastStatus || info.position !== lastPosition) {
            sendEvent("queue_update", { position: info.position, waitSeconds: info.waitSeconds });
            lastStatus = info.status;
            lastPosition = info.position;
          } else {
            sendEvent("time_update", { waitSeconds: info.waitSeconds });
          }
          return;
        }

        if (!info.status) {
          sendEvent("queue_cancelled", { reason: "EXPIRED" });
          sendEvent("stream_closed", { reason: "EXPIRED" });
          stopStream();
        }
      };

      let isPolling = false;
      const pollInterval = setInterval(async () => {
        if (!isActive || isPolling) return;
        isPolling = true;

        try {
          const info = matchmakingService.getStatus(userId, gameType);

          processStatus(info);

        } catch (err) {
          console.error("Error in matchmaking polling:", err);
        } finally {
          isPolling = false;
        }
      }, 1000);

      // Attempt a match immediately when SSE connection opens.
      try {
        await matchmakingService.tryPair(gameType);
        const info = matchmakingService.getStatus(userId, gameType);
        processStatus(info);
      } catch (err) {
        console.error("Error during initial matchmaking attempt:", err);
      }

      // Cleanup on client disconnect — auto-remove from queue
      req.signal.addEventListener("abort", () => {
        stopStream();
        console.log(`[SSE] Client disconnected for user ${userId} on ${gameType}`);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
