/**
 * @file app/api/play/matchmaking/status/route.ts
 * @description Authenticated status endpoint used as a fallback for matchmaking redirect reliability.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/auth-session";
import { matchmakingService } from "@/lib/matchmaking/MatchmakingService";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gameType = req.nextUrl.searchParams.get("gameType");
  if (!gameType) {
    return NextResponse.json({ error: "gameType required" }, { status: 400 });
  }

  const status = matchmakingService.getStatus(session.userId, gameType);
  return NextResponse.json({ ok: true, data: status });
}
