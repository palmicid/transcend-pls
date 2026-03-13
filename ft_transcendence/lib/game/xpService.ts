import prisma from "@/lib/prisma";
import { GameRegistry } from "@/lib/game/GameRegistry";
import type { XPInfo } from "@/types/progression";

// ─── Level Math ──────────────────────────────────────────────────────────────

/** Total XP needed to reach `level` (cumulative from level 1). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(level - 1, 1.5));
}

/** Derive current level from total XP. */
export function levelFromXP(totalXP: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXP) level++;
  return level;
}

/** Build the XPInfo display object from raw totals. */
export function buildXPInfo(totalXP: number): XPInfo {
  const level = levelFromXP(totalXP);
  const currentThreshold = xpForLevel(level);
  const nextThreshold = xpForLevel(level + 1);
  const xpIntoLevel = totalXP - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;

  return {
    totalXP,
    level,
    currentLevelXP: xpIntoLevel,
    nextLevelXP: xpNeeded,
    progress: xpNeeded === 0 ? 100 : Math.round((xpIntoLevel / xpNeeded) * 100),
  };
}

// ─── XP Calculation ──────────────────────────────────────────────────────────

/** Calculate XP earned for a single game outcome. */
export function calculateXP(
  gameType: string,
  result: "win" | "loss" | "draw"
): number {
  const gameDef = GameRegistry.get(gameType);
  if (!gameDef?.xpReward) return 0;

  const { base, winMultiplier, drawMultiplier, lossMultiplier } =
    gameDef.xpReward;
  const multiplier =
    result === "win"
      ? winMultiplier
      : result === "draw"
        ? drawMultiplier
        : lossMultiplier;

  return Math.floor(base * multiplier);
}

// ─── Database Operations ─────────────────────────────────────────────────────

/** Award XP to a user, upsert their PlayerXP record, recalculate level. */
export async function awardXP(userId: number, amount: number): Promise<XPInfo> {
  // Upsert: create if first game, increment otherwise
  const record = await prisma.playerXP.upsert({
    where: { user_id: userId },
    create: {
      user_id: userId,
      total_xp: amount,
      level: levelFromXP(amount),
    },
    update: {
      total_xp: { increment: amount },
    },
  });

  // Recalculate level (increment doesn't let us compute in-DB)
  const newLevel = levelFromXP(record.total_xp);
  if (newLevel !== record.level) {
    await prisma.playerXP.update({
      where: { user_id: userId },
      data: { level: newLevel },
    });
  }

  return buildXPInfo(record.total_xp);
}

/** Get XPInfo for display on profile/leaderboard. */
export async function getXPInfo(userId: number): Promise<XPInfo> {
  const record = await prisma.playerXP.findUnique({
    where: { user_id: userId },
  });

  return buildXPInfo(record?.total_xp ?? 0);
}
