/**
 * @file TicTacToePlayerSlot.test.ts
 * @description Unit tests for Tic-Tac-Toe player slot management.
 */

import { describe, it, expect, beforeEach } from "vitest";
import TicTacToePlayerSlot from "@/app/game/tic-tac-toe/TicTacToePlayerSlot";

describe("TicTacToePlayerSlot", () => {
  let slots: TicTacToePlayerSlot;

  beforeEach(() => {
    slots = new TicTacToePlayerSlot();
  });

  // ===========================================================================
  // ASSIGNMENT
  // ===========================================================================

  describe("assign", () => {
    it("should assign first player as X", () => {
      const role = slots.assign("player-1");
      expect(role).toBe("X");
      expect(slots.roles.X).toBe("player-1");
    });

    it("should assign second player as O", () => {
      slots.assign("player-1");
      const role = slots.assign("player-2");
      expect(role).toBe("O");
      expect(slots.roles.O).toBe("player-2");
    });

    it("should return null for third player", () => {
      slots.assign("player-1");
      slots.assign("player-2");
      const role = slots.assign("player-3");
      expect(role).toBe(null);
    });

    it("should return existing role if already assigned", () => {
      slots.assign("player-1");
      const role = slots.assign("player-1");
      expect(role).toBe("X");
    });

    it("should not reassign existing player to different slot", () => {
      slots.assign("player-1"); // Gets X
      slots.assign("player-2"); // Gets O
      slots.assign("player-1"); // Should still be X

      expect(slots.roles.X).toBe("player-1");
      expect(slots.roles.O).toBe("player-2");
    });
  });

  // ===========================================================================
  // REMOVAL
  // ===========================================================================

  describe("remove", () => {
    it("should remove player from X slot", () => {
      slots.assign("player-1");
      slots.remove("player-1");
      expect(slots.roles.X).toBe(null);
    });

    it("should remove player from O slot", () => {
      slots.assign("player-1");
      slots.assign("player-2");
      slots.remove("player-2");
      expect(slots.roles.O).toBe(null);
      expect(slots.roles.X).toBe("player-1"); // X unchanged
    });

    it("should do nothing for unknown player", () => {
      slots.assign("player-1");
      slots.remove("unknown");
      expect(slots.roles.X).toBe("player-1");
    });

    it("should allow reassignment after removal", () => {
      slots.assign("player-1");
      slots.assign("player-2");
      slots.remove("player-1");

      const role = slots.assign("player-3");
      expect(role).toBe("X");
      expect(slots.roles.X).toBe("player-3");
    });
  });

  // ===========================================================================
  // GET ROLE
  // ===========================================================================

  describe("getRole", () => {
    it("should return X for player in X slot", () => {
      slots.assign("player-1");
      expect(slots.getRole("player-1")).toBe("X");
    });

    it("should return O for player in O slot", () => {
      slots.assign("player-1");
      slots.assign("player-2");
      expect(slots.getRole("player-2")).toBe("O");
    });

    it("should return null for unknown player", () => {
      expect(slots.getRole("unknown")).toBe(null);
    });
  });

  // ===========================================================================
  // CAPACITY
  // ===========================================================================

  describe("capacity", () => {
    it("should not be full when empty", () => {
      expect(slots.isFull).toBe(false);
      expect(slots.canAcceptMorePlayers).toBe(true);
    });

    it("should not be full with one player", () => {
      slots.assign("player-1");
      expect(slots.isFull).toBe(false);
      expect(slots.canAcceptMorePlayers).toBe(true);
    });

    it("should be full with two players", () => {
      slots.assign("player-1");
      slots.assign("player-2");
      expect(slots.isFull).toBe(true);
      expect(slots.canAcceptMorePlayers).toBe(false);
    });

    it("should become unfull after removal", () => {
      slots.assign("player-1");
      slots.assign("player-2");
      slots.remove("player-1");
      expect(slots.isFull).toBe(false);
      expect(slots.canAcceptMorePlayers).toBe(true);
    });
  });
});
