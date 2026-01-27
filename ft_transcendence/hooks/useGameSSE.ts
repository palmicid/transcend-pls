/**
 * @file hooks/useGameSSE.ts
 * @description Hook for real-time game updates via Express SSE.
 *
 * Connects to Express SSE server using JWT token from Next.js.
 * Handles connection state, reconnection, and message parsing.
 *
 * @example
 * ```tsx
 * function GameComponent({ roomId, sseToken }) {
 *   const { snapshot, isConnected } = useGameSSE(roomId, sseToken);
 *
 *   return (
 *     <div>
 *       {isConnected ? "Connected" : "Connecting..."}
 *       <GameBoard board={snapshot?.board} />
 *     </div>
 *   );
 * }
 * ```
 */

"use client";

import { useEffect, useState, useCallback } from "react";

const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || "http://localhost:3001";

export interface GameSnapshot {
  board?: (string | null)[];
  current_turn?: string | null;
  winner?: string | null;
  is_draw?: boolean;
  [key: string]: unknown;
}

export interface UseGameSSEResult {
  /** Current game snapshot from SSE events */
  snapshot: GameSnapshot | null;
  /** Whether SSE connection is established */
  isConnected: boolean;
  /** Any connection error message */
  error: string | null;
}

/**
 * Hook for subscribing to game updates via SSE.
 *
 * @param roomId - The room to subscribe to
 * @param token - SSE token from the join API
 * @returns Connection state and game snapshot
 */
export function useGameSSE(roomId: string, token: string, customUrl?: string): UseGameSSEResult {
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId || !token) return;

    // Use custom URL if provided, otherwise fall back to Express URL
    let url: string;
    if (customUrl) {
      // Append token to custom URL
      const separator = customUrl.includes("?") ? "&" : "?";
      url = `${customUrl}${separator}token=${encodeURIComponent(token)}`;
    } else {
      url = `${EXPRESS_URL}/event/${roomId}?token=${encodeURIComponent(token)}`;
    }

    console.log("[SSE] Connecting to:", url);

    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      console.log("[SSE] Connection opened");
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        // Some SSE implementations might send data update without "data:" prefix handling if raw,
        // but EventSource standard handles 'data: ...' lines and puts payload in event.data
        const data = JSON.parse(event.data);
        // console.log("[SSE] Message:", data); // verbose

        // Handle different event types
        if (data.event === "connected") {
          setIsConnected(true);
        } else if (data.event === "ping") {
          // Keep-alive, no action needed
        } else if (data.board !== undefined) {
          // Direct game state update
          setSnapshot((prev) => ({ ...prev, ...data }));
        } else if (data.snapshot) {
          // Wrapped snapshot or full room update
          // If it's a room update containing 'snapshot' field, use that
          setSnapshot(data.snapshot);
        } else if (data.data) {
           // Handle nested data if needed (some broadcasters might double wrap)
           // But based on our route, we send { data: JSON.parse(jsonString) } implicitly?
           // No, route sends: send({ data: "..." }) -> Client gets "..." as event.data.
           // So JSON.parse(event.data) IS the payload.
           // Our payload has { event, roomId, state, snapshot }
           if (data.snapshot) {
             setSnapshot(data.snapshot);
           }
        }
      } catch (err) {
        console.error("[SSE] Parse error:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("[SSE] Error:", err);
      setIsConnected(false);

      if (eventSource.readyState === EventSource.CLOSED) {
        setError("Connection closed");
      }
    };

    return () => {
      console.log("[SSE] Closing connection");
      eventSource.close();
    };
  }, [roomId, token, customUrl]);

  return { snapshot, isConnected, error };
}

export default useGameSSE;
