/**
 * @file Connect4PlayerSlot.ts
 * @description Player slot management for Connect Four.
 *
 * Manages the two player slots (Red and Yellow) and handles:
 * - Assigning players to available slots
 * - Tracking which player is Red or Yellow
 * - Removing players when they disconnect
 */

import { PlayerSlot } from "@/lib/game";

/**
 * The two possible colors/roles in Connect Four.
 */
export type PlayerColor = "Red" | "Yellow";

/**
 * Player slot configuration for Connect Four.
 *
 * Two slots: one for Red player, one for Yellow player.
 */
export default class Connect4PlayerSlot implements PlayerSlot {
  /**
   * Mapping of colors to player IDs.
   * null means the slot is empty.
   */
  roles: Record<PlayerColor, string | null> = { Red: null, Yellow: null };

  /**
   * Assign a player to an available slot.
   *
   * Players are assigned in order: first gets Red, second gets Yellow.
   *
   * @param playerId - The user ID to assign
   * @returns The assigned color, or null if no slots available
   */
  assign(playerId: string): PlayerColor | null {
    // Check if player is already assigned a color
    if (this.roles.Red === playerId) return "Red";
    if (this.roles.Yellow === playerId) return "Yellow";

    // Assign to first available slot
    if (this.roles.Red === null) {
      this.roles.Red = playerId;
      return "Red";
    }
    if (this.roles.Yellow === null) {
      this.roles.Yellow = playerId;
      return "Yellow";
    }

    return null;
  }

  /**
   * Get the color assigned to a player.
   *
   * @param playerId - The player's ID
   * @returns The color ("Red", "Yellow") or null if not assigned
   */
  getRole(playerId: string): PlayerColor | null {
    if (this.roles.Red === playerId) return "Red";
    if (this.roles.Yellow === playerId) return "Yellow";
    return null;
  }

  /**
   * Remove a player from their slot.
   *
   * @param playerId - The player to remove
   */
  remove(playerId: string): void {
    if (this.roles.Red === playerId) this.roles.Red = null;
    if (this.roles.Yellow === playerId) this.roles.Yellow = null;
  }

  /**
   * Check if both slots are occupied.
   */
  get isFull(): boolean {
    return this.roles.Red !== null && this.roles.Yellow !== null;
  }

  /**
   * Check if there are empty slots available.
   */
  get canAcceptMorePlayers(): boolean {
    return this.roles.Red === null || this.roles.Yellow === null;
  }
}
