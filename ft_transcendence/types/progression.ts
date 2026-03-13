export interface XPInfo {
  totalXP: number;
  level: number;
  currentLevelXP: number; // XP earned within current level
  nextLevelXP: number; // XP total needed for the level-up
  progress: number; // 0–100 percentage
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name (e.g. "Swords", "Trophy")
  category: "wins" | "games" | "streak" | "special";
  hidden?: boolean; // if true, not shown until unlocked
}

export interface UserAchievementInfo extends AchievementDef {
  unlockedAt: string | null; // ISO string if unlocked, null if locked
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  displayName: string;
  avatarUrl: string;
  level: number;
  totalXP: number;
  wins: number;
  totalGames: number;
}
