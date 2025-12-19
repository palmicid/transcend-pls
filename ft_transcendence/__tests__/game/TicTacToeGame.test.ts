/**
 * @file TicTacToeGame.test.ts
 * @description Unit tests for Tic-Tac-Toe game logic.
 */

import { describe, it, expect, beforeEach } from "vitest";
import TicTacToeGame from "@/app/game/tic-tac-toe/TicTacToeGame";

describe("TicTacToeGame", () => {
  let game: TicTacToeGame;

  beforeEach(() => {
    game = new TicTacToeGame();
    game.init();
  });

  // ===========================================================================
  // PLAYER MANAGEMENT
  // ===========================================================================

  describe("player management", () => {
    it("should assign first player as X", () => {
      game.handlePlayerConnect("player-1");
      expect(game.getPlayerRole("player-1")).toBe("X");
    });

    it("should assign second player as O", () => {
      game.handlePlayerConnect("player-1");
      game.handlePlayerConnect("player-2");
      expect(game.getPlayerRole("player-2")).toBe("O");
    });

    it("should reject third player", () => {
      game.handlePlayerConnect("player-1");
      game.handlePlayerConnect("player-2");
      game.handlePlayerConnect("player-3");
      expect(game.getPlayerRole("player-3")).toBe("spectator");
    });

    it("should remove player on disconnect", () => {
      game.handlePlayerConnect("player-1");
      game.handlePlayerDisconnect("player-1");
      expect(game.canAcceptMorePlayers).toBe(true);
    });

    it("should be ready to start when full", () => {
      game.handlePlayerConnect("player-1");
      game.handlePlayerConnect("player-2");
      expect(game.isReady2Start).toBe(true);
    });

    it("should not be ready with only one player", () => {
      game.handlePlayerConnect("player-1");
      expect(game.isReady2Start).toBe(false);
    });
  });

  // ===========================================================================
  // ACTION VALIDATION
  // ===========================================================================

  describe("isValidAction", () => {
    beforeEach(() => {
      game.handlePlayerConnect("player-1"); // X
      game.handlePlayerConnect("player-2"); // O
    });

    it("should allow X to move first", () => {
      expect(game.isValidAction("player-1", { cell: 0 })).toBe(true);
    });

    it("should reject O moving first", () => {
      expect(game.isValidAction("player-2", { cell: 0 })).toBe(false);
    });

    it("should reject out of bounds cell", () => {
      expect(game.isValidAction("player-1", { cell: 9 })).toBe(false);
      expect(game.isValidAction("player-1", { cell: -1 })).toBe(false);
    });

    it("should reject move on occupied cell", () => {
      game.playerAction("player-1", { cell: 0 });
      game.playerAction("player-2", { cell: 1 });
      expect(game.isValidAction("player-1", { cell: 0 })).toBe(false);
    });

    it("should reject spectator moves", () => {
      game.handlePlayerConnect("player-3");
      expect(game.isValidAction("player-3", { cell: 0 })).toBe(false);
    });
  });

  // ===========================================================================
  // PLAYER ACTIONS
  // ===========================================================================

  describe("playerAction", () => {
    beforeEach(() => {
      game.handlePlayerConnect("player-1"); // X
      game.handlePlayerConnect("player-2"); // O
    });

    it("should mark cell and switch turns", () => {
      game.playerAction("player-1", { cell: 4 });
      expect(game.gameState.board[4]).toBe("X");
      expect(game.gameState.currentTurn).toBe("O");
    });

    it("should alternate between X and O", () => {
      game.playerAction("player-1", { cell: 0 });
      game.playerAction("player-2", { cell: 1 });
      game.playerAction("player-1", { cell: 2 });
      expect(game.gameState.board[0]).toBe("X");
      expect(game.gameState.board[1]).toBe("O");
      expect(game.gameState.board[2]).toBe("X");
    });

    it("should not process invalid moves", () => {
      game.playerAction("player-2", { cell: 0 }); // Wrong turn
      expect(game.gameState.board[0]).toBe(null);
      expect(game.gameState.currentTurn).toBe("X");
    });
  });

  // ===========================================================================
  // WIN DETECTION
  // ===========================================================================

  describe("checkEndConditions", () => {
    beforeEach(() => {
      game.handlePlayerConnect("player-1"); // X
      game.handlePlayerConnect("player-2"); // O
    });

    it("should detect row win", () => {
      // X | X | X
      // O | O | -
      // - | - | -
      game.playerAction("player-1", { cell: 0 });
      game.playerAction("player-2", { cell: 3 });
      game.playerAction("player-1", { cell: 1 });
      game.playerAction("player-2", { cell: 4 });
      game.playerAction("player-1", { cell: 2 });
      game.updateState();

      expect(game.gameState.winner).toBe("X");
      expect(game.checkEndConditions()).toBe(true);
    });

    it("should detect column win", () => {
      // X | O | -
      // X | O | -
      // X | - | -
      game.playerAction("player-1", { cell: 0 });
      game.playerAction("player-2", { cell: 1 });
      game.playerAction("player-1", { cell: 3 });
      game.playerAction("player-2", { cell: 4 });
      game.playerAction("player-1", { cell: 6 });
      game.updateState();

      expect(game.gameState.winner).toBe("X");
      expect(game.checkEndConditions()).toBe(true);
    });

    it("should detect diagonal win", () => {
      // X | O | O
      // - | X | -
      // - | - | X
      game.playerAction("player-1", { cell: 0 });
      game.playerAction("player-2", { cell: 1 });
      game.playerAction("player-1", { cell: 4 });
      game.playerAction("player-2", { cell: 2 });
      game.playerAction("player-1", { cell: 8 });
      game.updateState();

      expect(game.gameState.winner).toBe("X");
      expect(game.checkEndConditions()).toBe(true);
    });

    it("should detect draw", () => {
      // X | O | X
      // X | O | O
      // O | X | X
      game.playerAction("player-1", { cell: 0 });
      game.playerAction("player-2", { cell: 1 });
      game.playerAction("player-1", { cell: 2 });
      game.playerAction("player-2", { cell: 4 });
      game.playerAction("player-1", { cell: 3 });
      game.playerAction("player-2", { cell: 6 });
      game.playerAction("player-1", { cell: 7 });
      game.playerAction("player-2", { cell: 5 });
      game.playerAction("player-1", { cell: 8 });
      game.updateState();

      expect(game.gameState.winner).toBe(null);
      expect(game.checkEndConditions()).toBe(true);
    });

    it("should not end game mid-play", () => {
      game.playerAction("player-1", { cell: 0 });
      expect(game.checkEndConditions()).toBe(false);
    });
  });

  // ===========================================================================
  // SNAPSHOT
  // ===========================================================================

  describe("Snapshot", () => {
    it("should return serializable game state", () => {
      game.handlePlayerConnect("player-1");
      game.handlePlayerConnect("player-2");
      game.playerAction("player-1", { cell: 4 });

      const snapshot = game.Snapshot as {
        board: (string | null)[];
        currentTurn: string;
        winner: string | null;
        players: Record<string, string | null>;
      };

      expect(snapshot.board).toHaveLength(9);
      expect(snapshot.board[4]).toBe("X");
      expect(snapshot.currentTurn).toBe("O");
      expect(snapshot.winner).toBe(null);
      expect(snapshot.players.X).toBe("player-1");
      expect(snapshot.players.O).toBe("player-2");
    });
  });
});
