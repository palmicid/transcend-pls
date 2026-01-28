/**
 * @file __tests__/bot/BotHelpers.test.ts
 * @description Unit tests for bot helper functions
 */

import { describe, it, expect, vi } from "vitest";
import {
  isBotConfigured,
  getTotalPlayerCount,
  createBotMoveCallback,
  getBotDifficultyLabel,
  validateBotConfig,
  getBotPrismaConfig,
} from "@/app/play/tic-tac-toe/lib/BotHelpers";

describe("BotHelpers", () => {
  describe("isBotConfigured", () => {
    it("should return true when both role and difficulty are set", () => {
      expect(isBotConfigured("X", 9)).toBe(true);
      expect(isBotConfigured("O", 1)).toBe(true);
      expect(isBotConfigured("X", 3)).toBe(true);
    });

    it("should return false when role is missing", () => {
      expect(isBotConfigured(null, 9)).toBe(false);
      expect(isBotConfigured(undefined, 9)).toBe(false);
    });

    it("should return false when difficulty is missing", () => {
      expect(isBotConfigured("X", null)).toBe(false);
      expect(isBotConfigured("X", undefined)).toBe(false);
    });

    it("should return false when both are missing", () => {
      expect(isBotConfigured(null, null)).toBe(false);
      expect(isBotConfigured(undefined, undefined)).toBe(false);
    });

    it("should handle zero difficulty as falsy", () => {
      expect(isBotConfigured("X", 0)).toBe(false);
    });

    it("should handle empty string role as falsy", () => {
      expect(isBotConfigured("", 9)).toBe(false);
    });
  });

  describe("getTotalPlayerCount", () => {
    it("should return only human count when no bot configured", () => {
      expect(getTotalPlayerCount(0, null, null)).toBe(0);
      expect(getTotalPlayerCount(1, null, null)).toBe(1);
      expect(getTotalPlayerCount(2, null, null)).toBe(2);
    });

    it("should add 1 when bot is configured", () => {
      expect(getTotalPlayerCount(0, "X", 9)).toBe(1);
      expect(getTotalPlayerCount(1, "X", 9)).toBe(2);
      expect(getTotalPlayerCount(2, "X", 9)).toBe(3);
    });

    it("should not count bot if only role is set", () => {
      expect(getTotalPlayerCount(1, "X", null)).toBe(1);
    });

    it("should not count bot if only difficulty is set", () => {
      expect(getTotalPlayerCount(1, null, 9)).toBe(1);
    });

    it("should handle various bot configurations", () => {
      expect(getTotalPlayerCount(0, "O", 1)).toBe(1);
      expect(getTotalPlayerCount(1, "O", 3)).toBe(2);
      expect(getTotalPlayerCount(2, "X", 9)).toBe(3);
    });
  });

  describe("getBotDifficultyLabel", () => {
    it("should return 'Easy' for difficulty 1", () => {
      expect(getBotDifficultyLabel(1)).toBe("Easy");
    });

    it("should return 'Medium' for difficulty 3", () => {
      expect(getBotDifficultyLabel(3)).toBe("Medium");
    });

    it("should return 'Hard' for difficulty 9 or any other value", () => {
      expect(getBotDifficultyLabel(9)).toBe("Hard");
      expect(getBotDifficultyLabel(5)).toBe("Hard");
      expect(getBotDifficultyLabel(10)).toBe("Hard");
    });

    it("should return 'Hard' for null or undefined", () => {
      expect(getBotDifficultyLabel(null)).toBe("Hard");
      expect(getBotDifficultyLabel(undefined)).toBe("Hard");
    });

    it("should return 'Hard' for zero", () => {
      expect(getBotDifficultyLabel(0)).toBe("Hard");
    });
  });

  describe("validateBotConfig", () => {
    it("should not throw for valid configurations", () => {
      expect(() => validateBotConfig("X", 1)).not.toThrow();
      expect(() => validateBotConfig("O", 3)).not.toThrow();
      expect(() => validateBotConfig("X", 9)).not.toThrow();
    });

    it("should throw for invalid role", () => {
      expect(() => validateBotConfig("A", 9)).toThrow("Invalid bot role");
      expect(() => validateBotConfig("Y", 9)).toThrow("Invalid bot role");
      expect(() => validateBotConfig("", 9)).toThrow("Invalid bot role");
    });

    it("should throw for invalid difficulty", () => {
      expect(() => validateBotConfig("X", 0)).toThrow("Invalid bot difficulty");
      expect(() => validateBotConfig("X", 2)).toThrow("Invalid bot difficulty");
      expect(() => validateBotConfig("X", 5)).toThrow("Invalid bot difficulty");
      expect(() => validateBotConfig("X", 10)).toThrow("Invalid bot difficulty");
    });

    it("should provide helpful error messages", () => {
      expect(() => validateBotConfig("Z", 9)).toThrow('Must be "X" or "O"');
      expect(() => validateBotConfig("X", 7)).toThrow("Must be 1 (Easy), 3 (Medium), or 9 (Hard)");
    });
  });

  describe("getBotPrismaConfig", () => {
    it("should return config with all values when provided", () => {
      const config = getBotPrismaConfig("X", 9, 500);
      expect(config).toEqual({
        bot_role: "X",
        bot_difficulty: 9,
        bot_delay_ms: 500,
      });
    });

    it("should handle null values", () => {
      const config = getBotPrismaConfig(null, null);
      expect(config).toEqual({
        bot_role: null,
        bot_difficulty: null,
        bot_delay_ms: undefined,
      });
    });

    it("should handle missing delay", () => {
      const config = getBotPrismaConfig("O", 3);
      expect(config).toEqual({
        bot_role: "O",
        bot_difficulty: 3,
        bot_delay_ms: undefined,
      });
    });

    it("should handle zero delay", () => {
      const config = getBotPrismaConfig("X", 1, 0);
      expect(config).toEqual({
        bot_role: "X",
        bot_difficulty: 1,
        bot_delay_ms: 0,
      });
    });
  });

  describe("createBotMoveCallback", () => {
    it("should create a callback that syncs and broadcasts", async () => {
      const mockRoom = { end: vi.fn() } as any;
      const mockGame = { checkEndConditions: vi.fn(() => false) } as any;
      const mockSync = vi.fn().mockResolvedValue(undefined);
      const mockBroadcast = vi.fn().mockResolvedValue(undefined);
      const mockPrismaUpdate = vi.fn().mockResolvedValue(undefined);

      const callback = createBotMoveCallback(
        "room-1",
        mockRoom,
        mockGame,
        mockSync,
        mockBroadcast,
        mockPrismaUpdate
      );

      await callback();

      expect(mockSync).toHaveBeenCalledWith("room-1", mockRoom);
      expect(mockBroadcast).toHaveBeenCalledWith("room-1", "game_move");
      expect(mockGame.checkEndConditions).toHaveBeenCalled();
      expect(mockRoom.end).not.toHaveBeenCalled();
      expect(mockPrismaUpdate).not.toHaveBeenCalled();
    });

    it("should handle game end when conditions are met", async () => {
      const mockRoom = { end: vi.fn() } as any;
      const mockGame = { checkEndConditions: vi.fn(() => true) } as any;
      const mockSync = vi.fn().mockResolvedValue(undefined);
      const mockBroadcast = vi.fn().mockResolvedValue(undefined);
      const mockPrismaUpdate = vi.fn().mockResolvedValue(undefined);

      const callback = createBotMoveCallback(
        "room-1",
        mockRoom,
        mockGame,
        mockSync,
        mockBroadcast,
        mockPrismaUpdate
      );

      await callback();

      expect(mockSync).toHaveBeenCalledWith("room-1", mockRoom);
      expect(mockBroadcast).toHaveBeenCalledWith("room-1", "game_move");
      expect(mockGame.checkEndConditions).toHaveBeenCalled();
      expect(mockRoom.end).toHaveBeenCalled();
      expect(mockPrismaUpdate).toHaveBeenCalledWith("room-1", "ENDED");
      expect(mockBroadcast).toHaveBeenCalledWith("room-1", "game_end");
    });

    it("should call functions in correct order", async () => {
      const callOrder: string[] = [];
      const mockRoom = { 
        end: vi.fn(() => callOrder.push("end")) 
      } as any;
      const mockGame = { 
        checkEndConditions: vi.fn(() => {
          callOrder.push("check");
          return true;
        }) 
      } as any;
      const mockSync = vi.fn(async () => callOrder.push("sync"));
      const mockBroadcast = vi.fn(async (id: string, event: string) => {
        callOrder.push(`broadcast:${event}`);
      });
      const mockPrismaUpdate = vi.fn(async () => callOrder.push("prisma"));

      const callback = createBotMoveCallback(
        "room-1",
        mockRoom,
        mockGame,
        mockSync,
        mockBroadcast,
        mockPrismaUpdate
      );

      await callback();

      expect(callOrder).toEqual([
        "sync",
        "broadcast:game_move",
        "check",
        "end",
        "prisma",
        "broadcast:game_end",
      ]);
    });

    it("should handle errors gracefully", async () => {
      const mockRoom = { end: vi.fn() } as any;
      const mockGame = { checkEndConditions: vi.fn(() => false) } as any;
      const mockSync = vi.fn().mockRejectedValue(new Error("Sync failed"));
      const mockBroadcast = vi.fn().mockResolvedValue(undefined);
      const mockPrismaUpdate = vi.fn().mockResolvedValue(undefined);

      const callback = createBotMoveCallback(
        "room-1",
        mockRoom,
        mockGame,
        mockSync,
        mockBroadcast,
        mockPrismaUpdate
      );

      await expect(callback()).rejects.toThrow("Sync failed");
    });
  });
});
