/**
 * @file app/api/play/matchmaking/leave/route.ts
 * @description Beacon-compatible endpoint to remove a user from the matchmaking queue.
 *              Called by sendBeacon on tab close / beforeunload as a last-resort cleanup.
 */

import { getSession } from "@/lib/auth/auth-session";
import { matchmakingService } from "@/lib/matchmaking/MatchmakingService";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const gameType = req.nextUrl.searchParams.get("gameType");
  if (!gameType) return NextResponse.json({ ok: false, error: "Missing gameType" }, { status: 400 });

  matchmakingService.leaveQueue(session.userId, gameType);
  return NextResponse.json({ ok: true });
}
