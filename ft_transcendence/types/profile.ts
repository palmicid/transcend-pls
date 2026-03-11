export type ProfileFieldConfig = {
  key: string;
  label: string;
  editable?: boolean;
};

export interface ProfileGameStats {
  wins: number;
  losses: number;
  draws: number;
  total: number;
  winRate: number;
  nonLossRate: number;
  averageDurationMs: number | null;
}

export interface ProfileGameSummary {
  id: number;
  gameType: string;
  roomId: string | null;
  winnerId: number | null;
  isDraw: boolean;
  durationMs: number | null;
  startedAt: string;
  endedAt: string;
  result: "win" | "loss" | "draw";
  opponent: { id: number; displayName: string };
  finalBoard: unknown;
}

export interface ProfileUser {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string;
  online: boolean;
  createdAt: string;
  isVerified: boolean;
  use2FA: boolean;
  stats?: ProfileGameStats;
  recentGames?: ProfileGameSummary[];
}
