/**
 * @file __tests__/matchmaking/MatchmakingService.test.ts
 * @description Unit tests for the MatchmakingService.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { MatchmakingService } from "@/lib/matchmaking/MatchmakingService";

// Mock the modules that tryPair dynamically imports
vi.mock("@/lib/rooms", () => ({
  roomManager: {
    createRoomRecord: vi.fn().mockResolvedValue({ id: "TESTID" }),
  },
}));
vi.mock("@/lib/game/GameRegistry", () => ({
  GameRegistry: {
    get: vi.fn().mockReturnValue({
      maxPlayers: 2,
      createEmptyBoard: () => [],
      firstTurn: "X",
      roles: ["X", "O"],
      createGame: () => ({ init: vi.fn() }),
    }),
  },
}));
vi.mock("@/lib/prisma", () => ({
  default: {
    roomPlayer: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
  },
}));

describe("MatchmakingService", () => {
  let service: MatchmakingService;

  beforeEach(() => {
    service = new MatchmakingService();
  });

  it("should add a user to the queue", () => {
    service.joinQueue(1, "Player 1", "tic-tac-toe");
    const status = service.getStatus(1, "tic-tac-toe");

    expect(status.status).toBe("WAITING");
    expect(status.position).toBe(1);
    expect(status.waitSeconds).toBeGreaterThanOrEqual(0);
  });

  it("should correctly report queue position", () => {
    service.joinQueue(1, "Player 1", "tic-tac-toe");
    service.joinQueue(2, "Player 2", "tic-tac-toe");
    service.joinQueue(3, "Player 3", "tic-tac-toe");

    expect(service.getStatus(1, "tic-tac-toe").position).toBe(1);
    expect(service.getStatus(2, "tic-tac-toe").position).toBe(2);
    expect(service.getStatus(3, "tic-tac-toe").position).toBe(3);
  });

  it("should not add a waiting user twice to the same queue", () => {
    service.joinQueue(1, "Player 1", "tic-tac-toe");
    service.joinQueue(1, "Player 1", "tic-tac-toe");

    expect(service.getStatus(1, "tic-tac-toe").position).toBe(1);

    service.joinQueue(2, "Player 2", "tic-tac-toe");
    expect(service.getStatus(2, "tic-tac-toe").position).toBe(2);
  });

  it("should allow a user to queue for different games simultaneously", () => {
    service.joinQueue(1, "Player 1", "tic-tac-toe");
    service.joinQueue(1, "Player 1", "connect4");

    expect(service.getStatus(1, "tic-tac-toe").status).toBe("WAITING");
    expect(service.getStatus(1, "connect4").status).toBe("WAITING");
  });

  it("should allow a user to cancel their queue entry", () => {
    service.joinQueue(1, "Player 1", "tic-tac-toe");
    service.leaveQueue(1, "tic-tac-toe");

    const status = service.getStatus(1, "tic-tac-toe");
    expect(status.status).toBe("CANCELLED");
  });

  it("should pair two waiting users in the same queue", async () => {
    service.joinQueue(1, "Player 1", "tic-tac-toe");
    service.joinQueue(2, "Player 2", "tic-tac-toe");

    const match = await service.tryPair("tic-tac-toe");

    expect(match).not.toBeNull();
    expect(match?.player1.userId).toBe(1);
    expect(match?.player2.userId).toBe(2);
    expect(match?.roomId).toMatch(/^[A-Z]{6}$/); // 6-char uppercase

    expect(service.getStatus(1, "tic-tac-toe").status).toBe("MATCHED");
    expect(service.getStatus(2, "tic-tac-toe").status).toBe("MATCHED");
    expect(service.getStatus(1, "tic-tac-toe").matchedRoomId).toBe(match?.roomId);
    expect(service.getStatus(1, "tic-tac-toe").matchedRole).toBe("X");
    expect(service.getStatus(2, "tic-tac-toe").matchedRole).toBe("O");
  });

  it("should not pair users across different game queues", async () => {
    service.joinQueue(1, "Player 1", "tic-tac-toe");
    service.joinQueue(2, "Player 2", "connect4");

    const matchTtt = await service.tryPair("tic-tac-toe");
    const matchC4 = await service.tryPair("connect4");

    expect(matchTtt).toBeNull();
    expect(matchC4).toBeNull();
  });

  it("should not pair a cancelled user", async () => {
    service.joinQueue(1, "Player 1", "tic-tac-toe");
    service.joinQueue(2, "Player 2", "tic-tac-toe");

    service.leaveQueue(1, "tic-tac-toe");

    const match = await service.tryPair("tic-tac-toe");
    expect(match).toBeNull();

    expect(service.getStatus(2, "tic-tac-toe").status).toBe("WAITING");
  });
});
