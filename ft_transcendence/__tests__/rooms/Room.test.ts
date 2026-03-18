/**
 * @file Room.test.ts
 * @description Unit tests for Room state machine and lifecycle.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import Room from "@/lib/rooms/Room";
import { State } from "@/lib/rooms/RoomState";
import TicTacToeGame from "@/lib/game/tic-tac-toe/TicTacToeGame";
import type { Broadcaster } from "@/lib/broadcast";

// Mock broadcaster
function createMockBroadcaster(): Broadcaster {
  return {
    broadcast: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  } as unknown as Broadcaster;
}

describe("Room", () => {
  let room: Room;
  let game: TicTacToeGame;
  let broadcaster: Broadcaster;

  beforeEach(() => {
    broadcaster = createMockBroadcaster();
    room = new Room("test-room", broadcaster, "owner-id");
    game = new TicTacToeGame();
    game.init();
    room.attachGame(game);
  });

  // ===========================================================================
  // SETUP
  // ===========================================================================

  describe("initialization", () => {
    it("should have correct room ID", () => {
      expect(room.roomId).toBe("test-room");
    });

    it("should have correct owner", () => {
      expect(room.owner).toBe("owner-id");
    });

    it("should start in OPEN state", () => {
      expect(room.status).toBe(State.OPEN);
    });

    it("should have attached game type", () => {
      expect(room.gameType).toBe("tic-tac-toe");
    });

    it("should start with 0 players", () => {
      expect(room.playerCount).toBe(0);
    });
  });

  describe("setOwnerIfEmpty", () => {
    it("should set owner if not already set", () => {
      const emptyRoom = new Room("empty", broadcaster);
      expect(emptyRoom.owner).toBe(null);
      emptyRoom.setOwnerIfEmpty("new-owner");
      expect(emptyRoom.owner).toBe("new-owner");
    });

    it("should not override existing owner", () => {
      room.setOwnerIfEmpty("another-owner");
      expect(room.owner).toBe("owner-id");
    });
  });

  // ===========================================================================
  // PLAYER MANAGEMENT
  // ===========================================================================

  describe("addPlayer", () => {
    it("should add player to game", () => {
      const result = room.addPlayer("player-1");
      expect(result).toBe(true);
      expect(room.playerCount).toBe(1);
    });

    it("should broadcast snapshot after adding", () => {
      room.addPlayer("player-1");
      expect(broadcaster.broadcast).toHaveBeenCalled();
    });

    it("should transition to READY when full", () => {
      room.addPlayer("player-1");
      room.addPlayer("player-2");
      expect(room.status).toBe(State.READY);
    });

    it("should reject third player", () => {
      room.addPlayer("player-1");
      room.addPlayer("player-2");
      const result = room.addPlayer("player-3");
      expect(result).toBe(false);
    });

    it("should fail without attached game", () => {
      const emptyRoom = new Room("empty", broadcaster);
      const result = emptyRoom.addPlayer("player-1");
      expect(result).toBe(false);
    });
  });

  describe("removePlayer", () => {
    beforeEach(() => {
      room.addPlayer("player-1");
      room.addPlayer("player-2");
    });

    it("should remove player from game", () => {
      room.removePlayer("player-1");
      expect(room.playerCount).toBe(1);
    });

    it("should broadcast snapshot after removal", () => {
      vi.mocked(broadcaster.broadcast).mockClear();
      room.removePlayer("player-1");
      expect(broadcaster.broadcast).toHaveBeenCalled();
    });

    it("should pause game if in progress", () => {
      room.start();
      expect(room.status).toBe(State.IN_GAME);
      room.removePlayer("player-1");
      expect(room.status).toBe(State.READY);
    });
  });

  // ===========================================================================
  // GAME ACTIONS
  // ===========================================================================

  describe("submitAction", () => {
    beforeEach(() => {
      room.addPlayer("player-1");
      room.addPlayer("player-2");
      room.start();
    });

    it("should process valid action", () => {
      const result = room.submitAction("player-1", { cell: 0 });
      expect(result).toBe(true);
    });

    it("should reject invalid action", () => {
      const result = room.submitAction("player-2", { cell: 0 }); // Wrong turn
      expect(result).toBe(false);
    });

    it("should NOT broadcast after action (responsibility of caller)", () => {
      vi.mocked(broadcaster.broadcast).mockClear();
      room.submitAction("player-1", { cell: 0 });
      expect(broadcaster.broadcast).not.toHaveBeenCalled();
    });

    it("should indicate terminal state on win via isTerminal()", () => {
      // X wins with top row
      room.submitAction("player-1", { cell: 0 });
      room.submitAction("player-2", { cell: 3 });
      room.submitAction("player-1", { cell: 1 });
      room.submitAction("player-2", { cell: 4 });
      room.submitAction("player-1", { cell: 2 }); // X wins

      expect(room.isTerminal()).toBe(true);
      // Room status remains IN_GAME until caller explicitly ends it
      expect(room.status).toBe(State.IN_GAME);
    });
  });

  describe("getSnapshot", () => {
    it("should return game snapshot", () => {
      room.addPlayer("player-1");
      const snapshot = room.getSnapshot() as { board: unknown[]; players: unknown };
      expect(snapshot).toBeDefined();
      expect(snapshot.board).toHaveLength(9);
      expect(snapshot.players).toBeDefined();
    });

    it("should return null without game", () => {
      const emptyRoom = new Room("empty", broadcaster);
      expect(emptyRoom.getSnapshot()).toBe(null);
    });
  });

  // ===========================================================================
  // STATE TRANSITIONS
  // ===========================================================================

  describe("state transitions", () => {
    beforeEach(() => {
      room.addPlayer("player-1");
      room.addPlayer("player-2");
    });

    describe("start", () => {
      it("should transition from READY to IN_GAME", () => {
        expect(room.status).toBe(State.READY);
        const result = room.start();
        expect(result).toBe(true);
        expect(room.status).toBe(State.IN_GAME);
      });

      it("should auto-transition from OPEN to READY if game is ready", () => {
        const openRoom = new Room("open", broadcaster);
        openRoom.attachGame(game);
        // Game needs players to be ready - add one
        game.handlePlayerConnect("player-1");
        game.handlePlayerConnect("player-2");
        
        // Now start should succeed and auto-transition
        const result = openRoom.start();
        expect(result).toBe(true);
        expect(openRoom.status).toBe(State.IN_GAME);
      });
    });

    describe("pause", () => {
      it("should transition from IN_GAME to READY", () => {
        room.start();
        const result = room.pause();
        expect(result).toBe(true);
        expect(room.status).toBe(State.READY);
      });
    });

    describe("end", () => {
      it("should transition from IN_GAME to ENDED", () => {
        room.start();
        const result = room.end();
        expect(result).toBe(true);
        expect(room.status).toBe(State.ENDED);
      });
    });

    describe("reset", () => {
      it("should transition from ENDED to OPEN", () => {
        room.start();
        room.end();
        expect(room.status).toBe(State.ENDED);
        const result = room.reset();
        expect(result).toBe(true);
        expect(room.status).toBe(State.OPEN);
      });
    });
  });

  // ===========================================================================
  // SUBSCRIPTIONS
  // ===========================================================================

  describe("subscriptions", () => {
    it("should add listener via subscribe", () => {
      const listener = vi.fn();
      room.subscribe(listener);
      expect(broadcaster.addListener).toHaveBeenCalledWith("test-room", listener);
    });

    it("should remove listener via unsubscribe", () => {
      const listener = vi.fn();
      room.unsubscribe(listener);
      expect(broadcaster.removeListener).toHaveBeenCalledWith("test-room", listener);
    });
  });
});
