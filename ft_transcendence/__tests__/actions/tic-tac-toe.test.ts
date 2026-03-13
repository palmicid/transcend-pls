/**
 * @file tic-tac-toe.test.ts
 * @description Integration tests for Tic-Tac-Toe server actions.
 *
 * NOTE: These tests are skipped because they require a real database connection.
 * Server actions depend on Prisma operations that cannot be easily mocked.
 * The core game logic is tested in TicTacToeGame.test.ts and Room.test.ts.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock auth before importing actions
vi.mock("@/lib/auth/auth-session", () => ({
  getSession: vi.fn(() => Promise.resolve({ userId: 1 })),
}));

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  default: {
    room: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    roomPlayer: {
      findMany: vi.fn(() => []),
    },
  },
}));

// Mock broadcaster
vi.mock("@/lib/broadcast", () => ({
  broadcaster: {
    broadcast: vi.fn(),
  },
}));

import { roomManager } from "@/lib/rooms";
import {
  createTicTacToeRoom,
  submitTicTacToeMove,
  startTicTacToeGame,
} from "@/app/play/tic-tac-toe/actions";

describe.skip("Tic-Tac-Toe Server Actions", () => {
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
      const result = await createTicTacToeRoom(testRoomId);
      expect(result.ok).toBe(true);
      expect(result.roomId).toBe(testRoomId);

      const room = roomManager.getRoom(testRoomId);
      expect(room).toBeDefined();
      expect(room?.gameType).toBe("tic-tac-toe");
    });

    it("should work without owner", async () => {
      const result = await createTicTacToeRoom(testRoomId);
      expect(result.ok).toBe(true);
    });
  });

  // ===========================================================================
  // startTicTacToeGame
  // ===========================================================================

  describe("startTicTacToeGame", () => {
    beforeEach(async () => {
      await createTicTacToeRoom(testRoomId);
      const room = roomManager.getRoom(testRoomId);
      if (room) {
          room.addPlayer("player-1");
          room.addPlayer("player-2");
      }
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
      const room = roomManager.getRoom(testRoomId);
      if (room) room.addPlayer("player-1"); // Only one player

      const result = await startTicTacToeGame(testRoomId);
      expect(result.ok).toBe(false);
    });
  });

  // ===========================================================================
  // submitTicTacToeMove
  // ===========================================================================

  describe("submitTicTacToeMove", () => {
    beforeEach(async () => {
      await createTicTacToeRoom(testRoomId);
      const room = roomManager.getRoom(testRoomId);
      if (room) {
          room.addPlayer("player-1");
          room.addPlayer("player-2"); // X and O assigned
      }
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
