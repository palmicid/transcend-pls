import prisma from "@/lib/prisma";
import { getPlayerStats } from "@/lib/game/getGameHistory";
import { getXPInfo } from "@/lib/game/xpService";
import type { AchievementDef, UserAchievementInfo } from "@/types/progression";

// ─── Achievement Definitions ────────────────────────────────────────────────

export interface AchievementCheck extends AchievementDef {
  /** Return true if the user qualifies. */
  check: (ctx: CheckContext) => boolean;
}

export interface CheckContext {
  stats: { wins: number; losses: number; draws: number; total: number };
  level: number;
}

export const ACHIEVEMENTS: AchievementCheck[] = [
  {
    id: "rookie",
    name: "Rookie",
    description: "Play your first game",
    icon: "Gamepad2",
    category: "games",
    check: (ctx) => ctx.stats.total >= 1,
  },
  {
    id: "first-blood",
    name: "First Blood",
    description: "Win your first game",
    icon: "Swords",
    category: "wins",
    check: (ctx) => ctx.stats.wins >= 1,
  },
  {
    id: "rising-star",
    name: "Rising Star",
    description: "Reach Level 3",
    icon: "Star",
    category: "special",
    check: (ctx) => ctx.level >= 3,
  },
];

// ─── Main Evaluation ────────────────────────────────────────────────────────

/**
 * Check all achievements for a user and award any newly earned ones.
 * Returns the list of NEWLY unlocked achievements (for toast notifications).
 *
 * This function is idempotent — calling it repeatedly won't duplicate unlocks
 * because of the @@unique([user_id, achievement_id]) constraint.
 */
export async function checkAndAwardAchievements(
  userId: number
): Promise<AchievementDef[]> {
  // 1. Gather context (parallel)
  const [stats, xpInfo, existingUnlocks] = await Promise.all([
    getPlayerStats(userId),
    getXPInfo(userId),
    prisma.userAchievement.findMany({
      where: { user_id: userId },
      select: { achievement_id: true },
    }),
  ]);

  const alreadyUnlocked = new Set(existingUnlocks.map((u: { achievement_id: string }) => u.achievement_id));

  const ctx: CheckContext = {
    stats,
    level: xpInfo.level,
  };

  // 2. Evaluate all achievements
  const newlyUnlocked: AchievementDef[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (alreadyUnlocked.has(achievement.id)) continue;
    if (!achievement.check(ctx)) continue;

    // Insert unlock record (createMany with skipDuplicates for safety)
    await prisma.userAchievement.create({
      data: {
        user_id: userId,
        achievement_id: achievement.id,
      },
    });

    newlyUnlocked.push({
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      category: achievement.category,
    });
  }

  return newlyUnlocked;
}

// ─── Query ──────────────────────────────────────────────────────────────────

/**
 * Get all achievements with unlock status for a user.
 * Used on the profile page to show the achievement grid.
 */
export async function getUserAchievements(
  userId: number
): Promise<UserAchievementInfo[]> {
  const unlocks = await prisma.userAchievement.findMany({
    where: { user_id: userId },
    select: { achievement_id: true, unlocked_at: true },
  });

  const unlockMap = new Map<string, Date>(
    unlocks.map((u: { achievement_id: string; unlocked_at: Date }) => [u.achievement_id, u.unlocked_at] as const)
  );

  return ACHIEVEMENTS.filter((a) => !a.hidden).map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    icon: a.icon,
    category: a.category,
    unlockedAt: unlockMap.get(a.id)?.toISOString() ?? null,
  }));
}
