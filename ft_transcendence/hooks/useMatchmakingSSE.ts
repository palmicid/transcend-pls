/**
 * @file hooks/useMatchmakingSSE.ts
 * @description Hook to connect to the Matchmaking SSE endpoint and manage state.
 */

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MatchmakingStatus } from "@/lib/matchmaking/types";

interface MatchmakingState {
  status: MatchmakingStatus | null;
  position: number;
  waitSeconds: number;
  matchedRoomId: string | null;
  isSearching: boolean;
}

export default function useMatchmakingSSE(gameType: string, isSearching: boolean) {
  const [state, setState] = useState<MatchmakingState>({
    status: null,
    position: 0,
    waitSeconds: 0,
    matchedRoomId: null,
    isSearching: false,
  });

  const evtSourceRef = useRef<EventSource | null>(null);
  const queueStartedAtRef = useRef<number | null>(null);
  const redirectInProgressRef = useRef(false);
  const router = useRouter();

  const redirectToMatchedRoom = (roomId: string) => {
    if (redirectInProgressRef.current) return;
    redirectInProgressRef.current = true;

    setState((s) => ({
      ...s,
      status: "MATCHED",
      matchedRoomId: roomId,
      isSearching: false,
    }));

    if (evtSourceRef.current) {
      evtSourceRef.current.close();
      evtSourceRef.current = null;
    }

    router.push(`/play/${gameType}/${roomId}`);
  };

  useEffect(() => {
    if (isSearching) {
      queueStartedAtRef.current = Date.now();
      setState((s) => ({
        ...s,
        status: "WAITING",
        position: 0,
        waitSeconds: 0,
        matchedRoomId: null,
        isSearching: true,
      }));

      // Close any existing connection before creating new one
      if (evtSourceRef.current) {
        evtSourceRef.current.close();
      }

      console.log(`[SSE] Connecting to matchmaking for ${gameType}`);
      const sseUrl = `/api/play/matchmaking/sse?gameType=${encodeURIComponent(gameType)}`;
      const evtSource = new EventSource(sseUrl);
      evtSourceRef.current = evtSource;

      evtSource.onmessage = (event) => {
        // Fallback catch-all
        console.log(`[SSE message]`, event.data);
      };

      evtSource.addEventListener("connected", () => {
        console.log(`[SSE] Connected to matchmaking queue`);
      });

      evtSource.addEventListener("queue_update", (e) => {
        const data = JSON.parse((e as MessageEvent).data);
        console.log(`[SSE queue_update] Position: ${data.position}, Wait: ${data.waitSeconds}s`);
        setState((s) => ({
          ...s,
          status: "WAITING",
          position: data.position,
          waitSeconds: data.waitSeconds,
        }));
      });

      evtSource.addEventListener("time_update", (e) => {
        const data = JSON.parse((e as MessageEvent).data);
        setState((s) => ({
          ...s,
          waitSeconds: data.waitSeconds,
        }));
      });

      evtSource.addEventListener("match_found", (e) => {
        const data = JSON.parse((e as MessageEvent).data);
        console.log(`[SSE match_found] Room: ${data.roomId}`);
        redirectToMatchedRoom(data.roomId);
      });

      evtSource.addEventListener("stream_closed", () => {
        if (evtSourceRef.current) {
          evtSourceRef.current.close();
          evtSourceRef.current = null;
        }
      });

      evtSource.addEventListener("queue_cancelled", (e) => {
        const data = JSON.parse((e as MessageEvent).data);
        console.log(`[SSE queue_cancelled] Reason: ${data.reason}`);
        setState((s) => ({
          ...s,
          status: data.reason,
          isSearching: false,
        }));
        evtSource.close();
      });

      evtSource.onerror = (err) => {
        console.warn(`[SSE Error] Matchmaking connection issue (browser will retry)`, err);
      };

      // Client-side timer fallback to ensure showBotFallback works even if SSE is laggy
      const timerInterval = setInterval(() => {
        const startedAt = queueStartedAtRef.current;
        if (!startedAt) return;

        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        setState((s) => {
          const nextWait = Math.max(s.waitSeconds, elapsed);
          return {
            ...s,
            waitSeconds: nextWait,
          };
        });
      }, 1000);

      // Safety net: leave queue if user closes the browser tab or window
      const handleBeforeUnload = () => {
        // Use sendBeacon for reliable fire-and-forget on tab close
        navigator.sendBeacon(
          `/api/play/matchmaking/leave?gameType=${encodeURIComponent(gameType)}`
        );
      };
      window.addEventListener("beforeunload", handleBeforeUnload);

      return () => {
        clearInterval(timerInterval);
        evtSource.close();
        evtSourceRef.current = null;
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    } else {
      // isSearching is false, close existing connection
      if (evtSourceRef.current) {
        console.log(`[SSE] Closing connection to matchmaking`);
        evtSourceRef.current.close();
        evtSourceRef.current = null;
      }
      queueStartedAtRef.current = null;
      redirectInProgressRef.current = false;
      setState({
        status: null,
        position: 0,
        waitSeconds: 0,
        matchedRoomId: null,
        isSearching: false,
      });
    }

    return () => {
      if (evtSourceRef.current) {
        evtSourceRef.current.close();
      }
    };
  }, [gameType, isSearching, router]);

  return state;
}
