/**
 * @file hooks/useGameSSE.ts
 * @description Hook for real-time game updates via SSE.
 *
 * Connects to SSE endpoint using session cookies.
 * Parses snapshots from Prisma and updates local state.
 */

"use client";

import { useEffect, useState } from "react";

// =============================================================================
// TYPES
// =============================================================================

export interface PlayerInfo {
  userId: number;
  displayName: string;
  role: string | null;
  isConnected: boolean;
}

export interface RoomSnapshot {
  roomId: string;
  status: string;
  board: (string | null)[];
  currentTurn: string | null;
  winner: string | null;
  isDraw: boolean;
  players: PlayerInfo[];
  maxPlayers: number;
  myRole?: string | null;
}

export interface UseGameSSEResult {
  /** Full room snapshot from Prisma */
  snapshot: RoomSnapshot | null;
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

  useEffect(() => {
    if (!roomId || !sseUrl) return;

    console.log("[SSE] Connecting to:", sseUrl);

    const eventSource = new EventSource(sseUrl, { withCredentials: true });

    eventSource.onopen = () => {
      console.log("[SSE] Connection opened");
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Track event type
        if (data.event) {
          setLastEvent(data.event);
        }

        // Update snapshot from any event that includes room data
        if (data.roomId && data.board !== undefined) {
          const players: PlayerInfo[] = data.players || [];

          // Derive myRole whenever we have players data and a userId
          if (userId) {
            const derived = players.find((p) => p.userId === userId)?.role || null;
            if (derived) {
              setMyRole(derived);
            }
          }

          // Update myRole if provided explicitly (initial snapshot)
          if (data.myRole) {
            setMyRole(data.myRole);
          }

          setSnapshot({
            roomId: data.roomId,
            status: data.status,
            board: data.board,
            currentTurn: data.currentTurn,
            winner: data.winner,
            isDraw: data.isDraw,
            players,
            maxPlayers: data.maxPlayers || 2,
            myRole: data.myRole,
          });
        }
      } catch (err) {
        console.error("[SSE] Parse error:", err);
      }
    };

    eventSource.onerror = () => {
      console.error("[SSE] Connection error");
      setIsConnected(false);
      if (eventSource.readyState === EventSource.CLOSED) {
        setError("Connection closed");
      }
    };

    return () => {
      console.log("[SSE] Closing connection");
      eventSource.close();
    };
  }, [roomId, sseUrl]);

  return { snapshot, isConnected, myRole, error, lastEvent };
}

export default useGameSSE;
