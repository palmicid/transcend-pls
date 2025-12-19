/**
 * @file tic-tac-toe.test.ts
 * @description Integration tests for Tic-Tac-Toe server actions.
 *
 * Tests the server actions using the real roomManager singleton.
 * Each test cleans up after itself to avoid state leakage.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { roomManager } from "@/lib/rooms";
import {
  createTicTacToeRoom,
  joinTicTacToeRoom,
  submitTicTacToeMove,
  startTicTacToeGame,
} from "@/app/game/tic-tac-toe/actions";

describe("Tic-Tac-Toe Server Actions", () => {
  const testRoomId = "test-room-actions";

  afterEach(() => {
    // Cleanup: destroy the test room after each test
    roomManager.destroyRoom(testRoomId);
  });

  // ===========================================================================
  // createTicTacToeRoom
  // ===========================================================================

  describe("createTicTacToeRoom", () => {
    it("should create a room with game attached", async () => {
      const result = await createTicTacToeRoom(testRoomId, "owner-1");
      expect(result.ok).toBe(true);
      expect(result.roomId).toBe(testRoomId);

      const room = roomManager.getRoom(testRoomId);
      expect(room).toBeDefined();
      expect(room?.gameType).toBe("tic-tac-toe");
    });

    it("should set owner correctly", async () => {
      await createTicTacToeRoom(testRoomId, "owner-1");
      const room = roomManager.getRoom(testRoomId);
      expect(room?.owner).toBe("owner-1");
    });

    it("should work without owner", async () => {
      const result = await createTicTacToeRoom(testRoomId);
      expect(result.ok).toBe(true);
    });
  });

  // ===========================================================================
  // joinTicTacToeRoom
  // ===========================================================================

  describe("joinTicTacToeRoom", () => {
    beforeEach(async () => {
      await createTicTacToeRoom(testRoomId, "owner-1");
    });

    it("should add player to room", async () => {
      const result = await joinTicTacToeRoom(testRoomId, "player-1");
      expect(result.ok).toBe(true);
    });

    it("should return current room state", async () => {
      await joinTicTacToeRoom(testRoomId, "player-1");
      const result = await joinTicTacToeRoom(testRoomId, "player-2");
      expect(result.state).toBe("READY");
    });

    it("should reject third player", async () => {
      await joinTicTacToeRoom(testRoomId, "player-1");
      await joinTicTacToeRoom(testRoomId, "player-2");
      const result = await joinTicTacToeRoom(testRoomId, "player-3");
      expect(result.ok).toBe(false);
    });
  });

  // ===========================================================================
  // startTicTacToeGame
  // ===========================================================================

  describe("startTicTacToeGame", () => {
    beforeEach(async () => {
      await createTicTacToeRoom(testRoomId, "owner-1");
      await joinTicTacToeRoom(testRoomId, "player-1");
      await joinTicTacToeRoom(testRoomId, "player-2");
    });

    it("should start game when ready", async () => {
      const result = await startTicTacToeGame(testRoomId);
      expect(result.ok).toBe(true);

      const room = roomManager.getRoom(testRoomId);
      expect(room?.status).toBe("IN_GAME");
    });

    it("should fail if not ready", async () => {
      roomManager.destroyRoom(testRoomId);
      await createTicTacToeRoom(testRoomId);
      await joinTicTacToeRoom(testRoomId, "player-1"); // Only one player

      const result = await startTicTacToeGame(testRoomId);
      expect(result.ok).toBe(false);
    });
  });

  // ===========================================================================
  // submitTicTacToeMove
  // ===========================================================================

  describe("submitTicTacToeMove", () => {
    beforeEach(async () => {
      await createTicTacToeRoom(testRoomId, "owner-1");
      await joinTicTacToeRoom(testRoomId, "player-1");
      await joinTicTacToeRoom(testRoomId, "player-2");
      await startTicTacToeGame(testRoomId);
    });

    it("should process valid move", async () => {
      const result = await submitTicTacToeMove(testRoomId, "player-1", 4);
      expect(result.ok).toBe(true);
      expect(result.snapshot).toBeDefined();
    });

    it("should update board in snapshot", async () => {
      const result = await submitTicTacToeMove(testRoomId, "player-1", 4);
      const snapshot = result.snapshot as { board: (string | null)[] };
      expect(snapshot.board[4]).toBe("X");
    });

    it("should reject wrong turn", async () => {
      const result = await submitTicTacToeMove(testRoomId, "player-2", 0);
      expect(result.ok).toBe(false);
    });

    it("should reject invalid cell", async () => {
      const result = await submitTicTacToeMove(testRoomId, "player-1", 99);
      expect(result.ok).toBe(false);
    });

    it("should handle complete game", async () => {
      // X wins with top row
      await submitTicTacToeMove(testRoomId, "player-1", 0);
      await submitTicTacToeMove(testRoomId, "player-2", 3);
      await submitTicTacToeMove(testRoomId, "player-1", 1);
      await submitTicTacToeMove(testRoomId, "player-2", 4);
      const result = await submitTicTacToeMove(testRoomId, "player-1", 2);

      const snapshot = result.snapshot as { winner: string | null };
      expect(snapshot.winner).toBe("X");

      const room = roomManager.getRoom(testRoomId);
      expect(room?.status).toBe("ENDED");
    });
  });
});
