"use client";

import { useEffect, useRef } from "react";

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Sends periodic heartbeat requests to keep the user's online_status active.
 * Only sends when the browser tab is visible.
 * Users inactive for 15+ minutes will be marked offline by the server.
 */
export function useHeartbeat() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const sendHeartbeat = async () => {
      // Only send if the tab is visible
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/auth/heartbeat", { method: "POST" });
        if (!res.ok) {
          // Stop polling if the user is no longer authenticated
          if (res.status === 401 || res.status === 403) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
          // Silently ignore HTTP errors (e.g. server issues)
          return;
        }
      } catch {
        // Silently ignore network errors (user might be offline)
      }
    };

    // Send an initial heartbeat immediately
    sendHeartbeat();

    // Set up periodic heartbeat
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    // Also send a heartbeat when the tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sendHeartbeat();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
}
