/**
 * @file TicTacToePlayerSlot.ts
 * @description Player slot management for Tic-Tac-Toe.
 *
 * Manages the two player slots (X and O) and handles:
 * - Assigning players to available slots
 * - Tracking which player is X or O
 * - Removing players when they disconnect
 * - Bot player support (bot as "another player")
 */

import { PlayerSlot } from "@/lib/game";
import { BOT_PLAYER_ID } from "./TicTacToeBot";

// Re-export for convenience
export { BOT_PLAYER_ID };

/**
 * The two possible roles/marks in Tic-Tac-Toe.
 */
export type PlayerRole = "X" | "O";

/**
 * Player slot configuration for Tic-Tac-Toe.
 *
 * Two slots: one for X player, one for O player.
 * The bot is treated as "another player" with a special ID.
 */
export default class TicTacToePlayerSlot implements PlayerSlot {
  /**
   * Mapping of roles to player IDs.
   * null means the slot is empty.
   * BOT_PLAYER_ID means the slot is occupied by the bot.
   */
  roles: Record<PlayerRole, string | null> = { X: null, O: null };

  // ===========================================================================
  // HUMAN PLAYER MANAGEMENT
  // ===========================================================================

  /**
   * Assign a player to an available slot.
   *
   * Players are assigned in order: first gets X, second gets O.
   * Will not overwrite a slot occupied by a bot.
   *
   * @param playerId - The user ID to assign
   * @returns The assigned role, or null if no slots available
   */
  assign(playerId: string): PlayerRole | null {
    // Check if player is already assigned a role
    if (this.roles.X === playerId) return "X";
    if (this.roles.O === playerId) return "O";

    // Assign to first available slot (not occupied by bot or human)
    if (this.roles.X === null) {
      this.roles.X = playerId;
      return "X";
    }
    if (this.roles.O === null) {
      this.roles.O = playerId;
      return "O";
    }
    return null;
  }

  /**
   * Remove a player from their slot.
   *
   * @param playerId - The user ID to remove
   */
  remove(playerId: string): void {
    if (this.roles.X === playerId) this.roles.X = null;
    if (this.roles.O === playerId) this.roles.O = null;
  }

  /**
   * Get the role of a player.
   *
   * @param playerId - The user ID to look up
   * @returns The player's role, or null if not in game
   */
  getRole(playerId: string): PlayerRole | null {
    if (this.roles.X === playerId) return "X";
    if (this.roles.O === playerId) return "O";
    return null;
  }

  // ===========================================================================
  // BOT PLAYER MANAGEMENT
  // ===========================================================================

  /**
   * Assign the bot to a specific role.
   * The bot acts as "another player" with a special ID.
   *
   * @param role - The role to assign to the bot ("X" or "O")
   */
  assignBot(role: PlayerRole): void {
    const current = this.roles[role];
    // Prevent silently evicting a human player from this role
    if (current !== null && current !== BOT_PLAYER_ID) {
      throw new Error(
        `Cannot assign bot to role "${role}": slot is occupied by a human player.`,
      );
    }
    this.roles[role] = BOT_PLAYER_ID;
  }

  /**
   * Remove the bot from a role (convert back to open slot).
   *
   * @param role - The role to clear of bot
   */
  removeBot(role: PlayerRole): void {
    if (this.roles[role] === BOT_PLAYER_ID) {
      this.roles[role] = null;
    }
  }

  /**
   * Check if a role is occupied by the bot.
   *
   * @param role - The role to check
   * @returns True if the role is held by the bot
   */
  isBot(role: PlayerRole): boolean {
    return this.roles[role] === BOT_PLAYER_ID;
  }

  /**
   * Get the bot's role, if any.
   *
   * @returns The role the bot occupies, or null if no bot
   */
  getBotRole(): PlayerRole | null {
    if (this.roles.X === BOT_PLAYER_ID) return "X";
    if (this.roles.O === BOT_PLAYER_ID) return "O";
    return null;
  }

  // ===========================================================================
  // SLOT STATUS
  // ===========================================================================

  /**
   * Check if both slots are filled (by humans or bots).
   */
  get isFull(): boolean {
    return this.roles.X !== null && this.roles.O !== null;
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
    if (this.roles.X !== null && this.roles.X !== BOT_PLAYER_ID) count++;
    if (this.roles.O !== null && this.roles.O !== BOT_PLAYER_ID) count++;
    return count;
  }

  /**
   * Check if a role is empty (no human or bot).
   *
   * @param role - The role to check
   */
  isEmpty(role: PlayerRole): boolean {
    return this.roles[role] === null;
  }
}

