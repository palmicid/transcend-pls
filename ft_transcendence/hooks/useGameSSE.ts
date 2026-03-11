/**
 * @file hooks/useGameSSE.ts
 * @description Hook for real-time game updates via SSE.
 *
 * Connects to SSE endpoint using session cookies.
 * Parses snapshots from Prisma and updates local state.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import type { RoomSnapshot as BaseRoomSnapshot } from "@/types/game";
import {
  parseGameSSEPayload,
  type GameRoomSnapshot,
} from "@/lib/sse";

// =============================================================================
// TYPES
// =============================================================================

export type RoomSnapshot = GameRoomSnapshot;

export interface UseGameSSEResult {
  /** Full room snapshot from Prisma */
  snapshot: BaseRoomSnapshot<unknown> | null;
  /** Whether SSE connection is established */
  isConnected: boolean;
  /** Player's role in the game (X, O) */
  myRole: string | null;
  /** Any connection error message */
  error: string | null;
  /** Last event type received */
  lastEvent: string | null;
}

// =============================================================================
// HOOK
// =============================================================================

export function useGameSSE(roomId: string, sseUrl: string, userId?: number): UseGameSSEResult {
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  // Keep userId in a ref so the message handler always uses the current value
  // without requiring the effect to re-run (which would disconnect and reconnect)
  const userIdRef = useRef(userId);

  // Update ref whenever userId changes, but don't reconnect the SSE
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    if (!roomId || !sseUrl) return;

    const eventSource = new EventSource(sseUrl, { withCredentials: true });

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      const payload = parseGameSSEPayload(event.data);
      if (!payload) return;

      if (payload.event) {
        setLastEvent(payload.event);
      }

      if (!payload.snapshot) return;

      if (userIdRef.current != null) {
        const derived =
          payload.snapshot.players.find((p) => p.userId === userIdRef.current)
            ?.role ?? null;
        if (derived) {
          setMyRole(derived);
        }
      }

      if (payload.snapshot.myRole) {
        setMyRole(payload.snapshot.myRole);
      }

      setSnapshot(payload.snapshot);
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      if (eventSource.readyState === EventSource.CLOSED) {
        setError("Connection closed");
      }
    };

    return () => {
      eventSource.close();
    };
    // Dependency array: only reconnect if roomId or sseUrl changes
    // userId is intentionally omitted and tracked via ref instead to avoid
    // unnecessary reconnections (which would interrupt the stream)
  }, [roomId, sseUrl]);

  return { snapshot, isConnected, myRole, error, lastEvent };
}

export default useGameSSE;
