/**
 * @file TicTacToePlayerSlot.ts
 * @description Player slot management for Tic-Tac-Toe.
 *
 * Manages the two player slots (X and O) and handles:
 * - Assigning players to available slots
 * - Tracking which player is X or O
 * - Removing players when they disconnect
 */

import { PlayerSlot } from "@/lib/game";

/**
 * The two possible roles/marks in Tic-Tac-Toe.
 */
export type PlayerRole = "X" | "O";

/**
 * Player slot configuration for Tic-Tac-Toe.
 *
 * Two slots: one for X player, one for O player.
 */
export default class TicTacToePlayerSlot implements PlayerSlot {
  /**
   * Mapping of roles to player IDs.
   * null means the slot is empty.
   */
  roles: Record<PlayerRole, string | null> = { X: null, O: null };

  /**
   * Assign a player to an available slot.
   *
   * Players are assigned in order: first gets X, second gets O.
   *
   * @param playerId - The user ID to assign
   * @returns The assigned role, or null if no slots available
   */
  assign(playerId: string): PlayerRole | null {
    // Check if player is already assigned a role
    if (this.roles.X === playerId) return "X";
    if (this.roles.O === playerId) return "O";

    // Assign to first available slot
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

  /**
   * Check if both slots are filled.
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
}
