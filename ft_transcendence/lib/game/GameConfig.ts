/**
 * @file GameConfig.ts
 * @description Base interface for game configuration.
 *
 * Each game implementation should extend this with game-specific settings
 * like board size, time limits, scoring rules, etc.
 *
 * @example
 * ```ts
 * import { GameConfig } from '@/lib/game';
 *
 * interface PongConfig extends GameConfig {
 *   courtWidth: number;
 *   courtHeight: number;
 *   paddleSpeed: number;
 *   ballSpeed: number;
 * }
 * ```
 */

/**
 * Base configuration interface for all games.
 *
 * This is intentionally minimal to allow maximum flexibility.
 * Game implementations define their own configuration properties.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export default interface GameConfig {}
