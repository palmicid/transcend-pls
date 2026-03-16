/**
 * @file app/play/matchmaking-actions.ts
 * @description Server actions for matchmaking.
 */

"use server";

import { getSession } from "@/lib/auth/auth-session";
import { matchmakingService } from "@/lib/matchmaking/MatchmakingService";

/**
 * Join the matchmaking queue.
 */
export async function joinMatchmakingQueue(gameType: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  // Using username as display name fallback since displayName isn't in UserSession type
  const displayName = (session as any).displayName || session.username || "Unknown Player";
  matchmakingService.joinQueue(session.userId, displayName, gameType);
  
  // Attempt immediate pairing
  await matchmakingService.tryPair(gameType);
  
  return { ok: true };
}

/**
 * Leave the matchmaking queue.
 */
export async function leaveMatchmakingQueue(gameType: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  matchmakingService.leaveQueue(session.userId, gameType);
  return { ok: true };
}

/**
 * Get the current matchmaking status.
 */
export async function getMatchmakingStatus(gameType: string) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const status = matchmakingService.getStatus(session.userId, gameType);
  return { ok: true, data: status };
}
