/**
 * @file GameState.ts
 * @description Base interface for game state.
 *
 * Each game implementation should extend this with game-specific state
 * like board positions, scores, timers, etc.
 *
 * @example
 * ```ts
 * import { GameState } from '@/lib/game';
 *
 * interface TicTacToeState extends GameState {
 *   board: Array<'X' | 'O' | null>;
 *   currentTurn: 'X' | 'O';
 *   winner: 'X' | 'O' | null;
 * }
 * ```
 */

/**
 * Base state interface for all games.
 *
 * This is intentionally minimal to allow maximum flexibility.
 * Game implementations define their own state properties.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export default interface GameState {}
