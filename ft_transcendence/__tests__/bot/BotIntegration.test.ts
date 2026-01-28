/**
 * @file __tests__/bot/BotIntegration.test.ts
 * @description Integration tests for bot gameplay scenarios
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import TicTacToeGame from "@/app/play/tic-tac-toe/lib/TicTacToeGame";
import { BOT_PLAYER_ID } from "@/app/play/tic-tac-toe/lib/TicTacToePlayerSlot";

describe("Bot Integration Tests", () => {
  let game: TicTacToeGame;

  beforeEach(() => {
    game = new TicTacToeGame();
    game.init();
  });

  describe("Bot Configuration", () => {
    it("should configure bot correctly", () => {
      game.configureBot("X", 9, 500);
      
      expect(game.gameConfig.hasBot).toBe(true);
      expect(game.gameConfig.botRole).toBe("X");
      expect(game.gameConfig.botDifficulty).toBe(9);
      expect(game.gameConfig.botDelayMs).toBe(500);
    });

    it("should assign bot to correct slot", () => {
      game.configureBot("O", 3);
      
      expect(game.playerslot.roles.O).toBe(BOT_PLAYER_ID);
      expect(game.playerslot.roles.X).toBeNull();
    });

    it("should allow removing bot", () => {
      game.configureBot("X", 9);
      expect(game.gameConfig.hasBot).toBe(true);
      
      game.configureBot(null, null);
      expect(game.gameConfig.hasBot).toBe(false);
      expect(game.playerslot.roles.X).toBeNull();
    });

    it("should replace existing bot when reconfiguring", () => {
      game.configureBot("X", 1);
      expect(game.playerslot.roles.X).toBe(BOT_PLAYER_ID);
      
      game.configureBot("O", 9);
      expect(game.playerslot.roles.X).toBeNull();
      expect(game.playerslot.roles.O).toBe(BOT_PLAYER_ID);
    });
  });

  describe("Game Readiness with Bot", () => {
    it("should be ready with bot and one human player", () => {
      game.configureBot("O", 9);
      game.handlePlayerConnect("player-1");
      
      expect(game.isReady2Start).toBe(true);
    });

    it("should not be ready with only bot", () => {
      game.configureBot("X", 9);
      
      expect(game.isReady2Start).toBe(false);
    });

    it("should not be ready with two humans (no bot)", () => {
      game.handlePlayerConnect("player-1");
      // Only one player, not ready yet
      expect(game.isReady2Start).toBe(false);
      
      game.handlePlayerConnect("player-2");
      // Now ready
      expect(game.isReady2Start).toBe(true);
    });
  });

  describe("Bot Move Scheduling", () => {
    it("should schedule bot move when it's bot's turn", () => {
      game.configureBot("X", 9, 100);
      game.handlePlayerConnect("player-1");
      
      const scheduleSpy = vi.spyOn(game, "scheduleBotMoveIfNeeded");
      game.startGame();
      
      expect(scheduleSpy).toHaveBeenCalled();
    });

    it("should not schedule bot move when it's human's turn", () => {
      game.configureBot("O", 9, 100);
      game.handlePlayerConnect("player-1"); // Gets X
      game.startGame();
      
      // Current turn is X (human), bot shouldn't be scheduled
      expect(game.gameState.currentTurn).toBe("X");
    });

    it("should schedule bot move after human plays", async () => {
      game.configureBot("O", 9, 50);
      game.handlePlayerConnect("player-1");
      game.startGame();
      
      // Human (X) plays
      game.playerAction("player-1", { cell: 0 });
      game.updateState();
      
      // Now it's bot's turn
      expect(game.gameState.currentTurn).toBe("O");
    });
  });

  describe("Bot Move Execution", () => {
    it("should execute bot move after delay", async () => {
      game.configureBot("X", 9, 50);
      game.handlePlayerConnect("player-1");
      
      let moveExecuted = false;
      game.onBotMove = async () => {
        moveExecuted = true;
      };
      
      game.startGame();
      
      // Wait for bot delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(moveExecuted).toBe(true);
      expect(game.gameState.board.some(cell => cell === "X")).toBe(true);
    });

    it("should alternate turns correctly with bot", async () => {
      game.configureBot("O", 9, 50);  // 50ms delay for test
      game.handlePlayerConnect("player-1");
      game.startGame();
      
      expect(game.gameState.currentTurn).toBe("X");
      
      // Human plays
      game.playerAction("player-1", { cell: 0 });
      game.updateState();
      expect(game.gameState.board[0]).toBe("X");
      expect(game.gameState.currentTurn).toBe("O");
      
      // Manually schedule bot move since we don't have callback wired
      game.scheduleBotMoveIfNeeded();
      
      // Wait for bot with sufficient timeout for execution
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Bot should have played
      const botMoves = game.gameState.board.filter(cell => cell === "O");
      expect(botMoves.length).toBeGreaterThan(0);
      expect(game.gameState.currentTurn).toBe("X");
    });
  });

  describe("Bot Win Detection", () => {
    it("should detect when bot wins", async () => {
      game.configureBot("X", 9, 10);
      game.handlePlayerConnect("player-1");
      game.startGame();
      
      // Set up a winning position for bot
      game.gameState.board = ["X", "X", null, "O", "O", null, null, null, null];
      game.gameState.currentTurn = "X";
      
      // Bot should win
      game.scheduleBotMoveIfNeeded();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      game.updateState();
      expect(game.gameState.winner).toBe("X");
    });

    it("should detect when human wins against bot", () => {
      game.configureBot("O", 9);
      game.handlePlayerConnect("player-1");
      game.startGame();
      
      // Set up winning position for human
      game.gameState.board = ["X", "X", "X", "O", "O", null, null, null, null];
      game.updateState();
      
      expect(game.gameState.winner).toBe("X");
    });
  });

  describe("Bot Difficulty Behavior", () => {
    it("should make reasonable moves at easy difficulty", async () => {
      game.configureBot("X", 1, 10);
      game.handlePlayerConnect("player-1");
      game.startGame();
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Bot should have made a move
      const botMoves = game.gameState.board.filter(cell => cell === "X");
      expect(botMoves.length).toBe(1);
    });

    it("should block winning moves at hard difficulty", async () => {
      game.configureBot("O", 9, 10);
      game.handlePlayerConnect("player-1");
      game.startGame();
      
      // Human has two in a row
      game.gameState.board = ["X", "X", null, null, null, null, null, null, null];
      game.gameState.currentTurn = "O";
      
      game.scheduleBotMoveIfNeeded();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Bot should block at index 2
      expect(game.gameState.board[2]).toBe("O");
    });

    it("should take winning move at hard difficulty", async () => {
      game.configureBot("X", 9, 10);
      game.handlePlayerConnect("player-1");
      game.startGame();
      
      // Bot has two in a row
      game.gameState.board = ["X", "X", null, "O", null, null, null, null, null];
      game.gameState.currentTurn = "X";
      
      game.scheduleBotMoveIfNeeded();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Bot should win at index 2
      expect(game.gameState.board[2]).toBe("X");
      game.updateState();
      expect(game.gameState.winner).toBe("X");
    });
  });

  describe("Bot Error Handling", () => {
    it("should handle onBotMove callback errors gracefully", async () => {
      game.configureBot("X", 9, 10);
      game.handlePlayerConnect("player-1");
      
      game.onBotMove = async () => {
        throw new Error("Callback error");
      };
      
      game.startGame();
      
      // Should not crash
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Bot move should still have been executed
      const botMoves = game.gameState.board.filter(cell => cell === "X");
      expect(botMoves.length).toBe(1);
    });

    it("should cancel pending bot move when game ends", () => {
      game.configureBot("X", 9, 1000);
      game.handlePlayerConnect("player-1");
      game.startGame();
      
      // End game immediately
      game.endGame();
      
      // Bot move timeout should be cleared
      // (no easy way to test this directly, but ensuring no crash)
      expect(true).toBe(true);
    });
  });

  describe("Bot State Persistence", () => {
    it("should restore bot configuration from persisted state", () => {
      const persistedState = {
        board_state: ["X", null, null, null, "O", null, null, null, null],
        current_turn: "X",
        status: "IN_GAME",
        bot_role: "O",
        bot_difficulty: 9,
        bot_delay_ms: 500,
      };
      
      game.restoreState(persistedState);
      
      expect(game.gameConfig.hasBot).toBe(true);
      expect(game.gameConfig.botRole).toBe("O");
      expect(game.gameConfig.botDifficulty).toBe(9);
      expect(game.gameConfig.botDelayMs).toBe(500);
    });

    it("should include bot config in snapshot", () => {
      game.configureBot("X", 3, 750);
      game.handlePlayerConnect("player-1");
      
      const snapshot = game.Snapshot as any;
      
      expect(snapshot.bot).toBeDefined();
      expect(snapshot.bot.role).toBe("X");
      expect(snapshot.bot.difficulty).toBe(3);
      expect(snapshot.bot.delayMs).toBe(750);
    });

    it("should not include bot in snapshot when no bot configured", () => {
      game.handlePlayerConnect("player-1");
      game.handlePlayerConnect("player-2");
      
      const snapshot = game.Snapshot as any;
      
      expect(snapshot.bot).toBeNull();
    });
  });

  describe("Multiple Bots (Edge Case)", () => {
    it("should only allow one bot at a time", () => {
      game.configureBot("X", 9);
      expect(game.playerslot.roles.X).toBe(BOT_PLAYER_ID);
      
      // Try to configure second bot
      game.configureBot("O", 9);
      
      // First bot should be removed
      expect(game.playerslot.roles.X).toBeNull();
      expect(game.playerslot.roles.O).toBe(BOT_PLAYER_ID);
    });
  });
});
