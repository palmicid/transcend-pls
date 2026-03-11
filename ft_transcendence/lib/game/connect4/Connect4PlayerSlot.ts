/**
 * @file Connect4PlayerSlot.ts
 * @description Player slot management for Connect Four.
 *
 * Manages the two player slots (Red and Yellow) and handles:
 * - Assigning players to available slots
 * - Tracking which player is Red or Yellow
 * - Removing players when they disconnect
 * - Bot player support
 */

import { PlayerSlot } from "@/lib/game";
import { BOT_PLAYER_ID } from "@/lib/bot";

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

  // ===========================================================================
  // HUMAN PLAYER MANAGEMENT
  // ===========================================================================

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

    // Assign to first available slot (not occupied by bot)
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
   * Switch a player to a specific role.
   * Only allowed if the target slot is completely empty (no human or bot).
   *
   * @param playerId - The user ID to switch
   * @param targetRole - The role to switch to
   * @returns True if switch successful, false otherwise
   */
  switchTo(playerId: string, targetRole: PlayerColor): boolean {
    const currentRole = this.getRole(playerId);
    if (!currentRole || currentRole === targetRole) return false;

    // Check if target slot is empty (Option B: bots block switching)
    if (this.roles[targetRole] !== null) return false;

    // Move player
    this.roles[currentRole] = null;
    this.roles[targetRole] = playerId;

    return true;
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

  // ===========================================================================
  // BOT PLAYER MANAGEMENT
  // ===========================================================================

  /**
   * Assign the bot to a specific role.
   */
  assignBot(role: PlayerColor): void {
    const current = this.roles[role];
    if (current !== null && current !== BOT_PLAYER_ID) {
      throw new Error(
        `Cannot assign bot to role "${role}": slot is occupied by a human player.`
      );
    }
    this.roles[role] = BOT_PLAYER_ID;
  }

  /**
   * Remove the bot from a role.
   */
  removeBot(role: PlayerColor): void {
    if (this.roles[role] === BOT_PLAYER_ID) {
      this.roles[role] = null;
    }
  }

  /**
   * Check if a role is occupied by the bot.
   */
  isBot(role: PlayerColor): boolean {
    return this.roles[role] === BOT_PLAYER_ID;
  }

  /**
   * Get the bot's role, if any.
   */
  getBotRole(): PlayerColor | null {
    if (this.roles.Red === BOT_PLAYER_ID) return "Red";
    if (this.roles.Yellow === BOT_PLAYER_ID) return "Yellow";
    return null;
  }

  // ===========================================================================
  // SLOT STATUS
  // ===========================================================================

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
    return !this.isFull;
  }

  /**
   * Get the number of human players currently in slots.
   */
  get humanPlayerCount(): number {
    let count = 0;
    if (this.roles.Red !== null && this.roles.Red !== BOT_PLAYER_ID) count++;
    if (this.roles.Yellow !== null && this.roles.Yellow !== BOT_PLAYER_ID) count++;
    return count;
  }
}
