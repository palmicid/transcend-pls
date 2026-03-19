/**
 * @file instrumentation.ts
 * @description Next.js instrumentation hook – runs once when the server starts.
 *              Sets up a background job that marks stale users as offline every 3 minutes.
 */

import { INACTIVITY_THRESHOLD_MS } from "@/lib/onlineStatus";

const CLEANUP_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

export async function onRequestError() {
  // Required export – intentionally empty.
}

export async function register() {
  // Only run on the Node.js server, not in Edge runtime
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { default: prisma } = await import("@/lib/prisma");

    const cleanup = async () => {
      try {
        const cutoff = new Date(Date.now() - INACTIVITY_THRESHOLD_MS);
        const result = await prisma.user.updateMany({
          where: {
            online_status: true,
            last_active_at: { lt: cutoff },
          },
          data: { online_status: false },
        });
        if (result.count > 0) {
          console.log(`[online-cleanup] Marked ${result.count} stale user(s) offline`);
        }
      } catch (err) {
        console.error("[online-cleanup] Error:", err);
      }
    };

    // Run immediately on startup, then every 3 minutes
    cleanup();
    setInterval(cleanup, CLEANUP_INTERVAL_MS);
    console.log("[online-cleanup] Background job started (every 3 min)");
  }
}
