/**
 * @file PlayerSlot.ts
 * @description Base interface for player slot management.
 *
 * Player slots define how players are organized within a game:
 * - How many players can join
 * - What roles/positions are available (e.g., X/O, Player1/Player2)
 * - Which player controls which game elements
 *
 * @example
 * ```ts
 * import { PlayerSlot } from '@/lib/game';
 *
 * interface PongPlayerSlot extends PlayerSlot {
 *   leftPaddle: string | null;   // Player ID or null if empty
 *   rightPaddle: string | null;
 * }
 * ```
 */

/**
 * Base interface for player slot management.
 *
 * This is intentionally minimal to allow maximum flexibility.
 * Game implementations define their own slot structure.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export default interface PlayerSlot {}
