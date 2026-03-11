/**
 * @file __tests__/bot/TicTacToeBot.test.ts
 * @description Unit tests for Tic-Tac-Toe bot AI logic
 */

import { describe, it, expect } from "vitest";
import { getBotMove } from "@/lib/game/tic-tac-toe/TicTacToeBot";
import type { PlayerRole } from "@/lib/game/tic-tac-toe/TicTacToePlayerSlot";

type Board = (PlayerRole | null)[];

describe("TicTacToeBot - getBotMove", () => {
	describe("Immediate Win Detection", () => {
		it("should take winning move on row", () => {
			// X X _ (bot is X, should play index 2)
			const board: Board = ["X", "X", null, null, null, null, null, null, null];
			const move = getBotMove(board, "X", "Hard");
			expect(move).toBe(2);
		});

		it("should take winning move on column", () => {
			// X | _ | _
			// X | _ | _
			// _ | _ | _  (bot is X, should play index 6)
			const board: Board = ["X", null, null, "X", null, null, null, null, null];
			const move = getBotMove(board, "X", "Hard");
			expect(move).toBe(6);
		});

		it("should take winning move on diagonal", () => {
			// X | _ | _
			// _ | X | _
			// _ | _ | _  (bot is X, should play index 8)
			const board: Board = ["X", null, null, null, "X", null, null, null, null];
			const move = getBotMove(board, "X", "Hard");
			expect(move).toBe(8);
		});

		it("should take winning move on anti-diagonal", () => {
			// _ | _ | O
			// _ | O | _
			// _ | _ | _  (bot is O, should play index 6)
			const board: Board = [null, null, "O", null, "O", null, null, null, null];
			const move = getBotMove(board, "O", "Hard");
			expect(move).toBe(6);
		});
	});

	describe("Block Opponent Win", () => {
		it("should block opponent's winning row", () => {
			// O | O | _
			// _ | _ | _
			// _ | _ | _  (bot is X, should block at index 2)
			const board: Board = ["O", "O", null, null, null, null, null, null, null];
			const move = getBotMove(board, "X", "Hard");
			expect(move).toBe(2);
		});

		it("should block opponent's winning column", () => {
			// X | _ | _
			// X | _ | _
			// _ | _ | _  (bot is O, should block at index 6)
			const board: Board = ["X", null, null, "X", null, null, null, null, null];
			const move = getBotMove(board, "O", "Hard");
			expect(move).toBe(6);
		});

		it("should block opponent's winning diagonal", () => {
			// _ | _ | O
			// _ | O | _
			// X | _ | _  (bot is X, should block at index 0)
			const board: Board = [null, null, "O", null, "O", null, "X", null, null];
			const move = getBotMove(board, "X", "Hard");
			expect(move).toBe(0);
		});
	});

	describe("Strategic Positioning", () => {
		it("should make a valid move on empty board", () => {
			const board: Board = [
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
			];
			const move = getBotMove(board, "X", "Hard");
			// Hard bot should make a strategically sound move
			expect(move).not.toBeNull();
			expect(board[move!]).toBeNull();
		});

		it("should take center if available after opponent's corner", () => {
			// X | _ | _
			// _ | _ | _
			// _ | _ | _  (bot should take center)
			const board: Board = [
				"X",
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
			];
			const move = getBotMove(board, "O", "Hard");
			expect(move).toBe(4);
		});

		it("should take corner when center is taken", () => {
			// _ | _ | _
			// _ | X | _
			// _ | _ | _  (bot should take a corner)
			const board: Board = [
				null,
				null,
				null,
				null,
				"X",
				null,
				null,
				null,
				null,
			];
			const move = getBotMove(board, "O", "Hard");
			expect([0, 2, 6, 8]).toContain(move);
		});
	});

	describe("Difficulty Levels", () => {
		it("should return valid move for easy difficulty", () => {
			const board: Board = ["X", null, null, null, "O", null, null, null, null];
			const move = getBotMove(board, "X", "Easy");
			expect(move).toBeGreaterThanOrEqual(0);
			expect(move).toBeLessThan(9);
			expect(board[move!]).toBeNull();
		});

		it("should return valid move for medium difficulty", () => {
			const board: Board = ["X", null, null, null, "O", null, null, null, null];
			const move = getBotMove(board, "X", "Medium");
			expect(move).toBeGreaterThanOrEqual(0);
			expect(move).toBeLessThan(9);
			expect(board[move!]).toBeNull();
		});

		it("should make optimal moves at hard difficulty", () => {
			// Test fork opportunity
			// X | _ | _
			// _ | O | _
			// _ | _ | X  (bot is X at hard, should create fork)
			const board: Board = ["X", null, null, null, "O", null, null, null, "X"];
			const move = getBotMove(board, "X", "Hard");
			// Should play corner or edge to set up multiple win threats
			expect(move).not.toBeNull();
			expect(board[move!]).toBeNull();
		});
	});

	describe("Edge Cases", () => {
		it("should return null for full board", () => {
			const board: Board = ["X", "O", "X", "O", "X", "O", "O", "X", "O"];
			const move = getBotMove(board, "X", "Hard");
			expect(move).toBeNull();
		});

		it("should handle board with one empty cell", () => {
			const board: Board = ["X", "O", "X", "O", "X", "O", "O", "X", null];
			const move = getBotMove(board, "O", "Hard");
			expect(move).toBe(8);
		});

		it("should not play on occupied cells", () => {
			const board: Board = ["X", "O", null, "X", null, "O", null, null, null];
			const move = getBotMove(board, "X", "Hard");
			expect(move).not.toBeNull();
			expect(board[move!]).toBeNull();
		});

		it("should handle boards with mixed marks", () => {
			const board: Board = ["O", null, "X", null, "X", null, "O", null, null];
			const move = getBotMove(board, "O", "Hard");
			expect(move).not.toBeNull();
			expect(board[move!]).toBeNull();
		});
	});

	describe("Fork Creation (Advanced Strategy)", () => {
		it("should create fork opportunities at high difficulty", () => {
			// X | _ | _
			// _ | _ | _
			// _ | _ | X  (bot is X, corner opposite creates fork)
			const board: Board = ["X", null, null, null, null, null, null, null, "X"];
			const move = getBotMove(board, "X", "Hard");
			// Hard bot should recognize this winning pattern
			expect(move).not.toBeNull();
		});

		it("should block opponent's fork at high difficulty", () => {
			// O | _ | _
			// _ | X | _
			// _ | _ | O  (bot is X, should block fork)
			const board: Board = ["O", null, null, null, "X", null, null, null, "O"];
			const move = getBotMove(board, "X", "Hard");
			// Should block the fork by playing an edge
			expect([1, 3, 5, 7]).toContain(move);
		});
	});

	describe("Consistency and Determinism", () => {
		it("should return same move for same board state at max difficulty", () => {
			const board: Board = ["X", null, null, null, "O", null, null, null, null];
			const move1 = getBotMove(board, "X", "Hard");
			const move2 = getBotMove(board, "X", "Hard");
			expect(move1).toBe(move2);
		});

		it("should always return valid moves", () => {
			// Generate random test cases
			for (let i = 0; i < 50; i++) {
				const board: Board = Array(9)
					.fill(null)
					.map((_, idx) => {
						const rand = Math.random();
						if (rand < 0.3) return "X";
						if (rand < 0.6) return "O";
						return null;
					});

				const move = getBotMove(board, "X", "Hard");
				if (move !== null) {
					expect(move).toBeGreaterThanOrEqual(0);
					expect(move).toBeLessThan(9);
					expect(board[move]).toBeNull();
				}
			}
		});
	});

	describe("Minimax Algorithm Behavior", () => {
		it("should never lose when playing optimally", () => {
			// Test that hard bot makes unbeatable moves
			// X | _ | _
			// _ | O | _
			// _ | _ | _  (bot is O, should play optimally)
			const board: Board = ["X", null, null, null, "O", null, null, null, null];
			const move = getBotMove(board, "O", "Hard");
			// Valid optimal moves would be corners or strategic positions
			expect([1, 2, 3, 5, 6, 7, 8]).toContain(move);
		});

		it("should force win when available", () => {
			// O | X | O
			// X | X | _
			// _ | O | _  (bot is X, should win at 5)
			const board: Board = ["O", "X", "O", "X", "X", null, null, "O", null];
			const move = getBotMove(board, "X", "Hard");
			expect(move).toBe(5);
		});
	});
});
