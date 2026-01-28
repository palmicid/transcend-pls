/**
 * @file hooks/useGameSSE.ts
 * @description Hook for real-time game updates via SSE.
 *
 * Connects to SSE endpoint using session cookies.
 * Parses snapshots from Prisma and updates local state.
 */

"use client";

import { useEffect, useRef, useState } from "react";

// =============================================================================
// TYPES
// =============================================================================

export interface PlayerInfo {
  userId: number;
  displayName: string;
  role: string | null;
  isConnected: boolean;
  /** Whether this player is the bot */
  isBot?: boolean;
}

/** Bot configuration as broadcast via SSE */
export interface BotInfo {
  role: string;
  difficulty: 1 | 3 | 9;
  delayMs: number;
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
  /** Bot configuration, if a bot is in the game */
  bot?: BotInfo | null;
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

  // Keep userId in a ref so the message handler always uses the current value
  // without requiring the effect to re-run (which would disconnect and reconnect)
  const userIdRef = useRef(userId);

  // Update ref whenever userId changes, but don't reconnect the SSE
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

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

          // Derive myRole from players list using current userId (via ref)
          // Use ref instead of adding userId to dependency array to avoid reconnecting
          // the SSE whenever userId changes
          if (userIdRef.current) {
            const derived = players.find((p) => p.userId === userIdRef.current)?.role || null;
            if (derived) {
              setMyRole(derived);
            }
          }

          // Update myRole if provided explicitly in the event (initial snapshot)
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
            bot: data.bot || null,
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
    // Dependency array: only reconnect if roomId or sseUrl changes
    // userId is intentionally omitted and tracked via ref instead to avoid
    // unnecessary reconnections (which would interrupt the stream)
  }, [roomId, sseUrl]);

  return { snapshot, isConnected, myRole, error, lastEvent };
}

export default useGameSSE;
