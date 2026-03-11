/**
 * @file index.ts
 * @description Public API for the bot library.
 */

export type { BotStrategy, BotConfig } from "./BotStrategy";
export type { MinimaxAdapter } from "./strategies/MinimaxStrategy";
export type { RandomAdapter } from "./strategies/RandomStrategy";

export { MinimaxStrategy } from "./strategies/MinimaxStrategy";
export { RandomStrategy } from "./strategies/RandomStrategy";
export { BotRegistry } from "./BotRegistry";
export {
	BOT_PLAYER_ID,
	BOT_DIFFICULTIES,
	DEFAULT_DIFFICULTY_DEPTH_MAP,
} from "./constants";
export type { BotDifficulty } from "./constants";
