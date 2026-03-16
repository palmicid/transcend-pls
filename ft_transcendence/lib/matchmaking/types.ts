/**
 * @file lib/matchmaking/types.ts
 * @description Type definitions for the matchmaking system.
 */

export type MatchmakingStatus = "WAITING" | "MATCHED" | "CANCELLED" | "EXPIRED";

export interface QueueEntry {
  userId: number;
  displayName: string;
  gameType: string;
  joinedAt: Date;
  status: MatchmakingStatus;
  matchedRoomId?: string;
  matchedRole?: string;
  matchedAt?: Date;
}

export interface MatchResult {
  player1: QueueEntry;
  player2: QueueEntry;
  roomId: string;
  gameType: string;
}
