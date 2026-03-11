/**
 * @file constants.ts
 * @description Shared constants for the bot system.
 */

/** Constant ID representing the bot player in any game's player slots */
export const BOT_PLAYER_ID = "__BOT__";

/**
 * The three supported difficulty tiers, stored as human-readable strings
 * both in memory and in the database.
 *
 * Each strategy is responsible for mapping these labels to whatever
 * internal parameter makes sense for its algorithm (e.g. search depth,
 * randomness factor, look-ahead horizon, etc.).
 */
export type BotDifficulty = "Easy" | "Medium" | "Hard";

/**
 * Ordered list of valid difficulty values.
 * Useful for validation and iteration.
 */
export const BOT_DIFFICULTIES: readonly BotDifficulty[] = [
	"Easy",
	"Medium",
	"Hard",
] as const;

/**
 * Fallback depth map used when a MinimaxStrategy is created without
 * an explicit depthMap.  Individual game strategies should always
 * supply their own calibrated map via MinimaxStrategyOptions.depthMap.
 *
 *   Easy   →  1  (shallow search, makes obvious mistakes)
 *   Medium →  3  (decent play, occasional blunders)
 *   Hard   →  9  (deep search, near-perfect for small trees like TTT)
 */
export const DEFAULT_DIFFICULTY_DEPTH_MAP: Record<BotDifficulty, number> = {
	Easy: 1,
	Medium: 3,
	Hard: 9,
};
