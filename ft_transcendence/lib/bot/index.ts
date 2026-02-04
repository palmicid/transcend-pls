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
export * from "./constants";
