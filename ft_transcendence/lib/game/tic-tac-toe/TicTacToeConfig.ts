/**
 * @file TicTacToeConfig.ts
 * @description Configuration settings for Tic-Tac-Toe games.
 *
 * Defines the static settings that don't change during gameplay,
 * like board size, available player symbols, and bot configuration.
 *
 * Bot configuration is persisted in Prisma and broadcast via SSE.
 */

import { GameConfig } from "@/lib/game";
import type { BotDifficulty } from "@/lib/bot/constants";

// =============================================================================
// TYPES
// =============================================================================

/** Shape of bot config as stored in Prisma Room model */
export interface BotPrismaData {
	bot_difficulty: string | null;
	bot_role: string | null;
	bot_delay_ms: number;
}

// =============================================================================
// CONFIG CLASS
// =============================================================================

/**
 * Configuration for a Tic-Tac-Toe game.
 */
export default class TicTacToeConfig implements GameConfig {
	/** Size of the board (3x3 = 9 cells) */
	boardSize = 3;

	/** Available player symbols */
	players = ["X", "O"] as const;

	// ===========================================================================
	// BOT CONFIGURATION
	// ===========================================================================

	/** Bot difficulty tier: "Easy" | "Medium" | "Hard", null = no bot */
	botDifficulty: BotDifficulty | null = null;

	/** Which role the bot plays (null if no bot) */
	botRole: "X" | "O" | null = null;

	/** Delay before bot makes a move (milliseconds) for human-like feel */
	botDelayMs: number = 500;

	// ===========================================================================
	// COMPUTED PROPERTIES
	// ===========================================================================

	/** Whether this game has an active bot */
	get hasBot(): boolean {
		return this.botRole !== null && this.botDifficulty !== null;
	}

	// ===========================================================================
	// PRISMA SERIALIZATION
	// ===========================================================================

	/**
	 * Load config from Prisma room data.
	 *
	 * @param room - Room data from Prisma with bot fields
	 * @returns New config instance with bot settings applied
	 */
	static fromPrisma(room: BotPrismaData): TicTacToeConfig {
		const config = new TicTacToeConfig();

		if (room.bot_difficulty && room.bot_role) {
			config.botDifficulty = room.bot_difficulty as BotDifficulty;
			config.botRole = room.bot_role as "X" | "O";
			config.botDelayMs = room.bot_delay_ms;
		}

		return config;
	}

	/**
	 * Convert to Prisma-compatible object for saving.
	 *
	 * @returns Object with Prisma field names
	 */
	toPrisma(): BotPrismaData {
		return {
			bot_difficulty: this.botDifficulty,
			bot_role: this.botRole,
			bot_delay_ms: this.botDelayMs,
		};
	}

	// ===========================================================================
	// SSE SERIALIZATION
	// ===========================================================================

	/**
	 * Get bot info for SSE broadcast.
	 *
	 * @returns Bot info object for frontend, or null if no bot
	 */
	toBroadcast(): {
		role: string;
		difficulty: BotDifficulty;
		delayMs: number;
	} | null {
		if (!this.hasBot) return null;

		return {
			role: this.botRole!,
			difficulty: this.botDifficulty!,
			delayMs: this.botDelayMs,
		};
	}
}
