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
} from "@/lib/game/tic-tac-toe/BotHelpers";

describe("BotHelpers", () => {
	describe("isBotConfigured", () => {
		it("should return true when both role and difficulty are set", () => {
			expect(isBotConfigured("X", "Hard")).toBe(true);
			expect(isBotConfigured("O", "Easy")).toBe(true);
			expect(isBotConfigured("X", "Medium")).toBe(true);
		});

		it("should return false when role is missing", () => {
			expect(isBotConfigured(null, "Hard")).toBe(false);
			expect(isBotConfigured(undefined, "Hard")).toBe(false);
		});

		it("should return false when difficulty is missing", () => {
			expect(isBotConfigured("X", null)).toBe(false);
			expect(isBotConfigured("X", undefined)).toBe(false);
		});

		it("should return false when both are missing", () => {
			expect(isBotConfigured(null, null)).toBe(false);
			expect(isBotConfigured(undefined, undefined)).toBe(false);
		});

		it("should handle empty string role as falsy", () => {
			expect(isBotConfigured("", "Hard")).toBe(false);
		});

		it("should handle empty string difficulty as falsy", () => {
			expect(isBotConfigured("X", "")).toBe(false);
		});
	});

	describe("getTotalPlayerCount", () => {
		it("should return only human count when no bot configured", () => {
			expect(getTotalPlayerCount(0, null, null)).toBe(0);
			expect(getTotalPlayerCount(1, null, null)).toBe(1);
			expect(getTotalPlayerCount(2, null, null)).toBe(2);
		});

		it("should add 1 when bot is configured", () => {
			expect(getTotalPlayerCount(0, "X", "Hard")).toBe(1);
			expect(getTotalPlayerCount(1, "X", "Hard")).toBe(2);
			expect(getTotalPlayerCount(2, "X", "Hard")).toBe(3);
		});

		it("should not count bot if only role is set", () => {
			expect(getTotalPlayerCount(1, "X", null)).toBe(1);
		});

		it("should not count bot if only difficulty is set", () => {
			expect(getTotalPlayerCount(1, null, "Hard")).toBe(1);
		});

		it("should handle various bot configurations", () => {
			expect(getTotalPlayerCount(0, "O", "Easy")).toBe(1);
			expect(getTotalPlayerCount(1, "O", "Medium")).toBe(2);
			expect(getTotalPlayerCount(2, "X", "Hard")).toBe(3);
		});
	});

	describe("getBotDifficultyLabel", () => {
		it("should return 'Easy' for difficulty Easy", () => {
			expect(getBotDifficultyLabel("Easy")).toBe("Easy");
		});

		it("should return 'Medium' for difficulty Medium", () => {
			expect(getBotDifficultyLabel("Medium")).toBe("Medium");
		});

		it("should return 'Hard' for difficulty Hard", () => {
			expect(getBotDifficultyLabel("Hard")).toBe("Hard");
		});

		it("should return 'Hard' for invalid difficulty values", () => {
			expect(getBotDifficultyLabel("Invalid" as any)).toBe("Hard");
			expect(getBotDifficultyLabel("easy" as any)).toBe("Hard");
			expect(getBotDifficultyLabel("HARD" as any)).toBe("Hard");
		});

		it("should return 'Hard' for null or undefined", () => {
			expect(getBotDifficultyLabel(null)).toBe("Hard");
			expect(getBotDifficultyLabel(undefined)).toBe("Hard");
		});

		it("should return 'Hard' for empty string", () => {
			expect(getBotDifficultyLabel("")).toBe("Hard");
		});
	});

	describe("validateBotConfig", () => {
		it("should not throw for valid configurations", () => {
			expect(() => validateBotConfig("X", "Easy")).not.toThrow();
			expect(() => validateBotConfig("O", "Medium")).not.toThrow();
			expect(() => validateBotConfig("X", "Hard")).not.toThrow();
		});

		it("should throw for invalid role", () => {
			expect(() => validateBotConfig("A", "Hard")).toThrow("Invalid bot role");
			expect(() => validateBotConfig("Y", "Hard")).toThrow("Invalid bot role");
			expect(() => validateBotConfig("", "Hard")).toThrow("Invalid bot role");
		});

		it("should throw for invalid difficulty", () => {
			expect(() => validateBotConfig("X", "")).toThrow(
				"Invalid bot difficulty",
			);
			expect(() => validateBotConfig("X", "easy")).toThrow(
				"Invalid bot difficulty",
			);
			expect(() => validateBotConfig("X", "HARD")).toThrow(
				"Invalid bot difficulty",
			);
			expect(() => validateBotConfig("X", "invalid")).toThrow(
				"Invalid bot difficulty",
			);
		});

		it("should provide helpful error messages", () => {
			expect(() => validateBotConfig("Z", "Hard")).toThrow(
				'Must be "X" or "O"',
			);
			expect(() => validateBotConfig("X", "invalid")).toThrow(
				'Must be "Easy", "Medium", or "Hard"',
			);
		});
	});

	describe("getBotPrismaConfig", () => {
		it("should return config with all values when provided", () => {
			const config = getBotPrismaConfig("X", "Hard", 500);
			expect(config).toEqual({
				bot_role: "X",
				bot_difficulty: "Hard",
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
			const config = getBotPrismaConfig("O", "Medium");
			expect(config).toEqual({
				bot_role: "O",
				bot_difficulty: "Medium",
				bot_delay_ms: undefined,
			});
		});

		it("should handle zero delay", () => {
			const config = getBotPrismaConfig("X", "Easy", 0);
			expect(config).toEqual({
				bot_role: "X",
				bot_difficulty: "Easy",
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
				mockPrismaUpdate,
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
				mockPrismaUpdate,
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
				end: vi.fn(() => callOrder.push("end")),
			} as any;
			const mockGame = {
				checkEndConditions: vi.fn(() => {
					callOrder.push("check");
					return true;
				}),
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
				mockPrismaUpdate,
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
				mockPrismaUpdate,
			);

			await expect(callback()).rejects.toThrow("Sync failed");
		});
	});
});
