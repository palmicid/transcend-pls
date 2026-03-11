"use client";

import { useHeartbeat } from "@/hooks/useHeartbeat";

/**
 * Client component that runs the heartbeat hook.
 * Include this in the root layout to track user activity.
 */
export function HeartbeatProvider({ children }: { children: React.ReactNode }) {
  useHeartbeat();
  return <>{children}</>;
}
